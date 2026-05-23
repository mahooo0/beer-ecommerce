export interface SearchDocument {
  id: string;
  name: string;
  description: string;
  sku: string;
  price: number;
  images: string[];
  status: string;
  productType: string;
  brandId: string | null;
  brandName: string | null;
  categoryId: string;
  categoryName: string;
  categoryPath: string;
  createdAt: number; // Unix timestamp in ms
  updatedAt: number; // Unix timestamp in ms
}
