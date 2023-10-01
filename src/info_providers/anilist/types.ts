import { Genres } from "../../types";

export interface MalsyncReturn {
  id: number;
  type: string;
  title: string;
  url: string;
  image: string;
  anidbId: number;
  Sites: Sites;
}

export interface Sites {
  "9anime": Site[];
  Gogoanime: Site[];
  Marin: Site[];
  Zoro: Site[];
  animepahe: Site[];
  YugenAnime: Site[];
  Crunchyroll: Site[];
  Funimation: Site[];
  Hulu: Site[];
  Netflix: Site[];
  [x: string]: Site[];
}

export interface Site {
  identifier: string;
  image?: string;
  malId: number;
  aniId?: number;
  page: string;
  title: string;
  type: string;
  url: string;
}

export type AdvancedSearch = {
  query?: string;
  type: string;
  page: number;
  perPage: number;
  format?: string;
  sort?: string[];
  genres?: Genres[] | string[];
  id?: string | number;
  year?: number;
  status?: string;
  season?: string;
};
