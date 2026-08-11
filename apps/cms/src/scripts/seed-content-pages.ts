/**
 * Idempotent seed for the storefront content pages + their forms.
 *
 * Creates/updates ONLY:
 *   forms: "Kontakt (PL/UK)", "Franczyza (PL/UK)"
 *   pages: about, delivery, franchise, contacts   (bilingual pl + uk)
 *
 * It NEVER clears collections, so the blog (posts/media) is untouched. Safe to
 * re-run. Because `pages.layout` is localized, each locale references its own
 * (localized) form, which gives fully bilingual forms without localizing the
 * form-builder internals.
 *
 * Run on the CMS host:  pnpm --filter cms payload run src/scripts/seed-content-pages.ts
 * (or from apps/cms:     pnpm payload run src/scripts/seed-content-pages.ts)
 */

import { getPayload } from 'payload'
import config from '@payload-config'

// ---------- lexical helpers ----------

type Node = Record<string, unknown>

const text = (t: string, format = 0): Node => ({
  type: 'text',
  detail: 0,
  format,
  mode: 'normal',
  style: '',
  text: t,
  version: 1,
})

const p = (t: string): Node => ({
  type: 'paragraph',
  children: [text(t)],
  direction: 'ltr',
  format: '',
  indent: 0,
  textFormat: 0,
  version: 1,
})

const h = (tag: 'h2' | 'h3', t: string): Node => ({
  type: 'heading',
  tag,
  children: [text(t)],
  direction: 'ltr',
  format: '',
  indent: 0,
  version: 1,
})

const ul = (items: string[]): Node => ({
  type: 'list',
  listType: 'bullet',
  tag: 'ul',
  start: 1,
  direction: 'ltr',
  format: '',
  indent: 0,
  version: 1,
  children: items.map((it, i) => ({
    type: 'listitem',
    value: i + 1,
    children: [text(it)],
    direction: 'ltr',
    format: '',
    indent: 0,
    version: 1,
  })),
})

const root = (children: Node[]) => ({
  root: { type: 'root', children, direction: 'ltr', format: '', indent: 0, version: 1 },
})

const contentBlock = (children: Node[]) => ({
  blockType: 'content' as const,
  columns: [{ size: 'full' as const, richText: root(children) }],
})

const formBlock = (formId: number | string, intro?: Node[]) => ({
  blockType: 'formBlock' as const,
  form: formId,
  enableIntro: Boolean(intro),
  ...(intro ? { introContent: root(intro) } : {}),
})

// ---------- form definitions ----------

const NOTIFY = process.env.CONTACT_NOTIFY_EMAIL || 'info@taranka.online'
const FROM = process.env.CONTACT_FROM_EMAIL || 'Taranka <noreply@taranka.online>'

const notifyEmail = (subject: string, body: string) => [
  { emailTo: NOTIFY, emailFrom: FROM, subject, message: root([p(body)]) },
]

const contactFields = (L: Record<string, string>) => [
  { name: 'imie', blockName: 'imie', blockType: 'text' as const, label: L.name, required: true, width: 100 },
  { name: 'email', blockName: 'email', blockType: 'email' as const, label: L.email, required: true, width: 100 },
  { name: 'telefon', blockName: 'telefon', blockType: 'text' as const, label: L.phone, required: false, width: 100 },
  { name: 'temat', blockName: 'temat', blockType: 'text' as const, label: L.subject, required: false, width: 100 },
  { name: 'wiadomosc', blockName: 'wiadomosc', blockType: 'textarea' as const, label: L.message, required: true, width: 100 },
]

