import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Icon from '../components/ui/Icon'
import JerseyGraphic from '../components/product/JerseyGraphic'
import { PageHeader, TrustStrip } from '../components/ui/PageHeader'
import { ProductRail } from '../components/product/ProductCard'
import { products as productsApi } from '../lib/api'
import { SITE } from '../lib/config'
import { formatPrice, whatsappLink } from '../lib/format'

const TIMELINE = [
  ['2021', 'One stubborn order', 'A jersey arrived with the print already cracking after two washes. We were not going to let that be the standard.'],
  ['2022', 'A print room in Dhaka', 'We hired two printers and started producing our own kits instead of reselling whatever we could import.'],
  ['2023', 'Delivery to all 64 districts', 'We replaced guesswork couriers with tracked nationwide delivery and cash on delivery, everywhere.'],
  ['2025', 'Custom jerseys', 'Our most requested product. Send us a design, we confirm it on WhatsApp, and print it to your spec.'],
  ['Today', '12,000+ orders later', 'Same promise as day one: honest quality, honest pricing, and no advance payment ever.'],
]

const VALUES = [
  ['shield2', 'Quality over margin', 'We would rather sell 200 good jerseys than 2,000 that crack after a month. Every kit goes through the same wash test before it ships.'],
  ['tag', 'Honest pricing', 'The price you see is the price you pay. When something is on sale, the discount is real — no inflated "original price" games.'],
  ['whatsapp', 'Answers from people', 'Every message is answered by someone who can look up your actual order. No bots, no ticket numbers.'],
  ['refresh', 'We fix our mistakes', 'Wrong size, late delivery, a print you do not like. Tell us and we sort it. No arguments.'],
]

