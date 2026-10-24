import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Icon from '../components/ui/Icon'
import { PageHeader } from '../components/ui/PageHeader'
import { SITE } from '../lib/config'
import { formatPrice, whatsappLink } from '../lib/format'

const TOPICS = [
  { id: 'orders', label: 'Orders & delivery', icon: 'truck' },
  { id: 'sizing', label: 'Sizing & fit', icon: 'jersey' },
  { id: 'quality', label: 'Print & quality', icon: 'paint' },
  { id: 'payment', label: 'Payment & pricing', icon: 'tag' },
  { id: 'custom', label: 'Custom jerseys', icon: 'paint' },
  { id: 'returns', label: 'Exchanges & returns', icon: 'refresh' },
]

const FAQS = {
  orders: [
    {
      q: 'Do you deliver all over Bangladesh?',
      a: `Yes — all 64 districts, cash on delivery. Inside Dhaka is ${formatPrice(SITE.delivery.insideDhaka)} and usually arrives in 1–2 days. Outside Dhaka is ${formatPrice(SITE.delivery.outsideDhaka)} and takes 2–4 days. Orders over ${formatPrice(SITE.delivery.freeThreshold)} ship free anywhere in the country.`,
      link: { to: '/about#delivery', label: 'Delivery details' },
    },
    {
      q: 'How do I track my order?',
      a: 'Go to the Orders page and enter your order number (it looks like FTX-2609-1041). You will see exactly where it is in the journey, from confirmed to delivered. We also message you on WhatsApp as soon as the courier collects it.',
      link: { to: '/orders', label: 'Track an order' },
    },
    {
      q: 'What happens after I place an order?',
      a: 'You get a confirmation right away with your order number. We call or message to confirm your size and address, then print and pack. You pay the courier when the parcel reaches you — never in advance.',
    },
    {
      q: 'Can I change or cancel my order?',
      a: 'Yes, as long as it has not shipped. Message us on WhatsApp with your order number as early as possible and we will sort it out. Once it is with the courier we can arrange a return instead.',
    },
  ],
  sizing: [
    {
      q: 'How do your jerseys fit?',
      a: 'Regular fit. They are not ultra tight like a match shirt, and not baggy like a fan shirt. If you want a relaxed matchday feel, size up one.',
      link: { to: '/about#sizing', label: 'Size chart' },
    },
    {
      q: 'I am between two sizes. Which do I pick?',
      a: 'Measure your favourite shirt flat across the chest, one inch below the armhole, and compare it to our chart. If you land between two, go up for comfort or down for a closer fit. Still unsure? Message us your usual size and we will advise.',
    },
    {
      q: 'Are the sizes UK, US or Asian?',
      a: 'Our chart shows UK and US equivalents with the actual chest and length measurements in cm, so you can compare against any jersey you already own.',
      link: { to: '/about#sizing', label: 'See measurements' },
    },
  ],
  quality: [
    {
      q: 'Will the print crack or peel?',
      a: 'Not if you wash it properly. Every jersey goes through a wash test before it ships. Wash inside out at 30°C, do not tumble dry, and do not iron the print.',
    },
    {
      q: 'What material are the jerseys?',
      a: 'A breathable polyester knit that stays cool during a match and does not cling when it is wet. It is machine washable and quick to dry — no special treatment needed.',
    },
    {
      q: 'Can I see the exact design before it ships?',
      a: 'For custom orders, yes. We send you a photo of the actual printed shirt for approval before we pack it. For standard catalogue kits the designs are as pictured.',
    },
  ],
  payment: [
    {
      q: 'Do you accept advance payment?',
      a: 'No. We are cash on delivery only. You pay the courier when the parcel is in your hands. It is the reason people trust us and it is not changing.',
    },
    {
      q: 'How much is delivery?',
      a: `Inside Dhaka ${formatPrice(SITE.delivery.insideDhaka)}, outside Dhaka ${formatPrice(SITE.delivery.outsideDhaka)}, and free on orders over ${formatPrice(SITE.delivery.freeThreshold)}. Custom jerseys have their own delivery charge, quoted on WhatsApp before we start.`,
      link: { to: '/about#delivery', label: 'Delivery table' },
    },
    {
      q: 'Are the prices real?',
      a: 'Yes. When something is on sale, the crossed-out price is what we actually charged before, not an inflated number we made up. The price you see is what you pay.',
    },
  ],
  custom: [
    {
      q: 'How do custom jerseys work?',
      a: 'Message us on WhatsApp with your design (or an idea), the quantity and your sizes. We confirm the price and timeline, print a sample for your approval, then produce the rest. Typical turnaround is 3–5 days.',
    },
    {
      q: 'What is the minimum order for custom kits?',
      a: 'One jersey. There is no minimum — plenty of people order a single custom shirt for themselves or as a gift.',
    },
    {
      q: 'Can I get my own name and number printed?',
      a: 'Yes. Names and numbers are included in the custom price. Keep it to the last name and a number between 1 and 99 so it matches real kit conventions.',
    },
  ],
  returns: [
    {
      q: 'What is your return policy?',
      a: 'If the jersey is the wrong size or has a printing fault, message us within 7 days of delivery and we will exchange it. You only pay the delivery again, not the jersey.',
    },
    {
      q: 'Can I return something I simply do not like?',
      a: 'We accept returns within 7 days if the shirt is unworn and still has its tags. In that case the delivery for the return is yours. That is the one rule we cannot bend, because we print on a made-to-order basis.',
    },
    {
      q: 'My order arrived damaged. What now?',
      a: 'Send us a photo on WhatsApp within 48 hours. We will ship a replacement immediately and cover the delivery. You will not pay twice for the same shirt.',
    },
  ],
}

