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
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
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

  // 播放状态变化时的处理
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.error('Play error:', error);
          setIsPlaying(false);
          setError('播放失败，请稍后重试');
        });
      }
    } else {
      audio.pause();
    }
  }, [isPlaying]);

  const handleTimeUpdate = () => {
    const audio = audioRef.current;
    if (!audio) return;
    
    const currentTime = audio.currentTime;
    const duration = audio.duration || 0;
    const progressValue = (currentTime / duration) * 100;
    
    setCurrentTime(currentTime);
    setProgress(progressValue);
  };

  const handleLoadedMetadata = () => {
    const audio = audioRef.current;
    if (!audio) return;
    setDuration(audio.duration);
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setProgress(0);
    setCurrentTime(0);
  };

  const handleError = () => {
    setIsPlaying(false);
    setError('音频加载失败，请稍后重试');
  };

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

  const togglePlay = () => {
    if (!audioRef.current || !src) return;
    setIsPlaying(!isPlaying);
  };

  // 格式化时间
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
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
            {/* 进度条和时间 */}
            {src && (
              <div className="mt-2">
                <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gray-500 rounded-full transition-all duration-100"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="mt-1 flex justify-between text-xs text-gray-500">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
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
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={handleEnded}
          onError={handleError}
        />
      )}
    </div>
  );
};

export default MusicPlayer;