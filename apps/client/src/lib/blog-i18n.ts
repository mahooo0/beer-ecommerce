import type { BlogLocale } from './blog-api';

/**
 * Blog UI strings, localized pl/uk the same way the rest of the blog does it
 * (a plain object keyed by URL locale — no react-i18next in these routes).
 */
export interface BlogStrings {
  blog: string;
  home: string;
  subtitle: string;
  readMore: string;
  empty: string;
  back: string;
  author: string;
  related: string;
  prev: string;
  next: string;
  minRead: (n: number) => string;
  searchPlaceholder: string;
  searchLabel: string;
  searchSubmit: string;
  resultsFor: (q: string) => string;
  noResults: string;
  clearSearch: string;
  category: string;
  categories: string;
  newer: string;
  older: string;
  pageOf: (page: number, total: number) => string;
  paginationLabel: string;
  breadcrumbLabel: string;
}

export const BLOG_T: Record<BlogLocale, BlogStrings> = {
  pl: {
    blog: 'Blog',
    home: 'Strona główna',
    subtitle: 'Przydatne wiadomości ze świata Taranka',
    readMore: 'więcej',
    empty: 'Brak wpisów.',
    back: '← Wróć na blog',
    author: 'Autor',
    related: 'Czytaj także',
    prev: 'Poprzedni wpis',
    next: 'Następny wpis',
    minRead: (n) => `${n} min czytania`,
    searchPlaceholder: 'Szukaj we wpisach…',
    searchLabel: 'Szukaj',
    searchSubmit: 'Szukaj',
    resultsFor: (q) => `Wyniki wyszukiwania: „${q}”`,
    noResults: 'Nic nie znaleziono.',
    clearSearch: 'Wyczyść',
    category: 'Kategoria',
    categories: 'Kategorie',
    newer: 'Nowsze',
    older: 'Starsze',
    pageOf: (page, total) => `Strona ${page} z ${total}`,
    paginationLabel: 'Paginacja',
    breadcrumbLabel: 'Ścieżka nawigacji',
  },
  uk: {
    blog: 'Блог',
    home: 'Головна',
    subtitle: 'Корисні новини зі світу Taranka',
    readMore: 'більше',
    empty: 'Поки що немає записів.',
    back: '← Назад до блогу',
    author: 'Автор',
    related: 'Читайте також',
    prev: 'Попередній запис',
    next: 'Наступний запис',
    minRead: (n) => `${n} хв читання`,
    searchPlaceholder: 'Пошук у записах…',
    searchLabel: 'Пошук',
    searchSubmit: 'Знайти',
    resultsFor: (q) => `Результати пошуку: «${q}»`,
    noResults: 'Нічого не знайдено.',
    clearSearch: 'Очистити',
    category: 'Категорія',
    categories: 'Категорії',
    newer: 'Новіші',
    older: 'Старіші',
    pageOf: (page, total) => `Сторінка ${page} з ${total}`,
    paginationLabel: 'Пагінація',
    breadcrumbLabel: 'Навігаційний ланцюжок',
  },
};
