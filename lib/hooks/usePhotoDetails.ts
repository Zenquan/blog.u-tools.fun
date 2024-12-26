'use client';

import { useState, useEffect } from 'react';
import { unsplash } from '@/lib/unsplash';
import { Photo } from '@/lib/types/unsplash';

export function usePhotoDetails(photoId: string | null) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [photoDetails, setPhotoDetails] = useState<Photo | null>(null);
  const [photoStats, setPhotoStats] = useState<any>(null);

  useEffect(() => {
    async function fetchPhotoDetails() {
      if (!photoId) return;

      setLoading(true);
      setError(null);

      try {
        const [photoResult, statsResult] = await Promise.all([
          unsplash.photos.get({ photoId }),
          unsplash.photos.getStats({ photoId })
        ]);

        if (photoResult.response) {
          setPhotoDetails(photoResult.response);
        }
        if (statsResult.response) {
          setPhotoStats(statsResult.response);
        }
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch photo details'));
      } finally {
        setLoading(false);
      }
    }

    fetchPhotoDetails();
  }, [photoId]);

  return {
    loading,
    error,
    photoDetails,
    photoStats
  };
} 