import { ANIME, INFO, MANGA, MOVIE } from "../extensions";
import { EXTENSION_LIST_TYPE } from "../types";

/**
 * Enabled Extensions
 */
export const EXTENSION_LIST: EXTENSION_LIST_TYPE = {
  ANIME: [
    new ANIME.Gogoanime(),
    new ANIME.AnimePahe(),
    new ANIME.AllAnime()
  ],
  MANGA: [
    new MANGA.ComicK(),
    new MANGA.FlameScans(),
    new MANGA.MangaDex(),
    // new MANGA.Mangakomi(),
    new MANGA.MangaPill(),
    new MANGA.Mangasee123(),
  ],
  MOVIE: [new MOVIE.FlixHQ()],
  INFO: [new INFO.Anilist()],
};
