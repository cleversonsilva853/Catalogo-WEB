import { useState } from 'react';
import { Play } from 'lucide-react';
import { Story } from '@/hooks/useStories';
import { StoryViewer } from './StoryViewer';

interface StoriesBarProps {
  stories: Story[];
}

export function StoriesBar({ stories }: StoriesBarProps) {
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const active = stories.filter(s => s.is_active);

  if (active.length === 0) return null;

  return (
    <>
      <div className="px-4 py-3">
        <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-1 snap-x">
          {active.map((story, index) => (
            <button
              key={story.id}
              onClick={() => setViewerIndex(index)}
              className="flex flex-col items-center gap-1.5 flex-shrink-0 snap-start group"
            >
              {/* Circular Thumbnail with gradient ring */}
              <div className="relative">
                <div className="w-16 h-16 rounded-full p-[2px] bg-gradient-to-tr from-primary via-orange-400 to-yellow-300 shadow-md group-hover:scale-105 transition-transform">
                  <div className="w-full h-full rounded-full overflow-hidden border-2 border-background bg-muted">
                    {story.media_type === 'video' ? (
                      <div className="relative w-full h-full bg-black flex items-center justify-center">
                        <video
                          src={story.media_url}
                          className="w-full h-full object-cover absolute inset-0"
                          muted
                          playsInline
                        />
                        <Play className="h-4 w-4 text-white z-10 drop-shadow" />
                      </div>
                    ) : (
                      <img
                        src={story.media_url}
                        alt={story.title || 'story'}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                </div>
              </div>
              {/* Title below */}
              <span className="text-[11px] font-semibold text-foreground max-w-[64px] truncate text-center leading-tight">
                {story.title || 'Story'}
              </span>
            </button>
          ))}
        </div>
      </div>

      {viewerIndex !== null && (
        <StoryViewer
          stories={active}
          initialIndex={viewerIndex}
          onClose={() => setViewerIndex(null)}
        />
      )}
    </>
  );
}
