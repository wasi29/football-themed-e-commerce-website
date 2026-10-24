import { useState } from 'react'
import Icon from '../components/ui/Icon'
import { PageHeader } from '../components/ui/PageHeader'
import { messages } from '../lib/api'
import { SITE } from '../lib/config'
import { useToast } from '../contexts/ToastContext'
import { whatsappLink } from '../lib/format'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

const CHANNELS = [
  {
    icon: 'whatsapp',
    title: 'WhatsApp',
    value: SITE.contact.phone,
    body: 'Fastest. Usually answered within an hour during opening times.',
    href: whatsappLink(SITE.contact.whatsapp, 'Hi FootballTrix, I have a question.'),
    cta: 'Open WhatsApp',
    external: true,
    accent: 'text-pitch',
  },
  {
    icon: 'mail',
    title: 'Email',
    value: SITE.contact.email,
    body: 'Good for bulk quotes, design files and anything with attachments.',
    href: `mailto:${SITE.contact.email}`,
    cta: 'Send an email',
    external: true,
    accent: 'text-lime-dark',
  },
  {
    icon: 'phone',
    title: 'Phone',
    value: SITE.contact.phone,
    body: SITE.contact.hours,
    href: `tel:${SITE.contact.phone.replace(/\s/g, '')}`,
    cta: 'Call us',
    external: true,
    accent: 'text-ink-800',
  },
]

