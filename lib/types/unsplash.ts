export interface Photo {
  id: string;
  urls: {
    regular: string;
    full: string;
    thumb: string;
  };
  created_at: string;
  alt_description: string;
  width: number;
  height: number;
  views?: number;
  downloads?: number;
  likes?: number;
  exif?: {
    make?: string;
    model?: string;
    name?: string;
    exposure_time?: string;
    aperture?: string;
    focal_length?: string;
    iso?: number;
  };
  location?: {
    name?: string | null;
    city?: string | null;
    country?: string | null;
    position?: {
      latitude?: number | null;
      longitude?: number | null;
    };
  };
  user?: {
    name: string;
    username: string;
  };
}

export interface Collection {
  id: string;
  title: string;
  description: string | null;
  total_photos: number;
  updated_at: string;
  tags: Array<{
    type: string;
    title: string;
  }>;
  preview_photos: Array<{
    id: string;
    urls: {
      regular: string;
      thumb: string;
    };
  }>;
} 