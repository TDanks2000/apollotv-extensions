export interface AnimePaheEpisodes {
  total: number;
  per_page: number;
  current_page: number;
  last_page: number;
  next_page_url: null;
  prev_page_url: null;
  from: number;
  to: number;
  data: AnimePaheEpisode[];
}

export interface AnimePaheEpisode {
  id: number;
  anime_id: number;
  episode: number;
  episode2: number;
  edition: string;
  title: string | undefined;
  snapshot: string;
  disc: Disc | "";
  audio: Audio;
  duration: string;
  session: string;
  filler: number;
  created_at: Date;
}

export enum Audio {
  Eng = "eng",
  Jpn = "jpn",
}

export enum Disc {
  Bd = "BD",
}

export interface AnimePaheSearch {
  total: number;
  per_page: number;
  current_page: number;
  last_page: number;
  from: number;
  to: number;
  data: AnimePaheSearchResults[];
}

export interface AnimePaheSearchResults {
  id: number;
  title: string;
  type: string;
  episodes: number;
  status: string;
  season: string;
  year: number;
  score: number;
  poster: string;
  session: string;
}
