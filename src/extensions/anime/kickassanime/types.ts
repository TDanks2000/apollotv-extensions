export type Search = {
  rating: string;
  slug: string;
  start_date: string;
  status: string;
  title: string;
  title_en: string;
  type: string;
  year: number;
  poster: Image;
  [x: string]: unknown;
};

export type Info = {
  end_date: string;
  episode_duration: number;
  genres: string[];
  locales: string[];
  rating: string;
  season: string;
  slug: string;
  start_date: string;
  status: string;
  synopsis: string;
  title: string;
  title_en: string;
  title_original: string;
  type: string;
  year: number;
  poster: Image;
  banner: Image;
  watch_uri: string;
  [x: string]: unknown;
};

export interface Episode {
  current_page: number;
  pages: EpisodePage[];
  result: EpisodeResult[];
}

export interface EpisodePage {
  number: number;
  from: string;
  to: string;
  eps: number[];
}

export interface EpisodeResult {
  slug: string;
  title: string;
  duration_ms: number;
  episode_number: number;
  episode_string: string;
  thumbnail: Image;
}

export type Image = {
  formats: string[];
  sm: string;
  aspectRatio: number;
  hq: string;
};

export enum Format {
  JPEG = "jpeg",
  Webp = "webp",
}