const franchiseFields = (L: Record<string, string>, opts: Array<{ label: string; value: string }>) => [
  { name: 'imie', blockName: 'imie', blockType: 'text' as const, label: L.name, required: true, width: 100 },
  { name: 'email', blockName: 'email', blockType: 'email' as const, label: L.email, required: true, width: 100 },
  { name: 'telefon', blockName: 'telefon', blockType: 'text' as const, label: L.phone, required: true, width: 100 },
  { name: 'miasto', blockName: 'miasto', blockType: 'text' as const, label: L.city, required: true, width: 100 },
  { name: 'budzet', blockName: 'budzet', blockType: 'select' as const, label: L.budget, required: false, width: 100, options: opts },
  { name: 'wiadomosc', blockName: 'wiadomosc', blockType: 'textarea' as const, label: L.message, required: false, width: 100 },
]

const forms = {
  contactPl: {
    title: 'Kontakt (PL)',
    submitButtonLabel: 'Wyślij',
    confirmationType: 'message' as const,
    confirmationMessage: root([h('h2', 'Dziękujemy! Wiadomość została wysłana.')]),
    emails: notifyEmail('Nowa wiadomość z formularza kontaktowego', 'Otrzymano nowe zgłoszenie z formularza kontaktowego Taranka.'),
    fields: contactFields({ name: 'Imię i nazwisko', email: 'E-mail', phone: 'Telefon', subject: 'Temat', message: 'Wiadomość' }),
  },
  contactUk: {
    title: 'Kontakt (UK)',
    submitButtonLabel: 'Надіслати',
    confirmationType: 'message' as const,
    confirmationMessage: root([h('h2', 'Дякуємо! Повідомлення надіслано.')]),
    emails: notifyEmail('Нове повідомлення з контактної форми', 'Отримано нове звернення з контактної форми Taranka.'),
    fields: contactFields({ name: 'Ім’я та прізвище', email: 'E-mail', phone: 'Телефон', subject: 'Тема', message: 'Повідомлення' }),
  },
  franchisePl: {
    title: 'Franczyza (PL)',
    submitButtonLabel: 'Wyślij zgłoszenie',
    confirmationType: 'message' as const,
    confirmationMessage: root([h('h2', 'Dziękujemy za zgłoszenie! Wkrótce się z Tobą skontaktujemy.')]),
    emails: notifyEmail('Nowe zgłoszenie franczyzowe', 'Otrzymano nowe zgłoszenie franczyzowe Taranka.'),
    fields: franchiseFields(
      { name: 'Imię i nazwisko', email: 'E-mail', phone: 'Telefon', city: 'Miasto / region', budget: 'Budżet inwestycyjny', message: 'Twoja wiadomość' },
      [
        { label: 'do 50 000 zł', value: 'do-50k' },
        { label: '50 000 – 150 000 zł', value: '50-150k' },
        { label: 'powyżej 150 000 zł', value: 'powyzej-150k' },
      ],
    ),
  },
  franchiseUk: {
    title: 'Franczyza (UK)',
    submitButtonLabel: 'Надіслати заявку',
    confirmationType: 'message' as const,
    confirmationMessage: root([h('h2', 'Дякуємо за заявку! Ми найближчим часом з вами зв’яжемося.')]),
    emails: notifyEmail('Нова заявка на франшизу', 'Отримано нову заявку на франшизу Taranka.'),
    fields: franchiseFields(
      { name: 'Ім’я та прізвище', email: 'E-mail', phone: 'Телефон', city: 'Місто / регіон', budget: 'Інвестиційний бюджет', message: 'Ваше повідомлення' },
      [
        { label: 'до 50 000 zł', value: 'do-50k' },
        { label: '50 000 – 150 000 zł', value: '50-150k' },
        { label: 'понад 150 000 zł', value: 'powyzej-150k' },
      ],
    ),
  },
}

// ---------- run ----------

async function upsertForm(payload: Awaited<ReturnType<typeof getPayload>>, data: (typeof forms)[keyof typeof forms]) {
  const existing = await payload.find({ collection: 'forms', where: { title: { equals: data.title } }, limit: 1, depth: 0 })
  if (existing.docs[0]) {
    const doc = await payload.update({ collection: 'forms', id: existing.docs[0].id, data: data as never, depth: 0, context: { disableRevalidate: true } })
    return doc.id
  }
  const doc = await payload.create({ collection: 'forms', data: data as never, depth: 0, context: { disableRevalidate: true } })
  return doc.id
}

