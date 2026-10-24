import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import Icon from '../components/ui/Icon'
import ImagePicker from './components/ImagePicker'
import { ErrorState, LoadingState, PageHeader, Toast } from './components/Page'
import { adminCategories, adminCollections, adminProducts } from '../lib/adminApi'
import { formatPrice } from '../lib/format'

const KINDS = [
  { value: 'club', label: 'Club' },
  { value: 'international', label: 'International' },
  { value: 'retro', label: 'Retro' },
  { value: 'training', label: 'Training' },
  { value: 'third_kit', label: 'Third kit' },
]

const STATUSES = [
  { value: 'draft', label: 'Draft' },
  { value: 'active', label: 'Active' },
  { value: 'archived', label: 'Archived' },
  { value: 'out_of_stock', label: 'Out of stock' },
]

const SIZES = ['S', 'M', 'L', 'XL', 'XXL', 'Kids']

const EMPTY_FORM = {
  name: '', sku: '', brand: 'FootballTrix', team_name: '', player_name: '',
  edition: '', season: '', gender: 'unisex', kind: 'club',
  category_id: '', subcategory_id: '', collection_id: '',
  base_price: '', sale_price: '', cost_price: '', custom_price: 0,
  enable_custom_name: false, enable_custom_number: false,
  low_stock_threshold: 5,
  short_description: '', description: '', features: '', tags: '',
  thumbnail_url: '', images: [],
  material: '100% Polyester', fit_type: 'Regular Fit',
  sleeve_type: 'Half Sleeve', collar_type: 'V-Neck',
  primary_color: '#111827', secondary_color: '#F8FAFC', jersey_number: '',
  is_active: true, status: 'active',
  is_featured: false, is_best_seller: false, is_new_arrival: false,
  seo_title: '', seo_meta: '',
}

const EMPTY_VARIANT = {
  size: 'M', color_name: 'Default', color_hex: '#111827',
  sku: '', price_override: '', stock: 0, position: 0, is_active: true,
}

function Section({ title, hint, children }) {
  return (
    <section className="adm-card adm-card-pad">
      <h2 className="adm-card-title">{title}</h2>
      {hint && <p className="mt-1.5 text-xs leading-relaxed text-ink-500 dark:text-ink-400">{hint}</p>}
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  )
}

function Row({ children, cols = 2 }) {
  return <div className={`grid gap-4 ${cols === 3 ? 'sm:grid-cols-3' : 'sm:grid-cols-2'}`}>{children}</div>
}

/**
 * Product editor — used for both `/admin/products/new` and `…/:id/edit`.
 *
 * Variants are diffed on save rather than replaced wholesale: rows that gained
 * an `id` are updated, rows without one are inserted, and rows removed from the
 * list are deleted. Deleting a variant only nulls `order_items.variant_id`, so
 * past orders keep their line-item snapshot.
 */
