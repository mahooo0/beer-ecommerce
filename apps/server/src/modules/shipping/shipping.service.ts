import { prisma } from '@repo/db';
import { AppError } from '../../common/middleware/error-handler.js';
import type { ShippingRateType } from '@repo/types';

interface CreateZoneData {
  name: string;
  countries: string[];
  states?: string[];
  freeShippingThreshold?: number | null;
  isActive?: boolean;
}

interface UpdateZoneData {
  name?: string;
  countries?: string[];
  states?: string[];
  freeShippingThreshold?: number | null;
  isActive?: boolean;
}

interface CreateMethodData {
  zoneId: string;
  name: string;
  description?: string;
  rateType: ShippingRateType;
  flatRate?: number | null;
  weightRate?: number | null;
  minWeight?: number | null;
  maxWeight?: number | null;
  priceThresholds?: Record<string, number> | null;
  estimatedDaysMin?: number | null;
  estimatedDaysMax?: number | null;
  isActive?: boolean;
  position?: number;
}

interface UpdateMethodData {
  name?: string;
  description?: string | null;
  rateType?: ShippingRateType;
  flatRate?: number | null;
  weightRate?: number | null;
  minWeight?: number | null;
  maxWeight?: number | null;
  priceThresholds?: Record<string, number> | null;
  estimatedDaysMin?: number | null;
  estimatedDaysMax?: number | null;
  isActive?: boolean;
  position?: number;
}

interface CalculateRateParams {
  method: any;
  cartSubtotal: number;
  cartWeight: number;
}

interface GetAvailableMethodsParams {
  country: string;
  state?: string;
  cartSubtotal: number;
  cartWeight: number;
}

export class ShippingService {
  // Zone CRUD
  async createZone(data: CreateZoneData) {
    return prisma.shippingZone.create({
      data: {
        name: data.name,
        countries: data.countries,
        states: data.states || [],
        freeShippingThreshold: data.freeShippingThreshold,
        isActive: data.isActive ?? true,
      },
      include: { methods: true },
    });
  }

