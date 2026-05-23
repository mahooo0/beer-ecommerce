import type {
  Product,
  ProductVariant,
  Category,
  Brand,
  BundleItem,
  DigitalMeta,
  WeightedMeta,
} from '@repo/types';

export interface VariantOptionData {
  id: string;
  optionId: string;
  option: {
    id: string;
    value: string;
    label?: string;
    groupId: string;
    group: {
      id: string;
      name: string;
      displayName: string;
    };
  };
}

export interface ProductVariantDetail extends ProductVariant {
  options: VariantOptionData[];
}

export interface ProductDetail extends Product {
  category: Category;
  brand?: Brand;
  variants: ProductVariantDetail[];
  digitalMeta?: DigitalMeta;
  weightedMeta?: WeightedMeta;
  bundleItems?: Array<BundleItem & { product: Product }>;
  tags?: Array<{ tagId: string; tag: { name: string; slug: string } }>;
}
