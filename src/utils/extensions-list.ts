import { ANIME, INFO, MANGA, MOVIE } from "../extensions";

/**
 * Enabled Extensions
 */
export const EXTENSION_LIST = {
  ANIME: [new ANIME.Gogoanime(), new ANIME.AnimePahe()],
  MANGA: [new MANGA.MangaPill(), new MANGA.Mangasee123()],
  INFO: [new INFO.Anilist()],
  MOVIE: [new MOVIE.FlixHQ()],
};