export default function Contact() {
  const [form, setForm] = useState({
    name: '', email: '', phone: '', subject: '', message: '',
  })
  const [errors, setErrors] = useState({})
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState(false)
  const toast = useToast()

  const set = (key) => (e) => {
    setForm((prev) => ({ ...prev, [key]: e.target.value }))
    setErrors((prev) => ({ ...prev, [key]: undefined }))
  }

  const submit = async (e) => {
    e.preventDefault()
    const next = {}
    if (form.name.trim().length < 2) next.name = 'Please enter your name.'
    if (!EMAIL_RE.test(form.email)) next.email = 'Enter a valid email address.'
    if (form.message.trim().length < 15) next.message = 'Tell us a little more — at least a sentence.'
    setErrors(next)
    if (Object.keys(next).length) return

    setBusy(true)
    const { error } = await messages.send({
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim() || null,
      subject: form.subject.trim() || null,
      message: form.message.trim(),
    })
    setBusy(false)

    if (error) { toast.error(error.message); return }
    setSent(true)
    toast.success('Message sent. We reply within one working day.')
  }

  return (
    <>
      <PageHeader
        eyebrow="We are listening"
        title="Contact us"
        lede="Questions about sizing, an order in transit, or a bulk quote? Reach us whichever way suits you."
        breadcrumbs={[{ label: 'Contact' }]}
      />

      <div className="container-x py-12 sm:py-16">
        <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-14">
          {/* ---- channels ---- */}
          <div>
            <h2 className="heading-md mb-6 text-xl">Talk to us directly</h2>
            <div className="space-y-4">
              {CHANNELS.map((c) => (
                <a
                  key={c.title}
                  href={c.href}
                  target={c.external ? '_blank' : undefined}
                  rel={c.external ? 'noopener noreferrer' : undefined}
                  className="group flex items-start gap-4 rounded-2xl border border-ink-200/80 p-5 transition-all duration-300 hover:border-ink-950 hover:shadow-lift focus-ring"
                >
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-ink-950 text-lime-accent transition-transform duration-300 group-hover:scale-110">
                    <Icon name={c.icon} size={20} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-bold text-ink-950">{c.title}</span>
                    <span className="mt-0.5 block break-words text-sm font-semibold text-ink-800">
                      {c.value}
                    </span>
                    <span className="mt-1 block text-xs leading-relaxed text-ink-600/85">{c.body}</span>
                  </span>
                  <Icon
                    name="arrowRight"
                    size={17}
                    className="mt-1 shrink-0 text-ink-600/50 transition-transform group-hover:translate-x-1"
                  />
                </a>
              ))}
            </div>

            <div className="mt-6 rounded-2xl bg-ink-950 p-6 text-white">
              <h3 className="heading-md text-lg text-white">Visit the shop</h3>
              <address className="mt-3 space-y-2 text-sm not-italic text-white/70">
                <p className="flex gap-3">
                  <Icon name="pin" size={17} className="mt-0.5 shrink-0 text-lime-accent" />
                  {SITE.contact.address}
                </p>
                <p className="flex gap-3">
                  <Icon name="clock" size={17} className="mt-0.5 shrink-0 text-lime-accent" />
                  {SITE.contact.hours}
                </p>
              </address>
              <p className="mt-4 border-t border-white/10 pt-4 text-xs text-white/50">
                Walk-ins welcome. We are closed Friday, as is standard here.
              </p>
            </div>
          </div>

          {/* ---- form ---- */}
          <div>
            <h2 className="heading-md mb-6 text-xl">Send us a message</h2>

            {sent ? (
              <div className="rounded-3xl border border-emerald-300 bg-emerald-50 p-10 text-center">
                <span className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-pitch text-white">
                  <Icon name="check" size={30} strokeWidth={2.5} />
                </span>
                <h3 className="heading-md text-xl text-emerald-900">Message sent</h3>
                <p className="mx-auto mt-2.5 max-w-sm text-sm leading-relaxed text-emerald-900/80">
                  Thanks {form.name.split(' ')[0]} — we have your message and will reply within
                  one working day. For anything urgent, WhatsApp is faster.
                </p>
                <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
                  <a
                    href={whatsappLink(SITE.contact.whatsapp, 'Hi FootballTrix, I just sent a message.')}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary"
                  >
                    <Icon name="whatsapp" size={17} />
                    Follow up on WhatsApp
                  </a>
                  <button type="button" onClick={() => setSent(false)} className="btn-ghost">
                    Send another
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={submit} noValidate className="space-y-5">
                <div className="grid gap-5 sm:grid-cols-2">
                  <FormField
                    id="c-name" label="Your name" value={form.name} onChange={set('name')}
                    error={errors.name} autoComplete="name" placeholder="Rakib Hasan"
                  />
                  <FormField
                    id="c-phone" label="Mobile number (optional)" type="tel" inputMode="tel"
                    value={form.phone} onChange={set('phone')} autoComplete="tel" placeholder="01712345678"
                  />
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <FormField
                    id="c-email" label="Email address" type="email" value={form.email}
                    onChange={set('email')} error={errors.email} autoComplete="email"
                    placeholder="you@example.com"
                  />
                  <div>
                    <label htmlFor="c-subject" className="label">Subject</label>
                    <select
                      id="c-subject" value={form.subject} onChange={set('subject')} className="field"
                    >
                      <option value="">What is this about?</option>
                      <option>Order status</option>
                      <option>Sizing or fit question</option>
                      <option>Exchange or return</option>
                      <option>Custom or bulk order</option>
                      <option>Something else</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="c-message" className="label">
                    Message <span className="text-flame">*</span>
                  </label>
                  <textarea
                    id="c-message" value={form.message} onChange={set('message')}
                    rows={6} maxLength={1200}
                    placeholder="Tell us what you need. If it is about an order, include your order number."
                    className={`field resize-none ${errors.message ? 'field-error' : ''}`}
                    aria-invalid={Boolean(errors.message)}
                  />
                  <div className="mt-1.5 flex items-center justify-between">
                    {errors.message ? (
                      <p className="flex items-center gap-1.5 text-xs font-medium text-flame">
                        <Icon name="alert" size={13} />
                        {errors.message}
                      </p>
                    ) : (
                      <span />
                    )}
                    <span className="text-xs tabular-nums text-ink-600/70">
                      {form.message.length}/1200
                    </span>
                  </div>
                </div>

                <button type="submit" disabled={busy} className="btn-dark w-full sm:w-auto">
                  {busy ? 'Sending…' : 'Send message'}
                  {!busy && <Icon name="arrowRight" size={17} />}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

function FormField({ id, label, error, ...rest }) {
  return (
    <div>
      <label htmlFor={id} className="label">{label}</label>
      <input
        id={id} className={`field ${error ? 'field-error' : ''}`}
        aria-invalid={Boolean(error)} {...rest}
      />
      {error && (
        <p className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-flame">
          <Icon name="alert" size={13} />
          {error}
        </p>
      )}
    </div>
  )
}
