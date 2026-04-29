import { useState, useEffect, useRef, useCallback } from 'react';
import { X } from 'lucide-react';
import { Story } from '@/hooks/useStories';

interface StoryViewerProps {
  stories: Story[];
  initialIndex: number;
  onClose: () => void;
}

const STORY_DURATION = 5000; // ms por story (imagem)

export function StoryViewer({ stories, initialIndex, onClose }: StoryViewerProps) {
  const [current, setCurrent] = useState(initialIndex);
  const [progress, setProgress] = useState(0);
  const [mediaReady, setMediaReady] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const story = stories[current];

  // Limpa e inicia o timer de progresso
  const startTimer = useCallback((duration: number) => {
    setProgress(0);
    if (timerRef.current) clearInterval(timerRef.current);
    const step = 100 / (duration / 50);
    timerRef.current = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          goNext();
          return 0;
        }
        return prev + step;
      });
    }, 50);
  }, []);

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const goNext = useCallback(() => {
    stopTimer();
    setCurrent(prev => {
      if (prev < stories.length - 1) return prev + 1;
      onClose();
      return prev;
    });
  }, [stories.length, onClose]);

  const goPrev = useCallback(() => {
    stopTimer();
    setCurrent(prev => (prev > 0 ? prev - 1 : prev));
  }, []);

  // Quando muda de story, reseta estado de pronto
  useEffect(() => {
    setMediaReady(false);
    setProgress(0);
    stopTimer();
  }, [current]);

  // Quando a mídia fica pronta, inicia o timer
  useEffect(() => {
    if (!mediaReady) return;
    const story = stories[current];
    if (!story) return;

    // Para vídeo: usa a duração real do vídeo (máx 30s)
    if (story.media_type === 'video' && videoRef.current) {
      const vid = videoRef.current;
      const duration = Math.min((vid.duration || 10) * 1000, 30000);
      startTimer(duration);
    } else {
      startTimer(STORY_DURATION);
    }

    return () => stopTimer();
  }, [mediaReady, current, stories, startTimer]);

  // Fechar com Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  if (!story) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] bg-black flex items-center justify-center"
      onClick={onClose}
    >
      {/* Story Card — portrait 9:16 */}
      <div
        className="relative w-full h-[100dvh] sm:h-[85vh] sm:max-w-sm sm:rounded-2xl overflow-hidden select-none"
        onClick={e => e.stopPropagation()}
      >
        {/* Loading skeleton enquanto vídeo buffera */}
        {!mediaReady && (
          <div className="absolute inset-0 bg-zinc-900 flex items-center justify-center z-20">
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-4 border-white/20 border-t-white rounded-full animate-spin" />
              {story.media_type === 'video' && (
                <span className="text-white/60 text-sm">Carregando vídeo...</span>
              )}
            </div>
          </div>
        )}

        {/* Mídia */}
        {story.media_type === 'video' ? (
          <video
            ref={videoRef}
            key={story.id}
            src={story.media_url}
            autoPlay
            muted
            playsInline
            preload="auto"
            className="absolute inset-0 w-full h-full object-cover"
            onCanPlay={() => setMediaReady(true)}
            onLoadedData={() => setMediaReady(true)}
            onError={() => {
              // Em erro, avança pro próximo após 3s
              setMediaReady(true);
              setTimeout(goNext, 3000);
            }}
          />
        ) : (
          <img
            key={story.id}
            src={story.media_url}
            alt={story.title || ''}
            className="absolute inset-0 w-full h-full object-cover"
            onLoad={() => setMediaReady(true)}
            onError={() => setMediaReady(true)}
          />
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/70 z-[1]" />

        {/* Barras de progresso */}
        <div className="absolute top-3 left-3 right-3 flex gap-1 z-10">
          {stories.map((_, i) => (
            <div key={i} className="flex-1 h-0.5 rounded-full bg-white/30 overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-none"
                style={{
                  width: i < current ? '100%' : i === current ? `${progress}%` : '0%',
                }}
              />
            </div>
          ))}
        </div>

        {/* Botão fechar */}
        <button
          onClick={onClose}
          className="absolute top-8 right-3 z-10 text-white/80 hover:text-white bg-black/30 rounded-full p-1.5"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Zonas de toque: anterior / próximo */}
        <button
          className="absolute left-0 top-0 w-1/3 h-full z-10"
          onClick={(e) => { e.stopPropagation(); goPrev(); }}
          aria-label="Story anterior"
        />
        <button
          className="absolute right-0 top-0 w-1/3 h-full z-10"
          onClick={(e) => { e.stopPropagation(); goNext(); }}
          aria-label="Próximo story"
        />

        {/* Textos no rodapé */}
        {(story.title || story.subtitle || story.description) && (
          <div className="absolute bottom-0 left-0 right-0 z-10 p-5 space-y-1">
            {story.title && (
              <h2 className="text-white font-black text-2xl leading-tight drop-shadow-md">
                {story.title}
              </h2>
            )}
            {story.subtitle && (
              <p className="text-white/90 font-semibold text-sm drop-shadow-sm">
                {story.subtitle}
              </p>
            )}
            {story.description && (
              <p className="text-white/75 text-xs mt-2 leading-relaxed drop-shadow-sm line-clamp-3">
                {story.description}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
