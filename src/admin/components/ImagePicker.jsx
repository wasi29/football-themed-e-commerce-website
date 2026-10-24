import { useRef, useState } from 'react'
import Icon from '../../components/ui/Icon'
import { adminStorage } from '../../lib/adminApi'

/**
 * Image field with a real upload.
 *
 * The file goes to Supabase Storage under a namespaced bucket, and only the
 * resulting public URL is written to the row — so the database never holds a
 * blob and an image can be swapped without touching the data that references it.
 *
 * Cap at 4 MB: everything this panel uploads is a display asset, and a file
 * larger than that is almost always an accidental RAW/HEIC drop.
 */
export default function ImagePicker({
  label,
  bucket = 'product-images',
  value = '',
  onChange,
  help,
  aspect = 'aspect-[16/9]',
}) {
  const inputRef = useRef(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  async function handleFile(event) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setError('Choose an image file (JPG, PNG, WebP or SVG).')
      return
    }
    if (file.size > 4 * 1024 * 1024) {
      setError('That file is over 4 MB. Export it smaller and try again.')
      return
    }

    setBusy(true)
    setError(null)
    const result = await adminStorage.uploadImage(bucket, file)
    setBusy(false)

    if (result.error) {
      setError(result.error.message)
      return
    }
    onChange(result.data.url)
  }

  return (
    <div>
      <label className="adm-label">{label}</label>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
        <div className={`flex w-full shrink-0 items-center justify-center overflow-hidden rounded-xl border border-dashed border-ink-300 bg-ink-50 sm:w-40 ${aspect} dark:border-ink-700 dark:bg-ink-800`}>
          {value ? (
            <img src={value} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="text-center">
              <Icon name="image" size={20} className="mx-auto text-ink-500" />
              <p className="mt-1 text-[11px] text-ink-500">No image</p>
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <input
            className="adm-input font-mono text-xs"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Paste a URL, or upload below"
            aria-label={`${label} URL`}
          />

          <div className="mt-2 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={busy}
              className="adm-btn-outline !px-3 !py-2 !text-xs"
            >
              <Icon name={busy ? 'spinner' : 'upload'} size={14} className={busy ? 'animate-spin' : ''} />
              {busy ? 'Uploading…' : 'Upload image'}
            </button>
            {value && (
              <button
                type="button"
                onClick={() => onChange('')}
                className="adm-btn-outline !px-3 !py-2 !text-xs"
              >
                <Icon name="close" size={14} />
                Clear
              </button>
            )}
          </div>

          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={handleFile}
          />

          {error && (
            <p className="mt-2 rounded-lg bg-rose-50 px-3 py-2 text-xs leading-relaxed text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">
              {error}
            </p>
          )}
          {help && !error && (
            <p className="mt-2 text-xs leading-relaxed text-ink-500 dark:text-ink-400">{help}</p>
          )}
        </div>
      </div>
    </div>
  )
}