export default function AdminProductForm() {
  const { id } = useParams()
  const isNew = !id
  const navigate = useNavigate()

  const [form, setForm] = useState(EMPTY_FORM)
  const [variants, setVariants] = useState([])
  const [originalVariantIds, setOriginalVariantIds] = useState(new Set())
  const [categories, setCategories] = useState([])
  const [collections, setCollections] = useState([])
  const [loading, setLoading] = useState(!isNew)
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)
  const [toast, setToast] = useState(null)
  const [savedProduct, setSavedProduct] = useState(null)

  const set = useCallback((key, value) => setForm((f) => ({ ...f, [key]: value })), [])

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)

    const [cats, cols] = await Promise.all([adminCategories.list(), adminCollections.list()])
    if (cats.error) {
      setError(cats.error)
      setLoading(false)
      return
    }
    setCategories(cats.data)
    setCollections(cols.data ?? [])

    if (isNew) {
      setLoading(false)
      return
    }

    const result = await adminProducts.byId(id)
    const product = result.data

    if (!product) {
      setError(result.error ?? { message: 'That product could not be found — it may have been deleted.' })
      setLoading(false)
      return
    }

    setSavedProduct(product)
    setForm({
      ...EMPTY_FORM,
      ...Object.fromEntries(Object.keys(EMPTY_FORM).map((key) => [key, product[key] ?? EMPTY_FORM[key]])),
      features: (product.features ?? []).join('\n'),
      tags: (product.tags ?? []).join(', '),
      images: product.images ?? [],
      base_price: product.base_price ?? '',
      sale_price: product.sale_price ?? '',
      cost_price: product.cost_price ?? '',
      category_id: product.category_id ?? '',
      subcategory_id: product.subcategory_id ?? '',
      collection_id: product.collection_id ?? '',
    })

    const rows = (product.product_variants ?? []).map((v) => ({
      ...v,
      price_override: v.price_override ?? '',
    }))
    setVariants(rows)
    setOriginalVariantIds(new Set(rows.map((v) => v.id).filter(Boolean)))
    setLoading(false)
  }, [id, isNew])

  useEffect(() => {
    document.title = isNew ? 'New product — FootballTrix Admin' : 'Edit product — FootballTrix Admin'
    load()
  }, [load, isNew])

  const subcategories = useMemo(
    () => categories.filter((c) => c.parent_id === form.category_id),
    [categories, form.category_id],
  )

  // Live price preview so the admin can see the storefront price while typing.
  const effectivePrice = form.sale_price !== '' && form.sale_price != null
    ? Number(form.sale_price)
    : Number(form.base_price || 0)

  async function submit(publish) {
    if (!form.name.trim()) {
      setToast({ tone: 'error', text: 'Give the product a name first.' })
      return
    }
    if (!form.base_price || Number(form.base_price) < 0) {
      setToast({ tone: 'error', text: 'A base price of zero or more is required.' })
      return
    }
    if (form.sale_price !== '' && Number(form.sale_price) > Number(form.base_price)) {
      setToast({ tone: 'error', text: 'The sale price cannot be higher than the base price.' })
      return
    }

    const incomplete = variants.find(
      (v) => !String(v.size ?? '').trim() || !String(v.color_name ?? '').trim(),
    )
    if (incomplete) {
      setToast({ tone: 'error', text: 'Every variant needs both a size and a colour name.' })
      return
    }

    setBusy(true)

    const payload = {
      ...(isNew ? {} : { id }),
      name: form.name.trim(),
      sku: form.sku.trim() || null,
      brand: form.brand.trim() || null,
      team_name: form.team_name.trim() || null,
      player_name: form.player_name.trim() || null,
      edition: form.edition.trim() || null,
      season: form.season.trim() || null,
      gender: form.gender,
      kind: form.kind,
      category_id: form.category_id || null,
      subcategory_id: form.subcategory_id || null,
      collection_id: form.collection_id || null,
      base_price: Number(form.base_price),
      sale_price: form.sale_price === '' ? null : Number(form.sale_price),
      cost_price: form.cost_price === '' ? null : Number(form.cost_price),
      custom_price: Number(form.custom_price) || 0,
      enable_custom_name: form.enable_custom_name,
      enable_custom_number: form.enable_custom_number,
      low_stock_threshold: Number(form.low_stock_threshold) || 0,
      short_description: form.short_description.trim() || null,
      description: form.description.trim() || null,
      features: form.features.split('\n').map((s) => s.trim()).filter(Boolean),
      tags: form.tags.split(',').map((s) => s.trim()).filter(Boolean),
      thumbnail_url: form.thumbnail_url || null,
      images: form.images.filter(Boolean),
      material: form.material || null,
      fit_type: form.fit_type || null,
      sleeve_type: form.sleeve_type || null,
      collar_type: form.collar_type || null,
      primary_color: form.primary_color,
      secondary_color: form.secondary_color,
      jersey_number: form.jersey_number.trim() || null,
      is_active: publish ?? form.is_active,
      status: publish === true ? 'active' : form.status,
      is_featured: form.is_featured,
      is_best_seller: form.is_best_seller,
      is_new_arrival: form.is_new_arrival,
      seo_title: form.seo_title.trim() || null,
      seo_meta: form.seo_meta.trim() || null,
    }

    const saved = await adminProducts.save(payload)
    if (saved.error) {
      setBusy(false)
      setToast({
        tone: 'error',
        text: saved.error.code === '23505'
          ? 'Another product already uses that URL slug.'
          : saved.error.message,
      })
      return
    }

    const productId = saved.data.id

    // ---- variants: update existing, insert new, delete removed ------------
    for (const variant of variants) {
      const body = {
        product_id: productId,
        size: String(variant.size).trim(),
        color_name: String(variant.color_name).trim(),
        color_hex: variant.color_hex || null,
        sku: variant.sku?.trim() || null,
        price_override: variant.price_override === '' ? null : Number(variant.price_override),
        stock: Math.max(0, Number(variant.stock) || 0),
        position: Number(variant.position) || 0,
        is_active: variant.is_active ?? true,
      }
      const result = await adminProducts.saveVariant(variant.id ? { id: variant.id, ...body } : body)
      if (result.error) {
        setBusy(false)
        setToast({ tone: 'error', text: `Variant ${body.size}/${body.color_name}: ${result.error.message}` })
        return
      }
    }

    for (const removedId of originalVariantIds) {
      if (!variants.some((v) => v.id === removedId)) {
        await adminProducts.removeVariant(removedId)
      }
    }

    setBusy(false)
    setSavedProduct(saved.data)
    setOriginalVariantIds(new Set(variants.map((v) => v.id).filter(Boolean)))
    setToast({
      tone: 'ok',
      text: isNew
        ? `“${payload.name}” created${payload.is_active ? ' and published' : ' as a draft'}.`
        : `“${payload.name}” saved.`,
    })

    if (isNew) {
      navigate(`/admin/products/${productId}/edit`, { replace: true })
    }
  }

  if (loading) return <LoadingState label="Loading product…" />
  if (error) return <ErrorState error={error} onRetry={load} />

  return (
    <>
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <Link to="/admin/products" className="adm-btn-outline">
          <Icon name="arrowLeft" size={16} />
          All products
        </Link>
        {!isNew && savedProduct && (
          <Link to={`/`} className="adm-btn-outline">
            <Icon name="external" size={16} />
            View in shop
          </Link>
        )}
      </div>

      <Toast tone={toast?.tone} onDismiss={() => setToast(null)}>{toast?.text}</Toast>

      <PageHeader
        title={isNew ? 'New product' : form.name || 'Edit product'}
        lede={isNew
          ? 'Fill in the details below. The product starts as a draft until you publish it.'
          : 'Changes apply to the storefront as soon as you save.'}
        actions={
          <>
            <button
              type="button"
              onClick={() => submit(false)}
              disabled={busy}
              className="adm-btn-outline"
            >
              <Icon name="doc" size={16} />
              {busy ? 'Saving…' : 'Save draft'}
            </button>
            <button
              type="button"
              onClick={() => submit(true)}
              disabled={busy}
              className="adm-btn-dark"
            >
              <Icon name="check" size={16} />
              {busy ? 'Saving…' : 'Save & publish'}
            </button>
          </>
        }
      />

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          {/* ------------------------------------------------------ basics */}
          <Section title="Basics">
            <div>
              <label className="adm-label" htmlFor="pf-name">Product name *</label>
              <input
                id="pf-name"
                className="adm-input"
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
                placeholder="Home Jersey 2024/25"
                required
              />
              {!isNew && (
                <p className="mt-1.5 text-xs text-ink-500 dark:text-ink-400">
                  The URL slug is kept unchanged when you rename, so existing links keep working.
                </p>
              )}
            </div>

            <Row cols={3}>
              <div>
                <label className="adm-label" htmlFor="pf-sku">SKU</label>
                <input id="pf-sku" className="adm-input font-mono" value={form.sku} onChange={(e) => set('sku', e.target.value)} placeholder="FTX-HOME-25" />
              </div>
              <div>
                <label className="adm-label" htmlFor="pf-brand">Brand</label>
                <input id="pf-brand" className="adm-input" value={form.brand} onChange={(e) => set('brand', e.target.value)} />
              </div>
              <div>
                <label className="adm-label" htmlFor="pf-team">Team</label>
                <input id="pf-team" className="adm-input" value={form.team_name} onChange={(e) => set('team_name', e.target.value)} placeholder="Manchester City" />
              </div>
            </Row>

            <Row cols={3}>
              <div>
                <label className="adm-label" htmlFor="pf-kind">Kind</label>
                <select id="pf-kind" className="adm-select" value={form.kind} onChange={(e) => set('kind', e.target.value)}>
                  {KINDS.map((k) => <option key={k.value} value={k.value}>{k.label}</option>)}
                </select>
              </div>
              <div>
                <label className="adm-label" htmlFor="pf-gender">Gender</label>
                <select id="pf-gender" className="adm-select" value={form.gender} onChange={(e) => set('gender', e.target.value)}>
                  <option value="unisex">Unisex</option>
                  <option value="men">Men</option>
                  <option value="women">Women</option>
                  <option value="kids">Kids</option>
                </select>
              </div>
              <div>
                <label className="adm-label" htmlFor="pf-season">Season</label>
                <input id="pf-season" className="adm-input" value={form.season} onChange={(e) => set('season', e.target.value)} placeholder="2024/25" />
              </div>
            </Row>

            <Row>
              <div>
                <label className="adm-label" htmlFor="pf-player">Player name</label>
                <input id="pf-player" className="adm-input" value={form.player_name} onChange={(e) => set('player_name', e.target.value)} placeholder="Optional" />
              </div>
              <div>
                <label className="adm-label" htmlFor="pf-edition">Edition</label>
                <input id="pf-edition" className="adm-input" value={form.edition} onChange={(e) => set('edition', e.target.value)} placeholder="Player issue / Replica" />
              </div>
            </Row>

            <Row>
              <div>
                <label className="adm-label" htmlFor="pf-category">Category</label>
                <select
                  id="pf-category"
                  className="adm-select"
                  value={form.category_id}
                  onChange={(e) => setForm((f) => ({ ...f, category_id: e.target.value, subcategory_id: '' }))}
                >
                  <option value="">Uncategorised</option>
                  {categories.filter((c) => !c.parent_id).map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="adm-label" htmlFor="pf-subcategory">Subcategory</label>
                <select
                  id="pf-subcategory"
                  className="adm-select"
                  value={form.subcategory_id}
                  disabled={!form.category_id || subcategories.length === 0}
                  onChange={(e) => set('subcategory_id', e.target.value)}
                >
                  <option value="">None</option>
                  {subcategories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </Row>

            <div>
              <label className="adm-label" htmlFor="pf-collection">Collection</label>
              <select id="pf-collection" className="adm-select" value={form.collection_id} onChange={(e) => set('collection_id', e.target.value)}>
                <option value="">None</option>
                {collections.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </Section>

          {/* ------------------------------------------------------ pricing */}
          <Section title="Pricing" hint="The storefront shows the sale price when one is set, struck through against the base price.">
            <Row cols={3}>
              <div>
                <label className="adm-label" htmlFor="pf-base">Base price (৳) *</label>
                <input id="pf-base" type="number" min="0" className="adm-input tabular-nums" value={form.base_price} onChange={(e) => set('base_price', e.target.value)} required />
              </div>
              <div>
                <label className="adm-label" htmlFor="pf-sale">Sale price (৳)</label>
                <input id="pf-sale" type="number" min="0" className="adm-input tabular-nums" value={form.sale_price} onChange={(e) => set('sale_price', e.target.value)} placeholder="Leave blank for none" />
              </div>
              <div>
                <label className="adm-label" htmlFor="pf-cost">Cost price (৳)</label>
                <input id="pf-cost" type="number" min="0" className="adm-input tabular-nums" value={form.cost_price} onChange={(e) => set('cost_price', e.target.value)} placeholder="Internal only" />
                <p className="mt-1.5 text-xs text-ink-500 dark:text-ink-400">Never shown to customers.</p>
              </div>
            </Row>

            <Row>
              <div className="rounded-xl bg-ink-50 px-4 py-3 dark:bg-ink-800/60">
                <p className="adm-muted">Storefront price</p>
                <p className="mt-1 font-display text-2xl font-extrabold text-ink-950 dark:text-white">
                  {formatPrice(effectivePrice || 0)}
                </p>
              </div>
              <div>
                <label className="adm-label" htmlFor="pf-custom">Custom print price (৳)</label>
                <input id="pf-custom" type="number" min="0" className="adm-input tabular-nums" value={form.custom_price} onChange={(e) => set('custom_price', e.target.value)} />
              </div>
            </Row>

            <Row>
              <Toggle label="Allow custom name" checked={form.enable_custom_name} onChange={(v) => set('enable_custom_name', v)} />
              <Toggle label="Allow custom number" checked={form.enable_custom_number} onChange={(v) => set('enable_custom_number', v)} />
            </Row>

            <div className="max-w-[16rem]">
              <label className="adm-label" htmlFor="pf-threshold">Low stock threshold</label>
              <input id="pf-threshold" type="number" min="0" className="adm-input tabular-nums" value={form.low_stock_threshold} onChange={(e) => set('low_stock_threshold', e.target.value)} />
              <p className="mt-1.5 text-xs text-ink-500 dark:text-ink-400">
                Variants at or below this count raise a low-stock alert.
              </p>
            </div>
          </Section>

          {/* ------------------------------------------------- description */}
          <Section title="Description">
            <div>
              <label className="adm-label" htmlFor="pf-short">Short description</label>
              <textarea id="pf-short" className="adm-textarea" value={form.short_description} onChange={(e) => set('short_description', e.target.value)} placeholder="One line shown on product cards." />
            </div>
            <div>
              <label className="adm-label" htmlFor="pf-long">Full description</label>
              <textarea id="pf-long" className="adm-textarea min-h-40" value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="Fabric, fit, care instructions…" />
            </div>
            <Row>
              <div>
                <label className="adm-label" htmlFor="pf-features">Features</label>
                <textarea id="pf-features" className="adm-textarea" value={form.features} onChange={(e) => set('features', e.target.value)} placeholder={'Breathable mesh\nHeat-pressed crest'} />
                <p className="mt-1.5 text-xs text-ink-500 dark:text-ink-400">One per line.</p>
              </div>
              <div>
                <label className="adm-label" htmlFor="pf-tags">Tags</label>
                <textarea id="pf-tags" className="adm-textarea" value={form.tags} onChange={(e) => set('tags', e.target.value)} placeholder="home, premier-league, 2025" />
                <p className="mt-1.5 text-xs text-ink-500 dark:text-ink-400">Comma separated — used by search and filters.</p>
              </div>
            </Row>
          </Section>

          {/* ------------------------------------------------------- media */}
          <Section title="Media" hint="The thumbnail is what the shop grid shows; extra images appear in the gallery.">
            <ImagePicker
              label="Thumbnail"
              bucket="product-images"
              value={form.thumbnail_url}
              onChange={(url) => set('thumbnail_url', url)}
              aspect="aspect-square"
            />

            <div>
              <label className="adm-label">Gallery images</label>
              <ul className="space-y-2">
                {form.images.map((url, index) => (
                  <li key={`${url}-${index}`} className="flex items-center gap-2">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-ink-100 dark:bg-ink-800">
                      <img src={url} alt="" className="h-full w-full object-cover" />
                    </span>
                    <input
                      className="adm-input flex-1 font-mono text-xs"
                      value={url}
                      aria-label={`Gallery image ${index + 1}`}
                      onChange={(e) => set('images', form.images.map((u, i) => (i === index ? e.target.value : u)))}
                    />
                    <button
                      type="button"
                      aria-label={`Remove image ${index + 1}`}
                      onClick={() => set('images', form.images.filter((_, i) => i !== index))}
                      className="adm-icon-btn text-rose-600 dark:text-rose-400"
                    >
                      <Icon name="trash" size={16} />
                    </button>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={() => set('images', [...form.images, ''])}
                className="adm-btn-outline mt-3 !px-3 !py-2 !text-xs"
              >
                <Icon name="plus" size={14} />
                Add image row
              </button>
            </div>
          </Section>

          {/* --------------------------------------------------- variants */}
          <Section
            title="Variants"
            hint="One row per size and colour combination. Stock here drives the storefront's buy button."
          >
            {variants.length === 0 && (
              <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm leading-relaxed text-amber-900 dark:bg-amber-500/10 dark:text-amber-200">
                No variants yet — a product without any cannot be bought. Add at least one row.
              </p>
            )}

            <div className="space-y-3">
              {variants.map((variant, index) => (
                <div key={variant.id ?? `new-${index}`} className="rounded-xl border border-ink-200 p-3.5 dark:border-ink-800">
                  <div className="grid gap-3 sm:grid-cols-6">
                    <div>
                      <label className="adm-label" htmlFor={`v-size-${index}`}>Size</label>
                      <input
                        id={`v-size-${index}`}
                        className="adm-input"
                        list="variant-sizes"
                        value={variant.size}
                        onChange={(e) => setVariants((v) => v.map((row, i) => (i === index ? { ...row, size: e.target.value } : row)))}
                      />
                      <datalist id="variant-sizes">
                        {SIZES.map((s) => <option key={s} value={s} />)}
                      </datalist>
                    </div>
                    <div>
                      <label className="adm-label" htmlFor={`v-color-${index}`}>Colour</label>
                      <input
                        id={`v-color-${index}`}
                        className="adm-input"
                        value={variant.color_name}
                        onChange={(e) => setVariants((v) => v.map((row, i) => (i === index ? { ...row, color_name: e.target.value } : row)))}
                      />
                    </div>
                    <div>
                      <label className="adm-label" htmlFor={`v-hex-${index}`}>Swatch</label>
                      <input
                        id={`v-hex-${index}`}
                        type="color"
                        className="adm-input h-[2.625rem] cursor-pointer !p-1.5"
                        value={variant.color_hex ?? '#111827'}
                        onChange={(e) => setVariants((v) => v.map((row, i) => (i === index ? { ...row, color_hex: e.target.value } : row)))}
                      />
                    </div>
                    <div>
                      <label className="adm-label" htmlFor={`v-stock-${index}`}>Stock</label>
                      <input
                        id={`v-stock-${index}`}
                        type="number"
                        min="0"
                        className="adm-input tabular-nums"
                        value={variant.stock}
                        onChange={(e) => setVariants((v) => v.map((row, i) => (i === index ? { ...row, stock: e.target.value } : row)))}
                      />
                    </div>
                    <div>
                      <label className="adm-label" htmlFor={`v-price-${index}`}>Price override</label>
                      <input
                        id={`v-price-${index}`}
                        type="number"
                        min="0"
                        className="adm-input tabular-nums"
                        value={variant.price_override}
                        placeholder="—"
                        onChange={(e) => setVariants((v) => v.map((row, i) => (i === index ? { ...row, price_override: e.target.value } : row)))}
                      />
                    </div>
                    <div className="flex items-end">
                      <button
                        type="button"
                        aria-label="Remove variant"
                        onClick={() => setVariants((v) => v.filter((_, i) => i !== index))}
                        className="adm-icon-btn w-full text-rose-600 dark:text-rose-400"
                      >
                        <Icon name="trash" size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setVariants((v) => [...v, { ...EMPTY_VARIANT, position: v.length }])}
              className="adm-btn-outline"
            >
              <Icon name="plus" size={16} />
              Add variant
            </button>
          </Section>

          {/* --------------------------------------------------- details */}
          <Section title="Product details">
            <Row>
              <div>
                <label className="adm-label" htmlFor="pf-material">Material</label>
                <input id="pf-material" className="adm-input" value={form.material} onChange={(e) => set('material', e.target.value)} />
              </div>
              <div>
                <label className="adm-label" htmlFor="pf-fit">Fit type</label>
                <input id="pf-fit" className="adm-input" value={form.fit_type} onChange={(e) => set('fit_type', e.target.value)} />
              </div>
              <div>
                <label className="adm-label" htmlFor="pf-sleeve">Sleeve</label>
                <input id="pf-sleeve" className="adm-input" value={form.sleeve_type} onChange={(e) => set('sleeve_type', e.target.value)} />
              </div>
              <div>
                <label className="adm-label" htmlFor="pf-collar">Collar</label>
                <input id="pf-collar" className="adm-input" value={form.collar_type} onChange={(e) => set('collar_type', e.target.value)} />
              </div>
            </Row>

            <Row>
              <div>
                <label className="adm-label" htmlFor="pf-primary">Primary colour</label>
                <input id="pf-primary" type="color" className="adm-input h-[2.625rem] cursor-pointer !p-1.5" value={form.primary_color} onChange={(e) => set('primary_color', e.target.value)} />
              </div>
              <div>
                <label className="adm-label" htmlFor="pf-secondary">Secondary colour</label>
                <input id="pf-secondary" type="color" className="adm-input h-[2.625rem] cursor-pointer !p-1.5" value={form.secondary_color} onChange={(e) => set('secondary_color', e.target.value)} />
              </div>
            </Row>
          </Section>

          {/* -------------------------------------------------------- SEO */}
          <Section title="SEO" hint="Left blank, the storefront falls back to the product name and short description.">
            <div>
              <label className="adm-label" htmlFor="pf-seo-title">SEO title</label>
              <input id="pf-seo-title" className="adm-input" value={form.seo_title} onChange={(e) => set('seo_title', e.target.value)} placeholder="Around 60 characters" />
            </div>
            <div>
              <label className="adm-label" htmlFor="pf-seo-meta">Meta description</label>
              <textarea id="pf-seo-meta" className="adm-textarea" value={form.seo_meta} onChange={(e) => set('seo_meta', e.target.value)} placeholder="Around 155 characters" />
            </div>
          </Section>
        </div>

        {/* -------------------------------------------------------- sidebar */}
        <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
          <section className="adm-card adm-card-pad">
            <h2 className="adm-card-title">Publishing</h2>

            <div className="mt-4 space-y-4">
              <div>
                <label className="adm-label" htmlFor="pf-status">Status</label>
                <select id="pf-status" className="adm-select" value={form.status} onChange={(e) => { set('status', e.target.value); if (e.target.value === 'active') set('is_active', true) }}>
                  {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>

              <Toggle label="Visible in the shop" checked={form.is_active} onChange={(v) => set('is_active', v)} />
              <Toggle label="Featured" checked={form.is_featured} onChange={(v) => set('is_featured', v)} />
              <Toggle label="Best seller" checked={form.is_best_seller} onChange={(v) => set('is_best_seller', v)} />
              <Toggle label="New arrival" checked={form.is_new_arrival} onChange={(v) => set('is_new_arrival', v)} />
            </div>
          </section>

          <section className="adm-card adm-card-pad">
            <h2 className="adm-card-title">Summary</h2>
            <dl className="mt-3 space-y-2.5 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="adm-muted">Variants</dt>
                <dd className="font-semibold tabular-nums text-ink-900 dark:text-white">{variants.length}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="adm-muted">Total stock</dt>
                <dd className="font-semibold tabular-nums text-ink-900 dark:text-white">
                  {variants.reduce((sum, v) => sum + Math.max(0, Number(v.stock) || 0), 0)}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="adm-muted">Gallery</dt>
                <dd className="font-semibold tabular-nums text-ink-900 dark:text-white">
                  {form.images.filter(Boolean).length}
                </dd>
              </div>
              {savedProduct?.sold_count > 0 && (
                <div className="flex justify-between gap-3">
                  <dt className="adm-muted">Sold</dt>
                  <dd className="font-semibold tabular-nums text-ink-900 dark:text-white">{savedProduct.sold_count}</dd>
                </div>
              )}
            </dl>
          </section>

          <div className="space-y-2.5">
            <button type="button" onClick={() => submit(false)} disabled={busy} className="adm-btn-outline w-full">
              <Icon name="doc" size={16} />
              {busy ? 'Saving…' : 'Save draft'}
            </button>
            <button type="button" onClick={() => submit(true)} disabled={busy} className="adm-btn-dark w-full">
              <Icon name="check" size={16} />
              {busy ? 'Saving…' : 'Save & publish'}
            </button>
          </div>
        </aside>
      </div>
    </>
  )
}

function Toggle({ label, checked, onChange }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-ink-200 px-3.5 py-2.5 dark:border-ink-800">
      <span className="text-sm font-semibold text-ink-800 dark:text-ink-200">{label}</span>
      <span className="relative inline-flex shrink-0">
        <input
          type="checkbox"
          className="peer sr-only"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span className="block h-6 w-11 rounded-full bg-ink-200 transition-colors peer-checked:bg-lime-accent dark:bg-ink-700" />
        <span className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform peer-checked:translate-x-5" />
      </span>
    </label>
  )
}
