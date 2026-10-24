import { useState } from 'react'
import { Link } from 'react-router-dom'
import Icon from '../ui/Icon'
import SectionHeading from './SectionHeading'

/**
 * Homepage FAQ. Shares its data with /faq so the answers are written once.
 * The full page adds search and category grouping; the homepage keeps the
 * six questions that cover the most objections.
 */
export const FAQ_ITEMS = [
  {
    group: 'Orders & Payment',
    question: 'How do I pay, and is cash on delivery really available?',
    answer:
      'Everything is cash on delivery. You pay the courier when the jersey arrives, not us in advance. We do not ask for card numbers, bKash PINs, or any advance payment, and we will never call asking for one.',
  },
  {
    group: 'Orders & Payment',
    question: 'How long does delivery take?',
    answer:
      'Inside Dhaka it is 1–2 working days. Anywhere else in Bangladesh it is 2–4 working days, and we deliver to all 64 districts. Orders placed after 4 PM are dispatched the next working day.',
  },
  {
    group: 'Orders & Payment',
    question: 'What are the delivery charges?',
    answer:
      'Delivery inside Dhaka is ৳80, and outside Dhaka is ৳130. Delivery is free on any order over ৳5,000. Custom jerseys ship with the same rates.',
  },
  {
    group: 'Sizing & Fit',
    question: 'How does sizing work, and what if my size is wrong?',
    answer:
      'Our jerseys are regular fit. If you are between sizes or prefer a looser feel, size up; if you want it close to the body, size down. Every product page lists actual measurements in centimetres. If the size is wrong, exchange it free within 7 days — you only cover the return courier.',
  },
  {
    group: 'Sizing & Fit',
    question: 'Are these real official jerseys?',
    answer:
      'They are premium-quality fan jerseys made to the same specifications as official kit — same fabrics, same sublimation print, same cut. They are not manufacturer-authentic match-worn stock, and we never claim to be an official club retailer.',
  },
  {
    group: 'Sizing & Fit',
    question: 'How do I wash a jersey?',
    answer:
      'Machine wash cold, inside out, with similar colours. Do not bleach, do not tumble dry, and iron on the reverse only. The sublimation print will not crack or peel with normal washing.',
  },
  {
    group: 'Custom Jerseys',
    question: 'How long do custom jerseys take?',
    answer:
      'Custom jerseys are made to order and take 3–5 working days in production, plus delivery. We confirm your design on WhatsApp before printing, so check your message thread after ordering.',
  },
  {
    group: 'Custom Jerseys',
    question: 'Do you handle team and bulk orders?',
    answer:
      'Yes. Team kits, tournaments and corporate orders start from 10 pieces, with per-piece pricing and a single delivery. Use the bulk quote form or message us on WhatsApp with your quantity and sizes.',
  },
  {
    group: 'Returns & Support',
    question: 'What is your exchange and return policy?',
    answer:
      'Exchange within 7 days of delivery if the jersey is unworn, unwashed and still has its tags attached. We cover the replacement; you cover the return courier. Refused deliveries are not eligible for a refund of the item value once produced.',
  },
  {
    group: 'Returns & Support',
    question: 'How do I track my order?',
    answer:
      'Use the Track Order page with your order number — the format is FTX-YYMM-0000. You will also get a WhatsApp message when your parcel is handed to the courier.',
  },
  {
    group: 'Returns & Support',
    question: 'How do I contact you?',
    answer:
      'WhatsApp is fastest — we usually reply within an hour during opening hours. You can also email support@footballtrix.com or use the contact form, and we will get back to you within one working day.',
  },
  {
    group: 'Returns & Support',
    question: 'Is my payment information safe with you?',
    answer:
      'We never ask for or store card details, PINs or passwords. Checkout is cash on delivery only, so there is no payment data to steal in the first place.',
  },
]

/** The six highest-value questions, used on the homepage. */
const HOMEPAGE_QUESTIONS = [0, 1, 2, 3, 8, 6]

export function FaqSection({ title = 'Questions, answered', light = false }) {
  const [open, setOpen] = useState(HOMEPAGE_QUESTIONS[0])
  const items = HOMEPAGE_QUESTIONS.map((i) => FAQ_ITEMS[i])

  return (
    <section className="section">
      <div className="container-x">
        <div className="grid gap-10 lg:grid-cols-[0.75fr_1.25fr] lg:gap-16">
          <div>
            <SectionHeading
              eyebrow="Good to know"
              title={title}
              lede="The things people ask us most. If your question is not here, message us and we will answer properly."
            />
            <Link
              to="/faq"
              className="inline-flex items-center gap-2 text-sm font-semibold text-ink-950 underline decoration-lime-dark decoration-2 underline-offset-4 transition-colors hover:text-lime-dark focus-ring rounded"
            >
              See all questions
              <Icon name="arrowRight" size={15} />
            </Link>
          </div>

          <div className={`divide-y ${light ? 'divide-white/10' : 'divide-ink-200/70'}`}>
            {items.map((item) => {
              const isOpen = open === item.question
              return (
                <div key={item.question}>
                  <h3>
                    <button
                      type="button"
                      onClick={() => setOpen(isOpen ? null : item.question)}
                      aria-expanded={isOpen}
                      className="group flex w-full items-start justify-between gap-5 py-5 text-left focus-ring rounded"
                    >
                      <span
                        className={`font-display text-lg font-bold leading-snug transition-colors sm:text-xl ${
                          light ? 'text-white group-hover:text-lime-accent' : 'text-ink-950'
                        }`}
                      >
                        {item.question}
                      </span>
                      <span
                        className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-all duration-300 ${
                          light ? 'bg-white/10 text-white' : 'bg-ink-100 text-ink-900'
                        } ${isOpen ? 'rotate-180' : ''}`}
                      >
                        <Icon name="chevronDown" size={15} />
                      </span>
                    </button>
                  </h3>

                  <div
                    className={`grid transition-all duration-300 ease-out ${
                      isOpen ? 'grid-rows-[1fr] pb-5' : 'grid-rows-[0fr]'
                    }`}
                  >
                    <div className="overflow-hidden">
                      <p
                        className={`pr-10 text-sm leading-relaxed ${
                          light ? 'text-white/65' : 'text-ink-600/95'
                        }`}
                      >
                        {item.answer}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
