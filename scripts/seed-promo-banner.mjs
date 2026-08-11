// Idempotent seed for the initial homepage promo banner.
// Mirrors the previous hardcoded "Ridna Ukraina" block so the storefront looks
// unchanged, but the content now lives in the DB and is editable from the admin.
// Run: node scripts/seed-promo-banner.mjs   (from the repo root / container /app)
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const count = await prisma.promoBanner.count();
  if (count > 0) {
    console.log(`[seed-promo] ${count} banner(s) already exist — skipping.`);
    return;
  }

  const banner = await prisma.promoBanner.create({
    data: {
      image: '/book-ridna-ukraina.png',
      title: {
        pl: 'Słodycze\n“Rodzima Ukraina”',
        uk: 'Солодощі\n«Рідна Україна»',
      },
      subtitle: {
        pl: 'Za jedyne 45 zł\nJeden z najpopularniejszych produktów w naszym sklepie.\nIdealny na symboliczny prezent.',
        uk: 'Лише за 45 zł\nОдин із найпопулярніших товарів у нашому магазині.\nІдеальний як символічний подарунок.',
      },
      ctaLabel: { pl: 'Dowiedz się więcej', uk: 'Дізнатися більше' },
      href: '/products',
      isActive: true,
      position: 0,
    },
  });

  console.log('[seed-promo] created banner', banner.id);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error('[seed-promo] failed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
