import { useState, type ChangeEvent } from 'react';
import { Upload, ImageIcon, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import FormField from './FormField';

interface Props {
  label?:     string;
  value:      string;
  onChange:   (url: string) => void;
  pathPrefix: string;          // e.g. 'admin/videos', 'admin/courses'
  hint?:      string;
}

/** Thumbnail input: paste a URL or upload a file to the `thumbnails`
 *  bucket. On successful upload, the resulting public URL replaces
 *  whatever was in the text field. Shows a preview image when set. */
export default function ThumbnailField({
  label = 'Thumbnail',
  value,
  onChange,
  pathPrefix,
  hint = 'Recomendado 800×450px (16:9). Podés pegar URL o subir archivo.',
}: Props) {
  const [uploading, setUploading] = useState(false);
  const [error, setError]         = useState<string | null>(null);

  async function handleFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setUploading(true);

    const safeName = file.name.replace(/[^\w.\-]+/g, '_');
    const path     = `${pathPrefix}/${Date.now()}-${safeName}`;
    const { error: upErr } = await supabase.storage
      .from('thumbnails')
      .upload(path, file, { upsert: true, contentType: file.type });

    if (upErr) {
      setError(upErr.message);
      setUploading(false);
      e.target.value = '';
      return;
    }

    const { data } = supabase.storage.from('thumbnails').getPublicUrl(path);
    if (data?.publicUrl) onChange(data.publicUrl);
    setUploading(false);
    e.target.value = '';
  }

  return (
    <FormField label={label} hint={hint}>
      {/* Preview */}
      {value ? (
        <div className="relative aspect-[16/9] rounded-xl overflow-hidden bg-ink/[.04] mb-2 border border-line">
          <img
            src={value}
            alt="thumbnail preview"
            className="w-full h-full object-cover"
            onError={(ev) => {
              const img = ev.currentTarget;
              img.onerror = null;
              img.style.display = 'none';
            }}
          />
          <button
            type="button"
            onClick={() => onChange('')}
            className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/70 text-white grid place-items-center hover:bg-black"
            aria-label="Quitar imagen"
          >
            <X className="w-3.5 h-3.5" strokeWidth={2} />
          </button>
        </div>
      ) : (
        <div className="aspect-[16/9] rounded-xl border border-dashed border-line bg-ink/[.02] grid place-items-center mb-2">
          <ImageIcon className="w-8 h-8 text-ink/20" strokeWidth={1.5} />
        </div>
      )}

      {/* URL text input */}
      <input
        type="url"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="https://… o subí un archivo abajo"
        className="form-input mb-2"
      />

      {/* Upload button */}
      <label className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-dashed border-line cursor-pointer bg-ink/[.02] hover:bg-ink/[.05] transition-colors text-xs text-ink/70">
        <Upload className="w-3.5 h-3.5" strokeWidth={2} />
        {uploading ? 'Subiendo…' : 'Subir imagen'}
        <input
          type="file"
          accept="image/*"
          onChange={handleFile}
          className="hidden"
          disabled={uploading}
        />
      </label>

      {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
    </FormField>
  );
}
