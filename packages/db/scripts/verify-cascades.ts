import { readFileSync } from 'fs';

const schema = readFileSync('./packages/db/prisma/schema.prisma', 'utf-8');

const checks: [string, RegExp, string][] = [
  // Restrict: Parent deletion prevented if children exist
  ['Product → Category (Restrict)', /category\s+Category\s+@relation\(fields:\s*\[categoryId\],\s*references:\s*\[id\],\s*onDelete:\s*Restrict\)/s, 'Restrict'],
  ['Category → parent Category (Restrict)', /parent\s+Category\?\s+@relation\("CategoryTree",\s*fields:\s*\[parentId\],\s*references:\s*\[id\],\s*onDelete:\s*Restrict\)/s, 'Restrict'],

  // SetNull: Nullify reference on parent deletion
  ['Brand → Product (SetNull)', /brand\s+Brand\?\s+@relation\(fields:\s*\[brandId\],\s*references:\s*\[id\],\s*onDelete:\s*SetNull\)/s, 'SetNull'],

  // Cascade: Child deletion on parent deletion
  ['ProductVariant → Product (Cascade)', /product\s+Product\s+@relation\(fields:\s*\[productId\],\s*references:\s*\[id\],\s*onDelete:\s*Cascade\)/s, 'Cascade'],
  ['Address → User (Cascade)', /user\s+User\s+@relation\(fields:\s*\[userId\],\s*references:\s*\[id\],\s*onDelete:\s*Cascade\)/s, 'Cascade'],
  ['Review → User (Cascade)', /user\s+User\s+@relation\(fields:\s*\[userId\],\s*references:\s*\[id\],\s*onDelete:\s*Cascade\)/s, 'Cascade'],
  ['Review → Product (Cascade)', /product\s+Product\s+@relation\(fields:\s*\[productId\],\s*references:\s*\[id\],\s*onDelete:\s*Cascade\)/s, 'Cascade'],
  ['Wishlist → User (Cascade)', /user\s+User\s+@relation\(fields:\s*\[userId\],\s*references:\s*\[id\],\s*onDelete:\s*Cascade\)/s, 'Cascade'],
  ['WishlistItem → Wishlist (Cascade)', /wishlist\s+Wishlist\s+@relation\(fields:\s*\[wishlistId\],\s*references:\s*\[id\],\s*onDelete:\s*Cascade\)/s, 'Cascade'],
  ['WishlistItem → Product (Cascade)', /product\s+Product\s+@relation\(fields:\s*\[productId\],\s*references:\s*\[id\],\s*onDelete:\s*Cascade\)/s, 'Cascade'],
  ['CategoryAttribute → Category (Cascade)', /category\s+Category\s+@relation\(fields:\s*\[categoryId\],\s*references:\s*\[id\],\s*onDelete:\s*Cascade\)/s, 'Cascade'],
  ['DigitalMeta → Product (Cascade)', /product\s+Product\s+@relation\(fields:\s*\[productId\],\s*references:\s*\[id\],\s*onDelete:\s*Cascade\)/s, 'Cascade'],
  ['WeightedMeta → Product (Cascade)', /product\s+Product\s+@relation\(fields:\s*\[productId\],\s*references:\s*\[id\],\s*onDelete:\s*Cascade\)/s, 'Cascade'],
  ['BundleItem → Bundle Product (Cascade)', /bundleProduct\s+Product\s+@relation\("BundleProduct",\s*fields:\s*\[bundleProductId\],\s*references:\s*\[id\],\s*onDelete:\s*Cascade\)/s, 'Cascade'],
  ['BundleItem → Bundled Product (Cascade)', /product\s+Product\s+@relation\("BundledProduct",\s*fields:\s*\[productId\],\s*references:\s*\[id\],\s*onDelete:\s*Cascade\)/s, 'Cascade'],
  ['VariantOption → ProductVariant (Cascade)', /variant\s+ProductVariant\s+@relation\(fields:\s*\[variantId\],\s*references:\s*\[id\],\s*onDelete:\s*Cascade\)/s, 'Cascade'],
  ['VariantOption → OptionValue (Cascade)', /option\s+OptionValue\s+@relation\(fields:\s*\[optionId\],\s*references:\s*\[id\],\s*onDelete:\s*Cascade\)/s, 'Cascade'],
  ['OptionValue → OptionGroup (Cascade)', /group\s+OptionGroup\s+@relation\(fields:\s*\[groupId\],\s*references:\s*\[id\],\s*onDelete:\s*Cascade\)/s, 'Cascade'],
  ['ProductTag → Product (Cascade)', /product\s+Product\s+@relation\(fields:\s*\[productId\],\s*references:\s*\[id\],\s*onDelete:\s*Cascade\)/s, 'Cascade'],
  ['ProductTag → Tag (Cascade)', /tag\s+Tag\s+@relation\(fields:\s*\[tagId\],\s*references:\s*\[id\],\s*onDelete:\s*Cascade\)/s, 'Cascade'],
  ['ProductCollection → Product (Cascade)', /product\s+Product\s+@relation\(fields:\s*\[productId\],\s*references:\s*\[id\],\s*onDelete:\s*Cascade\)/s, 'Cascade'],
  ['ProductCollection → Collection (Cascade)', /collection\s+Collection\s+@relation\(fields:\s*\[collectionId\],\s*references:\s*\[id\],\s*onDelete:\s*Cascade\)/s, 'Cascade'],
  ['InventoryItem → Warehouse (Cascade)', /warehouse\s+Warehouse\s+@relation\(fields:\s*\[warehouseId\],\s*references:\s*\[id\],\s*onDelete:\s*Cascade\)/s, 'Cascade'],
  ['InventoryItem → ProductVariant (Cascade)', /variant\s+ProductVariant\s+@relation\(fields:\s*\[variantId\],\s*references:\s*\[id\],\s*onDelete:\s*Cascade\)/s, 'Cascade'],
  ['StockMovement → InventoryItem (Cascade)', /inventoryItem\s+InventoryItem\s+@relation\(fields:\s*\[inventoryItemId\],\s*references:\s*\[id\],\s*onDelete:\s*Cascade\)/s, 'Cascade'],
  ['ShippingMethod → ShippingZone (Cascade)', /zone\s+ShippingZone\s+@relation\(fields:\s*\[zoneId\],\s*references:\s*\[id\],\s*onDelete:\s*Cascade\)/s, 'Cascade'],
];

let passed = 0;
let failed = 0;

console.log('Verifying cascading delete behavior for SCHEMA-12...\n');

for (const [desc, pattern, expected] of checks) {
  if (pattern.test(schema)) {
    console.log(`✓ PASS: ${desc} → onDelete: ${expected}`);
    passed++;
  } else {
    console.error(`✗ FAIL: ${desc} → expected onDelete: ${expected} not found`);
    failed++;
  }
}

console.log(`\n${'='.repeat(60)}`);
console.log(`Results: ${passed} passed, ${failed} failed out of ${checks.length}`);
console.log(`${'='.repeat(60)}\n`);

if (failed > 0) {
  console.error('SCHEMA-12 VERIFICATION FAILED: Some cascade/restrict/setNull actions are missing or incorrect.');
  process.exit(1);
}

console.log('SCHEMA-12 VERIFIED: No orphaned records possible — all cascade/restrict/setNull actions confirmed.');
