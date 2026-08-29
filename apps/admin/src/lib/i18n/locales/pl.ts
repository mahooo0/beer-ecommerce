// Polski
import type { Resources } from "./en";

export const pl: Resources = {
  nav: {
    blog: "Blog",
    leads: "Zgłoszenia",
    blogPosts: "Wpisy",
    blogCategories: "Kategorie",
    blogMedia: "Media",
    pages: "Strony",
    overview: "Przegląd",
    catalog: "Katalog",
    allProducts: "Wszystkie produkty",
    addProduct: "Dodaj produkt",
    categories: "Kategorie",
    collections: "Kolekcje",
    brands: "Marki",
    promoBanners: "Banery promo",
    loyaltyTiers: "Poziomy lojalności",
    users: "Użytkownicy",
  },
  language: {
    title: "Język",
    en: "English",
    pl: "Polski",
    uk: "Українська",
  },
  common: {
    noResults: "Nie znaleziono wyników.",
    search: "Szukaj",
  },
  quickCreate: {
    tooltip: "Szybkie tworzenie",
    placeholder: "Wpisz polecenie lub szukaj…",
    createGroup: "Utwórz",
    button: "Szybka akcja",
    actions: {
      product: "Dodaj produkt",
      category: "Dodaj kategorię",
      collection: "Dodaj kolekcję",
      brand: "Dodaj markę",
      user: "Dodaj użytkownika",
    },
  },
  search: {
    placeholder: "Szukaj pulpitów, użytkowników i więcej…",
  },
  categories: {
    title: "Kategorie",
    add: "Dodaj kategorię",
    hierarchy: "Hierarchia kategorii",
    searchLabel: "Szukaj",
    searchPlaceholder: "Szukaj kategorii...",
    createTitle: "Utwórz kategorię",
    editTitle: "Edytuj kategorię",
    createDesc: "Wypełnij dane, aby utworzyć nową kategorię.",
    editDesc: "Zaktualizuj poniżej dane kategorii.",
    form: {
      name: "Nazwa",
      description: "Opis",
      parent: "Kategoria nadrzędna",
      none: "Brak (kategoria główna)",
      image: "Obraz",
      seo: "Ustawienia SEO",
      slug: "Adres URL (slug)",
      slugPreview: "Podgląd: /categories/{{slug}}",
      metaTitle: "Meta tytuł",
      metaDescription: "Meta opis",
      create: "Utwórz kategorię",
      update: "Zaktualizuj kategorię",
      cancel: "Anuluj",
      saving: "Zapisywanie...",
      errors: {
        nameRequired: "Nazwa jest wymagana",
        nameMax: "Nazwa może mieć maksymalnie 100 znaków",
        urlInvalid: "Musi być prawidłowy adres URL",
        metaTitleMax: "Meta tytuł może mieć maksymalnie 60 znaków",
        metaDescMax: "Meta opis może mieć maksymalnie 160 znaków",
        slugInvalid: "Slug może zawierać tylko małe litery, cyfry i myślniki",
        notAuth: "Brak uwierzytelnienia",
        saveFailed: "Nie udało się zapisać kategorii",
      },
    },
  },
  overview: {
    "title": "Pulpit",
    "dateRange": {
      "last7d": "Ostatnie 7 dni",
      "last30d": "Ostatnie 30 dni",
      "last90d": "Ostatnie 90 dni",
      "thisYear": "Ten rok"
    },
    "kpi": {
      "totalRevenue": "Przychód całkowity",
      "totalOrders": "Liczba zamówień",
      "avgOrderValue": "Średnia wartość zamówienia",
      "totalCustomers": "Liczba klientów"
    },
    "revenue": {
      "title": "Przychód w czasie",
      "label": "Przychód",
      "empty": "Brak danych dla wybranego okresu"
    },
    "orderStatus": {
      "title": "Status zamówień",
      "orders": "Zamówienia",
      "empty": "Brak danych o zamówieniach"
    },
    "lowStock": {
      "title": "Alerty niskiego stanu",
      "viewAll": "Zobacz wszystkie",
      "empty": "Brak alertów niskiego stanu",
      "availableThreshold": "Dostępne: {{available}} · Próg: {{threshold}}",
      "out": "Brak",
      "low": "Niski"
    },
    "recentOrders": {
      "title": "Ostatnie zamówienia",
      "empty": "Brak ostatnich zamówień",
      "columns": {
        "orderNumber": "Nr zamówienia",
        "customer": "Klient",
        "total": "Razem",
        "status": "Status",
        "date": "Data"
      }
    },
    "topProducts": {
      "title": "Najlepsze produkty",
      "empty": "Brak danych o produktach",
      "unitsSold": "sprzedano {{count}} szt."
    },
    "status": {
      "pending": "Oczekujące",
      "paid": "Opłacone",
      "processing": "W realizacji",
      "shipped": "Wysłane",
      "delivered": "Dostarczone",
      "cancelled": "Anulowane",
      "returned": "Zwrócone",
      "refund_requested": "Żądanie zwrotu"
    }
  },
  products: {
    "title": "Produkty",
    "count": "{{count}} produktów",
    "incomplete": "{{count}} niekompletnych",
    "incompleteCurrentPage": "{{count}} niekompletnych (na bieżącej stronie)",
    "newProduct": "Nowy produkt",
    "empty": "Nie znaleziono produktów.",
    "columns": {
      "selectAll": "Zaznacz wszystkie",
      "selectRow": "Zaznacz wiersz",
      "image": "Zdjęcie",
      "name": "Nazwa",
      "category": "Kategoria",
      "price": "Cena",
      "availability": "Dostępność",
      "completeness": "Uzupełnienie",
      "status": "Status",
      "actions": "Akcje"
    },
    "status": {
      "DRAFT": "Szkic",
      "ACTIVE": "Aktywny",
      "ARCHIVED": "Zarchiwizowany"
    },
    "type": {
      "SIMPLE": "Prosty",
      "VARIABLE": "Wariantowy",
      "WEIGHTED": "Na wagę",
      "DIGITAL": "Cyfrowy",
      "BUNDLED": "Zestaw"
    },
    "availability": {
      "inStock": "Dostępny",
      "outOfStock": "Brak",
      "units": "{{count}} szt."
    },
    "filters": {
      "title": "Filtry",
      "clear": "Wyczyść",
      "category": "Kategoria",
      "allCategories": "Wszystkie kategorie",
      "status": "Status",
      "allStatuses": "Wszystkie statusy",
      "allTypes": "Wszystkie typy",
      "availability": "Dostępność",
      "anyAvailability": "Dowolna",
      "completeness": "Uzupełnienie",
      "allCompleteness": "Wszystkie",
      "completenessComplete": "Uzupełnione (100%)",
      "completenessIncomplete": "Nieuzupełnione",
      "price": "Cena (₴)",
      "priceFrom": "od",
      "priceTo": "do"
    },
    "actions": {
      "edit": "Edytuj",
      "delete": "Usuń",
      "deleteConfirm": "Usunąć ten produkt?"
    },
    "bulk": {
      "actions": "Akcje zbiorcze",
      "setActive": "Ustaw jako Aktywny",
      "setDraft": "Ustaw jako Szkic",
      "setArchived": "Ustaw jako Zarchiwizowany",
      "deleteSelected": "Usuń zaznaczone",
      "selectedCount": "Zaznaczono: {{count}}",
      "confirmUpdate": "Zmienić status {{count}} produktów na {{status}}?",
      "confirmDelete": "Usunąć {{count}} produktów? Tej operacji nie można cofnąć."
    },
    "table": {
      "searchPlaceholder": "Szukaj produktów...",
      "createProduct": "Utwórz produkt",
      "empty": "Nie znaleziono produktów"
    },
    "pagination": {
      "previous": "Poprzednia",
      "next": "Następna",
      "back": "Wstecz",
      "forward": "Dalej",
      "pageOf": "Strona {{page}} z {{total}}",
      "perPage": "{{count}} na stronę"
    },
    "toasts": {
      "deleteFailed": "Nie udało się usunąć produktu",
      "selectToUpdate": "Wybierz produkty do aktualizacji",
      "selectToDelete": "Wybierz produkty do usunięcia",
      "updateFailed": "Nie udało się zaktualizować produktów: {{message}}",
      "deleteFailedDetail": "Nie udało się usunąć produktów: {{message}}"
    }
  },
  productForm: {
    "pageTitle": {
      "create": "Utwórz produkt",
      "edit": "Edytuj produkt"
    },
    "sections": {
      "basicInfo": "Informacje podstawowe",
      "pricing": "Cena",
      "stock": "Dostępność / Zapas",
      "attributes": "Atrybuty",
      "organization": "Organizacja",
      "images": "Zdjęcia",
      "keywords": "Słowa kluczowe",
      "wholesale": "Ceny hurtowe"
    },
    "wholesale": {
      "description": "Ceny zależne od ilości dla klientów hurtowych (WHOLESALE). Klienci detaliczni zawsze płacą cenę zwykłą.",
      "minQty": "Ilość od",
      "price": "Cena za ilość (grosze)",
      "perUnit": "≈ {{value}} zł/szt",
      "addTier": "Dodaj próg",
      "remove": "Usuń próg",
      "empty": "Brak progów. Dodaj pierwszy próg ceny hurtowej."
    },
    "fields": {
      "name": "Nazwa",
      "description": "Opis",
      "composition": "Skład",
      "slug": "Slug (URL)",
      "price": "Cena (grosze)",
      "salePrice": "Cena promocyjna (grosze)",
      "baseUnit": "Jednostka miary",
      "category": "Kategoria",
      "manufacturer": "Producent",
      "brand": "Marka",
      "status": "Status"
    },
    "placeholders": {
      "name": "Wprowadź nazwę produktu",
      "description": "Opisz produkt",
      "composition": "Skład / składniki",
      "slug": "url-produktu",
      "category": "Wybierz kategorię",
      "manufacturer": "Nazwa producenta",
      "brand": "Wybierz markę (opcjonalnie)",
      "keywords": "Generowane automatycznie na serwerze"
    },
    "hints": {
      "slug": "Tworzony z nazwy. Serwer sprawdza unikalność podczas zapisu."
    },
    "stock": {
      "quantityTab": "Ilość",
      "availabilityTab": "Dostępność",
      "quantityLabel": "Ilość w magazynie",
      "quantityHint": "Śledzona liczbowo; odejmowana przy zamówieniu.",
      "inStock": "Dostępny",
      "outOfStock": "Niedostępny",
      "availabilityHint": "Ręczny przełącznik dostępności bez śledzenia ilości."
    },
    "status": {
      "draft": "Wersja robocza",
      "active": "Aktywny",
      "archived": "Zarchiwizowany"
    },
    "actions": {
      "cancel": "Anuluj",
      "saving": "Zapisywanie…",
      "update": "Zaktualizuj produkt",
      "create": "Utwórz produkt"
    },
    "toasts": {
      "created": "Produkt utworzony",
      "updated": "Produkt zaktualizowany",
      "saveFailed": "Nie udało się zapisać produktu"
    },
    "attributes": {
      "selectCategoryFirst": "Wybierz kategorię, aby ustawić atrybuty produktu.",
      "loading": "Ładowanie atrybutów…",
      "loadError": "Nie udało się załadować atrybutów dla tej kategorii.",
      "empty": "Dla tej kategorii nie zdefiniowano atrybutów. Dodaj je na stronie kategorii.",
      "noValues": "Brak wartości. Dodaj „wspólne opcje” na stronie kategorii.",
      "notSet": "— nie ustawiono —"
    },
    "images": {
      "count": "{{count}}/{{max}} zdjęć",
      "reorderHint": " · przeciągnij, aby zmienić kolejność",
      "clearAll": "Wyczyść wszystko",
      "alt": "Zdjęcie produktu",
      "mainBadge": "Główne",
      "dragTitle": "Przeciągnij",
      "setMainTitle": "Ustaw jako główne",
      "removeTitle": "Usuń"
    },
    "completeness": {
      "filled": "Wypełniono {{percent}}%",
      "allFilled": "Wszystkie pola wypełnione"
    }
  },
  collections: {
    "title": "Kolekcje",
    "add": "Dodaj kolekcję",
    "empty": "Nie znaleziono kolekcji. Utwórz jedną, aby rozpocząć.",
    "filters": {
      "search": "Szukaj",
      "searchPlaceholder": "Szukaj kolekcji..."
    },
    "analytics": {
      "title": "Analityka kolekcji",
      "total": "Wszystkie kolekcje",
      "active": "Aktywne",
      "inactive": "Nieaktywne"
    },
    "columns": {
      "name": "Nazwa",
      "slug": "Slug",
      "products": "Produkty",
      "status": "Status",
      "actions": "Akcje"
    },
    "status": {
      "active": "Aktywna",
      "inactive": "Nieaktywna"
    },
    "actions": {
      "edit": "Edytuj",
      "products": "Produkty",
      "delete": "Usuń",
      "deleteConfirm": "Czy na pewno chcesz usunąć tę kolekcję?"
    },
    "sheet": {
      "editTitle": "Edytuj kolekcję",
      "createTitle": "Utwórz kolekcję",
      "editDescription": "Zaktualizuj poniżej szczegóły kolekcji.",
      "createDescription": "Wypełnij szczegóły, aby utworzyć nową kolekcję."
    },
    "form": {
      "name": "Nazwa",
      "namePlaceholder": "Kolekcja letnia",
      "slug": "Slug",
      "slugPlaceholder": "kolekcja-letnia",
      "description": "Opis",
      "descriptionPlaceholder": "Wyselekcjonowane produkty na sezon letni",
      "image": "Obraz",
      "active": "Aktywna",
      "saving": "Zapisywanie...",
      "update": "Zaktualizuj kolekcję",
      "create": "Utwórz kolekcję",
      "cancel": "Anuluj"
    },
    "products": {
      "manageTitle": "Zarządzaj produktami w \"{{name}}\"",
      "current": "Bieżące produkty",
      "empty": "W tej kolekcji nie ma jeszcze produktów.",
      "add": "Dodaj produkty",
      "addButton": "Dodaj",
      "remove": "Usuń",
      "searchPlaceholder": "Szukaj produktów według nazwy lub SKU...",
      "noResults": "Nie znaleziono produktów",
      "sku": "SKU: {{sku}}",
      "addFailed": "Nie udało się dodać produktu",
      "removeFailed": "Nie udało się usunąć produktu"
    },
    "errors": {
      "nameRequired": "Nazwa jest wymagana",
      "slugRequired": "Slug jest wymagany",
      "urlInvalid": "Musi być prawidłowym adresem URL",
      "notAuth": "Brak uwierzytelnienia",
      "saveFailed": "Nie udało się zapisać kolekcji",
      "deleteFailed": "Nie udało się usunąć kolekcji"
    }
  },
  leads: {
    title: "Zgłoszenia",
    empty: "Brak zgłoszeń.",
    searchPlaceholder: "Szukaj w zgłoszeniach…",
    analytics: { title: "Zgłoszenia z formularzy", total: "Wszystkie", forms: "Formularze" },
    columns: { date: "Data", form: "Formularz", data: "Przesłane dane" },
  },
  blog: {
    title: "Blog",
    add: "Nowy wpis",
    count: "Wpisy: {{count}}",
    empty: "Brak wpisów.",
    searchPlaceholder: "Szukaj po tytule lub slug…",
    analytics: { title: "Przegląd bloga", total: "Wszystkie", published: "Opublikowane", drafts: "Szkice" },
    columns: { title: "Tytuł", categories: "Kategorie", status: "Status", updated: "Zaktualizowano", actions: "Akcje" },
    status: { published: "Opublikowany", draft: "Szkic" },
    actions: { edit: "Edytuj", delete: "Usuń", deleteConfirm: "Usunąć ten wpis?" },
    errors: { deleteFailed: "Nie udało się usunąć wpisu" },
  },
  pages: {
    title: "Strony treści",
    editTitle: "Edytuj stronę",
    cancel: "Anuluj",
    saveDraft: "Zapisz szkic",
    publish: "Opublikuj",
    saving: "Zapisywanie…",
    saved: "Zapisano stronę",
    count: "Strony: {{count}}",
    empty: "Brak stron.",
    edit: "Edytuj",
    columns: { title: "Tytuł", slug: "Slug", status: "Status", actions: "Akcje" },
    status: { published: "Opublikowana", draft: "Szkic" },
    sections: {
      basics: "Podstawy",
      basicsHint: "Tytuł strony i slug URL.",
      layoutHint: "Zbuduj stronę z bloków treści, mediów i formularzy.",
      seo: "SEO",
      seoHint: "Opcjonalne nadpisania dla wyszukiwarek i podglądów w social media.",
    },
    fields: { title: "Tytuł", slug: "Slug", seoTitle: "Tytuł SEO", seoDescription: "Opis SEO" },
    layout: "Bloki treści",
    noBlocks: "Brak bloków. Dodaj poniżej.",
    contentPlaceholder: "Napisz…",
    form: "Formularz",
    blockReadonly: "Blok edytowany w Payload",
    addContent: "Dodaj tekst",
    addMedia: "Dodaj obraz",
    addForm: "Dodaj formularz",
    moveUp: "Przenieś w górę",
    moveDown: "Przenieś w dół",
    removeBlock: "Usuń blok",
    blocks: { content: "Tekst", media: "Obraz", form: "Formularz" },
    errors: {
      titleRequiredPl: "Tytuł (PL) jest wymagany",
      titleRequiredUk: "Tytuł (UK) jest wymagany",
      layoutRequiredPl: "Dodaj co najmniej jeden blok (PL)",
      layoutRequiredUk: "Dodaj co najmniej jeden blok (UK)",
      saveFailed: "Nie udało się zapisać strony",
    },
  },
  blogPost: {
    createTitle: "Nowy wpis",
    editTitle: "Edytuj wpis",
    cancel: "Anuluj",
    saveDraft: "Zapisz szkic",
    publish: "Opublikuj",
    saving: "Zapisywanie…",
    saved: "Zapisano wpis",
    fields: {
      title: "Tytuł",
      slug: "Slug",
      content: "Treść",
      contentPlaceholder: "Napisz wpis…",
      categories: "Kategorie",
      noCategories: "Brak kategorii — najpierw utwórz kategorię.",
      seoTitle: "Tytuł SEO",
      seoDescription: "Opis SEO",
      hero: "Obraz okładki",
      heroUpload: "Wgraj",
      heroUploading: "Wgrywanie…",
      heroRemove: "Usuń",
    },
    errors: { titleRequiredPl: "Tytuł (PL) jest wymagany", titleRequiredUk: "Tytuł (UK) jest wymagany", contentRequiredPl: "Treść (PL) jest wymagana", contentRequiredUk: "Treść (UK) jest wymagana", saveFailed: "Nie udało się zapisać wpisu" },
  },
  mediaPicker: {
    title: "Biblioteka mediów",
    choose: "Wybierz z mediów",
    upload: "Wgraj",
    uploading: "Wgrywanie…",
    remove: "Usuń",
    search: "Szukaj…",
    empty: "Brak mediów.",
    errors: { load: "Nie udało się wczytać mediów", upload: "Nie udało się wgrać" },
  },
  blogMedia: {
    title: "Biblioteka mediów",
    upload: "Wgraj",
    uploading: "Wgrywanie…",
    uploaded: "Wgrano",
    empty: "Brak mediów.",
    delete: "Usuń",
    deleteConfirm: "Usunąć ten obraz?",
    errors: { uploadFailed: "Nie udało się wgrać", deleteFailed: "Nie udało się usunąć" },
  },
  blogCategories: {
    title: "Kategorie bloga",
    add: "Nowa kategoria",
    count: "Kategorie: {{count}}",
    empty: "Brak kategorii.",
    saved: "Zapisano kategorię",
    analytics: { title: "Kategorie", total: "Wszystkie" },
    columns: { title: "Tytuł", slug: "Slug", actions: "Akcje" },
    sheet: { createTitle: "Nowa kategoria", editTitle: "Edytuj kategorię", description: "Tytuł w PL/UK oraz slug URL." },
    form: { titlePl: "Tytuł (PL)", titleUk: "Tytuł (UK)", slug: "Slug", cancel: "Anuluj", saving: "Zapisywanie…", create: "Utwórz", update: "Zapisz" },
    actions: { edit: "Edytuj", delete: "Usuń", deleteConfirm: "Usunąć tę kategorię?" },
    errors: { titleRequired: "Tytuł (PL) jest wymagany", titleRequiredUk: "Tytuł (UK) jest wymagany", saveFailed: "Nie udało się zapisać kategorii", deleteFailed: "Nie udało się usunąć kategorii" },
  },
  promoBanners: {
    title: "Banery promo",
    add: "Dodaj baner",
    empty: "Brak banerów promo. Utwórz pierwszy, aby zacząć.",
    target: { product: "Produkt", category: "Kategoria" },
    analytics: { title: "Analityka banerów", total: "Łącznie", active: "Aktywne", linked: "Z linkiem" },
    columns: { image: "Obraz", title: "Tytuł", target: "Cel", position: "Pozycja", status: "Status", actions: "Akcje" },
    status: { active: "Aktywny", inactive: "Nieaktywny" },
    sheet: {
      createTitle: "Utwórz baner promo",
      editTitle: "Edytuj baner promo",
      createDescription: "Wgraj obraz, dodaj tekst i połącz go z produktem lub kategorią.",
      editDescription: "Zaktualizuj baner promo poniżej.",
    },
    form: {
      image: "Obraz",
      titlePl: "Tytuł (PL)",
      titleUk: "Tytuł (UK)",
      titlePlaceholder: "Słodycze Ridna Ukraina",
      subtitlePl: "Tekst (PL)",
      subtitleUk: "Tekst (UK)",
      subtitlePlaceholder: "Jeden z najpopularniejszych produktów w naszym sklepie.",
      ctaPl: "Przycisk (PL)",
      ctaUk: "Przycisk (UK)",
      ctaPlaceholder: "Dowiedz się więcej",
      linkType: "Link",
      linkNone: "Bez linku",
      linkProduct: "Produkt",
      linkCategory: "Kategoria",
      linkHref: "Własny URL",
      product: "Produkt",
      selectProduct: "Wybierz produkt…",
      category: "Kategoria",
      selectCategory: "Wybierz kategorię…",
      href: "URL",
      isActive: "Aktywny",
      position: "Pozycja",
      saving: "Zapisywanie…",
      create: "Utwórz",
      update: "Zapisz",
    },
    actions: { edit: "Edytuj", delete: "Usuń", deleteConfirm: "Usunąć ten baner promo?" },
    errors: {
      imageRequired: "Obraz jest wymagany",
      notAuth: "Brak autoryzacji",
      saveFailed: "Nie udało się zapisać baneru",
      deleteFailed: "Nie udało się usunąć baneru",
    },
  },
  cartAnalytics: {
    tab: "Koszyki",
    empty: "Brak danych o zachowaniu w wybranym okresie.",
    kpi: {
      conversion: "Współczynnik konwersji",
      conversionHint: "Zakupy ÷ dodania do koszyka",
      abandonedCheckouts: "Porzucone zamówienia",
      abandonedCarts: "Porzucone koszyki",
      recoverable: "do odzyskania",
      purchases: "Zakupy",
      purchasesHint: "Zrealizowane zamówienia w okresie",
    },
    funnel: {
      title: "Lejek",
      productViews: "Wyświetlenia produktów",
      addToCart: "Dodano do koszyka",
      checkoutStarted: "Rozpoczęto zamówienie",
      purchased: "Zakupiono",
      dropoff: "spadek",
    },
    abandonedCheckouts: {
      title: "Porzucone zamówienia",
      subtitle: "Rozpoczęto zamówienie, brak płatności w ciągu 1 godz.",
      empty: "Brak porzuconych zamówień.",
    },
    abandonedCarts: {
      title: "Porzucone koszyki",
      subtitle: "Dodano produkty, brak zamówienia w ciągu 24 godz.",
      empty: "Brak porzuconych koszyków.",
    },
    table: {
      customer: "Klient",
      items: "Produkty",
      value: "Wartość",
      lastSeen: "Ostatnia aktywność",
      guest: "Gość",
      registered: "Zarejestrowany",
    },
    topViewed: { title: "Najczęściej oglądane produkty", empty: "Brak wyświetleń produktów." },
    topSearches: { title: "Najczęstsze wyszukiwania", empty: "Brak wyszukiwań." },
  },
  loyaltyTiers: {
    title: "Poziomy lojalnościowe",
    add: "Dodaj poziom",
    hint: "Klienci detaliczni otrzymują rabat najwyższego osiągniętego poziomu od sumy zamówienia, gdy ich łączne opłacone zakupy przekroczą próg. Hurt nie jest objęty.",
    empty: "Brak poziomów lojalnościowych. Dodaj pierwszy.",
    columns: { minSpend: "Min. kwota", percent: "Rabat", position: "Pozycja", status: "Status", actions: "Akcje" },
    status: { active: "Aktywny", inactive: "Nieaktywny" },
    sheet: {
      createTitle: "Nowy poziom lojalnościowy",
      editTitle: "Edytuj poziom lojalnościowy",
      createDescription: "Ustaw próg kwoty (w zł) i procent rabatu.",
      editDescription: "Zaktualizuj poziom poniżej.",
    },
    form: {
      minSpend: "Min. kwota (zł)",
      percent: "Rabat (%)",
      active: "Aktywny",
      position: "Pozycja",
      saving: "Zapisywanie…",
      create: "Utwórz",
      update: "Zapisz",
    },
    actions: { edit: "Edytuj", delete: "Usuń", deleteConfirm: "Usunąć ten poziom?" },
    errors: {
      notAuth: "Brak autoryzacji",
      saveFailed: "Nie udało się zapisać poziomu",
      deleteFailed: "Nie udało się usunąć poziomu",
    },
  },
  brands: {
    "title": "Marki",
    "addBrand": "Dodaj markę",
    "visit": "Odwiedź",
    "noLogo": "Brak logo",
    "empty": "Nie znaleziono marek. Utwórz pierwszą, aby rozpocząć.",
    "filters": {
      "search": "Szukaj",
      "searchPlaceholder": "Szukaj marek..."
    },
    "analytics": {
      "title": "Analityka marek",
      "totalBrands": "Wszystkie marki",
      "withLogos": "Z logo",
      "withWebsites": "Ze stroną www"
    },
    "columns": {
      "name": "Nazwa",
      "slug": "Slug",
      "logo": "Logo",
      "website": "Strona www",
      "products": "Produkty",
      "actions": "Akcje"
    },
    "form": {
      "name": "Nazwa",
      "namePlaceholder": "Nike",
      "slug": "Slug",
      "slugPlaceholder": "nike",
      "description": "Opis",
      "descriptionPlaceholder": "Wiodąca marka sportowa",
      "logo": "Logo",
      "website": "Strona www",
      "websitePlaceholder": "https://example.com",
      "saving": "Zapisywanie...",
      "create": "Utwórz markę",
      "update": "Zaktualizuj markę",
      "cancel": "Anuluj"
    },
    "sheet": {
      "createTitle": "Utwórz markę",
      "editTitle": "Edytuj markę",
      "createDescription": "Wypełnij dane, aby utworzyć nową markę.",
      "editDescription": "Zaktualizuj dane marki poniżej."
    },
    "actions": {
      "edit": "Edytuj",
      "delete": "Usuń",
      "deleteConfirm": "Czy na pewno chcesz usunąć tę markę?"
    },
    "errors": {
      "nameRequired": "Nazwa jest wymagana",
      "slugRequired": "Slug jest wymagany",
      "urlInvalid": "Musi być prawidłowym adresem URL",
      "notAuth": "Brak autoryzacji",
      "saveFailed": "Nie udało się zapisać marki",
      "deleteFailed": "Nie udało się usunąć marki"
    }
  },
  users: {
    "title": "Użytkownicy",
    "addUser": "Dodaj użytkownika",
    "empty": "Nie znaleziono użytkowników.",
    "roles": {
      "CUSTOMER": "Klient",
      "ADMIN": "Administrator",
      "SUPER_ADMIN": "Główny administrator"
    },
    "status": {
      "active": "Aktywny",
      "inactive": "Nieaktywny",
      "disabled": "Wyłączony"
    },
    "columns": {
      "id": "ID",
      "user": "Użytkownik",
      "email": "E-mail",
      "role": "Rola",
      "status": "Status",
      "created": "Utworzono",
      "actions": "Akcje"
    },
    "actions": {
      "view": "Zobacz"
    },
    "filters": {
      "search": "Szukaj",
      "searchPlaceholder": "Szukaj użytkowników...",
      "role": "Rola",
      "allRoles": "Wszystkie role"
    },
    "analytics": {
      "title": "Analityka użytkowników",
      "totalUsers": "Wszyscy użytkownicy",
      "active": "Aktywni",
      "inactive": "Nieaktywni",
      "admins": "Administratorzy"
    },
    "pagination": {
      "previous": "Poprzednia",
      "next": "Następna",
      "pageOf": "Strona {{page}} z {{totalPages}}"
    },
    "form": {
      "title": "Utwórz nowego użytkownika",
      "firstName": "Imię",
      "lastName": "Nazwisko",
      "email": "E-mail",
      "password": "Hasło",
      "role": "Rola",
      "cancel": "Anuluj",
      "submit": "Utwórz użytkownika",
      "creating": "Tworzenie..."
    },
    "roleForm": {
      "label": "Rola użytkownika",
      "update": "Zaktualizuj rolę",
      "updating": "Aktualizowanie..."
    },
    "statusToggle": {
      "title": "Status konta",
      "currentStatus": "Aktualny status:",
      "enable": "Włącz konto",
      "disable": "Wyłącz konto",
      "processing": "Przetwarzanie..."
    },
    "toasts": {
      "createFailed": "Nie udało się utworzyć użytkownika",
      "roleUpdated": "Rola została zaktualizowana",
      "roleUpdateFailed": "Nie udało się zaktualizować roli",
      "accountEnabled": "Konto użytkownika zostało włączone",
      "accountDisabled": "Konto użytkownika zostało wyłączone",
      "statusUpdateFailed": "Nie udało się zaktualizować statusu konta"
    },
    "detail": {
      "back": "← Powrót do użytkowników",
      "userInformation": "Informacje o użytkowniku",
      "phone": "Telefon",
      "memberSince": "Członek od",
      "lastLogin": "Ostatnie logowanie",
      "addresses": "Adresy",
      "noAddresses": "Nie dodano jeszcze żadnych adresów",
      "default": "Domyślny",
      "activityStatistics": "Statystyki aktywności",
      "reviews": "Recenzje",
      "wishlists": "Listy życzeń",
      "roleManagement": "Zarządzanie rolą",
      "accountControl": "Kontrola konta",
      "userId": "ID użytkownika",
      "email": "E-mail",
      "role": "Rola",
      "status": "Status",
      "copy": "Kopiuj ID",
      "copied": "Skopiowano",
      "inDatabase": "Zsynchronizowany z bazą",
      "clerkOnly": "Tylko Clerk"
    }
  },
  categoryPage: {
    "views": {
      "tree": "Widok drzewa",
      "table": "Widok tabeli"
    },
    "tree": {
      "processing": "Przetwarzanie..."
    },
    "table": {
      "columns": {
        "name": "Nazwa",
        "slug": "Slug",
        "path": "Ścieżka",
        "depth": "Poziom",
        "actions": "Akcje"
      },
      "empty": "Nie znaleziono kategorii."
    },
    "actions": {
      "edit": "Edytuj",
      "attributesAndFilters": "Atrybuty i filtry",
      "delete": "Usuń"
    },
    "confirm": {
      "deleteGeneric": "Czy na pewno chcesz usunąć tę kategorię?",
      "deleteNamed": "Czy na pewno chcesz usunąć „{{name}}”?"
    },
    "toasts": {
      "notAuthenticated": "Brak uwierzytelnienia",
      "moveFailed": "Nie udało się przenieść kategorii",
      "deleteFailed": "Nie udało się usunąć kategorii"
    },
    "detail": {
      "errorPrefix": "Błąd",
      "loadFailed": "Nie udało się załadować",
      "notFound": "Nie znaleziono kategorii",
      "backToCategories": "Powrót do kategorii",
      "editTitle": "Edytuj kategorię: {{name}}",
      "attributesHeading": "Atrybuty",
      "filtersHeading": "Filtry kategorii"
    },
    "attributes": {
      "add": "Dodaj atrybut",
      "empty": "Nie zdefiniowano jeszcze atrybutów.",
      "yes": "Tak",
      "no": "Nie",
      "errors": {
        "nameRequired": "Nazwa jest wymagana",
        "keyInvalid": "Klucz musi zaczynać się od litery i zawierać tylko małe litery, cyfry oraz podkreślenia"
      },
      "toasts": {
        "saveFailed": "Nie udało się zapisać atrybutu",
        "deleteFailed": "Nie udało się usunąć atrybutu"
      },
      "confirm": {
        "delete": "Czy na pewno chcesz usunąć ten atrybut?"
      },
      "table": {
        "columns": {
          "name": "Nazwa",
          "key": "Klucz",
          "type": "Typ",
          "values": "Wartości",
          "filterable": "Filtrowalny",
          "actions": "Akcje"
        }
      },
      "types": {
        "select": "Wybór (lista rozwijana)",
        "range": "Zakres (min-max)",
        "boolean": "Wartość logiczna (tak/nie)",
        "text": "Tekst (dowolny)"
      },
      "form": {
        "addTitle": "Dodaj atrybut",
        "editTitle": "Edytuj atrybut",
        "name": "Nazwa",
        "namePlaceholder": "Przekątna ekranu",
        "key": "Klucz",
        "keyPlaceholder": "screen_size",
        "type": "Typ",
        "unit": "Jednostka",
        "unitPlaceholder": "cal, GB itp.",
        "values": "Wartości (po jednej w wierszu)",
        "filterable": "Filtrowalny",
        "required": "Wymagany",
        "saving": "Zapisywanie...",
        "update": "Zaktualizuj",
        "add": "Dodaj",
        "cancel": "Anuluj"
      }
    }
  },
};