async function upsertPage(
  payload: Awaited<ReturnType<typeof getPayload>>,
  slug: string,
  pl: { title: string; layout: unknown[] },
  uk: { title: string; layout: unknown[] },
) {
  const existing = await payload.find({ collection: 'pages', where: { slug: { equals: slug } }, limit: 1, depth: 0, locale: 'pl' })
  const plData = { slug, _status: 'published', hero: { type: 'none' }, title: pl.title, layout: pl.layout }
  let id: number | string
  if (existing.docs[0]) {
    id = existing.docs[0].id
    await payload.update({ collection: 'pages', id, locale: 'pl', data: plData as never, depth: 0, context: { disableRevalidate: true } })
  } else {
    const created = await payload.create({ collection: 'pages', locale: 'pl', data: plData as never, depth: 0, context: { disableRevalidate: true } })
    id = created.id
  }
  // Set the Ukrainian localized values on the same document.
  await payload.update({ collection: 'pages', id, locale: 'uk', data: { title: uk.title, layout: uk.layout } as never, depth: 0, context: { disableRevalidate: true } })
  return id
}

const run = async () => {
  const payload = await getPayload({ config })
  payload.logger.info('Seeding storefront content pages + forms…')

  // 1) forms (per locale)
  const contactPl = await upsertForm(payload, forms.contactPl)
  const contactUk = await upsertForm(payload, forms.contactUk)
  const franchisePl = await upsertForm(payload, forms.franchisePl)
  const franchiseUk = await upsertForm(payload, forms.franchiseUk)
  payload.logger.info(`Forms ready: contact ${contactPl}/${contactUk}, franchise ${franchisePl}/${franchiseUk}`)

  // 2) pages
  await upsertPage(
    payload,
    'about',
    {
      title: 'O nas',
      layout: [
        contentBlock([
          p('Taranka to sklep z przekąskami do piwa, kiszonkami, winem i słodyczami. Dostarczamy ulubione smaki prosto pod Twoje drzwi — szybko, wygodnie i w dobrych cenach.'),
          h('h2', 'Nasza misja'),
          p('Łączymy tradycję i nowoczesność: starannie dobrany asortyment, sprawdzeni dostawcy i obsługa, która naprawdę pomaga. Chcemy, aby każde zamówienie było przyjemnością.'),
          h('h2', 'Dlaczego my'),
          ul(['Szeroki i stale rosnący asortyment', 'Ceny detaliczne i hurtowe', 'Szybka dostawa na terenie Polski', 'Wsparcie klienta w języku polskim i ukraińskim']),
        ]),
      ],
    },
    {
      title: 'Про нас',
      layout: [
        contentBlock([
          p('Taranka — це магазин снеків до пива, квашених продуктів, вина та солодощів. Ми доставляємо улюблені смаки прямо до ваших дверей — швидко, зручно та за вигідними цінами.'),
          h('h2', 'Наша місія'),
          p('Ми поєднуємо традиції та сучасність: ретельно підібраний асортимент, перевірені постачальники та підтримка, яка справді допомагає. Ми хочемо, щоб кожне замовлення було задоволенням.'),
          h('h2', 'Чому ми'),
          ul(['Широкий асортимент, що постійно зростає', 'Роздрібні та оптові ціни', 'Швидка доставка по Польщі', 'Підтримка клієнтів польською та українською']),
        ]),
      ],
    },
  )

  await upsertPage(
    payload,
    'delivery',
    {
      title: 'Dostawa i płatność',
      layout: [
        contentBlock([
          h('h2', 'Dostawa'),
          ul(['Kurier — 1–3 dni robocze', 'Paczkomaty InPost', 'Odbiór osobisty w punkcie']),
          h('h2', 'Płatność'),
          ul(['Płatność online (BLIK, karta)', 'Za pobraniem przy odbiorze', 'Przelew tradycyjny', 'Faktura dla klientów hurtowych']),
          p('Koszt i czas dostawy zależą od wybranej metody oraz adresu. Szczegóły zobaczysz podczas składania zamówienia.'),
        ]),
      ],
    },
    {
      title: 'Доставка та оплата',
      layout: [
        contentBlock([
          h('h2', 'Доставка'),
          ul(['Кур’єр — 1–3 робочі дні', 'Поштомати InPost', 'Самовивіз із пункту видачі']),
          h('h2', 'Оплата'),
          ul(['Онлайн-оплата (BLIK, картка)', 'Накладений платіж при отриманні', 'Банківський переказ', 'Рахунок-фактура для оптових клієнтів']),
          p('Вартість і термін доставки залежать від обраного способу та адреси. Деталі ви побачите під час оформлення замовлення.'),
        ]),
      ],
    },
  )

  await upsertPage(
    payload,
    'franchise',
    {
      title: 'Franczyza',
      layout: [
        contentBlock([
          h('h2', 'Zostań partnerem Taranka'),
          p('Franczyza Taranka to możliwość otwarcia własnego punktu i działania pod znaną marką. Kupujesz asortyment bezpośrednio od nas w cenach hurtowych i sprzedajesz go swoim klientom.'),
          h('h3', 'Co zyskujesz'),
          ul(['Rozpoznawalną markę i gotowy model biznesowy', 'Dostęp do asortymentu w cenach hurtowych', 'Gotowy sklep online pod Twoim punktem', 'Wsparcie marketingowe i szkoleniowe']),
          h('h3', 'Zostaw zgłoszenie'),
          p('Wypełnij formularz — skontaktujemy się z Tobą i przedstawimy szczegóły współpracy.'),
        ]),
        formBlock(franchisePl),
      ],
    },
    {
      title: 'Франшиза',
      layout: [
        contentBlock([
          h('h2', 'Стань партнером Taranka'),
          p('Франшиза Taranka — це можливість відкрити власну точку та працювати під відомим брендом. Ви купуєте асортимент безпосередньо в нас за оптовими цінами й продаєте його своїм клієнтам.'),
          h('h3', 'Що ви отримуєте'),
          ul(['Впізнаваний бренд і готову бізнес-модель', 'Доступ до асортименту за оптовими цінами', 'Готовий онлайн-магазин під вашу точку', 'Маркетингову підтримку та навчання']),
          h('h3', 'Залиште заявку'),
          p('Заповніть форму — ми зв’яжемося з вами й розповімо деталі співпраці.'),
        ]),
        formBlock(franchiseUk),
      ],
    },
  )

  await upsertPage(
    payload,
    'contacts',
    {
      title: 'Kontakty',
      layout: [
        contentBlock([
          h('h2', 'Kontakt'),
          ul(['Adres: Piaskowa 92/95, 55-296 Świdnik', 'Telefon: +48 55 250 34 10', `E-mail: ${NOTIFY}`]),
          h('h3', 'Napisz do nas'),
          p('Masz pytanie? Wypełnij formularz — odpowiemy najszybciej, jak to możliwe.'),
        ]),
        formBlock(contactPl),
      ],
    },
    {
      title: 'Контакти',
      layout: [
        contentBlock([
          h('h2', 'Контакти'),
          ul(['Адреса: Piaskowa 92/95, 55-296 Świdnik', 'Телефон: +48 55 250 34 10', `E-mail: ${NOTIFY}`]),
          h('h3', 'Напишіть нам'),
          p('Маєте запитання? Заповніть форму — ми відповімо якнайшвидше.'),
        ]),
        formBlock(contactUk),
      ],
    },
  )

  payload.logger.info('✅ Content pages + forms seeded (about, delivery, franchise, contacts).')
  process.exit(0)
}

run().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err)
  process.exit(1)
})
