import packageJson from "../../package.json";

const currentYear = new Date().getFullYear();

export const APP_CONFIG = {
  name: "Taranka",
  version: packageJson.version,
  copyright: `© ${currentYear}, Taranka.`,
  meta: {
    title: "Taranka Admin",
    description:
      "Taranka — панель управления магазином, построенная на Next.js 16, Tailwind CSS v4 и shadcn/ui с полной кастомизацией темы и раскладки.",
  },
};
