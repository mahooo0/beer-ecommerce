// Українська
import type { Resources } from "./en";

export const uk: Resources = {
  nav: {
    blog: "Блог",
    leads: "Заявки",
    blogPosts: "Пости",
    blogCategories: "Категорії",
    blogMedia: "Медіа",
    pages: "Сторінки",
    overview: "Огляд",
    catalog: "Каталог",
    allProducts: "Усі товари",
    addProduct: "Додати товар",
    categories: "Категорії",
    collections: "Колекції",
    brands: "Бренди",
    promoBanners: "Промо-банери",
    users: "Користувачі",
  },
  language: {
    title: "Мова",
    en: "English",
    pl: "Polski",
    uk: "Українська",
  },
  common: {
    noResults: "Нічого не знайдено.",
    search: "Пошук",
  },
  quickCreate: {
    tooltip: "Швидке створення",
    placeholder: "Введіть команду або пошук…",
    createGroup: "Створити",
    button: "Швидка дія",
    actions: {
      product: "Додати товар",
      category: "Додати категорію",
      collection: "Додати колекцію",
      brand: "Додати бренд",
      user: "Додати користувача",
    },
  },
  search: {
    placeholder: "Пошук панелей, користувачів тощо…",
  },
  categories: {
    title: "Категорії",
    add: "Додати категорію",
    hierarchy: "Ієрархія категорій",
    searchLabel: "Пошук",
    searchPlaceholder: "Пошук категорій...",
    createTitle: "Створити категорію",
    editTitle: "Редагувати категорію",
    createDesc: "Заповніть дані, щоб створити нову категорію.",
    editDesc: "Оновіть дані категорії нижче.",
    form: {
      name: "Назва",
      description: "Опис",
      parent: "Батьківська категорія",
      none: "Немає (коренева категорія)",
      image: "Зображення",
      seo: "Налаштування SEO",
      slug: "URL-адреса (slug)",
      slugPreview: "Перегляд: /categories/{{slug}}",
      metaTitle: "Мета-заголовок",
      metaDescription: "Мета-опис",
      create: "Створити категорію",
      update: "Оновити категорію",
      cancel: "Скасувати",
      saving: "Збереження...",
      errors: {
        nameRequired: "Назва обов'язкова",
        nameMax: "Назва має містити не більше 100 символів",
        urlInvalid: "Має бути дійсний URL",
        metaTitleMax: "Мета-заголовок має містити не більше 60 символів",
        metaDescMax: "Мета-опис має містити не більше 160 символів",
        slugInvalid: "Slug може містити лише малі літери, цифри та дефіси",
        notAuth: "Не автентифіковано",
        saveFailed: "Не вдалося зберегти категорію",
      },
    },
  },
  overview: {
    "title": "Панель керування",
    "dateRange": {
      "last7d": "Останні 7 днів",
      "last30d": "Останні 30 днів",
      "last90d": "Останні 90 днів",
      "thisYear": "Цей рік"
    },
    "kpi": {
      "totalRevenue": "Загальний дохід",
      "totalOrders": "Усього замовлень",
      "avgOrderValue": "Середня вартість замовлення",
      "totalCustomers": "Усього клієнтів"
    },
    "revenue": {
      "title": "Дохід у часі",
      "label": "Дохід",
      "empty": "Немає даних за обраний період"
    },
    "orderStatus": {
      "title": "Статус замовлень",
      "orders": "Замовлення",
      "empty": "Немає даних про замовлення"
    },
    "lowStock": {
      "title": "Сповіщення про низький запас",
      "viewAll": "Переглянути всі",
      "empty": "Немає сповіщень про низький запас",
      "availableThreshold": "Доступно: {{available}} · Поріг: {{threshold}}",
      "out": "Немає",
      "low": "Низький"
    },
    "recentOrders": {
      "title": "Останні замовлення",
      "empty": "Немає останніх замовлень",
      "columns": {
        "orderNumber": "№ замовлення",
        "customer": "Клієнт",
        "total": "Разом",
        "status": "Статус",
        "date": "Дата"
      }
    },
    "topProducts": {
      "title": "Топ товари",
      "empty": "Немає даних про товари",
      "unitsSold": "продано {{count}} шт."
    },
    "status": {
      "pending": "Очікує",
      "paid": "Оплачено",
      "processing": "Обробляється",
      "shipped": "Відправлено",
      "delivered": "Доставлено",
      "cancelled": "Скасовано",
      "returned": "Повернено",
      "refund_requested": "Запит на повернення коштів"
    }
  },
  products: {
    "title": "Товари",
    "count": "{{count}} товарів",
    "incomplete": "{{count}} не заповнено повністю",
    "incompleteCurrentPage": "{{count}} не заповнено повністю (за поточну сторінку)",
    "newProduct": "Новий товар",
    "empty": "Товарів не знайдено.",
    "columns": {
      "selectAll": "Обрати всі",
      "selectRow": "Обрати рядок",
      "image": "Зображення",
      "name": "Назва",
      "category": "Категорія",
      "price": "Ціна",
      "availability": "Наявність",
      "completeness": "Заповнення",
      "status": "Статус",
      "actions": "Дії"
    },
    "status": {
      "DRAFT": "Чернетка",
      "ACTIVE": "Активний",
      "ARCHIVED": "Архів"
    },
    "type": {
      "SIMPLE": "Простий",
      "VARIABLE": "Варіативний",
      "WEIGHTED": "Ваговий",
      "DIGITAL": "Цифровий",
      "BUNDLED": "Комплект"
    },
    "availability": {
      "inStock": "В наявності",
      "outOfStock": "Немає",
      "units": "{{count}} шт"
    },
    "filters": {
      "title": "Фільтри",
      "clear": "Очистити",
      "category": "Категорія",
      "allCategories": "Усі категорії",
      "status": "Статус",
      "allStatuses": "Усі статуси",
      "allTypes": "Усі типи",
      "availability": "Наявність",
      "anyAvailability": "Будь-яка",
      "completeness": "Заповнення",
      "allCompleteness": "Усі",
      "completenessComplete": "Заповнені (100%)",
      "completenessIncomplete": "Не заповнені",
      "price": "Ціна (₴)",
      "priceFrom": "від",
      "priceTo": "до"
    },
    "actions": {
      "edit": "Редагувати",
      "delete": "Видалити",
      "deleteConfirm": "Видалити цей товар?"
    },
    "bulk": {
      "actions": "Масові дії",
      "setActive": "Зробити активним",
      "setDraft": "Зробити чернеткою",
      "setArchived": "Перенести в архів",
      "deleteSelected": "Видалити обрані",
      "selectedCount": "Обрано: {{count}}",
      "confirmUpdate": "Змінити статус {{count}} товарів на {{status}}?",
      "confirmDelete": "Видалити {{count}} товарів? Цю дію не можна скасувати."
    },
    "table": {
      "searchPlaceholder": "Пошук товарів...",
      "createProduct": "Створити товар",
      "empty": "Товарів не знайдено"
    },
    "pagination": {
      "previous": "Назад",
      "next": "Далі",
      "back": "Назад",
      "forward": "Далі",
      "pageOf": "Сторінка {{page}} з {{total}}",
      "perPage": "{{count}} на сторінку"
    },
    "toasts": {
      "deleteFailed": "Не вдалося видалити товар",
      "selectToUpdate": "Оберіть товари для оновлення",
      "selectToDelete": "Оберіть товари для видалення",
      "updateFailed": "Не вдалося оновити товари: {{message}}",
      "deleteFailedDetail": "Не вдалося видалити товари: {{message}}"
    }
  },
  productForm: {
    "pageTitle": {
      "create": "Створити товар",
      "edit": "Редагувати товар"
    },
    "sections": {
      "basicInfo": "Основна інформація",
      "pricing": "Ціна",
      "stock": "Наявність / Запас",
      "attributes": "Атрибути",
      "organization": "Організація",
      "images": "Зображення",
      "keywords": "Ключові слова",
      "wholesale": "Оптові ціни (гурт)"
    },
    "wholesale": {
      "description": "Ціни за кількість для оптових клієнтів (WHOLESALE). Роздрібні клієнти завжди платять звичайну ціну.",
      "minQty": "Кількість від",
      "price": "Ціна за обсяг (копійки)",
      "perUnit": "≈ {{value}} zł/шт",
      "addTier": "Додати рівень",
      "remove": "Видалити рівень",
      "empty": "Рівнів ще немає. Додайте перший рівень оптової ціни."
    },
    "fields": {
      "name": "Назва",
      "description": "Опис",
      "composition": "Склад",
      "slug": "Slug (URL)",
      "price": "Ціна (копійки)",
      "salePrice": "Ціна зі знижкою (копійки)",
      "baseUnit": "Одиниця виміру",
      "category": "Категорія",
      "manufacturer": "Виробник",
      "brand": "Бренд",
      "status": "Статус"
    },
    "placeholders": {
      "name": "Введіть назву товару",
      "description": "Опишіть товар",
      "composition": "Склад / інгредієнти",
      "slug": "url-tovaru",
      "category": "Оберіть категорію",
      "manufacturer": "Назва виробника",
      "brand": "Оберіть бренд (необов'язково)",
      "keywords": "Формуються автоматично на сервері"
    },
    "hints": {
      "slug": "Формується з назви. Сервер перевіряє унікальність під час збереження."
    },
    "stock": {
      "quantityTab": "Кількість",
      "availabilityTab": "Наявність",
      "quantityLabel": "Кількість на складі",
      "quantityHint": "Відстежується числом; списується при замовленні.",
      "inStock": "В наявності",
      "outOfStock": "Немає в наявності",
      "availabilityHint": "Ручний перемикач наявності без обліку кількості."
    },
    "status": {
      "draft": "Чернетка",
      "active": "Активний",
      "archived": "Архів"
    },
    "actions": {
      "cancel": "Скасувати",
      "saving": "Збереження…",
      "update": "Оновити товар",
      "create": "Створити товар"
    },
    "toasts": {
      "created": "Товар створено",
      "updated": "Товар оновлено",
      "saveFailed": "Не вдалося зберегти товар"
    },
    "attributes": {
      "selectCategoryFirst": "Оберіть категорію, щоб задати атрибути товару.",
      "loading": "Завантаження атрибутів…",
      "loadError": "Не вдалося завантажити атрибути для цієї категорії.",
      "empty": "Для цієї категорії не визначено атрибутів. Додайте їх на сторінці категорії.",
      "noValues": "Немає значень. Додайте «спільні опції» на сторінці категорії.",
      "notSet": "— не задано —"
    },
    "images": {
      "count": "{{count}}/{{max}} зображень",
      "reorderHint": " · перетягніть, щоб змінити порядок",
      "clearAll": "Очистити все",
      "alt": "Зображення товару",
      "mainBadge": "Головне",
      "dragTitle": "Перетягнути",
      "setMainTitle": "Зробити головним",
      "removeTitle": "Видалити"
    },
    "completeness": {
      "filled": "Заповнено {{percent}}%",
      "allFilled": "Усі поля заповнені"
    }
  },
  collections: {
    "title": "Колекції",
    "add": "Додати колекцію",
    "empty": "Колекцій не знайдено. Створіть одну, щоб почати.",
    "filters": {
      "search": "Пошук",
      "searchPlaceholder": "Пошук колекцій..."
    },
    "analytics": {
      "title": "Аналітика колекцій",
      "total": "Усього колекцій",
      "active": "Активні",
      "inactive": "Неактивні"
    },
    "columns": {
      "name": "Назва",
      "slug": "Slug",
      "products": "Товари",
      "status": "Статус",
      "actions": "Дії"
    },
    "status": {
      "active": "Активна",
      "inactive": "Неактивна"
    },
    "actions": {
      "edit": "Редагувати",
      "products": "Товари",
      "delete": "Видалити",
      "deleteConfirm": "Ви впевнені, що хочете видалити цю колекцію?"
    },
    "sheet": {
      "editTitle": "Редагувати колекцію",
      "createTitle": "Створити колекцію",
      "editDescription": "Оновіть деталі колекції нижче.",
      "createDescription": "Заповніть деталі, щоб створити нову колекцію."
    },
    "form": {
      "name": "Назва",
      "namePlaceholder": "Літня колекція",
      "slug": "Slug",
      "slugPlaceholder": "litnya-kolektsiya",
      "description": "Опис",
      "descriptionPlaceholder": "Дібрані товари для літнього сезону",
      "image": "Зображення",
      "active": "Активна",
      "saving": "Збереження...",
      "update": "Оновити колекцію",
      "create": "Створити колекцію",
      "cancel": "Скасувати"
    },
    "products": {
      "manageTitle": "Керування товарами в \"{{name}}\"",
      "current": "Поточні товари",
      "empty": "У цій колекції ще немає товарів.",
      "add": "Додати товари",
      "addButton": "Додати",
      "remove": "Видалити",
      "searchPlaceholder": "Пошук товарів за назвою або SKU...",
      "noResults": "Товарів не знайдено",
      "sku": "SKU: {{sku}}",
      "addFailed": "Не вдалося додати товар",
      "removeFailed": "Не вдалося видалити товар"
    },
    "errors": {
      "nameRequired": "Назва обов'язкова",
      "slugRequired": "Slug обов'язковий",
      "urlInvalid": "Має бути дійсною URL-адресою",
      "notAuth": "Не автентифіковано",
      "saveFailed": "Не вдалося зберегти колекцію",
      "deleteFailed": "Не вдалося видалити колекцію"
    }
  },
  leads: {
    title: "Заявки",
    empty: "Заявок ще немає.",
    searchPlaceholder: "Пошук у заявках…",
    analytics: { title: "Заявки з форм", total: "Усього", forms: "Форми" },
    columns: { date: "Дата", form: "Форма", data: "Надіслані дані" },
  },
  blog: {
    title: "Блог",
    add: "Новий пост",
    count: "Постів: {{count}}",
    empty: "Постів ще немає.",
    searchPlaceholder: "Пошук за назвою або slug…",
    analytics: { title: "Огляд блогу", total: "Усього", published: "Опубліковані", drafts: "Чернетки" },
    columns: { title: "Назва", categories: "Категорії", status: "Статус", updated: "Оновлено", actions: "Дії" },
    status: { published: "Опубліковано", draft: "Чернетка" },
    actions: { edit: "Редагувати", delete: "Видалити", deleteConfirm: "Видалити цей пост?" },
    errors: { deleteFailed: "Не вдалося видалити пост" },
  },
  pages: {
    title: "Контент-сторінки",
    editTitle: "Редагувати сторінку",
    cancel: "Скасувати",
    saveDraft: "Зберегти чернетку",
    publish: "Опублікувати",
    saving: "Збереження…",
    saved: "Сторінку збережено",
    count: "Сторінок: {{count}}",
    empty: "Сторінок ще немає.",
    edit: "Редагувати",
    columns: { title: "Назва", slug: "Slug", status: "Статус", actions: "Дії" },
    status: { published: "Опубліковано", draft: "Чернетка" },
    sections: {
      basics: "Основне",
      basicsHint: "Назва сторінки та slug URL.",
      layoutHint: "Зберіть сторінку з блоків тексту, медіа та форм.",
      seo: "SEO",
      seoHint: "Необов'язкові перевизначення для пошуковиків і соцмереж.",
    },
    fields: { title: "Назва", slug: "Slug", seoTitle: "SEO заголовок", seoDescription: "SEO опис" },
    layout: "Блоки контенту",
    noBlocks: "Блоків немає. Додайте нижче.",
    contentPlaceholder: "Напишіть…",
    form: "Форма",
    blockReadonly: "Блок редагується в Payload",
    addContent: "Додати текст",
    addMedia: "Додати зображення",
    addForm: "Додати форму",
    moveUp: "Вгору",
    moveDown: "Вниз",
    removeBlock: "Видалити блок",
    blocks: { content: "Текст", media: "Зображення", form: "Форма" },
    errors: {
      titleRequiredPl: "Назва (PL) обов'язкова",
      titleRequiredUk: "Назва (UK) обов'язкова",
      layoutRequiredPl: "Додайте хоча б один блок (PL)",
      layoutRequiredUk: "Додайте хоча б один блок (UK)",
      saveFailed: "Не вдалося зберегти сторінку",
    },
  },
  blogPost: {
    createTitle: "Новий пост",
    editTitle: "Редагувати пост",
    cancel: "Скасувати",
    saveDraft: "Зберегти чернетку",
    publish: "Опублікувати",
    saving: "Збереження…",
    saved: "Пост збережено",
    fields: {
      title: "Назва",
      slug: "Slug",
      content: "Контент",
      contentPlaceholder: "Напишіть пост…",
      categories: "Категорії",
      noCategories: "Категорій немає — спершу створіть категорію.",
      seoTitle: "SEO заголовок",
      seoDescription: "SEO опис",
      hero: "Обкладинка",
      heroUpload: "Завантажити",
      heroUploading: "Завантаження…",
      heroRemove: "Прибрати",
    },
    errors: { titleRequiredPl: "Назва (PL) обов'язкова", titleRequiredUk: "Назва (UK) обов'язкова", contentRequiredPl: "Контент (PL) обов'язковий", contentRequiredUk: "Контент (UK) обов'язковий", saveFailed: "Не вдалося зберегти пост" },
  },
  mediaPicker: {
    title: "Медіатека",
    choose: "Вибрати з медіа",
    upload: "Завантажити",
    uploading: "Завантаження…",
    remove: "Прибрати",
    search: "Пошук…",
    empty: "Медіа ще немає.",
    errors: { load: "Не вдалося завантажити медіа", upload: "Не вдалося завантажити" },
  },
  blogMedia: {
    title: "Медіатека",
    upload: "Завантажити",
    uploading: "Завантаження…",
    uploaded: "Завантажено",
    empty: "Медіа ще немає.",
    delete: "Видалити",
    deleteConfirm: "Видалити це зображення?",
    errors: { uploadFailed: "Не вдалося завантажити", deleteFailed: "Не вдалося видалити" },
  },
  blogCategories: {
    title: "Категорії блогу",
    add: "Нова категорія",
    count: "Категорії: {{count}}",
    empty: "Категорій ще немає.",
    saved: "Категорію збережено",
    analytics: { title: "Категорії", total: "Усього" },
    columns: { title: "Назва", slug: "Slug", actions: "Дії" },
    sheet: { createTitle: "Нова категорія", editTitle: "Редагувати категорію", description: "Назва PL/UK та slug URL." },
    form: { titlePl: "Назва (PL)", titleUk: "Назва (UK)", slug: "Slug", cancel: "Скасувати", saving: "Збереження…", create: "Створити", update: "Зберегти" },
    actions: { edit: "Редагувати", delete: "Видалити", deleteConfirm: "Видалити цю категорію?" },
    errors: { titleRequired: "Назва (PL) обов'язкова", titleRequiredUk: "Назва (UK) обов'язкова", saveFailed: "Не вдалося зберегти категорію", deleteFailed: "Не вдалося видалити категорію" },
  },
  promoBanners: {
    title: "Промо-банери",
    add: "Додати банер",
    empty: "Промо-банерів ще немає. Створіть перший, щоб почати.",
    target: { product: "Товар", category: "Категорія" },
    analytics: { title: "Аналітика банерів", total: "Усього", active: "Активні", linked: "З посиланням" },
    columns: { image: "Зображення", title: "Заголовок", target: "Ціль", position: "Позиція", status: "Статус", actions: "Дії" },
    status: { active: "Активний", inactive: "Неактивний" },
    sheet: {
      createTitle: "Створити промо-банер",
      editTitle: "Редагувати промо-банер",
      createDescription: "Завантажте зображення, додайте текст і прив'яжіть до товару чи категорії.",
      editDescription: "Оновіть промо-банер нижче.",
    },
    form: {
      image: "Зображення",
      titlePl: "Заголовок (PL)",
      titleUk: "Заголовок (UK)",
      titlePlaceholder: "Солодощі Рідна Україна",
      subtitlePl: "Текст (PL)",
      subtitleUk: "Текст (UK)",
      subtitlePlaceholder: "Один із найпопулярніших товарів у нашому магазині.",
      ctaPl: "Кнопка (PL)",
      ctaUk: "Кнопка (UK)",
      ctaPlaceholder: "Дізнатися більше",
      linkType: "Посилання",
      linkNone: "Без посилання",
      linkProduct: "Товар",
      linkCategory: "Категорія",
      linkHref: "Власний URL",
      product: "Товар",
      selectProduct: "Оберіть товар…",
      category: "Категорія",
      selectCategory: "Оберіть категорію…",
      href: "URL",
      isActive: "Активний",
      position: "Позиція",
      saving: "Збереження…",
      create: "Створити",
      update: "Зберегти",
    },
    actions: { edit: "Редагувати", delete: "Видалити", deleteConfirm: "Видалити цей промо-банер?" },
    errors: {
      imageRequired: "Зображення обов'язкове",
      notAuth: "Не авторизовано",
      saveFailed: "Не вдалося зберегти банер",
      deleteFailed: "Не вдалося видалити банер",
    },
  },
  brands: {
    "title": "Бренди",
    "addBrand": "Додати бренд",
    "visit": "Перейти",
    "noLogo": "Немає логотипа",
    "empty": "Бренди не знайдено. Створіть перший, щоб розпочати.",
    "filters": {
      "search": "Пошук",
      "searchPlaceholder": "Пошук брендів..."
    },
    "analytics": {
      "title": "Аналітика брендів",
      "totalBrands": "Усього брендів",
      "withLogos": "З логотипами",
      "withWebsites": "З вебсайтами"
    },
    "columns": {
      "name": "Назва",
      "slug": "Slug",
      "logo": "Логотип",
      "website": "Вебсайт",
      "products": "Товари",
      "actions": "Дії"
    },
    "form": {
      "name": "Назва",
      "namePlaceholder": "Nike",
      "slug": "Slug",
      "slugPlaceholder": "nike",
      "description": "Опис",
      "descriptionPlaceholder": "Провідний спортивний бренд",
      "logo": "Логотип",
      "website": "Вебсайт",
      "websitePlaceholder": "https://example.com",
      "saving": "Збереження...",
      "create": "Створити бренд",
      "update": "Оновити бренд",
      "cancel": "Скасувати"
    },
    "sheet": {
      "createTitle": "Створити бренд",
      "editTitle": "Редагувати бренд",
      "createDescription": "Заповніть дані, щоб створити новий бренд.",
      "editDescription": "Оновіть дані бренду нижче."
    },
    "actions": {
      "edit": "Редагувати",
      "delete": "Видалити",
      "deleteConfirm": "Ви впевнені, що хочете видалити цей бренд?"
    },
    "errors": {
      "nameRequired": "Назва обов'язкова",
      "slugRequired": "Slug обов'язковий",
      "urlInvalid": "Має бути дійсною URL-адресою",
      "notAuth": "Не авторизовано",
      "saveFailed": "Не вдалося зберегти бренд",
      "deleteFailed": "Не вдалося видалити бренд"
    }
  },
  users: {
    "title": "Користувачі",
    "addUser": "Додати користувача",
    "empty": "Користувачів не знайдено.",
    "roles": {
      "CUSTOMER": "Клієнт",
      "ADMIN": "Адміністратор",
      "SUPER_ADMIN": "Головний адміністратор"
    },
    "status": {
      "active": "Активний",
      "inactive": "Неактивний",
      "disabled": "Вимкнено"
    },
    "columns": {
      "id": "ID",
      "user": "Користувач",
      "email": "Ел. пошта",
      "role": "Роль",
      "status": "Статус",
      "created": "Створено",
      "actions": "Дії"
    },
    "actions": {
      "view": "Переглянути"
    },
    "filters": {
      "search": "Пошук",
      "searchPlaceholder": "Пошук користувачів...",
      "role": "Роль",
      "allRoles": "Усі ролі"
    },
    "analytics": {
      "title": "Аналітика користувачів",
      "totalUsers": "Усього користувачів",
      "active": "Активні",
      "inactive": "Неактивні",
      "admins": "Адміністратори"
    },
    "pagination": {
      "previous": "Попередня",
      "next": "Наступна",
      "pageOf": "Сторінка {{page}} з {{totalPages}}"
    },
    "form": {
      "title": "Створити нового користувача",
      "firstName": "Ім'я",
      "lastName": "Прізвище",
      "email": "Ел. пошта",
      "password": "Пароль",
      "role": "Роль",
      "cancel": "Скасувати",
      "submit": "Створити користувача",
      "creating": "Створення..."
    },
    "roleForm": {
      "label": "Роль користувача",
      "update": "Оновити роль",
      "updating": "Оновлення..."
    },
    "statusToggle": {
      "title": "Статус облікового запису",
      "currentStatus": "Поточний статус:",
      "enable": "Увімкнути обліковий запис",
      "disable": "Вимкнути обліковий запис",
      "processing": "Обробка..."
    },
    "toasts": {
      "createFailed": "Не вдалося створити користувача",
      "roleUpdated": "Роль успішно оновлено",
      "roleUpdateFailed": "Не вдалося оновити роль",
      "accountEnabled": "Обліковий запис користувача увімкнено",
      "accountDisabled": "Обліковий запис користувача вимкнено",
      "statusUpdateFailed": "Не вдалося оновити статус облікового запису"
    },
    "detail": {
      "back": "← Назад до користувачів",
      "userInformation": "Інформація про користувача",
      "phone": "Телефон",
      "memberSince": "Учасник з",
      "lastLogin": "Останній вхід",
      "addresses": "Адреси",
      "noAddresses": "Адреси ще не додано",
      "default": "За замовчуванням",
      "activityStatistics": "Статистика активності",
      "reviews": "Відгуки",
      "wishlists": "Списки бажань",
      "roleManagement": "Керування роллю",
      "accountControl": "Керування обліковим записом",
      "userId": "ID користувача",
      "email": "Ел. пошта",
      "role": "Роль",
      "status": "Статус",
      "copy": "Копіювати ID",
      "copied": "Скопійовано",
      "inDatabase": "Синхронізовано з базою",
      "clerkOnly": "Лише Clerk"
    }
  },
  categoryPage: {
    "views": {
      "tree": "Деревоподібний вигляд",
      "table": "Табличний вигляд"
    },
    "tree": {
      "processing": "Обробка..."
    },
    "table": {
      "columns": {
        "name": "Назва",
        "slug": "Slug",
        "path": "Шлях",
        "depth": "Рівень",
        "actions": "Дії"
      },
      "empty": "Категорій не знайдено."
    },
    "actions": {
      "edit": "Редагувати",
      "attributesAndFilters": "Атрибути та фільтри",
      "delete": "Видалити"
    },
    "confirm": {
      "deleteGeneric": "Ви впевнені, що хочете видалити цю категорію?",
      "deleteNamed": "Ви впевнені, що хочете видалити «{{name}}»?"
    },
    "toasts": {
      "notAuthenticated": "Не автентифіковано",
      "moveFailed": "Не вдалося перемістити категорію",
      "deleteFailed": "Не вдалося видалити категорію"
    },
    "detail": {
      "errorPrefix": "Помилка",
      "loadFailed": "Не вдалося завантажити",
      "notFound": "Категорію не знайдено",
      "backToCategories": "Назад до категорій",
      "editTitle": "Редагувати категорію: {{name}}",
      "attributesHeading": "Атрибути",
      "filtersHeading": "Фільтри категорії"
    },
    "attributes": {
      "add": "Додати атрибут",
      "empty": "Атрибути ще не визначені.",
      "yes": "Так",
      "no": "Ні",
      "errors": {
        "nameRequired": "Назва обов'язкова",
        "keyInvalid": "Ключ має починатися з літери й містити лише малі літери, цифри та підкреслення"
      },
      "toasts": {
        "saveFailed": "Не вдалося зберегти атрибут",
        "deleteFailed": "Не вдалося видалити атрибут"
      },
      "confirm": {
        "delete": "Ви впевнені, що хочете видалити цей атрибут?"
      },
      "table": {
        "columns": {
          "name": "Назва",
          "key": "Ключ",
          "type": "Тип",
          "values": "Значення",
          "filterable": "Фільтрований",
          "actions": "Дії"
        }
      },
      "types": {
        "select": "Вибір (випадний список)",
        "range": "Діапазон (мін-макс)",
        "boolean": "Логічний (так/ні)",
        "text": "Текст (вільне введення)"
      },
      "form": {
        "addTitle": "Додати атрибут",
        "editTitle": "Редагувати атрибут",
        "name": "Назва",
        "namePlaceholder": "Розмір екрана",
        "key": "Ключ",
        "keyPlaceholder": "screen_size",
        "type": "Тип",
        "unit": "Одиниця",
        "unitPlaceholder": "дюйм, ГБ тощо",
        "values": "Значення (по одному в рядку)",
        "filterable": "Фільтрований",
        "required": "Обов'язковий",
        "saving": "Збереження...",
        "update": "Оновити",
        "add": "Додати",
        "cancel": "Скасувати"
      }
    }
  },
};
