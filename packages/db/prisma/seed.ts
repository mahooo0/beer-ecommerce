// All monetary values stored as integers (cents). 1299 = $12.99.

import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';
import dotenv from 'dotenv';
import { connectMongoDB, OrderModel, CartModel, mongoose } from '../src/mongoose.js';
import {
  createUser,
  createCategory,
  createBrand,
  createProduct,
  createProductVariant,
  createReview,
  createCoupon,
  createOrderData,
  createCartData,
} from '../src/seed-factories.js';

// Load environment variables (root .env first, then local)
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config();

// Set seed for reproducibility
faker.seed(12345);

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed process...\n');

  // ========================================================================
  // CLEANUP: Delete all existing data
  // ========================================================================
  console.log('🧹 Cleaning existing data...');

  // PostgreSQL cleanup (order matters for FK constraints)
  await prisma.stockMovement.deleteMany();
  await prisma.inventoryItem.deleteMany();
  await prisma.warehouse.deleteMany();
  await prisma.shippingMethod.deleteMany();
  await prisma.shippingZone.deleteMany();
  await prisma.promotion.deleteMany();
  await prisma.coupon.deleteMany();
  await prisma.review.deleteMany();
  await prisma.wishlistItem.deleteMany();
  await prisma.wishlist.deleteMany();
  await prisma.productCollection.deleteMany();
  await prisma.productTag.deleteMany();
  await prisma.variantOption.deleteMany();
  await prisma.inventoryItem.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.bundleItem.deleteMany();
  await prisma.weightedMeta.deleteMany();
  await prisma.digitalMeta.deleteMany();
  await prisma.product.deleteMany();
  await prisma.categoryAttribute.deleteMany();
  await prisma.category.deleteMany();
  await prisma.optionValue.deleteMany();
  await prisma.optionGroup.deleteMany();
  await prisma.collection.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.brand.deleteMany();
  await prisma.address.deleteMany();
  await prisma.user.deleteMany();

  // MongoDB cleanup
  const mongoUri = process.env.MONGODB_URI ?? 'mongodb://localhost:27017/ecommerce';
  await connectMongoDB(mongoUri);
  await OrderModel.deleteMany({});
  await CartModel.deleteMany({});

  console.log('✅ Cleanup complete\n');

  // ========================================================================
  // SEED USERS (5-10)
  // ========================================================================
  console.log('👥 Seeding users...');

  const superAdmin = await prisma.user.create({
    data: createUser({
      email: 'superadmin@example.com',
      firstName: 'Super',
      lastName: 'Admin',
      role: 'SUPER_ADMIN',
    }),
  });

  const admin1 = await prisma.user.create({
    data: createUser({
      email: 'admin1@example.com',
      firstName: 'Admin',
      lastName: 'One',
      role: 'ADMIN',
    }),
  });

  const admin2 = await prisma.user.create({
    data: createUser({
      email: 'admin2@example.com',
      firstName: 'Admin',
      lastName: 'Two',
      role: 'ADMIN',
    }),
  });

  const customers = await Promise.all(
    Array.from({ length: 20 }).map(() =>
      prisma.user.create({
        data: createUser({ role: 'CUSTOMER' }),
      })
    )
  );

  const allUsers = [superAdmin, admin1, admin2, ...customers];
  console.log(`✅ Created ${allUsers.length} users`);

  // Create addresses for customers
  console.log('📍 Seeding addresses...');
  let addressCount = 0;
  for (const customer of customers) {
    const addressesToCreate = faker.number.int({ min: 1, max: 2 });
    for (let i = 0; i < addressesToCreate; i++) {
      await prisma.address.create({
        data: {
          userId: customer.id,
          firstName: faker.person.firstName(),
          lastName: faker.person.lastName(),
          street: faker.location.streetAddress(),
          city: faker.location.city(),
          state: faker.location.state(),
          zipCode: faker.location.zipCode(),
          country: 'US',
          phone: faker.phone.number(),
          isDefault: i === 0, // First address is default
          label: i === 0 ? 'Home' : faker.helpers.arrayElement(['Work', 'Shipping', 'Billing']),
        },
      });
      addressCount++;
    }
  }
  console.log(`✅ Created ${addressCount} addresses\n`);

  // ========================================================================
  // SEED CATEGORIES (10-15, 3 levels deep)
  // ========================================================================
  console.log('📂 Seeding categories...');

  const rootCategoryNames = ['Electronics', 'Clothing', 'Home & Garden', 'Sports', 'Books'];
  const rootCategories = [];

  for (const name of rootCategoryNames) {
    const category = await prisma.category.create({
      data: createCategory(0, '', undefined, { name }),
    });
    rootCategories.push(category);

    // Create 2-3 subcategories per root
    const subcategoryCount = faker.number.int({ min: 2, max: 3 });
    for (let i = 0; i < subcategoryCount; i++) {
      const subCategory = await prisma.category.create({
        data: createCategory(1, category.path, category.id),
      });

      // Create 1-2 sub-subcategories
      const subSubCount = faker.number.int({ min: 1, max: 2 });
      for (let j = 0; j < subSubCount; j++) {
        await prisma.category.create({
          data: createCategory(2, subCategory.path, subCategory.id),
        });
      }
    }
  }

  const allCategories = await prisma.category.findMany();
  console.log(`✅ Created ${allCategories.length} categories`);

  // Add 2-3 CategoryAttributes to each leaf/mid category
  console.log('🏷️  Seeding category attributes...');
  let attributeCount = 0;
  const leafCategories = allCategories.filter((c) => c.depth > 0);
  for (const category of leafCategories) {
    const attrCount = faker.number.int({ min: 2, max: 3 });
    for (let i = 0; i < attrCount; i++) {
      await prisma.categoryAttribute.create({
        data: {
          name: faker.commerce.productAdjective(),
          key: `attr-${i}-${faker.string.alphanumeric(4)}`,
          type: faker.helpers.arrayElement(['SELECT', 'RANGE', 'BOOLEAN', 'TEXT']),
          values: Array.from({ length: 3 }).map(() => faker.commerce.productMaterial()),
          unit: faker.helpers.arrayElement([null, 'inch', 'cm', 'GB']),
          isFilterable: true,
          isRequired: false,
          position: i,
          categoryId: category.id,
        },
      });
      attributeCount++;
    }
  }
  console.log(`✅ Created ${attributeCount} category attributes\n`);

  // ========================================================================
  // SEED BRANDS (5-8)
  // ========================================================================
  console.log('🏢 Seeding brands...');

  const brands = await Promise.all(
    Array.from({ length: 7 }).map(() => prisma.brand.create({ data: createBrand() }))
  );

  console.log(`✅ Created ${brands.length} brands\n`);

  // ========================================================================
  // SEED TAGS (8-12)
  // ========================================================================
  console.log('🏷️  Seeding tags...');

  const tagNames = [
    'New',
    'Sale',
    'Popular',
    'Limited Edition',
    'Best Seller',
    'Trending',
    'Featured',
    'Eco-Friendly',
    'Premium',
    'Budget-Friendly',
  ];

  const tags = await Promise.all(
    tagNames.map((name) =>
      prisma.tag.create({
        data: {
          name,
          slug: faker.helpers.slugify(name).toLowerCase(),
        },
      })
    )
  );

  console.log(`✅ Created ${tags.length} tags\n`);

  // ========================================================================
  // SEED COLLECTIONS (3-5)
  // ========================================================================
  console.log('📦 Seeding collections...');

  const collectionNames = ['Summer Sale', 'Best Sellers', 'New Arrivals', 'Holiday Specials'];

  const collections = await Promise.all(
    collectionNames.map((name) =>
      prisma.collection.create({
        data: {
          name,
          slug: faker.helpers.slugify(name).toLowerCase(),
          description: faker.lorem.paragraph(),
          image: faker.image.urlLoremFlickr({ category: 'business' }),
          isActive: true,
        },
      })
    )
  );

  console.log(`✅ Created ${collections.length} collections\n`);

  // ========================================================================
  // SEED OPTION GROUPS + VALUES
  // ========================================================================
  console.log('🎨 Seeding option groups and values...');

  const sizeGroup = await prisma.optionGroup.create({
    data: { name: 'Size', displayName: 'Size' },
  });

  const sizeValues = await Promise.all(
    ['XS', 'S', 'M', 'L', 'XL', 'XXL'].map((value) =>
      prisma.optionValue.create({
        data: { value, groupId: sizeGroup.id },
      })
    )
  );

  const colorGroup = await prisma.optionGroup.create({
    data: { name: 'Color', displayName: 'Color' },
  });

  const colorValues = await Promise.all(
    ['Red', 'Blue', 'Green', 'Black', 'White', 'Navy', 'Gray'].map((value) =>
      prisma.optionValue.create({
        data: { value, groupId: colorGroup.id },
      })
    )
  );

  const materialGroup = await prisma.optionGroup.create({
    data: { name: 'Material', displayName: 'Material' },
  });

  const materialValues = await Promise.all(
    ['Cotton', 'Polyester', 'Leather', 'Silk', 'Wool'].map((value) =>
      prisma.optionValue.create({
        data: { value, groupId: materialGroup.id },
      })
    )
  );

  console.log(
    `✅ Created 3 option groups with ${sizeValues.length + colorValues.length + materialValues.length} values\n`
  );

  // ========================================================================
  // SEED PRODUCTS (~50 total, all types)
  // ========================================================================
  console.log('🛍️  Seeding products...');

  const products = [];

  // ~25 SIMPLE products
  for (let i = 0; i < 25; i++) {
    const category = faker.helpers.arrayElement(leafCategories);
    const brand = faker.helpers.arrayElement([...brands, null]);

    const product = await prisma.product.create({
      data: createProduct(category.id, brand?.id, { productType: 'SIMPLE' }),
    });
    products.push(product);
  }

  // ~10 VARIABLE products (each with 3-6 variants)
  for (let i = 0; i < 10; i++) {
    const category = faker.helpers.arrayElement(leafCategories);
    const brand = faker.helpers.arrayElement([...brands, null]);

    const product = await prisma.product.create({
      data: createProduct(category.id, brand?.id, { productType: 'VARIABLE' }),
    });
    products.push(product);

    // Create 3-6 variants with options
    const variantCount = faker.number.int({ min: 3, max: 6 });
    for (let j = 0; j < variantCount; j++) {
      const variant = await prisma.productVariant.create({
        data: createProductVariant(product.id),
      });

      // Connect to 1-2 option values
      const selectedSize = faker.helpers.arrayElement(sizeValues);
      const selectedColor = faker.helpers.arrayElement(colorValues);

      await prisma.variantOption.create({
        data: {
          variantId: variant.id,
          optionId: selectedSize.id,
        },
      });

      await prisma.variantOption.create({
        data: {
          variantId: variant.id,
          optionId: selectedColor.id,
        },
      });
    }
  }

  // ~5 WEIGHTED products
  for (let i = 0; i < 5; i++) {
    const category = faker.helpers.arrayElement(leafCategories);
    const brand = faker.helpers.arrayElement([...brands, null]);

    const product = await prisma.product.create({
      data: createProduct(category.id, brand?.id, { productType: 'WEIGHTED' }),
    });
    products.push(product);

    // Create WeightedMeta
    await prisma.weightedMeta.create({
      data: {
        productId: product.id,
        unit: faker.helpers.arrayElement(['KG', 'LB', 'OZ', 'G']),
        pricePerUnit: faker.number.int({ min: 100, max: 2000 }),
        minWeight: 0.1,
        maxWeight: 10.0,
        stepWeight: 0.1,
      },
    });
  }

  // ~5 DIGITAL products
  for (let i = 0; i < 5; i++) {
    const category = faker.helpers.arrayElement(leafCategories);
    const brand = faker.helpers.arrayElement([...brands, null]);

    const product = await prisma.product.create({
      data: createProduct(category.id, brand?.id, { productType: 'DIGITAL' }),
    });
    products.push(product);

    // Create DigitalMeta
    await prisma.digitalMeta.create({
      data: {
        productId: product.id,
        fileUrl: faker.internet.url(),
        fileName: `${faker.system.fileName()}.pdf`,
        fileSize: faker.number.int({ min: 1024, max: 10485760 }),
        fileFormat: faker.helpers.arrayElement(['pdf', 'zip', 'mp3', 'mp4']),
        maxDownloads: faker.helpers.arrayElement([null, 3, 5, 10]),
        accessDuration: faker.helpers.arrayElement([null, 30, 90, 365]),
      },
    });
  }

  // ~5 BUNDLED products
  const simpleProducts = products.filter((p) => p.productType === 'SIMPLE').slice(0, 10);
  for (let i = 0; i < 5; i++) {
    const category = faker.helpers.arrayElement(leafCategories);
    const brand = faker.helpers.arrayElement([...brands, null]);

    const bundleProduct = await prisma.product.create({
      data: createProduct(category.id, brand?.id, { productType: 'BUNDLED' }),
    });
    products.push(bundleProduct);

    // Add 2-4 products to bundle
    const bundleItemCount = faker.number.int({ min: 2, max: 4 });
    const selectedProducts = faker.helpers.arrayElements(simpleProducts, bundleItemCount);

    for (const selectedProduct of selectedProducts) {
      await prisma.bundleItem.create({
        data: {
          bundleProductId: bundleProduct.id,
          productId: selectedProduct.id,
          quantity: faker.number.int({ min: 1, max: 3 }),
          discount: faker.number.int({ min: 0, max: 500 }),
        },
      });
    }
  }

  console.log(`✅ Created ${products.length} products`);

  // Link products to tags (2-4 tags each)
  console.log('🔗 Linking products to tags...');
  let productTagCount = 0;
  for (const product of products) {
    const selectedTags = faker.helpers.arrayElements(
      tags,
      faker.number.int({ min: 2, max: 4 })
    );
    for (const tag of selectedTags) {
      await prisma.productTag.create({
        data: {
          productId: product.id,
          tagId: tag.id,
        },
      });
      productTagCount++;
    }
  }
  console.log(`✅ Created ${productTagCount} product-tag links`);

  // Link products to collections
  console.log('🔗 Linking products to collections...');
  let productCollectionCount = 0;
  for (const collection of collections) {
    const selectedProducts = faker.helpers.arrayElements(
      products,
      faker.number.int({ min: 5, max: 15 })
    );
    for (const product of selectedProducts) {
      await prisma.productCollection.create({
        data: {
          productId: product.id,
          collectionId: collection.id,
          position: faker.number.int({ min: 0, max: 100 }),
        },
      });
      productCollectionCount++;
    }
  }
  console.log(`✅ Created ${productCollectionCount} product-collection links\n`);

  // ========================================================================
  // SEED REVIEWS (20-30)
  // ========================================================================
  console.log('⭐ Seeding reviews...');

  let reviewCount = 0;
  const reviewableProducts = faker.helpers.arrayElements(products, 20);
  for (const product of reviewableProducts) {
    const reviewsPerProduct = faker.number.int({ min: 1, max: 3 });
    const selectedCustomers = faker.helpers.arrayElements(customers, reviewsPerProduct);

    for (const customer of selectedCustomers) {
      try {
        await prisma.review.create({
          data: createReview(customer.id, product.id),
        });
        reviewCount++;
      } catch (error) {
        // Skip if duplicate (unique constraint on userId + productId)
      }
    }
  }

  console.log(`✅ Created ${reviewCount} reviews\n`);

  // ========================================================================
  // SEED COUPONS (3-5)
  // ========================================================================
  console.log('🎫 Seeding coupons...');

  const coupons = await Promise.all([
    prisma.coupon.create({
      data: createCoupon({
        code: 'WELCOME10',
        description: '10% off your first order',
        discountType: 'PERCENTAGE',
        discountValue: 10,
        minOrderAmount: null,
        maxDiscountAmount: null,
        perCustomerLimit: 1,
        startsAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      }),
    }),
    prisma.coupon.create({
      data: createCoupon({
        code: 'SAVE20',
        description: '$20 off orders over $100',
        discountType: 'FIXED_AMOUNT',
        discountValue: 2000,
        minOrderAmount: 10000,
        maxDiscountAmount: null,
        startsAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        expiresAt: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
      }),
    }),
    prisma.coupon.create({
      data: createCoupon({
        code: 'FREESHIP',
        description: 'Free shipping on orders over $50',
        discountType: 'FREE_SHIPPING',
        discountValue: 0,
        minOrderAmount: 5000,
        maxDiscountAmount: null,
        startsAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      }),
    }),
    prisma.coupon.create({
      data: createCoupon({
        code: 'FLASH25',
        description: '25% off flash sale',
        discountType: 'PERCENTAGE',
        discountValue: 25,
        minOrderAmount: null,
        maxDiscountAmount: 5000,
        usageLimit: 100,
        startsAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      }),
    }),
  ]);

  console.log(`✅ Created ${coupons.length} coupons\n`);

  // ========================================================================
  // SEED PROMOTIONS (2-3)
  // ========================================================================
  console.log('🎉 Seeding promotions...');

  const promotions = await Promise.all([
    prisma.promotion.create({
      data: {
        name: 'Buy 3 Get 10% Off',
        description: 'Buy 3 or more items and get 10% off',
        type: 'TIERED_PRICING',
        discountType: 'PERCENTAGE',
        discountValue: 10,
        conditions: { minQuantity: 3 },
        applicableProductIds: [],
        applicableCategoryIds: [],
        stackable: false,
        priority: 10,
        usageLimit: null,
        usageCount: 0,
        startsAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        isActive: true,
      },
    }),
    prisma.promotion.create({
      data: {
        name: 'Buy 2 Get 1 Free',
        description: 'Buy 2 and get 1 free on selected items',
        type: 'BOGO',
        discountType: 'PERCENTAGE',
        discountValue: 100,
        conditions: { buyQuantity: 2, getQuantity: 1 },
        applicableProductIds: products.slice(0, 10).map((p) => p.id),
        applicableCategoryIds: [],
        stackable: false,
        priority: 5,
        usageLimit: null,
        usageCount: 0,
        startsAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        isActive: true,
      },
    }),
  ]);

  console.log(`✅ Created ${promotions.length} promotions\n`);

  // ========================================================================
  // SEED SHIPPING ZONES + METHODS
  // ========================================================================
  console.log('🚚 Seeding shipping zones and methods...');

  const usZone = await prisma.shippingZone.create({
    data: {
      name: 'US Domestic',
      countries: ['US'],
      states: [],
      isActive: true,
      freeShippingThreshold: 7500, // $75
    },
  });

  await prisma.shippingMethod.createMany({
    data: [
      {
        name: 'Standard Shipping',
        description: '5-7 business days',
        zoneId: usZone.id,
        rateType: 'FLAT_RATE',
        flatRate: 599, // $5.99
        estimatedDaysMin: 5,
        estimatedDaysMax: 7,
        isActive: true,
        position: 1,
      },
      {
        name: 'Express Shipping',
        description: '2-3 business days',
        zoneId: usZone.id,
        rateType: 'FLAT_RATE',
        flatRate: 1499, // $14.99
        estimatedDaysMin: 2,
        estimatedDaysMax: 3,
        isActive: true,
        position: 2,
      },
    ],
  });

  const intlZone = await prisma.shippingZone.create({
    data: {
      name: 'International',
      countries: ['CA', 'GB', 'AU', 'DE', 'FR', 'IT', 'ES'],
      states: [],
      isActive: true,
      freeShippingThreshold: null,
    },
  });

  await prisma.shippingMethod.create({
    data: {
      name: 'International Standard',
      description: '10-15 business days',
      zoneId: intlZone.id,
      rateType: 'WEIGHT_BASED',
      weightRate: 1599, // $15.99 base
      minWeight: 0.1,
      maxWeight: 50.0,
      estimatedDaysMin: 10,
      estimatedDaysMax: 15,
      isActive: true,
      position: 1,
    },
  });

  console.log(`✅ Created 2 shipping zones with 3 shipping methods\n`);

  // ========================================================================
  // SEED WAREHOUSES (2-3)
  // ========================================================================
  console.log('🏭 Seeding warehouses...');

  const warehouses = await Promise.all([
    prisma.warehouse.create({
      data: {
        name: 'East Coast Warehouse',
        code: 'EC-01',
        address: '123 Industrial Pkwy',
        city: 'Newark',
        state: 'NJ',
        country: 'US',
        zipCode: '07102',
        latitude: 40.7357,
        longitude: -74.1724,
        priority: 10,
        isActive: true,
      },
    }),
    prisma.warehouse.create({
      data: {
        name: 'West Coast Warehouse',
        code: 'WC-01',
        address: '456 Logistics Blvd',
        city: 'Los Angeles',
        state: 'CA',
        country: 'US',
        zipCode: '90001',
        latitude: 34.0522,
        longitude: -118.2437,
        priority: 10,
        isActive: true,
      },
    }),
    prisma.warehouse.create({
      data: {
        name: 'Central Warehouse',
        code: 'CT-01',
        address: '789 Distribution Dr',
        city: 'Chicago',
        state: 'IL',
        country: 'US',
        zipCode: '60601',
        latitude: 41.8781,
        longitude: -87.6298,
        priority: 5,
        isActive: true,
      },
    }),
  ]);

  console.log(`✅ Created ${warehouses.length} warehouses\n`);

  // ========================================================================
  // SEED INVENTORY ITEMS
  // ========================================================================
  console.log('📦 Seeding inventory items...');

  const allVariants = await prisma.productVariant.findMany();
  const variantsToStock = allVariants.length > 0 ? allVariants : [];

  let inventoryItemCount = 0;
  for (const variant of variantsToStock) {
    // Create inventory for 1-2 warehouses per variant
    const warehouseCount = faker.number.int({ min: 1, max: 2 });
    const selectedWarehouses = faker.helpers.arrayElements(warehouses, warehouseCount);

    for (const warehouse of selectedWarehouses) {
      // Create variety: some healthy stock, some low, some critically low/out
      const stockProfile = faker.helpers.weightedArrayElement([
        { value: 'healthy', weight: 5 },
        { value: 'low', weight: 3 },
        { value: 'critical', weight: 1 },
        { value: 'out', weight: 1 },
      ]);

      let quantity: number;
      let reserved: number;
      let lowStockThreshold: number;

      switch (stockProfile) {
        case 'healthy':
          quantity = faker.number.int({ min: 50, max: 200 });
          reserved = faker.number.int({ min: 0, max: 10 });
          lowStockThreshold = 10;
          break;
        case 'low':
          quantity = faker.number.int({ min: 8, max: 15 });
          reserved = faker.number.int({ min: 0, max: 3 });
          lowStockThreshold = 15;
          break;
        case 'critical':
          quantity = faker.number.int({ min: 2, max: 5 });
          reserved = faker.number.int({ min: 0, max: 2 });
          lowStockThreshold = 10;
          break;
        case 'out':
        default:
          quantity = faker.number.int({ min: 0, max: 2 });
          reserved = quantity;
          lowStockThreshold = 5;
          break;
      }

      const inventoryItem = await prisma.inventoryItem.create({
        data: {
          variantId: variant.id,
          warehouseId: warehouse.id,
          quantity,
          reserved,
          lowStockThreshold,
        },
      });

      // Create initial stock movement
      await prisma.stockMovement.create({
        data: {
          inventoryItemId: inventoryItem.id,
          quantity,
          reason: 'RESTOCK',
          note: 'Initial stock',
        },
      });

      inventoryItemCount++;
    }
  }

  console.log(`✅ Created ${inventoryItemCount} inventory items\n`);

  // ========================================================================
  // SEED MONGODB: ORDERS (50+)
  // ========================================================================
  console.log('📋 Seeding orders (MongoDB)...');

  // Distribution: more delivered/shipped, fewer cancelled — realistic mix
  const statusDistribution = [
    ...Array(15).fill('pending'),
    ...Array(25).fill('paid'),
    ...Array(20).fill('processing'),
    ...Array(30).fill('shipped'),
    ...Array(40).fill('delivered'),
    ...Array(10).fill('cancelled'),
    ...Array(5).fill('returned'),
    ...Array(5).fill('refund_requested'),
  ];
  const ordersToCreate = 150;
  const createdOrders = [];

  for (let i = 0; i < ordersToCreate; i++) {
    const customer = faker.helpers.arrayElement(customers);
    const itemCount = faker.number.int({ min: 1, max: 5 });
    const selectedProducts = faker.helpers.arrayElements(products, itemCount);

    const orderItems = selectedProducts.map((product) => ({
      productId: product.id,
      variantId: undefined,
      name: product.name,
      sku: product.sku,
      price: product.price,
      quantity: faker.number.int({ min: 1, max: 3 }),
      imageUrl: product.images[0],
      attributes: {},
    }));

    const status = statusDistribution[i % statusDistribution.length];

    // Spread orders: 60% in last 30 days, 30% in days 31-60, 10% in days 61-90
    let createdAt: Date;
    const roll = faker.number.float({ min: 0, max: 1 });
    if (roll < 0.6) {
      createdAt = faker.date.between({
        from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        to: new Date(),
      });
    } else if (roll < 0.9) {
      createdAt = faker.date.between({
        from: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
        to: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      });
    } else {
      createdAt = faker.date.between({
        from: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
        to: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
      });
    }

    const orderData = createOrderData(customer.id, orderItems, { status, createdAt });

    const order = await OrderModel.create(orderData);
    createdOrders.push(order);
  }

  console.log(`✅ Created ${createdOrders.length} orders\n`);

  // ========================================================================
  // SEED MONGODB: CARTS (3-5)
  // ========================================================================
  console.log('🛒 Seeding carts (MongoDB)...');

  const cartsToCreate = [];

  // 2 guest carts
  for (let i = 0; i < 2; i++) {
    const itemCount = faker.number.int({ min: 1, max: 3 });
    const selectedProducts = faker.helpers.arrayElements(products, itemCount);

    const cartData = createCartData({
      sessionId: faker.string.uuid(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    cartData.items = selectedProducts.map((product) => ({
      productId: product.id,
      variantId: undefined,
      name: product.name,
      price: product.price,
      quantity: faker.number.int({ min: 1, max: 3 }),
      imageUrl: product.images[0],
      sku: product.sku,
      attributes: {},
    }));

    cartsToCreate.push(cartData);
  }

  // 2-3 authenticated carts
  for (let i = 0; i < 3; i++) {
    const customer = faker.helpers.arrayElement(customers);
    const itemCount = faker.number.int({ min: 1, max: 4 });
    const selectedProducts = faker.helpers.arrayElements(products, itemCount);

    const cartData = createCartData({
      userId: customer.id,
    });

    cartData.items = selectedProducts.map((product) => ({
      productId: product.id,
      variantId: undefined,
      name: product.name,
      price: product.price,
      quantity: faker.number.int({ min: 1, max: 3 }),
      imageUrl: product.images[0],
      sku: product.sku,
      attributes: {},
    }));

    cartsToCreate.push(cartData);
  }

  await CartModel.insertMany(cartsToCreate);
  console.log(`✅ Created ${cartsToCreate.length} carts\n`);

  // ========================================================================
  // SUMMARY
  // ========================================================================
  console.log('🎉 Seed complete!\n');
  console.log('Summary:');
  console.log(`  - Users: ${allUsers.length}`);
  console.log(`  - Addresses: ${addressCount}`);
  console.log(`  - Categories: ${allCategories.length}`);
  console.log(`  - Category Attributes: ${attributeCount}`);
  console.log(`  - Brands: ${brands.length}`);
  console.log(`  - Tags: ${tags.length}`);
  console.log(`  - Collections: ${collections.length}`);
  console.log(`  - Products: ${products.length}`);
  console.log(`  - Product-Tag Links: ${productTagCount}`);
  console.log(`  - Product-Collection Links: ${productCollectionCount}`);
  console.log(`  - Reviews: ${reviewCount}`);
  console.log(`  - Coupons: ${coupons.length}`);
  console.log(`  - Promotions: ${promotions.length}`);
  console.log(`  - Shipping Zones: 2`);
  console.log(`  - Shipping Methods: 3`);
  console.log(`  - Warehouses: ${warehouses.length}`);
  console.log(`  - Inventory Items: ${inventoryItemCount}`);
  console.log(`  - Orders (MongoDB): ${createdOrders.length} (150 across 90 days)`);
  console.log(`  - Carts (MongoDB): ${cartsToCreate.length}`);
}

main()
  .catch((error) => {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await mongoose.disconnect();
  });
