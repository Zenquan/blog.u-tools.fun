'use client';

import { FC, useRef, useState, useEffect } from 'react';
import { Music, Play, Pause } from 'lucide-react';
import Image from 'next/image';

interface MusicPlayerProps {
  url: string;
}

const MusicPlayer: FC<MusicPlayerProps> = ({ url }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [musicInfo, setMusicInfo] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const fetchMusicInfo = async () => {
      try {
        setError(null);
        const response = await fetch(`/api/music?url=${encodeURIComponent(url)}`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const text = await response.text();
        if (!text) {
          throw new Error('Empty response');
        }
        const data = JSON.parse(text);
        if (!data) {
          throw new Error('Invalid music info');
        }
        setMusicInfo(data);
      } catch (error) {
        console.error('Failed to fetch music info:', error);
        setError('音乐信息加载失败，请稍后重试');
        setMusicInfo(null);
      }
    };

    fetchMusicInfo();
  }, [url]);

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

    const handleError = (e: Event) => {
      console.error('Audio error:', e);
      setIsPlaying(false);
      setError('音频加载失败，请稍后重试');
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

  if (error) {
    return (
      <div className="my-8 p-4 bg-red-50 rounded-lg text-red-600 text-sm">
        {error}
      </div>
    );
  }

  if (!musicInfo) return null;
  const { title, artist, cover, src, platform } = musicInfo;
  const proxyUrl = src ? `/api/proxy?url=${encodeURIComponent(src)}` : '';

  const togglePlay = async () => {
    if (!audioRef.current || !src) return;

    try {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        await audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    } catch (error) {
      console.error('Play error:', error);
      setIsPlaying(false);
      setError('播放失败，请稍后重试');
    }
  };

  return (
    <div className="my-8">
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl overflow-hidden border border-gray-100 shadow-sm transition-shadow duration-300"
        onClick={togglePlay}
      >
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
          <div className="flex-1 min-w-0 py-4 pr-6">
            <div className="text-base font-medium text-gray-900 truncate">
              {title}
            </div>
            <div className="text-sm text-gray-500 truncate">
              {artist} · {platform}
            </div>
            {/* 进度条 */}
            {src && (
              <div className="mt-2 h-1 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gray-500 rounded-full transition-all duration-100"
                  style={{ width: `${progress}%` }}
                />
              </div>
            )}
          </div>
        </div>
      </div>
      {proxyUrl && (
        <audio
          ref={audioRef}
          src={proxyUrl}
          preload="metadata"
          onError={() => setError('音频加载失败，请稍后重试')}
        />
      )}
    </div>
  );
};

export default MusicPlayer;