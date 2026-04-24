import { useState, useEffect, useRef } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Story } from '@/hooks/useStories';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

interface StoryViewerProps {
  stories: Story[];
  initialIndex: number;
  onClose: () => void;
}

const STORY_DURATION = 5000; // ms per story

export function StoryViewer({ stories, initialIndex, onClose }: StoryViewerProps) {
  const isMobile = useIsMobile();
  const [current, setCurrent] = useState(initialIndex);
  const [progress, setProgress] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const story = stories[current];

  const startTimer = () => {
    setProgress(0);
    if (timerRef.current) clearInterval(timerRef.current);
    const step = 100 / (STORY_DURATION / 50);
    timerRef.current = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          goNext();
          return 0;
        }
        return prev + step;
      });
    }, 50);
  };

  const goNext = () => {
    setCurrent(prev => {
      if (prev < stories.length - 1) return prev + 1;
      onClose();
      return prev;
    });
  };

  const goPrev = () => {
    setCurrent(prev => (prev > 0 ? prev - 1 : prev));
  };

  useEffect(() => {
    startTimer();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [current]);

  // Close on Escape
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
        style={{ aspectRatio: isMobile ? 'auto' : '9/16' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Media */}
        {story.media_type === 'video' ? (
          <video
            key={story.id}
            src={story.media_url}
            autoPlay
            muted
            playsInline
            loop
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <img
            key={story.id}
            src={story.media_url}
            alt={story.title || ''}
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/70" />

        {/* Progress bars */}
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

        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-8 right-3 z-10 text-white/80 hover:text-white bg-black/30 rounded-full p-1.5"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Tap zones: prev / next */}
        <button
          className="absolute left-0 top-0 w-1/3 h-full z-10"
          onClick={(e) => { e.stopPropagation(); goPrev(); }}
        />
        <button
          className="absolute right-0 top-0 w-1/3 h-full z-10"
          onClick={(e) => { e.stopPropagation(); goNext(); }}
        />

        {/* Bottom Text */}
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