  async getAllZones(includeInactive = false) {
    const where = includeInactive ? {} : { isActive: true };
    return prisma.shippingZone.findMany({
      where,
      include: { methods: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getZoneById(id: string) {
    const zone = await prisma.shippingZone.findUnique({
      where: { id },
      include: { methods: true },
    });
    if (!zone) {
      throw new AppError(404, 'Shipping zone not found');
    }
    return zone;
  }

  async updateZone(id: string, data: UpdateZoneData) {
    try {
      return await prisma.shippingZone.update({
        where: { id },
        data,
        include: { methods: true },
      });
    } catch (error) {
      throw new AppError(404, 'Shipping zone not found');
    }
  }

  async deleteZone(id: string) {
    try {
      await prisma.shippingZone.delete({
        where: { id },
      });
    } catch (error) {
      throw new AppError(404, 'Shipping zone not found');
    }
  }

  // Method CRUD
  async createMethod(data: CreateMethodData) {
    // Validate that zone exists
    const zone = await prisma.shippingZone.findUnique({
      where: { id: data.zoneId },
    });
    if (!zone) {
      throw new AppError(404, 'Shipping zone not found');
    }

    return prisma.shippingMethod.create({
      data: {
        zoneId: data.zoneId,
        name: data.name,
        description: data.description,
        rateType: data.rateType,
        flatRate: data.flatRate,
        weightRate: data.weightRate,
        minWeight: data.minWeight,
        maxWeight: data.maxWeight,
        priceThresholds: data.priceThresholds as any,
        estimatedDaysMin: data.estimatedDaysMin,
        estimatedDaysMax: data.estimatedDaysMax,
        isActive: data.isActive ?? true,
        position: data.position ?? 0,
      },
    });
  }

  async getMethodsByZone(zoneId: string) {
    return prisma.shippingMethod.findMany({
      where: { zoneId },
      orderBy: { position: 'asc' },
    });
  }

  async updateMethod(id: string, data: UpdateMethodData) {
    try {
      return await prisma.shippingMethod.update({
        where: { id },
        data: {
          ...data,
          priceThresholds: data.priceThresholds as any,
        },
      });
    } catch (error) {
      throw new AppError(404, 'Shipping method not found');
    }
  }

  async deleteMethod(id: string) {
    try {
      await prisma.shippingMethod.delete({
        where: { id },
      });
    } catch (error) {
      throw new AppError(404, 'Shipping method not found');
    }
  }

  // Zone matching algorithm
  async findMatchingZone({ country, state }: { country: string; state?: string }) {
    // Priority 1: State-specific match (zone has the country AND the specific state)
    if (state) {
      const stateSpecificZone = await prisma.shippingZone.findFirst({
        where: {
          isActive: true,
          countries: { has: country },
          states: { has: state },
        },
        include: {
          methods: {
            where: { isActive: true },
            orderBy: { position: 'asc' },
          },
        },
      });
      if (stateSpecificZone) {
        return stateSpecificZone;
      }
    }

    // Priority 2: Country-wide match (zone has the country and states array is empty)
    const countryWideZone = await prisma.shippingZone.findFirst({
      where: {
        isActive: true,
        countries: { has: country },
        states: { isEmpty: true },
      },
      include: {
        methods: {
          where: { isActive: true },
          orderBy: { position: 'asc' },
        },
      },
    });

    return countryWideZone || null;
  }

  // Rate calculation
  calculateShippingRate({ method, cartSubtotal, cartWeight }: CalculateRateParams): number {
    // Check free shipping threshold FIRST
    if (method.zone?.freeShippingThreshold && cartSubtotal >= method.zone.freeShippingThreshold) {
      return 0;
    }

    switch (method.rateType) {
      case 'FLAT_RATE':
        return method.flatRate ?? 0;

      case 'WEIGHT_BASED':
        // Validate weight constraints
        if (method.minWeight !== null && cartWeight < method.minWeight) {
          throw new AppError(400, `Cart weight ${cartWeight}kg is below minimum ${method.minWeight}kg for ${method.name}`);
        }
        if (method.maxWeight !== null && cartWeight > method.maxWeight) {
          throw new AppError(400, `Cart weight ${cartWeight}kg exceeds maximum ${method.maxWeight}kg for ${method.name}`);
        }
        return Math.round(cartWeight * (method.weightRate ?? 0));

      case 'PRICE_BASED':
        if (!method.priceThresholds) {
          throw new AppError(400, 'Price-based method missing price thresholds');
        }
        // Parse thresholds as Record<string, number>
        const thresholds = method.priceThresholds as Record<string, number>;
        // Sort threshold keys in descending order
        const sortedThresholds = Object.keys(thresholds)
          .map(Number)
          .sort((a, b) => b - a);

        if (sortedThresholds.length === 0) {
          throw new AppError(400, 'Price-based method has empty price thresholds');
        }

        // Find first threshold where cartSubtotal >= threshold
        for (const threshold of sortedThresholds) {
          if (cartSubtotal >= threshold) {
            const rate = thresholds[threshold.toString()];
            if (rate === undefined) {
              throw new AppError(400, 'Invalid price threshold configuration');
            }
            return rate;
          }
        }
        // If no threshold matches, use the lowest threshold value
        const lowestThreshold = sortedThresholds[sortedThresholds.length - 1]!;
        const lowestRate = thresholds[lowestThreshold.toString()];
        if (lowestRate === undefined) {
          throw new AppError(400, 'Invalid price threshold configuration');
        }
        return lowestRate;

      default:
        throw new AppError(400, `Unknown rate type: ${method.rateType}`);
    }
  }

  // Get available shipping methods for a location and cart
  async getAvailableShippingMethods({
    country,
    state,
    cartSubtotal,
    cartWeight,
  }: GetAvailableMethodsParams) {
    const zone = await this.findMatchingZone({ country, state });
    if (!zone) {
      return null;
    }

    const availableMethods = [];
    for (const method of zone.methods) {
      try {
        const rate = this.calculateShippingRate({
          method: { ...method, zone },
          cartSubtotal,
          cartWeight,
        });
        availableMethods.push({
          id: method.id,
          name: method.name,
          description: method.description,
          rate,
          estimatedDays:
            method.estimatedDaysMin && method.estimatedDaysMax
              ? `${method.estimatedDaysMin}-${method.estimatedDaysMax}`
              : null,
        });
      } catch (error) {
        // Skip methods that throw errors (e.g., weight exceeded)
        continue;
      }
    }

    return {
      zone: zone.name,
      methods: availableMethods,
    };
  }
}

export const shippingService = new ShippingService();
