"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EXTENSION_LIST = void 0;
const extensions_1 = require("../extensions");
/**
 * Enabled Extensions
 */
exports.EXTENSION_LIST = {
    ANIME: [new extensions_1.ANIME.Gogoanime(), new extensions_1.ANIME.AnimePahe()],
    MANGA: [new extensions_1.MANGA.MangaPill(), new extensions_1.MANGA.Mangasee123()],
    INFO: [new extensions_1.INFO.Anilist()],
    MOVIE: [new extensions_1.MOVIE.FlixHQ()],
};
