import { useState } from 'react';
import { Play, Lock, Clock } from 'lucide-react';
import type { VideoRow } from '@/lib/types';

const TIER_LABEL: Record<string, string> = {
  free:    'Gratis',
  basica:  'Básica',
  vip:     'VIP',
  premium: 'Premium',
};

function extractVimeoId(url: string | null): string | null {
  if (!url) return null;
  const m = String(url).match(/(?:vimeo\.com\/(?:video\/)?|^)(\d+)/);
  return m ? m[1] : null;
}

interface Props {
  video:       VideoRow;
  /** If false: render a locked overlay with the tier badge instead of a play button */
  unlocked?:   boolean;
  /** 0–100 — shown as a progress bar below the video */
  progressPct?: number;
}

export default function VideoCard({ video, unlocked = true, progressPct = 0 }: Props) {
  const [playing, setPlaying] = useState(false);
  const vimeoId = extractVimeoId(video.vimeo_url);
  const thumb   = video.thumbnail_url;
  const tier    = (video.tier_required ?? 'free').toLowerCase();

  return (
    <article className="card overflow-hidden p-0">
      {/* Player area */}
      <div className="relative aspect-[16/9] bg-grad-brand/10">
        {playing && unlocked && vimeoId ? (
          <iframe
            src={`https://player.vimeo.com/video/${vimeoId}?autoplay=1&color=F57C00&title=0&byline=0&portrait=0`}
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 w-full h-full border-0"
            title={video.title}
          />
        ) : (
          <>
            {thumb && (
              <img
                src={thumb}
                alt={video.title}
                loading="lazy"
                className={`absolute inset-0 w-full h-full object-cover ${unlocked ? '' : 'blur-sm scale-105'}`}
                onError={(ev) => {
                  const img = ev.currentTarget;
                  img.onerror = null;
                  img.style.display = 'none';
                }}
              />
            )}
            {unlocked ? (
              <button
                type="button"
                onClick={() => vimeoId && setPlaying(true)}
                disabled={!vimeoId}
                className="absolute inset-0 grid place-items-center group disabled:cursor-not-allowed"
                aria-label={vimeoId ? `Reproducir ${video.title}` : 'Video no disponible'}
              >
                <span
                  className={`w-14 h-14 rounded-full bg-grad-brand grid place-items-center text-white
                    transition-transform group-hover:scale-110 shadow-card-hover ${vimeoId ? '' : 'opacity-50'}`}
                >
                  <Play className="w-6 h-6 ml-0.5" fill="currentColor" strokeWidth={0} />
                </span>
              </button>
            ) : (
              <div className="absolute inset-0 grid place-items-center text-center px-4"
                   style={{ background: 'rgba(11,14,20,.55)' }}>
                <div className="text-white">
                  <Lock className="w-7 h-7 mx-auto mb-2 opacity-80" strokeWidth={2} />
                  <p className="text-xs">
                    Requiere membresía <strong>{TIER_LABEL[tier] ?? tier}</strong>
                  </p>
                </div>
              </div>
            )}
            {video.duration && unlocked && (
              <span className="absolute bottom-2 right-2 text-xs font-semibold px-2 py-0.5 rounded-md text-white flex items-center gap-1 backdrop-blur-sm"
                    style={{ background: 'rgba(0,0,0,.7)' }}>
                <Clock className="w-3 h-3" strokeWidth={2} />{video.duration}
              </span>
            )}
          </>
        )}
      </div>

      {/* Progress bar */}
      {progressPct > 0 && unlocked && !playing && (
        <div className="px-4 pt-3">
          <div className="h-1 rounded-full bg-ink/10 overflow-hidden">
            <div className="h-full bg-grad-brand" style={{ width: `${progressPct}%` }} />
          </div>
          <p className="text-[10px] text-ink/40 mt-1">{progressPct}% completado</p>
        </div>
      )}

      {/* Title + description */}
      <div className="p-4">
        <h3 className={`font-bold text-sm font-serif mb-1 ${unlocked ? 'text-ink' : 'text-ink/50'}`}>
          {video.title}
        </h3>
        {video.description && unlocked && (
          <p className="text-xs text-ink/50 leading-relaxed line-clamp-2">{video.description}</p>
        )}
      </div>
    </article>
  );
}
