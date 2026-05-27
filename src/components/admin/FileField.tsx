import { useState, type ChangeEvent } from 'react';
import { Upload, FileText, X, ExternalLink } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import FormField from './FormField';

interface Props {
  label?:     string;
  value:      string;           // public URL
  onChange:   (url: string) => void;
  bucket?:    string;           // default 'documents'
  pathPrefix: string;           // e.g. 'admin/docs'
  accept?:    string;           // default 'application/pdf,.pdf,.doc,.docx,.zip'
  hint?:      string;
}

/** File upload field for non-image attachments (PDFs, DOCs, etc.).
 *  Same UX as ThumbnailField but renders a doc preview row instead of
 *  an image. Stores the public URL in `value`. */
export default function FileField({
  label  = 'Archivo',
  value,
  onChange,
  bucket = 'documents',
  pathPrefix,
  accept = 'application/pdf,.pdf,.doc,.docx,.xlsx,.zip',
  hint   = 'Subí un PDF/doc o pegá una URL externa (Drive, etc.)',
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
      .from(bucket)
      .upload(path, file, { upsert: true, contentType: file.type || 'application/octet-stream' });

    if (upErr) {
      setError(upErr.message);
      setUploading(false);
      e.target.value = '';
      return;
    }

    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    if (data?.publicUrl) onChange(data.publicUrl);
    setUploading(false);
    e.target.value = '';
  }

  const filename = value ? (value.split('/').pop() ?? 'archivo') : '';

  return (
    <FormField label={label} hint={hint}>
      {/* Current file preview */}
      {value ? (
        <div className="flex items-center gap-2 p-3 rounded-xl border border-line bg-ink/[.04] mb-2">
          <FileText className="w-5 h-5 text-accent-blue flex-shrink-0" strokeWidth={2} />
          <a
            href={value}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 min-w-0 text-xs text-ink/70 truncate hover:text-accent-orange"
            title={value}
          >
            {filename}
          </a>
          <a
            href={value}
            target="_blank"
            rel="noopener noreferrer"
            className="w-7 h-7 rounded grid place-items-center hover:bg-ink/10 transition-colors"
            aria-label="Abrir"
          >
            <ExternalLink className="w-3.5 h-3.5 text-ink/50" strokeWidth={2} />
          </a>
          <button
            type="button"
            onClick={() => onChange('')}
            className="w-7 h-7 rounded grid place-items-center bg-red-500/10 hover:bg-red-500/20 transition-colors"
            aria-label="Quitar"
          >
            <X className="w-3.5 h-3.5 text-red-500" strokeWidth={2} />
          </button>
        </div>
      ) : null}

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
        {uploading ? 'Subiendo…' : 'Subir archivo'}
        <input
          type="file"
          accept={accept}
          onChange={handleFile}
          className="hidden"
          disabled={uploading}
        />
      </label>

      {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
    </FormField>
  );
}
