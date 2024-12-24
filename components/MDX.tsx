'use client';

import { FC, useRef, useState, useEffect } from 'react';
import { useMDXComponent } from 'next-contentlayer2/hooks';
import Image from 'next/image';
import { ExternalLink, Music, Play, Pause } from 'lucide-react';

interface MusicPlayerProps {
  title: string;
  artist: string;
  cover: string;
  platform: string;
  link: string;
  src?: string;
}

const MusicPlayer: FC<MusicPlayerProps> = ({
  title,
  artist,
  cover,
  platform,
  link,
  src,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  // 构建代理 URL
  const proxyUrl = src ? `/api/proxy?url=${encodeURIComponent(src)}` : '';

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateProgress = () => {
      const value = (audio.currentTime / audio.duration) * 100;
      setProgress(value || 0);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setProgress(0);
    };

    const handleError = (e: ErrorEvent) => {
      console.error('Audio error:', e);
      setIsPlaying(false);
    };

    audio.addEventListener('timeupdate', updateProgress);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('timeupdate', updateProgress);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
    };
  }, []);

  const togglePlay = () => {
    if (!audioRef.current || !src) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(error => {
        console.error('Play error:', error);
        setIsPlaying(false);
      });
    }
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="my-8">
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-300">
        <div className="flex items-center gap-6">
          {/* 封面 */}
          <div className="relative w-24 h-24 flex-shrink-0 rounded-xl overflow-hidden">
            <div className="absolute inset-0 bg-black/5 z-10" />
            <Image
              src={cover}
              alt={`${title} - ${artist}`}
              fill
              sizes="96px"
              className="object-cover m-0"
            />
            {src ? (
              <button
                onClick={togglePlay}
                className="absolute inset-0 z-20 flex items-center justify-center bg-black/20 hover:bg-black/30 transition-colors group"
              >
                {isPlaying ? (
                  <Pause className="w-8 h-8 text-white opacity-90 group-hover:opacity-100 transition-opacity" />
                ) : (
                  <Play className="w-8 h-8 text-white opacity-90 group-hover:opacity-100 transition-opacity" />
                )}
              </button>
            ) : (
              <div className="absolute inset-0 z-20 flex items-center justify-center">
                <Music className="w-8 h-8 text-white/80" />
              </div>
            )}
          </div>

          {/* 信息 */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 truncate">
                  {title}
                </h3>
                <p className="mt-1.5 text-sm text-gray-500 flex items-center gap-2">
                  <span>{artist}</span>
                  <span className="inline-block w-1 h-1 rounded-full bg-gray-300" />
                  <span>{platform}</span>
                </p>
              </div>
            </div>
            {src && (
              <div>
                <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full transition-all duration-100"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <audio ref={audioRef} src={proxyUrl} preload="metadata" />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const slugifyWithCounter = () => {
  const slugs = new Map<string, number>();

  return (str: string) => {
    const base = str
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^\w\-]+/g, '')
      .replace(/\-\-+/g, '-');

    const count = slugs.get(base) ?? 0;
    slugs.set(base, count + 1);

    return count === 0 ? base : `${base}-${count}`;
  };
};

interface MDXProps {
  code: string;
}

const MDX: FC<MDXProps> = ({ code }) => {
  try {
    const Component = useMDXComponent(code);
    const slugify = slugifyWithCounter();

    return (
      <div className="mdx-content">
        <Component
          components={{
            img: ({ alt, ...props }: any) => (
              <span className="block my-4">
                <Image alt={alt || ''} {...props} />
              </span>
            ),
            h1: (props: any) => (
              <h1 {...props} id={slugify(props.children)} />
            ),
            h2: (props: any) => (
              <h2 {...props} id={slugify(props.children)} />
            ),
            h3: (props: any) => (
              <h3 {...props} id={slugify(props.children)} />
            ),
            MusicPlayer,
          }}
        />
      </div>
    );
  } catch (error) {
    console.error('MDX rendering error:', error);
    return (
      <div className="text-red-500">
        内容加载失败，请刷新页面重试。
      </div>
    );
  }
};

export default MDX;
