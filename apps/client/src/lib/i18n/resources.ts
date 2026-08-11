import type { Language, Namespace } from "./settings";

import plCommon from "./locales/pl/common.json";
import plHome from "./locales/pl/home.json";
import plCatalog from "./locales/pl/catalog.json";
import plCart from "./locales/pl/cart.json";
import plCheckout from "./locales/pl/checkout.json";
import plProfile from "./locales/pl/profile.json";
import plAuth from "./locales/pl/auth.json";
import plCategories from "./locales/pl/categories.json";
import plShop from "./locales/pl/shop.json";
import plMisc from "./locales/pl/misc.json";

import ukCommon from "./locales/uk/common.json";
import ukHome from "./locales/uk/home.json";
import ukCatalog from "./locales/uk/catalog.json";
import ukCart from "./locales/uk/cart.json";
import ukCheckout from "./locales/uk/checkout.json";
import ukProfile from "./locales/uk/profile.json";
import ukAuth from "./locales/uk/auth.json";
import ukCategories from "./locales/uk/categories.json";
import ukShop from "./locales/uk/shop.json";
import ukMisc from "./locales/uk/misc.json";

export const resources: Record<Language, Record<Namespace, Record<string, unknown>>> = {
  pl: {
    common: plCommon,
    home: plHome,
    catalog: plCatalog,
    cart: plCart,
    checkout: plCheckout,
    profile: plProfile,
    auth: plAuth,
    categories: plCategories,
    shop: plShop,
    misc: plMisc,
  },
  uk: {
    common: ukCommon,
    home: ukHome,
    catalog: ukCatalog,
    cart: ukCart,
    checkout: ukCheckout,
    profile: ukProfile,
    auth: ukAuth,
    categories: ukCategories,
    shop: ukShop,
    misc: ukMisc,
  },
};
