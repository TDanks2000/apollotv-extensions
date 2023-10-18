import MediaProvier from "./media-parser";
import ReadableParser from "./readable-parser";
export type EXTENSION_LIST_TYPE = {
    ANIME: MediaProvier[];
    MANGA: ReadableParser[];
    MOVIE: MediaProvier[];
    INFO: MediaProvier[];
};