export default function Faq() {
  const [topic, setTopic] = useState('orders')
  const [open, setOpen] = useState(0)
  const [query, setQuery] = useState('')

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return null
    return Object.entries(FAQS)
      .flatMap(([id, items]) => items.map((item) => ({ ...item, id })))
      .filter((item) => `${item.q} ${item.a}`.toLowerCase().includes(q))
  }, [query])

  useEffect(() => {
    setOpen(0)
  }, [topic])

  const list = results ?? FAQS[topic] ?? []

  return (
    <>
      <PageHeader
        eyebrow="Help centre"
        title="Frequently asked questions"
        lede="Everything about delivery, sizing, print quality and returns. Still stuck? We are one WhatsApp message away."
        breadcrumbs={[{ label: 'FAQ' }]}
      />

      <div className="container-x py-10 sm:py-14">
        {/* ---- search ---- */}
        <div className="mx-auto max-w-2xl">
          <label htmlFor="faq-search" className="sr-only">Search questions</label>
          <div className="relative">
            <Icon name="search" size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-600" />
            <input
              id="faq-search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search — delivery, sizing, returns…"
              className="field pl-11"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-ink-600 hover:bg-ink-100 focus-ring"
                aria-label="Clear search"
              >
                <Icon name="close" size={15} />
              </button>
            )}
          </div>
        </div>

        <div className="mt-10 grid gap-10 lg:grid-cols-[15rem_1fr] lg:gap-14">
          {/* ---- topics ---- */}
          {!results && (
            <nav aria-label="FAQ topics" className="lg:sticky lg:top-32 lg:self-start">
              <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 lg:flex-col lg:overflow-visible lg:pb-0">
                {TOPICS.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTopic(t.id)}
                    aria-current={topic === t.id}
                    className={`flex shrink-0 items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-colors focus-ring ${
                      topic === t.id ? 'bg-ink-950 text-white' : 'text-ink-700 hover:bg-ink-50'
                    }`}
                  >
                    <Icon name={t.icon} size={17} className={topic === t.id ? 'text-lime-accent' : 'text-ink-600'} />
                    {t.label}
                  </button>
                ))}
              </div>

              <div className="mt-6 hidden rounded-2xl bg-ink-950 p-5 text-white lg:block">
                <Icon name="whatsapp" size={22} className="text-lime-accent" />
                <p className="heading-md mt-3 text-base text-white">Still need help?</p>
                <p className="mt-1.5 text-xs leading-relaxed text-white/60">
                  We answer messages ourselves, usually within the hour.
                </p>
                <a
                  href={whatsappLink(SITE.contact.whatsapp, 'Hi FootballTrix, I have a question from your FAQ page.')}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex items-center gap-2 rounded-full bg-lime-accent px-4 py-2.5 text-xs font-bold text-ink-950 transition-colors hover:bg-white focus-ring"
                >
                  Message us
                  <Icon name="arrowRight" size={14} />
                </a>
              </div>
            </nav>
          )}

          {/* ---- questions ---- */}
          <div className="min-w-0">
            {results && (
              <p className="mb-5 text-sm text-ink-600">
                {results.length} {results.length === 1 ? 'result' : 'results'} for{' '}
                <span className="font-semibold text-ink-950">"{query}"</span>
              </p>
            )}

            {list.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-ink-300 p-12 text-center">
                <Icon name="search" size={30} className="mx-auto text-ink-300" />
                <p className="heading-md mt-4 text-lg text-ink-900">No answers for that</p>
                <p className="mx-auto mt-2 max-w-sm text-sm text-ink-600/80">
                  Try a different word, or ask us directly — we usually reply the same day.
                </p>
                <a
                  href={whatsappLink(SITE.contact.whatsapp, `Hi FootballTrix, my question: "${query}"`)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary mt-6"
                >
                  <Icon name="whatsapp" size={17} />
                  Ask on WhatsApp
                </a>
              </div>
            ) : (
              <div className="divide-y divide-ink-200/80 border-y border-ink-200/80">
                {list.map((item, i) => {
                  const key = `${item.id}-${item.q}`
                  const isOpen = open === i
                  return (
                    <div key={key}>
                      <h3>
                        <button
                          type="button"
                          onClick={() => setOpen(isOpen ? -1 : i)}
                          aria-expanded={isOpen}
                          className="flex w-full items-start justify-between gap-4 py-5 text-left focus-ring"
                        >
                          <span className="font-display text-[17px] font-bold leading-snug text-ink-950">
                            {item.q}
                          </span>
                          <span
                            className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border transition-all duration-300 ${
                              isOpen ? 'rotate-180 border-ink-950 bg-ink-950 text-lime-accent' : 'border-ink-200 text-ink-600'
                            }`}
                          >
                            <Icon name="chevronDown" size={15} />
                          </span>
                        </button>
                      </h3>
                      <div
                        className={`grid transition-[grid-template-rows] duration-300 ${
                          isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                        }`}
                      >
                        <div className="overflow-hidden">
                          <div className="pb-5 pr-10 text-[15px] leading-relaxed text-ink-600/95">
                            {item.a}
                            {item.link && (
                              <Link
                                to={item.link.to}
                                className="mt-2.5 ml-1 inline-flex items-center gap-1.5 text-sm font-semibold text-ink-950 underline decoration-lime-dark decoration-2 underline-offset-2 hover:text-lime-dark"
                              >
                                {item.link.label}
                                <Icon name="arrowRight" size={14} />
                              </Link>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* ---- still stuck ---- */}
            {!results && (
              <div className="mt-8 flex flex-col items-start justify-between gap-5 rounded-2xl border border-ink-200/80 bg-ink-50 p-6 sm:flex-row sm:items-center">
                <div>
                  <p className="heading-md text-lg text-ink-950">Question not answered here?</p>
                  <p className="mt-1 text-sm text-ink-600/90">
                    Message us and a real person will answer.
                  </p>
                </div>
                <div className="flex shrink-0 flex-wrap gap-3">
                  <Link to="/contact" className="btn-dark">Contact page</Link>
                  <a
                    href={whatsappLink(SITE.contact.whatsapp, 'Hi FootballTrix, I have a question.')}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-ghost"
                  >
                    <Icon name="whatsapp" size={17} className="text-pitch" />
                    WhatsApp
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}