export default function About() {
  const [products, setProducts] = useState([])

  useEffect(() => {
    productsApi.list({ limit: 5, bestSeller: true, sort: 'popular' })
      .then((r) => setProducts(r.items))
      .catch(() => {})
  }, [])

  return (
    <>
      <PageHeader
        eyebrow="Our story"
        title="FootballTrix"
        lede="We started because buying a decent jersey in Dhaka was a gamble. We fixed the print, the sizing and the returns — and we never ask for advance payment."
        breadcrumbs={[{ label: 'About' }]}
      >
        <TrustStrip />
      </PageHeader>

      {/* ---- story + art ---- */}
      <section className="section">
        <div className="container-x grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <span className="eyebrow-accent mb-4">
              <span className="h-px w-7 bg-lime-dark" />
              What we are
            </span>
            <h2 className="heading-lg text-ink-950">A football store that behaves like a football store should</h2>

            <div className="mt-5 space-y-4 text-base leading-relaxed text-ink-600/95">
              <p>
                FootballTrix makes premium football jerseys in Dhaka. Club kits, national
                colours, World Cup editions and made-to-order customs — produced on our own
                printers so we control the fabric, the fit and the finish.
              </p>
              <p>
                We are not an official club retailer and we will not pretend to be. What we are
                is a shop that tells you exactly what you are getting: real measurements, a
                size guide that matches the shirt, and a print that survives a full season of
                washing.
              </p>
              <p>
                Everything is cash on delivery. That is not a limitation — it is the reason
                people trust us. You do not pay us until the shirt is in your hands.
              </p>
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link to="/shop" className="btn-dark">
                Browse the range
                <Icon name="arrowRight" size={17} />
              </Link>
              <a
                href={whatsappLink(SITE.contact.whatsapp, 'Hi FootballTrix, I have a question.')}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-ghost"
              >
                <Icon name="whatsapp" size={17} className="text-pitch" />
                Talk to us
              </a>
            </div>
          </div>

          <div className="relative">
            <div className="relative mx-auto aspect-square w-full max-w-md rounded-3xl bg-gradient-to-br from-ink-900 to-ink-950 p-10">
              <div className="flex h-full items-center justify-center">
                <JerseyGraphic seed="about-hero" primary="#C8FF3D" secondary="#0B1220" className="h-full w-3/4" />
              </div>
            </div>
            <div className="absolute -bottom-5 -left-3 rounded-2xl border border-ink-200 bg-white px-5 py-4 shadow-lift">
              <p className="font-display text-2xl font-extrabold text-ink-950">4.8/5</p>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-600">
                From 1,900+ reviews
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ---- numbers ---- */}
      <section className="border-y border-ink-200/70 bg-ink-950 py-14 text-white sm:py-16">
        <div className="container-x grid grid-cols-2 gap-8 lg:grid-cols-4">
          {[
            ['12,000+', 'Orders delivered'],
            ['64', 'Districts covered'],
            ['4.8/5', 'Average rating'],
            ['3–5 days', 'Custom turnaround'],
          ].map(([value, label]) => (
            <div key={label}>
              <p className="font-display text-3xl font-extrabold leading-none text-lime-accent sm:text-4xl">
                {value}
              </p>
              <p className="mt-2 text-[11px] font-semibold uppercase tracking-wider text-white/45">
                {label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ---- timeline ---- */}
      <section className="section">
        <div className="container-x">
          <div className="mx-auto max-w-2xl text-center">
            <span className="eyebrow mb-4 justify-center">
              <span className="h-px w-7 bg-ink-950" />
              How we got here
            </span>
            <h2 className="heading-lg text-ink-950">From one bad order to a print room</h2>
          </div>

          <ol className="mx-auto mt-14 max-w-3xl">
            {TIMELINE.map(([year, title, body], i) => (
              <li key={year} className="relative flex gap-6 pb-10 last:pb-0 sm:gap-10">
                <div className="flex flex-col items-center">
                  <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-ink-950 font-display text-sm font-extrabold text-lime-accent">
                    {year}
                  </span>
                  {i < TIMELINE.length - 1 && (
                    <span className="my-2 w-px flex-1 bg-ink-200" aria-hidden="true" />
                  )}
                </div>
                <div className="pt-1">
                  <h3 className="heading-md text-xl text-ink-950">{title}</h3>
                  <p className="mt-2 text-[15px] leading-relaxed text-ink-600/95">{body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ---- values ---- */}
      <section className="section bg-ink-50">
        <div className="container-x">
          <div className="mx-auto max-w-2xl text-center">
            <span className="eyebrow mb-4 justify-center">
              <span className="h-px w-7 bg-ink-950" />
              What we stand for
            </span>
            <h2 className="heading-lg text-ink-950">Four rules we do not break</h2>
          </div>

          <div className="mt-12 grid gap-5 sm:grid-cols-2">
            {VALUES.map(([icon, title, body]) => (
              <div
                key={title}
                className="group rounded-2xl border border-ink-200/80 bg-white p-7 transition-all duration-300 hover:border-ink-950 hover:shadow-lift"
              >
                <span className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-ink-950 text-lime-accent transition-transform duration-300 group-hover:scale-110">
                  <Icon name={icon} size={21} />
                </span>
                <h3 className="heading-md text-xl text-ink-950">{title}</h3>
                <p className="mt-2.5 text-sm leading-relaxed text-ink-600/95">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---- delivery + sizing (anchored from footer/FAQ links) ---- */}
      <section className="section">
        <div className="container-x grid gap-12 lg:grid-cols-2 lg:gap-16">
          <div id="delivery" className="scroll-mt-32">
            <span className="eyebrow-accent mb-4">
              <span className="h-px w-7 bg-lime-dark" />
              Delivery
            </span>
            <h2 className="heading-md text-2xl sm:text-3xl">Getting your kit to you</h2>
            <div className="mt-6 overflow-x-auto">
              <table className="w-full min-w-[22rem] text-sm">
                <thead>
                  <tr className="border-b border-ink-950">
                    {['Destination', 'Charge', 'Time'].map((h) => (
                      <th key={h} className="py-2.5 pr-3 text-left text-[11px] font-bold uppercase tracking-wider text-ink-600">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-200/70">
                  {[
                    ['Inside Dhaka', formatPrice(SITE.delivery.insideDhaka), SITE.delivery.etaDhaka],
                    ['Outside Dhaka', formatPrice(SITE.delivery.outsideDhaka), SITE.delivery.etaOutside],
                    [`Order over ${formatPrice(SITE.delivery.freeThreshold)}`, 'Free', 'Nationwide'],
                  ].map(([a, b, c]) => (
                    <tr key={a}>
                      <td className="py-3.5 pr-3 font-semibold text-ink-950">{a}</td>
                      <td className="py-3.5 pr-3 text-ink-700">{b}</td>
                      <td className="py-3.5 text-ink-700">{c}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-5 text-sm leading-relaxed text-ink-600/95">
              We dispatch every working day. Cash on delivery everywhere, and you get a WhatsApp
              message with the courier name as soon as your parcel is handed over.
            </p>
          </div>

          <div id="sizing" className="scroll-mt-32">
            <span className="eyebrow-accent mb-4">
              <span className="h-px w-7 bg-lime-dark" />
              Sizing
            </span>
            <h2 className="heading-md text-2xl sm:text-3xl">Finding your size</h2>
            <p className="mt-4 text-sm leading-relaxed text-ink-600/95">
              Our jerseys are a regular fit. Measure your favourite shirt flat across the chest,
              one inch below the armhole, and compare — that is the easiest way to get it right
              first time.
            </p>

            <div className="mt-6 overflow-x-auto">
              <table className="w-full min-w-[24rem] text-sm">
                <thead>
                  <tr className="border-b border-ink-950">
                    {['Size', 'Chest (cm)', 'Length (cm)', 'UK', 'US'].map((h) => (
                      <th key={h} className="py-2.5 pr-3 text-left text-[11px] font-bold uppercase tracking-wider text-ink-600">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-200/70">
                  {[
                    ['S', '52', '70', '8', 'M'],
                    ['M', '55', '72', '10', 'L'],
                    ['L', '58', '74', '12', 'XL'],
                    ['XL', '61', '76', '14', 'XL'],
                    ['XXL', '64', '78', '16', '2XL'],
                  ].map((row) => (
                    <tr key={row[0]}>
                      {row.map((cell, i) => (
                        <td key={cell + i} className={`py-3 pr-3 tabular-nums ${i === 0 ? 'font-bold text-ink-950' : 'text-ink-700'}`}>
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="mt-4 text-sm text-ink-600/95">
              Between two sizes? Size up for a relaxed matchday fit, or down for a close one.
              Still unsure? Message us on WhatsApp with your usual size and we will advise.
            </p>
          </div>
        </div>
      </section>

      {/* ---- cross-sell ---- */}
      {products.length > 0 && (
        <section className="section-tight border-t border-ink-200/70 bg-ink-50 pb-20">
          <div className="container-x">
            <h2 className="heading-md mb-7 text-2xl">What fans are buying</h2>
            <ProductRail products={products} />
          </div>
        </section>
      )}
    </>
  )
}
