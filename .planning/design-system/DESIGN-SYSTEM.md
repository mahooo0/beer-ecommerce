# Taranka — Design System Analysis

Прогрессивный документ. Дополняется по мере получения новых фреймов из Figma.

**Figma file:** `K6ojbU8eSvlnsvOgR2kkI7` (https://www.figma.com/design/K6ojbU8eSvlnsvOgR2kkI7/online-shop)

**Бренд:** Taranka — польско-украинский онлайн-магазин (Sklep internetowy Taranka). Полный ассортимент: пиво, снэки, рыба, вино, сладости (в т.ч. украинские).

**Технический стек по правилам пользователя:**
- Tailwind v4 (`@theme` в `apps/client/src/app/theme.css`)
- shadcn/ui компоненты — **в `apps/client` пока НЕ установлен**, есть только в `apps/admin/`. Перед началом вёрстки нужен `npx shadcn init`.
- Никакой логики на этапе вёрстки

---

## Проанализированные фреймы

| Node ID | Имя | Скриншот |
|---|---|---|
| `823:49707` | Main (главная) | `/tmp/frame-main.png` |
| `823:50264` | Каталог для оптовика | `/tmp/frame-catalog.png` |

---

## 1. Цвета

Извлечено из заливок (`fills.SOLID`) обоих фреймов.

| Семантика | HEX | RGB | CSS var | Где встречается |
|---|---|---|---|---|
| Page background | `#EBE8DD` | 235,232,221 | `--color-cream-50` | фон страницы, секций |
| Surface alt | `#E2DFD4` | 226,223,212 | `--color-cream-100` | альтернативный фон, бордеры на тёмном |
| Border light | `#CCC9BE` | 204,201,190 | `--color-cream-200` | разделители, контуры карточек |
| Muted | `#B5B2A7` | 181,178,167 | `--color-cream-300` | вторичные элементы |
| Muted foreground | `#9E9B90` | 158,155,144 | `--color-cream-400` | плейсхолдеры, мелкий вторичный текст |
| Ink (text) | `#272422` | 39,36,34 | `--color-ink-900` | основной текст, фон футера |
| Black | `#000000` | 0,0,0 | `--color-ink-950` | иконки |
| **Primary CTA red** | `#AA3C37` | 170,60,55 | `--color-brand-red-500` | основная кнопка «Do koszyka», ценники-акции |
| Primary dark | `#652421` | 101,36,33 | `--color-brand-red-700` | hover/тёмный акцент |
| White | `#FFFFFF` | 255,255,255 | (token `white`) | карточки товаров |

Палитра тёплая: кремовый базис + насыщенный приглушённый красный как единственный акцент. Никаких градиентов, теней — плоский стиль.

---

## 2. Типографика

Извлечено из текстовых стилей.

| Семейство | Веса | Размеры | Назначение |
|---|---|---|---|
| **Murs Gothic** | 800 | 48px / 14px | Display: логотип «TARANKA», hero «PIWO SPECJALNE», подписи категорий, заголовок «SKLEP INTERNETOWY TARANKA» |
| **Montserrat** | 400, 500, 600 | 12 / 14 / 16px | Body, UI, цены, навигация |
| **Poppins** | 500 | 16px | Единичные места (вероятно, кнопки) — нужно подтвердить на следующих фреймах |

### Murs Gothic — установлен локально

Файл: `apps/client/public/fonts/mursgothic-widedark.otf` (вес 800, "Wide Dark").

Подключён через `next/font/local` в `apps/client/src/app/fonts.ts`, экспортирует CSS-переменную `--font-murs-gothic`. В `theme.css` обёрнут в `--font-taranka-display` с fallback:

```
var(--font-murs-gothic), "Bowlby One SC", "Anton", "Archivo Black", system-ui, sans-serif
```

**Покрытие глифов:** только Latin (Wide Dark — display-вес). Для Polish-диакритики (ł, ą, ę) проверить визуально при первой польской вёрстке. Для Cyrillic (украинский) — Murs Gothic скорее всего НЕ покроет, упадёт на fallback Bowlby One SC. Если будут украинские заголовки — нужен другой шрифт для них, либо использовать Montserrat 800.

### Line-heights и letter-spacing

- 14px → lh 17, 18, 21 (множитель 1.2–1.5)
- 16px → lh 18, 19.5, 24 (множитель 1.13–1.5)
- 48px → lh 48 (множитель 1.0 — display tight)

Letter-spacing везде 0. Никакого `tracking-tight/wide`.

---

## 3. Радиусы

Из `cornerRadius`:

| Значение | Tailwind | Где применяется |
|---|---|---|
| 8px | `rounded-md` | мелкие пилюли, инпуты |
| 16px | `rounded-2xl` | карточки товаров |
| 20px | `rounded-[20px]` | средние блоки |
| 40px | `rounded-full` (pill) | основные кнопки CTA, чипы категорий |

---

## 4. Тени

`DROP_SHADOW` в извлечённых фреймах **отсутствует**. Дизайн полностью плоский — глубина выражается через контраст фона/карточек, не через shadow.

---

## 5. Повторяющиеся паттерны (наблюдения)

Будет расширяться по мере новых фреймов.

### Header
- Тёмная (`ink-900`) тонкая полоса сверху с контактами/локалью
- Под ней — белый бар с лого + поиск + иконки (профиль, избранное, корзина)
- Под баром — горизонтальная навигация по категориям с иконками

### Hero / promo block
- Тёмный фоновый имидж + крупный display-текст в Murs Gothic 800/48px
- Две кнопки CTA: красная (primary) + контурная белая (secondary)

### Категорийные пилюли
- Карточки с фото продукта на тёмном фоне + крупная плотная подпись (Murs Gothic 14/800 uppercase)

### Карточки товара
- Белый фон, `rounded-2xl`
- Фото товара по центру, описание мелким Montserrat
- Цена крупным шрифтом (Montserrat 16/600?) + красная кнопка-пилюля «Do koszyka» с иконкой корзины
- Иконка «избранное» (сердце) в правом верхнем углу

### Sidebar фильтры (на странице каталога)
- Колонки с чекбоксами «Spożywcze artykuły»
- Раскрывающиеся секции «Ryba» и т.п.
- Sort в правом верхнем углу

### Footer
- Тёмный (`ink-900`) фон
- Лого + 4 колонки (Menu, Dla klientów, O nas, Kontakty)
- Соц-иконки слева, контакты справа

---

## 6. TODO для следующих фреймов

При получении новых фреймов добавить сюда:
- [ ] Состояния кнопок (hover/pressed/disabled)
- [ ] Состояния инпутов (focus/error/filled)
- [ ] Toast / notification стили
- [ ] Модалки / drawer (корзина, фильтры на мобайле)
- [ ] Карточка товара (PDP) — детальная страница
- [ ] Чекаут / корзина — формы и шаги
- [ ] Spacing scale (пока не извлекал — нужны фреймы с разметкой)
- [ ] Адаптив / breakpoints (текущие фреймы только desktop)
- [ ] Иконки — какой набор используется (Lucide / Heroicons / кастомные?)
- [ ] Уточнить использование Poppins (единичный 16/500 — для каких элементов?)

---

## 7. Что уже сделано в коде

- `apps/client/src/app/theme.css` — добавлены токены `--color-cream-*`, `--color-ink-*`, `--color-brand-red-*` и `--font-taranka-*` в `@theme` блок (Tailwind v4 автоматически генерирует утилиты `bg-cream-50`, `text-ink-900`, `font-taranka-display` и т.д.)
- Добавлены **shadcn семантические токены** (`--color-primary`, `--color-background`, `--color-foreground`, `--color-card`, `--color-border`, `--color-ring` и т.д.), замаплены на бренд: primary → brand-red-500, background → cream-50, foreground → ink-900, border → cream-200.
- НЕ трогал существующие `brand-*` / `error-*` токены — они могут использоваться в коде шаблона.

### shadcn/ui — установлен в `apps/client`

- `apps/client/components.json` создан (style: new-york, baseColor: neutral, RSC: true, icons: lucide)
- Алиас `ui` → `@/components/shadcn` (отдельно от существующих кастомных компонентов в `@/components/ui` — чтобы не конфликтовать)
- Зависимости: `clsx`, `class-variance-authority`, `lucide-react`, `@radix-ui/react-slot`
- `cn(...)` helper добавлен в `@/lib/utils`
- Smoke-test: `npx shadcn add button` сработал — файл `src/components/shadcn/button.tsx` создан
- Для добавления новых компонентов: `cd apps/client && npx shadcn@latest add <name>` (card, input, badge, dialog, dropdown-menu и т.д.)

### Шрифты — подключены

- **Murs Gothic Wide Dark (800)** — локальный файл `public/fonts/mursgothic-widedark.otf`, через `next/font/local`.
- **Montserrat** (400/500/600/700) — `next/font/google`, subsets: `latin, latin-ext, cyrillic`.
- **Poppins** (500) — `next/font/google`, subsets: `latin, latin-ext`.
- Все три привязаны в `<html className>` в `apps/client/src/app/layout.tsx`. Используются через утилиты Tailwind: `font-taranka-display`, `font-taranka-body`, `font-taranka-ui`.
- Конфиг шрифтов: `apps/client/src/app/fonts.ts`.

**Оптимизация (отложено):** `.otf` весит 83KB. Если станет узким местом — конвертнуть в `.woff2` (≈40-50% меньше) через `fonttools` (`pyftsubset` / `woff2_compress`).
