"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const types_1 = require("../../../types");
const gogoanime_1 = __importDefault(require("../../anime/gogoanime"));
const utils_1 = require("../../../utils");
const queries_1 = require("./queries");
const metadata = __importStar(require("./extension.json"));
const mangasee123_1 = __importDefault(require("../../manga/mangasee123"));
const allanime_1 = __importDefault(require("../../anime/allanime"));
class Anilist extends types_1.MediaProvier {
    constructor(provider, animapped_api_key) {
        super();
        this.metaData = metadata;
        this.baseUrl = metadata.code.utils.mainURL;
        this.anilistGraphqlUrl = metadata.code.utils.apiURL;
        this.animapped_api_url = metadata.code.utils.animappedApiRrl;
        this.kitsuGraphqlUrl = metadata.code.utils.kitsuGraphqlUrl;
        this.fetchDefaultEpisodeList = (Media, dub, id) => __awaiter(this, void 0, void 0, function* () {
            var _b, _c;
            let episodes = [];
            episodes = yield this.findAnime({ english: (_b = Media.title) === null || _b === void 0 ? void 0 : _b.english, romaji: (_c = Media.title) === null || _c === void 0 ? void 0 : _c.romaji }, Media.season, Media.startDate.year, Media.idMal, dub, id, Media.externalLinks);
            return episodes;
        });
        this.findAnime = (title, season, startDate, malId, dub, anilistId, externalLinks) => __awaiter(this, void 0, void 0, function* () {
            var _d, _e, _f;
            title.english = (_d = title.english) !== null && _d !== void 0 ? _d : title.romaji;
            title.romaji = (_e = title.romaji) !== null && _e !== void 0 ? _e : title.english;
            title.english = title.english.toLowerCase();
            title.romaji = title.romaji.toLowerCase();
            if (title.english === title.romaji) {
                return ((_f = (yield this.findAnimeSlug(title.english, season, startDate, malId, dub, anilistId, externalLinks))) !== null && _f !== void 0 ? _f : []);
            }
            const romajiPossibleEpisodes = yield this.findAnimeSlug(title.romaji, season, startDate, malId, dub, anilistId, externalLinks);
            if (romajiPossibleEpisodes) {
                return romajiPossibleEpisodes;
            }
            const englishPossibleEpisodes = yield this.findAnimeSlug(title.english, season, startDate, malId, dub, anilistId, externalLinks);
            return englishPossibleEpisodes !== null && englishPossibleEpisodes !== void 0 ? englishPossibleEpisodes : [];
        });
        this.findAnimeSlug = (title, season, startDate, malId, dub, anilistId, externalLinks) => __awaiter(this, void 0, void 0, function* () {
            var _g, _h, _j;
            const slug = title.replace(/[^0-9a-zA-Z]+/g, " ");
            let possibleAnime;
            let possibleSource = yield this.findMappingId(malId, dub);
            if (!possibleSource)
                possibleAnime = yield this.findAnimeRaw(slug);
            if (!possibleSource && !possibleAnime)
                return [];
            try {
                possibleAnime = yield this.provider.getMediaInfo(possibleSource);
            }
            catch (err) {
                console.error(err);
                possibleAnime = yield this.findAnimeRaw(slug);
            }
            if (!possibleAnime)
                return undefined;
            // To avoid a new request, lets match and see if the anime show found is in sub/dub
            const expectedType = dub ? types_1.SubOrDubOrBoth.DUB : types_1.SubOrDubOrBoth.SUB;
            // Have this as a fallback in the meantime for compatibility
            if (possibleAnime.subOrDub) {
                if (possibleAnime.subOrDub != types_1.SubOrDubOrBoth.BOTH && possibleAnime.subOrDub != expectedType) {
                    return undefined;
                }
            }
            else if (((!possibleAnime.hasDub && dub) || (!possibleAnime.hasSub && !dub)) &&
                !this.provider.metaData.name.toLowerCase().includes("animepahe")) {
                return undefined;
            }
            // if (this.provider instanceof Zoro) {
            //   // Set the correct episode sub/dub request type
            //   possibleAnime.episodes.forEach((_: any, index: number) => {
            //     if (possibleAnime.subOrDub === SubOrSub.BOTH) {
            //       possibleAnime.episodes[index].id = possibleAnime.episodes[index].id.replace(
            //         `$both`,
            //         dub ? '$dub' : '$sub'
            //       );
            //     }
            //   });
            // }
            // if (this.provider instanceof Crunchyroll) {
            //   const nestedEpisodes = Object.keys(possibleAnime.episodes)
            //     .filter((key: any) => key.toLowerCase().includes(dub ? 'dub' : 'sub'))
            //     .sort((first: any, second: any) => {
            //       return (
            //         (possibleAnime.episodes[first]?.[0].season_number ?? 0) -
            //         (possibleAnime.episodes[second]?.[0].season_number ?? 0)
            //       );
            //     })
            //     .map((key: any) => {
            //       const audio = key
            //         .replace(/[0-9]/g, '')
            //         .replace(/(^\w{1})|(\s+\w{1})/g, (letter: string) => letter.toUpperCase());
            //       possibleAnime.episodes[key].forEach((element: any) => (element.type = audio));
            //       return possibleAnime.episodes[key];
            //     });
            //   return nestedEpisodes.flat();
            // }
            // if (this.provider instanceof NineAnime) {
            //   possibleAnime.episodes.forEach((_: any, index: number) => {
            //     if (expectedType == SubOrSub.DUB) {
            //       possibleAnime.episodes[index].id = possibleAnime.episodes[index].dubId;
            //     }
            //     if (possibleAnime.episodes[index].dubId) {
            //       delete possibleAnime.episodes[index].dubId;
            //     }
            //   });
            //   possibleAnime.episodes = possibleAnime.episodes.filter((el: any) => el.id != undefined);
            // }
            const possibleProviderEpisodes = possibleAnime.episodes;
            if (typeof ((_g = possibleProviderEpisodes[0]) === null || _g === void 0 ? void 0 : _g.image) !== "undefined" &&
                typeof ((_h = possibleProviderEpisodes[0]) === null || _h === void 0 ? void 0 : _h.title) !== "undefined" &&
                typeof ((_j = possibleProviderEpisodes[0]) === null || _j === void 0 ? void 0 : _j.description) !== "undefined") {
                return possibleProviderEpisodes;
            }
            const options = {
                headers: { "Content-Type": "application/json" },
                query: (0, queries_1.kitsuSearchQuery)(slug),
            };
            const newEpisodeList = yield this.findKitsuAnime(possibleProviderEpisodes, options, season, startDate);
            return newEpisodeList;
        });
        this.findMappingId = (malId, dub) => __awaiter(this, void 0, void 0, function* () {
            var _k;
            if (!malId)
                return undefined;
            try {
                const { data } = yield axios_1.default.get(`https://raw.githubusercontent.com/bal-mackup/mal-backup/master/mal/anime/${malId.toString()}.json`);
                // find site in sites
                if (!data)
                    return undefined;
                const sitesT = data.Sites;
                let sites = Object.values(sitesT).map((v, i) => {
                    const obj = [...Object.values(Object.values(sitesT)[i])];
                    const pages = obj.map((v) => ({
                        page: v.page,
                        url: v.url,
                        title: v.title,
                    }));
                    return pages;
                });
                sites = sites.flat();
                sites.sort((a, b) => {
                    const targetTitle = data.title.toLowerCase();
                    const firstRating = (0, utils_1.compareTwoStrings)(targetTitle, a.title.toLowerCase());
                    const secondRating = (0, utils_1.compareTwoStrings)(targetTitle, b.title.toLowerCase());
                    // Sort in descending order
                    return secondRating - firstRating;
                });
                const possibleSource = sites.find((s) => {
                    if (s.page.toLowerCase() !== this.provider.metaData.name.toLowerCase())
                        return false;
                    if (this.provider instanceof gogoanime_1.default) {
                        return dub
                            ? s.title.toLowerCase().includes("dub")
                            : !s.title.toLowerCase().includes("dub");
                    }
                    else
                        return true;
                });
                if (possibleSource)
                    return possibleSource.url.split("/").pop();
                if (!this.animapped_api_key)
                    return undefined;
                const { data: animapped_data } = yield axios_1.default.get(`${this.animapped_api_url}/mal/${malId}?api_key=${this.animapped_api_key}`);
                const mappings = animapped_data === null || animapped_data === void 0 ? void 0 : animapped_data.mappings;
                if (!mappings)
                    return undefined;
                const findMappingSite = Object.entries(mappings).find(([key, v]) => {
                    return key === this.provider.metaData.name.toLowerCase();
                });
                if (!findMappingSite || findMappingSite === null)
                    return undefined;
                let findMapping;
                try {
                    findMapping = Object.entries(findMappingSite[1]).find(([key, v]) => {
                        if (this.provider instanceof gogoanime_1.default) {
                            return dub ? key.toLowerCase().includes("dub") : !key.toLowerCase().includes("dub");
                        }
                        else
                            return true;
                    });
                }
                catch (error) {
                    return undefined;
                }
                return ((_k = findMapping === null || findMapping === void 0 ? void 0 : findMapping[1]) === null || _k === void 0 ? void 0 : _k.id) || undefined;
            }
            catch (error) {
                throw new Error(`Anilist Mapping Error: ${error.message}`);
            }
        });
        this.findAnimeRaw = (slug, externalLinks) => __awaiter(this, void 0, void 0, function* () {
            const findAnime = (yield this.provider.search(slug));
            if (findAnime.results.length === 0)
                return undefined;
            // Sort the retrieved info for more accurate results.
            let topRating = 0;
            findAnime.results.sort((a, b) => {
                var _b, _c, _d, _e;
                const targetTitle = slug.toLowerCase();
                let firstTitle;
                let secondTitle;
                if (typeof a.title == "string")
                    firstTitle = a.title;
                else
                    firstTitle = (_c = (_b = a.title.english) !== null && _b !== void 0 ? _b : a.title.romaji) !== null && _c !== void 0 ? _c : "";
                if (typeof b.title == "string")
                    secondTitle = b.title;
                else
                    secondTitle = (_e = (_d = b.title.english) !== null && _d !== void 0 ? _d : b.title.romaji) !== null && _e !== void 0 ? _e : "";
                const firstRating = (0, utils_1.compareTwoStrings)(targetTitle, firstTitle.toLowerCase());
                const secondRating = (0, utils_1.compareTwoStrings)(targetTitle, secondTitle.toLowerCase());
                if (firstRating > topRating) {
                    topRating = firstRating;
                }
                if (secondRating > topRating) {
                    topRating = secondRating;
                }
                // Sort in descending order
                return secondRating - firstRating;
            });
            if (topRating >= 0.7) {
                return yield this.provider.getMediaInfo(findAnime.results[0].id);
            }
            return undefined;
        });
        this.findKitsuAnime = (possibleProviderEpisodes, options, season, startDate) => __awaiter(this, void 0, void 0, function* () {
            const kitsuEpisodes = yield this.client.post(this.kitsuGraphqlUrl, options);
            const episodesList = new Map();
            if (kitsuEpisodes === null || kitsuEpisodes === void 0 ? void 0 : kitsuEpisodes.data.data) {
                const { nodes } = kitsuEpisodes.data.data.searchAnimeByTitle;
                if (nodes) {
                    nodes.forEach((node) => {
                        var _b, _c;
                        if (node.season === season &&
                            node.startDate.trim().split("-")[0] === (startDate === null || startDate === void 0 ? void 0 : startDate.toString())) {
                            const episodes = node.episodes.nodes;
                            for (const episode of episodes) {
                                const i = episode === null || episode === void 0 ? void 0 : episode.number.toString().replace(/"/g, "");
                                let name = undefined;
                                let description = undefined;
                                let thumbnail = undefined;
                                if ((_b = episode === null || episode === void 0 ? void 0 : episode.description) === null || _b === void 0 ? void 0 : _b.en)
                                    description = episode === null || episode === void 0 ? void 0 : episode.description.en.toString().replace(/"/g, "").replace("\\n", "\n");
                                if (episode === null || episode === void 0 ? void 0 : episode.thumbnail)
                                    thumbnail = episode === null || episode === void 0 ? void 0 : episode.thumbnail.original.url.toString().replace(/"/g, "");
                                if (episode) {
                                    if ((_c = episode.titles) === null || _c === void 0 ? void 0 : _c.canonical)
                                        name = episode.titles.canonical.toString().replace(/"/g, "");
                                    episodesList.set(i, {
                                        episodeNum: episode === null || episode === void 0 ? void 0 : episode.number.toString().replace(/"/g, ""),
                                        title: name,
                                        description,
                                        createdAt: episode === null || episode === void 0 ? void 0 : episode.createdAt,
                                        thumbnail,
                                    });
                                    continue;
                                }
                                episodesList.set(i, {
                                    episodeNum: undefined,
                                    title: undefined,
                                    description: undefined,
                                    createdAt: undefined,
                                    thumbnail,
                                });
                            }
                        }
                    });
                }
            }
            const newEpisodeList = [];
            if ((possibleProviderEpisodes === null || possibleProviderEpisodes === void 0 ? void 0 : possibleProviderEpisodes.length) !== 0) {
                possibleProviderEpisodes === null || possibleProviderEpisodes === void 0 ? void 0 : possibleProviderEpisodes.forEach((ep, i) => {
                    var _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s;
                    const j = (i + 1).toString();
                    newEpisodeList.push({
                        id: ep.id,
                        title: (_d = (_b = ep.title) !== null && _b !== void 0 ? _b : (_c = episodesList.get(j)) === null || _c === void 0 ? void 0 : _c.title) !== null && _d !== void 0 ? _d : null,
                        image: (_g = (_e = ep.image) !== null && _e !== void 0 ? _e : (_f = episodesList.get(j)) === null || _f === void 0 ? void 0 : _f.thumbnail) !== null && _g !== void 0 ? _g : null,
                        number: (_h = ep.number) !== null && _h !== void 0 ? _h : null,
                        createdAt: (_l = (_j = ep.createdAt) !== null && _j !== void 0 ? _j : (_k = episodesList.get(j)) === null || _k === void 0 ? void 0 : _k.createdAt) !== null && _l !== void 0 ? _l : null,
                        description: (_p = (_m = ep.description) !== null && _m !== void 0 ? _m : (_o = episodesList.get(j)) === null || _o === void 0 ? void 0 : _o.description) !== null && _p !== void 0 ? _p : null,
                        url: (_q = ep.url) !== null && _q !== void 0 ? _q : null,
                        hasDub: (_r = ep.hasDub) !== null && _r !== void 0 ? _r : "UNKOWN",
                        hasSub: (_s = ep.hasSub) !== null && _s !== void 0 ? _s : "UNKOWN",
                    });
                });
            }
            return newEpisodeList;
        });
        this.getTrendingAnime = (page = 1, perPage = 10) => __awaiter(this, void 0, void 0, function* () {
            const options = {
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
                query: (0, queries_1.anilistTrendingQuery)(page, perPage),
            };
            try {
                const { data } = yield this.client.post(this.anilistGraphqlUrl, options);
                const res = {
                    currentPage: data.data.Page.pageInfo.currentPage,
                    hasNextPage: data.data.Page.pageInfo.hasNextPage,
                    results: data.data.Page.media.map((item) => {
                        var _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o;
                        return ({
                            id: item.id.toString(),
                            malId: item.idMal,
                            title: {
                                romaji: item.title.romaji,
                                english: item.title.english,
                                native: item.title.native,
                                userPreferred: item.title.userPreferred,
                            } || item.title.romaji,
                            image: (_c = (_b = item.coverImage.extraLarge) !== null && _b !== void 0 ? _b : item.coverImage.large) !== null && _c !== void 0 ? _c : item.coverImage.medium,
                            trailer: {
                                id: (_d = item.trailer) === null || _d === void 0 ? void 0 : _d.id,
                                site: (_e = item.trailer) === null || _e === void 0 ? void 0 : _e.site,
                                thumbnail: (_f = item.trailer) === null || _f === void 0 ? void 0 : _f.thumbnail,
                            },
                            description: item.description,
                            status: item.status == "RELEASING"
                                ? types_1.MediaStatus.ONGOING
                                : item.status == "FINISHED"
                                    ? types_1.MediaStatus.COMPLETED
                                    : item.status == "NOT_YET_RELEASED"
                                        ? types_1.MediaStatus.NOT_YET_AIRED
                                        : item.status == "CANCELLED"
                                            ? types_1.MediaStatus.CANCELLED
                                            : item.status == "HIATUS"
                                                ? types_1.MediaStatus.HIATUS
                                                : types_1.MediaStatus.UNKNOWN,
                            cover: (_j = (_h = (_g = item.bannerImage) !== null && _g !== void 0 ? _g : item.coverImage.extraLarge) !== null && _h !== void 0 ? _h : item.coverImage.large) !== null && _j !== void 0 ? _j : item.coverImage.medium,
                            rating: item.averageScore,
                            releaseDate: item.seasonYear,
                            color: (_k = item.coverImage) === null || _k === void 0 ? void 0 : _k.color,
                            genres: item.genres,
                            totalEpisodes: isNaN(item.episodes)
                                ? 0
                                : (_o = (_l = item.episodes) !== null && _l !== void 0 ? _l : ((_m = item.nextAiringEpisode) === null || _m === void 0 ? void 0 : _m.episode) - 1) !== null && _o !== void 0 ? _o : 0,
                            duration: item.duration,
                            type: item.format,
                        });
                    }),
                };
                return res;
            }
            catch (err) {
                throw new Error(err.message);
            }
        });
        this.getPopularAnime = (page = 1, perPage = 10) => __awaiter(this, void 0, void 0, function* () {
            const options = {
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
                query: (0, queries_1.anilistPopularQuery)(page, perPage),
            };
            try {
                const { data } = yield this.client.post(this.anilistGraphqlUrl, options);
                const res = {
                    currentPage: data.data.Page.pageInfo.currentPage,
                    hasNextPage: data.data.Page.pageInfo.hasNextPage,
                    results: data.data.Page.media.map((item) => {
                        var _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o;
                        return ({
                            id: item.id.toString(),
                            malId: item.idMal,
                            title: {
                                romaji: item.title.romaji,
                                english: item.title.english,
                                native: item.title.native,
                                userPreferred: item.title.userPreferred,
                            } || item.title.romaji,
                            image: (_c = (_b = item.coverImage.extraLarge) !== null && _b !== void 0 ? _b : item.coverImage.large) !== null && _c !== void 0 ? _c : item.coverImage.medium,
                            trailer: {
                                id: (_d = item.trailer) === null || _d === void 0 ? void 0 : _d.id,
                                site: (_e = item.trailer) === null || _e === void 0 ? void 0 : _e.site,
                                thumbnail: (_f = item.trailer) === null || _f === void 0 ? void 0 : _f.thumbnail,
                            },
                            description: item.description,
                            status: item.status == "RELEASING"
                                ? types_1.MediaStatus.ONGOING
                                : item.status == "FINISHED"
                                    ? types_1.MediaStatus.COMPLETED
                                    : item.status == "NOT_YET_RELEASED"
                                        ? types_1.MediaStatus.NOT_YET_AIRED
                                        : item.status == "CANCELLED"
                                            ? types_1.MediaStatus.CANCELLED
                                            : item.status == "HIATUS"
                                                ? types_1.MediaStatus.HIATUS
                                                : types_1.MediaStatus.UNKNOWN,
                            cover: (_j = (_h = (_g = item.bannerImage) !== null && _g !== void 0 ? _g : item.coverImage.extraLarge) !== null && _h !== void 0 ? _h : item.coverImage.large) !== null && _j !== void 0 ? _j : item.coverImage.medium,
                            rating: item.averageScore,
                            releaseDate: item.seasonYear,
                            color: (_k = item.coverImage) === null || _k === void 0 ? void 0 : _k.color,
                            genres: item.genres,
                            totalEpisodes: isNaN(item.episodes)
                                ? 0
                                : (_o = (_l = item.episodes) !== null && _l !== void 0 ? _l : ((_m = item.nextAiringEpisode) === null || _m === void 0 ? void 0 : _m.episode) - 1) !== null && _o !== void 0 ? _o : 0,
                            duration: item.duration,
                            type: item.format,
                        });
                    }),
                };
                return res;
            }
            catch (err) {
                throw new Error(err.message);
            }
        });
        this.getAiringSchedule = (page = 1, perPage = 20, weekStart = (new Date().getDay() + 1) % 7, weekEnd = (new Date().getDay() + 7) % 7, notYetAired = false) => __awaiter(this, void 0, void 0, function* () {
            let day1, day2 = undefined;
            if (typeof weekStart === "string" && typeof weekEnd === "string")
                [day1, day2] = (0, utils_1.getDays)((0, utils_1.capitalizeFirstLetter)(weekStart.toLowerCase()), (0, utils_1.capitalizeFirstLetter)(weekEnd.toLowerCase()));
            else if (typeof weekStart === "number" && typeof weekEnd === "number")
                [day1, day2] = [weekStart, weekEnd];
            else
                throw new Error("Invalid weekStart or weekEnd");
            const options = {
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
                query: (0, queries_1.anilistAiringScheduleQuery)(page, perPage, day1, day2, notYetAired),
            };
            try {
                const { data } = yield this.client.post(this.anilistGraphqlUrl, options);
                const res = {
                    currentPage: data.data.Page.pageInfo.currentPage,
                    hasNextPage: data.data.Page.pageInfo.hasNextPage,
                    results: data.data.Page.airingSchedules.map((item) => {
                        var _b, _c, _d, _e, _f, _g;
                        return ({
                            id: item.media.id.toString(),
                            malId: item.media.idMal,
                            episode: item.episode,
                            airingAt: item.airingAt,
                            title: {
                                romaji: item.media.title.romaji,
                                english: item.media.title.english,
                                native: item.media.title.native,
                                userPreferred: item.media.title.userPreferred,
                            } || item.media.title.romaji,
                            country: item.media.countryOfOrigin,
                            image: (_c = (_b = item.media.coverImage.extraLarge) !== null && _b !== void 0 ? _b : item.media.coverImage.large) !== null && _c !== void 0 ? _c : item.media.coverImage.medium,
                            description: item.media.description,
                            cover: (_f = (_e = (_d = item.media.bannerImage) !== null && _d !== void 0 ? _d : item.media.coverImage.extraLarge) !== null && _e !== void 0 ? _e : item.media.coverImage.large) !== null && _f !== void 0 ? _f : item.media.coverImage.medium,
                            genres: item.media.genres,
                            color: (_g = item.media.coverImage) === null || _g === void 0 ? void 0 : _g.color,
                            rating: item.media.averageScore,
                            releaseDate: item.media.seasonYear,
                            type: item.media.format,
                        });
                    }),
                };
                return res;
            }
            catch (err) {
                throw new Error(err.message);
            }
        });
        this.getRandomAnime = () => __awaiter(this, void 0, void 0, function* () {
            const options = {
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
                query: (0, queries_1.anilistSiteStatisticsQuery)(),
            };
            try {
                // const {
                //   data: { data },
                // } = await this.client.post(this.anilistGraphqlUrl, options);
                // const selectedAnime = Math.floor(
                //   Math.random() * data.SiteStatistics.anime.nodes[data.SiteStatistics.anime.nodes.length - 1].count
                // );
                // const { results } = await this.advancedSearch(undefined, 'ANIME', Math.ceil(selectedAnime / 50), 50);
                const { data: data } = yield this.client.get("https://raw.githubusercontent.com/TDanks2000/anilistIds/main/anime_ids.txt");
                const ids = data === null || data === void 0 ? void 0 : data.trim().split("\n");
                const selectedAnime = Math.floor(Math.random() * ids.length);
                return yield this.getMediaInfo(ids[selectedAnime]);
            }
            catch (err) {
                throw new Error(err.message);
            }
        });
        this.getStaffById = (id) => __awaiter(this, void 0, void 0, function* () {
            throw new Error("Not implemented yet");
        });
        this.getAnimeGenres = (genres, page = 1, perPage = 20) => __awaiter(this, void 0, void 0, function* () {
            if (genres.length === 0)
                throw new Error("No genres specified");
            for (const genre of genres)
                if (!Object.values(types_1.Genres).includes(genre))
                    throw new Error("Invalid genre");
            const options = {
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
                query: (0, queries_1.anilistGenresQuery)(genres, page, perPage),
            };
            try {
                const { data } = yield this.client.post(this.anilistGraphqlUrl, options);
                const res = {
                    currentPage: data.data.Page.pageInfo.currentPage,
                    hasNextPage: data.data.Page.pageInfo.hasNextPage,
                    results: data.data.Page.media.map((item) => {
                        var _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o;
                        return ({
                            id: item.id.toString(),
                            malId: item.idMal,
                            title: {
                                romaji: item.title.romaji,
                                english: item.title.english,
                                native: item.title.native,
                                userPreferred: item.title.userPreferred,
                            } || item.title.romaji,
                            image: (_c = (_b = item.coverImage.extraLarge) !== null && _b !== void 0 ? _b : item.coverImage.large) !== null && _c !== void 0 ? _c : item.coverImage.medium,
                            trailer: {
                                id: (_d = item.trailer) === null || _d === void 0 ? void 0 : _d.id,
                                site: (_e = item.trailer) === null || _e === void 0 ? void 0 : _e.site,
                                thumbnail: (_f = item.trailer) === null || _f === void 0 ? void 0 : _f.thumbnail,
                            },
                            description: item.description,
                            cover: (_j = (_h = (_g = item.bannerImage) !== null && _g !== void 0 ? _g : item.coverImage.extraLarge) !== null && _h !== void 0 ? _h : item.coverImage.large) !== null && _j !== void 0 ? _j : item.coverImage.medium,
                            rating: item.averageScore,
                            releaseDate: item.seasonYear,
                            color: (_k = item.coverImage) === null || _k === void 0 ? void 0 : _k.color,
                            genres: item.genres,
                            totalEpisodes: isNaN(item.episodes)
                                ? 0
                                : (_o = (_l = item.episodes) !== null && _l !== void 0 ? _l : ((_m = item.nextAiringEpisode) === null || _m === void 0 ? void 0 : _m.episode) - 1) !== null && _o !== void 0 ? _o : 0,
                            duration: item.duration,
                            type: item.format,
                        });
                    }),
                };
                return res;
            }
            catch (err) {
                throw new Error(err.message);
            }
        });
        this.gethAnilistInfoById = (id) => __awaiter(this, void 0, void 0, function* () {
            var _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _0, _1, _2, _3, _4, _5, _6, _7, _8, _9, _10;
            const animeInfo = {
                id: id,
                title: "",
            };
            const options = {
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
                query: (0, queries_1.anilistMediaDetailQuery)(id),
            };
            try {
                const { data } = yield this.client.post(this.anilistGraphqlUrl, options).catch(() => {
                    throw new Error("Media not found");
                });
                animeInfo.malId = data.data.Media.idMal;
                animeInfo.title = {
                    romaji: data.data.Media.title.romaji,
                    english: data.data.Media.title.english,
                    native: data.data.Media.title.native,
                    userPreferred: data.data.Media.title.userPreferred,
                };
                if ((_l = data.data.Media.trailer) === null || _l === void 0 ? void 0 : _l.id) {
                    animeInfo.trailer = {
                        id: (_m = data.data.Media.trailer) === null || _m === void 0 ? void 0 : _m.id,
                        site: (_o = data.data.Media.trailer) === null || _o === void 0 ? void 0 : _o.site,
                        thumbnail: (_p = data.data.Media.trailer) === null || _p === void 0 ? void 0 : _p.thumbnail,
                    };
                }
                animeInfo.synonyms = data.data.Media.synonyms;
                animeInfo.isLicensed = data.data.Media.isLicensed;
                animeInfo.isAdult = data.data.Media.isAdult;
                animeInfo.countryOfOrigin = data.data.Media.countryOfOrigin;
                animeInfo.image =
                    (_r = (_q = data.data.Media.coverImage.extraLarge) !== null && _q !== void 0 ? _q : data.data.Media.coverImage.large) !== null && _r !== void 0 ? _r : data.data.Media.coverImage.medium;
                animeInfo.cover = (_s = data.data.Media.bannerImage) !== null && _s !== void 0 ? _s : animeInfo.image;
                animeInfo.description = data.data.Media.description;
                switch (data.data.Media.status) {
                    case "RELEASING":
                        animeInfo.status = types_1.MediaStatus.ONGOING;
                        break;
                    case "FINISHED":
                        animeInfo.status = types_1.MediaStatus.COMPLETED;
                        break;
                    case "NOT_YET_RELEASED":
                        animeInfo.status = types_1.MediaStatus.NOT_YET_AIRED;
                        break;
                    case "CANCELLED":
                        animeInfo.status = types_1.MediaStatus.CANCELLED;
                        break;
                    case "HIATUS":
                        animeInfo.status = types_1.MediaStatus.HIATUS;
                    default:
                        animeInfo.status = types_1.MediaStatus.UNKNOWN;
                }
                animeInfo.releaseDate = data.data.Media.startDate.year;
                if ((_t = data.data.Media.nextAiringEpisode) === null || _t === void 0 ? void 0 : _t.airingAt)
                    animeInfo.nextAiringEpisode = {
                        airingTime: (_u = data.data.Media.nextAiringEpisode) === null || _u === void 0 ? void 0 : _u.airingAt,
                        timeUntilAiring: (_v = data.data.Media.nextAiringEpisode) === null || _v === void 0 ? void 0 : _v.timeUntilAiring,
                        episode: (_w = data.data.Media.nextAiringEpisode) === null || _w === void 0 ? void 0 : _w.episode,
                    };
                animeInfo.totalEpisodes =
                    (_y = (_x = data.data.Media) === null || _x === void 0 ? void 0 : _x.episodes) !== null && _y !== void 0 ? _y : ((_z = data.data.Media.nextAiringEpisode) === null || _z === void 0 ? void 0 : _z.episode) - 1;
                animeInfo.currentEpisode = ((_1 = (_0 = data.data.Media) === null || _0 === void 0 ? void 0 : _0.nextAiringEpisode) === null || _1 === void 0 ? void 0 : _1.episode)
                    ? ((_2 = data.data.Media.nextAiringEpisode) === null || _2 === void 0 ? void 0 : _2.episode) - 1
                    : ((_3 = data.data.Media) === null || _3 === void 0 ? void 0 : _3.episodes) || undefined;
                animeInfo.rating = data.data.Media.averageScore;
                animeInfo.duration = data.data.Media.duration;
                animeInfo.genres = data.data.Media.genres;
                animeInfo.studios = data.data.Media.studios.edges.map((item) => item.node.name);
                animeInfo.season = data.data.Media.season;
                animeInfo.popularity = data.data.Media.popularity;
                animeInfo.type = data.data.Media.format;
                animeInfo.startDate = {
                    year: (_4 = data.data.Media.startDate) === null || _4 === void 0 ? void 0 : _4.year,
                    month: (_5 = data.data.Media.startDate) === null || _5 === void 0 ? void 0 : _5.month,
                    day: (_6 = data.data.Media.startDate) === null || _6 === void 0 ? void 0 : _6.day,
                };
                animeInfo.endDate = {
                    year: (_7 = data.data.Media.endDate) === null || _7 === void 0 ? void 0 : _7.year,
                    month: (_8 = data.data.Media.endDate) === null || _8 === void 0 ? void 0 : _8.month,
                    day: (_9 = data.data.Media.endDate) === null || _9 === void 0 ? void 0 : _9.day,
                };
                animeInfo.recommendations = data.data.Media.recommendations.edges.map((item) => {
                    var _b, _c, _d, _e, _f;
                    return ({
                        id: item.node.mediaRecommendation.id,
                        malId: item.node.mediaRecommendation.idMal,
                        title: {
                            romaji: item.node.mediaRecommendation.title.romaji,
                            english: item.node.mediaRecommendation.title.english,
                            native: item.node.mediaRecommendation.title.native,
                            userPreferred: item.node.mediaRecommendation.title.userPreferred,
                        },
                        status: item.node.mediaRecommendation.status == "RELEASING"
                            ? types_1.MediaStatus.ONGOING
                            : item.node.mediaRecommendation.status == "FINISHED"
                                ? types_1.MediaStatus.COMPLETED
                                : item.node.mediaRecommendation.status == "NOT_YET_RELEASED"
                                    ? types_1.MediaStatus.NOT_YET_AIRED
                                    : item.node.mediaRecommendation.status == "CANCELLED"
                                        ? types_1.MediaStatus.CANCELLED
                                        : item.node.mediaRecommendation.status == "HIATUS"
                                            ? types_1.MediaStatus.HIATUS
                                            : types_1.MediaStatus.UNKNOWN,
                        episodes: item.node.mediaRecommendation.episodes,
                        image: (_c = (_b = item.node.mediaRecommendation.coverImage.extraLarge) !== null && _b !== void 0 ? _b : item.node.mediaRecommendation.coverImage.large) !== null && _c !== void 0 ? _c : item.node.mediaRecommendation.coverImage.medium,
                        cover: (_f = (_e = (_d = item.node.mediaRecommendation.bannerImage) !== null && _d !== void 0 ? _d : item.node.mediaRecommendation.coverImage.extraLarge) !== null && _e !== void 0 ? _e : item.node.mediaRecommendation.coverImage.large) !== null && _f !== void 0 ? _f : item.node.mediaRecommendation.coverImage.medium,
                        rating: item.node.mediaRecommendation.meanScore,
                        type: item.node.mediaRecommendation.format,
                    });
                });
                animeInfo.characters = data.data.Media.characters.edges.map((item) => {
                    var _b;
                    return ({
                        id: item.node.id,
                        role: item.role,
                        name: {
                            first: item.node.name.first,
                            last: item.node.name.last,
                            full: item.node.name.full,
                            native: item.node.name.native,
                            userPreferred: item.node.name.userPreferred,
                        },
                        image: (_b = item.node.image.large) !== null && _b !== void 0 ? _b : item.node.image.medium,
                        voiceActors: item.voiceActors.map((voiceActor) => {
                            var _b;
                            return ({
                                id: voiceActor.id,
                                language: voiceActor.languageV2,
                                name: {
                                    first: voiceActor.name.first,
                                    last: voiceActor.name.last,
                                    full: voiceActor.name.full,
                                    native: voiceActor.name.native,
                                    userPreferred: voiceActor.name.userPreferred,
                                },
                                image: (_b = voiceActor.image.large) !== null && _b !== void 0 ? _b : voiceActor.image.medium,
                            });
                        }),
                    });
                });
                animeInfo.color = (_10 = data.data.Media.coverImage) === null || _10 === void 0 ? void 0 : _10.color;
                animeInfo.relations = data.data.Media.relations.edges.map((item) => {
                    var _b, _c, _d, _e, _f;
                    return ({
                        id: item.node.id,
                        malId: item.node.idMal,
                        relationType: item.relationType,
                        title: {
                            romaji: item.node.title.romaji,
                            english: item.node.title.english,
                            native: item.node.title.native,
                            userPreferred: item.node.title.userPreferred,
                        },
                        status: item.node.status == "RELEASING"
                            ? types_1.MediaStatus.ONGOING
                            : item.node.status == "FINISHED"
                                ? types_1.MediaStatus.COMPLETED
                                : item.node.status == "NOT_YET_RELEASED"
                                    ? types_1.MediaStatus.NOT_YET_AIRED
                                    : item.node.status == "CANCELLED"
                                        ? types_1.MediaStatus.CANCELLED
                                        : item.node.status == "HIATUS"
                                            ? types_1.MediaStatus.HIATUS
                                            : types_1.MediaStatus.UNKNOWN,
                        episodes: item.node.episodes,
                        image: (_c = (_b = item.node.coverImage.extraLarge) !== null && _b !== void 0 ? _b : item.node.coverImage.large) !== null && _c !== void 0 ? _c : item.node.coverImage.medium,
                        cover: (_f = (_e = (_d = item.node.bannerImage) !== null && _d !== void 0 ? _d : item.node.coverImage.extraLarge) !== null && _e !== void 0 ? _e : item.node.coverImage.large) !== null && _f !== void 0 ? _f : item.node.coverImage.medium,
                        rating: item.node.meanScore,
                        type: item.node.format,
                    });
                });
                return animeInfo;
            }
            catch (err) {
                throw new Error(err.message);
            }
        });
        this.getCharacterInfoById = (id) => __awaiter(this, void 0, void 0, function* () {
            var _11, _12, _13, _14, _15, _16, _17, _18, _19, _20, _21, _22, _23, _24, _25, _26, _27, _28, _29, _30, _31, _32, _33, _34, _35, _36, _37, _38, _39, _40, _41, _42, _43;
            const options = {
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
                query: (0, queries_1.anilistCharacterQuery)(),
                variables: {
                    id: id,
                },
            };
            try {
                const { data: { data: { Character }, }, } = yield this.client.post(this.anilistGraphqlUrl, options);
                const height = (_11 = Character.description.match(/__Height:__(.*)/)) === null || _11 === void 0 ? void 0 : _11[1].trim();
                const weight = (_12 = Character.description.match(/__Weight:__(.*)/)) === null || _12 === void 0 ? void 0 : _12[1].trim();
                const hairColor = (_13 = Character.description.match(/__Hair Color:__(.*)/)) === null || _13 === void 0 ? void 0 : _13[1].trim();
                const eyeColor = (_14 = Character.description.match(/__Eye Color:__(.*)/)) === null || _14 === void 0 ? void 0 : _14[1].trim();
                const relatives = (_15 = Character.description
                    .match(/__Relatives:__(.*)/)) === null || _15 === void 0 ? void 0 : _15[1].trim().split(/(, \[)/g).filter((g) => !g.includes(", [")).map((r) => {
                    var _b, _c, _d;
                    return ({
                        id: (_b = r.match(/\/(\d+)/)) === null || _b === void 0 ? void 0 : _b[1],
                        name: (_c = r.match(/([^)]+)\]/)) === null || _c === void 0 ? void 0 : _c[1].replace(/\[/g, ""),
                        relationship: (_d = r.match(/\(([^)]+)\).*?(\(([^)]+)\))/)) === null || _d === void 0 ? void 0 : _d[3],
                    });
                });
                const race = (_16 = Character.description
                    .match(/__Race:__(.*)/)) === null || _16 === void 0 ? void 0 : _16[1].split(", ").map((r) => r.trim());
                const rank = (_17 = Character.description.match(/__Rank:__(.*)/)) === null || _17 === void 0 ? void 0 : _17[1];
                const occupation = (_18 = Character.description.match(/__Occupation:__(.*)/)) === null || _18 === void 0 ? void 0 : _18[1];
                const previousPosition = (_20 = (_19 = Character.description
                    .match(/__Previous Position:__(.*)/)) === null || _19 === void 0 ? void 0 : _19[1]) === null || _20 === void 0 ? void 0 : _20.trim();
                const partner = (_21 = Character.description
                    .match(/__Partner:__(.*)/)) === null || _21 === void 0 ? void 0 : _21[1].split(/(, \[)/g).filter((g) => !g.includes(", [")).map((r) => {
                    var _b, _c;
                    return ({
                        id: (_b = r.match(/\/(\d+)/)) === null || _b === void 0 ? void 0 : _b[1],
                        name: (_c = r.match(/([^)]+)\]/)) === null || _c === void 0 ? void 0 : _c[1].replace(/\[/g, ""),
                    });
                });
                const dislikes = (_22 = Character.description.match(/__Dislikes:__(.*)/)) === null || _22 === void 0 ? void 0 : _22[1];
                const sign = (_23 = Character.description.match(/__Sign:__(.*)/)) === null || _23 === void 0 ? void 0 : _23[1];
                const zodicSign = (_25 = (_24 = Character.description.match(/__Zodiac sign:__(.*)/)) === null || _24 === void 0 ? void 0 : _24[1]) === null || _25 === void 0 ? void 0 : _25.trim();
                const zodicAnimal = (_27 = (_26 = Character.description.match(/__Zodiac Animal:__(.*)/)) === null || _26 === void 0 ? void 0 : _26[1]) === null || _27 === void 0 ? void 0 : _27.trim();
                const themeSong = (_29 = (_28 = Character.description.match(/__Theme Song:__(.*)/)) === null || _28 === void 0 ? void 0 : _28[1]) === null || _29 === void 0 ? void 0 : _29.trim();
                Character.description = Character.description.replace(/__Theme Song:__(.*)\n|__Race:__(.*)\n|__Height:__(.*)\n|__Relatives:__(.*)\n|__Rank:__(.*)\n|__Zodiac sign:__(.*)\n|__Zodiac Animal:__(.*)\n|__Weight:__(.*)\n|__Eye Color:__(.*)\n|__Hair Color:__(.*)\n|__Dislikes:__(.*)\n|__Sign:__(.*)\n|__Partner:__(.*)\n|__Previous Position:__(.*)\n|__Occupation:__(.*)\n/gm, "");
                const characterInfo = {
                    id: Character.id,
                    name: {
                        first: (_30 = Character.name) === null || _30 === void 0 ? void 0 : _30.first,
                        last: (_31 = Character.name) === null || _31 === void 0 ? void 0 : _31.last,
                        full: (_32 = Character.name) === null || _32 === void 0 ? void 0 : _32.full,
                        native: (_33 = Character.name) === null || _33 === void 0 ? void 0 : _33.native,
                        userPreferred: (_34 = Character.name) === null || _34 === void 0 ? void 0 : _34.userPreferred,
                        alternative: (_35 = Character.name) === null || _35 === void 0 ? void 0 : _35.alternative,
                        alternativeSpoiler: (_36 = Character.name) === null || _36 === void 0 ? void 0 : _36.alternativeSpoiler,
                    },
                    image: (_38 = (_37 = Character.image) === null || _37 === void 0 ? void 0 : _37.large) !== null && _38 !== void 0 ? _38 : (_39 = Character.image) === null || _39 === void 0 ? void 0 : _39.medium,
                    description: Character.description,
                    gender: Character.gender,
                    dateOfBirth: {
                        year: (_40 = Character.dateOfBirth) === null || _40 === void 0 ? void 0 : _40.year,
                        month: (_41 = Character.dateOfBirth) === null || _41 === void 0 ? void 0 : _41.month,
                        day: (_42 = Character.dateOfBirth) === null || _42 === void 0 ? void 0 : _42.day,
                    },
                    bloodType: Character.bloodType,
                    age: Character.age,
                    hairColor: hairColor,
                    eyeColor: eyeColor,
                    height: height,
                    weight: weight,
                    occupation: occupation,
                    partner: partner,
                    relatives: relatives,
                    race: race,
                    rank: rank,
                    previousPosition: previousPosition,
                    dislikes: dislikes,
                    sign: sign,
                    zodicSign: zodicSign,
                    zodicAnimal: zodicAnimal,
                    themeSong: themeSong,
                    relations: (_43 = Character.media.edges) === null || _43 === void 0 ? void 0 : _43.map((v) => {
                        var _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m;
                        return ({
                            id: v.node.id,
                            malId: v.node.idMal,
                            role: v.characterRole,
                            title: {
                                romaji: (_b = v.node.title) === null || _b === void 0 ? void 0 : _b.romaji,
                                english: (_c = v.node.title) === null || _c === void 0 ? void 0 : _c.english,
                                native: (_d = v.node.title) === null || _d === void 0 ? void 0 : _d.native,
                                userPreferred: (_e = v.node.title) === null || _e === void 0 ? void 0 : _e.userPreferred,
                            },
                            status: v.node.status == "RELEASING"
                                ? types_1.MediaStatus.ONGOING
                                : v.node.status == "FINISHED"
                                    ? types_1.MediaStatus.COMPLETED
                                    : v.node.status == "NOT_YET_RELEASED"
                                        ? types_1.MediaStatus.NOT_YET_AIRED
                                        : v.node.status == "CANCELLED"
                                            ? types_1.MediaStatus.CANCELLED
                                            : v.node.status == "HIATUS"
                                                ? types_1.MediaStatus.HIATUS
                                                : types_1.MediaStatus.UNKNOWN,
                            episodes: v.node.episodes,
                            image: (_j = (_g = (_f = v.node.coverImage) === null || _f === void 0 ? void 0 : _f.extraLarge) !== null && _g !== void 0 ? _g : (_h = v.node.coverImage) === null || _h === void 0 ? void 0 : _h.large) !== null && _j !== void 0 ? _j : (_k = v.node.coverImage) === null || _k === void 0 ? void 0 : _k.medium,
                            rating: v.node.averageScore,
                            releaseDate: (_l = v.node.startDate) === null || _l === void 0 ? void 0 : _l.year,
                            type: v.node.format,
                            color: (_m = v.node.coverImage) === null || _m === void 0 ? void 0 : _m.color,
                        });
                    }),
                };
                return characterInfo;
            }
            catch (err) {
                throw new Error(err.message);
            }
        });
        this.findMangaSlug = (provider, title, malId) => __awaiter(this, void 0, void 0, function* () {
            const slug = title.replace(/[^0-9a-zA-Z]+/g, " ");
            let possibleManga;
            if (!malId) {
                possibleManga = yield this.findMangaRaw(provider, slug, title);
            }
            const malAsyncReq = yield this.client.get(`https://raw.githubusercontent.com/bal-mackup/mal-backup/master/mal/manga/${malId}.json`, {
                validateStatus: () => true,
            });
            if (malAsyncReq.status !== 200) {
                possibleManga = yield this.findMangaRaw(provider, slug, title);
            }
            const sitesT = malAsyncReq.data.Sites;
            let sites = Object.values(sitesT).map((v, i) => {
                const obj = [...Object.values(Object.values(sitesT)[i])];
                const pages = obj.map((v) => ({ page: v.page, url: v.url, title: v.title }));
                return pages;
            });
            sites = sites.flat();
            sites.sort((a, b) => {
                const targetTitle = title.toLowerCase();
                const firstRating = (0, utils_1.compareTwoStrings)(targetTitle, a.title.toLowerCase());
                const secondRating = (0, utils_1.compareTwoStrings)(targetTitle, b.title.toLowerCase());
                // Sort in descending order
                return secondRating - firstRating;
            });
            const possibleSource = sites.find((s) => s.page.toLowerCase() === provider.metaData.name.toLowerCase());
            if (possibleSource) {
                possibleManga = yield provider.getMediaInfo(possibleSource.url.split("/").pop());
            }
            else {
                possibleManga = yield this.findMangaRaw(provider, slug, title);
            }
            const possibleProviderChapters = possibleManga.chapters;
            return possibleProviderChapters;
        });
        this.findMangaRaw = (provider, slug, title) => __awaiter(this, void 0, void 0, function* () {
            const findAnime = (yield provider.search(slug));
            if (findAnime.results.length === 0)
                return [];
            // TODO: use much better way than this
            const possibleManga = findAnime.results.find((manga) => title.toLowerCase() == (typeof manga.title === "string" ? manga.title.toLowerCase() : ""));
            if (!possibleManga) {
                return (yield provider.getMediaInfo(findAnime.results[0].id));
            }
            return (yield provider.getMediaInfo(possibleManga.id));
        });
        this.findManga = (provider, title, malId) => __awaiter(this, void 0, void 0, function* () {
            var _44, _45;
            title.english = (_44 = title.english) !== null && _44 !== void 0 ? _44 : title.romaji;
            title.romaji = (_45 = title.romaji) !== null && _45 !== void 0 ? _45 : title.english;
            title.english = title.english.toLowerCase();
            title.romaji = title.romaji.toLowerCase();
            if (title.english === title.romaji)
                return yield this.findMangaSlug(provider, title.english, malId);
            const romajiPossibleEpisodes = this.findMangaSlug(provider, title.romaji, malId);
            if (romajiPossibleEpisodes) {
                return romajiPossibleEpisodes;
            }
            const englishPossibleEpisodes = this.findMangaSlug(provider, title.english, malId);
            return englishPossibleEpisodes;
        });
        this.provider = provider || new gogoanime_1.default();
        this.animapped_api_key = animapped_api_key !== null && animapped_api_key !== void 0 ? animapped_api_key : "";
    }
    search(query, page = 1, perPage = 15) {
        var _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p;
        return __awaiter(this, void 0, void 0, function* () {
            const options = {
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
                query: (0, queries_1.anilistSearchQuery)(query, page, perPage),
            };
            try {
                let { data, status } = yield axios_1.default.post(this.anilistGraphqlUrl, options, {
                    validateStatus: () => true,
                });
                const res = {
                    currentPage: (_d = (_c = (_b = data.data.Page) === null || _b === void 0 ? void 0 : _b.pageInfo) === null || _c === void 0 ? void 0 : _c.currentPage) !== null && _d !== void 0 ? _d : (_e = data.meta) === null || _e === void 0 ? void 0 : _e.currentPage,
                    hasNextPage: (_h = (_g = (_f = data.data.Page) === null || _f === void 0 ? void 0 : _f.pageInfo) === null || _g === void 0 ? void 0 : _g.hasNextPage) !== null && _h !== void 0 ? _h : ((_j = data.meta) === null || _j === void 0 ? void 0 : _j.currentPage) != ((_k = data.meta) === null || _k === void 0 ? void 0 : _k.lastPage),
                    results: (_p = (_o = (_m = (_l = data.data) === null || _l === void 0 ? void 0 : _l.Page) === null || _m === void 0 ? void 0 : _m.media) === null || _o === void 0 ? void 0 : _o.map((item) => {
                        var _b, _c, _d, _e, _f, _g, _h, _j, _k;
                        return ({
                            id: item.id.toString(),
                            malId: item.idMal,
                            title: {
                                romaji: item.title.romaji,
                                english: item.title.english,
                                native: item.title.native,
                                userPreferred: item.title.userPreferred,
                            } || item.title.romaji,
                            status: item.status == "RELEASING"
                                ? types_1.MediaStatus.ONGOING
                                : item.status == "FINISHED"
                                    ? types_1.MediaStatus.COMPLETED
                                    : item.status == "NOT_YET_RELEASED"
                                        ? types_1.MediaStatus.NOT_YET_AIRED
                                        : item.status == "CANCELLED"
                                            ? types_1.MediaStatus.CANCELLED
                                            : item.status == "HIATUS"
                                                ? types_1.MediaStatus.HIATUS
                                                : types_1.MediaStatus.UNKNOWN,
                            image: (_e = (_c = (_b = item.coverImage) === null || _b === void 0 ? void 0 : _b.extraLarge) !== null && _c !== void 0 ? _c : (_d = item.coverImage) === null || _d === void 0 ? void 0 : _d.large) !== null && _e !== void 0 ? _e : (_f = item.coverImage) === null || _f === void 0 ? void 0 : _f.medium,
                            cover: item.bannerImage,
                            popularity: item.popularity,
                            description: item.description,
                            rating: item.averageScore,
                            genres: item.genres,
                            color: (_g = item.coverImage) === null || _g === void 0 ? void 0 : _g.color,
                            totalEpisodes: (_h = item.episodes) !== null && _h !== void 0 ? _h : ((_j = item.nextAiringEpisode) === null || _j === void 0 ? void 0 : _j.episode) - 1,
                            currentEpisodeCount: (item === null || item === void 0 ? void 0 : item.nextAiringEpisode)
                                ? ((_k = item === null || item === void 0 ? void 0 : item.nextAiringEpisode) === null || _k === void 0 ? void 0 : _k.episode) - 1
                                : item.episodes,
                            type: item.format,
                            releaseDate: item.seasonYear,
                        });
                    })) !== null && _p !== void 0 ? _p : data.data.map((item) => {
                        var _b, _c;
                        return ({
                            id: item.anilistId.toString(),
                            malId: item.mappings["mal"],
                            title: item.title,
                            status: item.status == "RELEASING"
                                ? types_1.MediaStatus.ONGOING
                                : item.status == "FINISHED"
                                    ? types_1.MediaStatus.COMPLETED
                                    : item.status == "NOT_YET_RELEASED"
                                        ? types_1.MediaStatus.NOT_YET_AIRED
                                        : item.status == "CANCELLED"
                                            ? types_1.MediaStatus.CANCELLED
                                            : item.status == "HIATUS"
                                                ? types_1.MediaStatus.HIATUS
                                                : types_1.MediaStatus.UNKNOWN,
                            image: (_b = item.coverImage) !== null && _b !== void 0 ? _b : item.bannerImage,
                            cover: item.bannerImage,
                            popularity: item.popularity,
                            description: item.description,
                            rating: item.averageScore,
                            genres: item.genre,
                            color: item.color,
                            totalEpisodes: item.currentEpisode,
                            currentEpisodeCount: (item === null || item === void 0 ? void 0 : item.nextAiringEpisode)
                                ? ((_c = item === null || item === void 0 ? void 0 : item.nextAiringEpisode) === null || _c === void 0 ? void 0 : _c.episode) - 1
                                : item.currentEpisode,
                            type: item.format,
                            releaseDate: item.year,
                        });
                    }),
                };
                return res;
            }
            catch (err) {
                throw new Error(err.message);
            }
        });
    }
    advancedSearch({ query, type = "ANIME", page = 1, perPage = 20, format, sort, genres, id, year, status, season, }) {
        var _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y;
        return __awaiter(this, void 0, void 0, function* () {
            const options = {
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
                query: (0, queries_1.anilistAdvancedQuery)(),
                variables: {
                    search: query,
                    type: type,
                    page: page,
                    size: perPage,
                    format: format,
                    sort: sort,
                    genres: genres,
                    id: id,
                    year: year ? `${year}%` : undefined,
                    status: status,
                    season: season,
                },
            };
            if (genres) {
                genres.forEach((genre) => {
                    if (!Object.values(types_1.Genres).includes(genre)) {
                        throw new Error(`genre ${genre} is not valid`);
                    }
                });
            }
            try {
                let { data, status } = yield axios_1.default.post(this.anilistGraphqlUrl, options, {
                    validateStatus: () => true,
                });
                if (status >= 500 && !query)
                    throw new Error("No results found");
                const res = {
                    currentPage: (_e = (_d = (_c = (_b = data.data) === null || _b === void 0 ? void 0 : _b.Page) === null || _c === void 0 ? void 0 : _c.pageInfo) === null || _d === void 0 ? void 0 : _d.currentPage) !== null && _e !== void 0 ? _e : (_f = data.meta) === null || _f === void 0 ? void 0 : _f.currentPage,
                    hasNextPage: (_k = (_j = (_h = (_g = data.data) === null || _g === void 0 ? void 0 : _g.Page) === null || _h === void 0 ? void 0 : _h.pageInfo) === null || _j === void 0 ? void 0 : _j.hasNextPage) !== null && _k !== void 0 ? _k : ((_l = data.meta) === null || _l === void 0 ? void 0 : _l.currentPage) != ((_m = data.meta) === null || _m === void 0 ? void 0 : _m.lastPage),
                    totalPages: (_q = (_p = (_o = data.data) === null || _o === void 0 ? void 0 : _o.Page) === null || _p === void 0 ? void 0 : _p.pageInfo) === null || _q === void 0 ? void 0 : _q.lastPage,
                    totalResults: (_t = (_s = (_r = data.data) === null || _r === void 0 ? void 0 : _r.Page) === null || _s === void 0 ? void 0 : _s.pageInfo) === null || _t === void 0 ? void 0 : _t.total,
                    results: [],
                };
                res.results.push(...((_x = (_w = (_v = (_u = data.data) === null || _u === void 0 ? void 0 : _u.Page) === null || _v === void 0 ? void 0 : _v.media) === null || _w === void 0 ? void 0 : _w.map((item) => {
                    var _b, _c, _d, _e, _f, _g, _h;
                    return ({
                        id: item.id.toString(),
                        malId: item.idMal,
                        title: {
                            romaji: item.title.romaji,
                            english: item.title.english,
                            native: item.title.native,
                            userPreferred: item.title.userPreferred,
                        } || item.title.romaji,
                        status: item.status == "RELEASING"
                            ? types_1.MediaStatus.ONGOING
                            : item.status == "FINISHED"
                                ? types_1.MediaStatus.COMPLETED
                                : item.status == "NOT_YET_RELEASED"
                                    ? types_1.MediaStatus.NOT_YET_AIRED
                                    : item.status == "CANCELLED"
                                        ? types_1.MediaStatus.CANCELLED
                                        : item.status == "HIATUS"
                                            ? types_1.MediaStatus.HIATUS
                                            : types_1.MediaStatus.UNKNOWN,
                        image: (_c = (_b = item.coverImage.extraLarge) !== null && _b !== void 0 ? _b : item.coverImage.large) !== null && _c !== void 0 ? _c : item.coverImage.medium,
                        cover: item.bannerImage,
                        popularity: item.popularity,
                        totalEpisodes: (_d = item.episodes) !== null && _d !== void 0 ? _d : ((_e = item.nextAiringEpisode) === null || _e === void 0 ? void 0 : _e.episode) - 1,
                        currentEpisode: (_g = ((_f = item.nextAiringEpisode) === null || _f === void 0 ? void 0 : _f.episode) - 1) !== null && _g !== void 0 ? _g : item.episodes,
                        countryOfOrigin: item.countryOfOrigin,
                        description: item.description,
                        genres: item.genres,
                        rating: item.averageScore,
                        color: (_h = item.coverImage) === null || _h === void 0 ? void 0 : _h.color,
                        type: item.format,
                        releaseDate: item.seasonYear,
                    });
                })) !== null && _x !== void 0 ? _x : (_y = data.data) === null || _y === void 0 ? void 0 : _y.map((item) => {
                    var _b;
                    return ({
                        id: item.anilistId.toString(),
                        malId: item.mappings["mal"],
                        title: item.title,
                        status: item.status == "RELEASING"
                            ? types_1.MediaStatus.ONGOING
                            : item.status == "FINISHED"
                                ? types_1.MediaStatus.COMPLETED
                                : item.status == "NOT_YET_RELEASED"
                                    ? types_1.MediaStatus.NOT_YET_AIRED
                                    : item.status == "CANCELLED"
                                        ? types_1.MediaStatus.CANCELLED
                                        : item.status == "HIATUS"
                                            ? types_1.MediaStatus.HIATUS
                                            : types_1.MediaStatus.UNKNOWN,
                        image: (_b = item.coverImage) !== null && _b !== void 0 ? _b : item.bannerImage,
                        cover: item.bannerImage,
                        popularity: item.popularity,
                        description: item.description,
                        rating: item.averageScore,
                        genres: item.genre,
                        color: item.color,
                        totalEpisodes: item.currentEpisode,
                        type: item.format,
                        releaseDate: item.year,
                    });
                })));
                return res;
            }
            catch (err) {
                throw new Error(err.message);
            }
        });
    }
    getMediaInfo(id, dub = false, fetchFiller = false) {
        var _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _0, _1, _2, _3, _4, _5, _6, _7, _8, _9, _10, _11, _12, _13, _14, _15, _16, _17, _18, _19, _20, _21, _22, _23, _24, _25, _26, _27, _28, _29, _30, _31, _32, _33, _34, _35, _36, _37, _38, _39, _40, _41, _42, _43, _44, _45, _46, _47, _48, _49, _50, _51, _52, _53, _54, _55, _56, _57, _58, _59, _60, _61, _62, _63, _64, _65, _66, _67, _68, _69, _70, _71, _72, _73, _74, _75, _76, _77, _78, _79, _80, _81, _82, _83, _84, _85, _86, _87, _88, _89, _90, _91, _92, _93, _94, _95, _96, _97, _98, _99, _100, _101, _102, _103, _104, _105;
        return __awaiter(this, void 0, void 0, function* () {
            const animeInfo = {
                id: id,
                title: "",
            };
            const options = {
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
                query: (0, queries_1.anilistMediaDetailQuery)(id),
            };
            let fillerEpisodes;
            try {
                let { data, status } = yield axios_1.default.post(this.anilistGraphqlUrl, options, {
                    validateStatus: () => true,
                });
                if (status == 404)
                    throw new Error("Media not found. Perhaps the id is invalid or the anime is not in anilist");
                if (status == 429)
                    throw new Error("You have been ratelimited by anilist. Please try again later");
                if (status >= 500)
                    throw new Error("Anilist seems to be down. Please try again later");
                if (status != 200 && status < 429)
                    throw Error("Media not found. If the problem persists, please contact the developer");
                animeInfo.malId = (_d = (_c = (_b = data.data) === null || _b === void 0 ? void 0 : _b.Media) === null || _c === void 0 ? void 0 : _c.idMal) !== null && _d !== void 0 ? _d : (_e = data === null || data === void 0 ? void 0 : data.mappings) === null || _e === void 0 ? void 0 : _e.mal;
                animeInfo.title = ((_f = data === null || data === void 0 ? void 0 : data.data) === null || _f === void 0 ? void 0 : _f.Media)
                    ? {
                        romaji: (_g = data.data) === null || _g === void 0 ? void 0 : _g.Media.title.romaji,
                        english: (_h = data.data) === null || _h === void 0 ? void 0 : _h.Media.title.english,
                        native: (_j = data.data) === null || _j === void 0 ? void 0 : _j.Media.title.native,
                        userPreferred: (_k = data.data) === null || _k === void 0 ? void 0 : _k.Media.title.userPreferred,
                    }
                    : data.data.title;
                animeInfo.synonyms = (_o = (_m = (_l = data.data) === null || _l === void 0 ? void 0 : _l.Media) === null || _m === void 0 ? void 0 : _m.synonyms) !== null && _o !== void 0 ? _o : data === null || data === void 0 ? void 0 : data.synonyms;
                animeInfo.isLicensed = (_r = (_q = (_p = data.data) === null || _p === void 0 ? void 0 : _p.Media) === null || _q === void 0 ? void 0 : _q.isLicensed) !== null && _r !== void 0 ? _r : undefined;
                animeInfo.isAdult = (_u = (_t = (_s = data.data) === null || _s === void 0 ? void 0 : _s.Media) === null || _t === void 0 ? void 0 : _t.isAdult) !== null && _u !== void 0 ? _u : undefined;
                animeInfo.countryOfOrigin = (_x = (_w = (_v = data.data) === null || _v === void 0 ? void 0 : _v.Media) === null || _w === void 0 ? void 0 : _w.countryOfOrigin) !== null && _x !== void 0 ? _x : undefined;
                if ((_0 = (_z = (_y = data.data) === null || _y === void 0 ? void 0 : _y.Media) === null || _z === void 0 ? void 0 : _z.trailer) === null || _0 === void 0 ? void 0 : _0.id) {
                    animeInfo.trailer = {
                        id: (_1 = data.data) === null || _1 === void 0 ? void 0 : _1.Media.trailer.id,
                        site: (_3 = (_2 = data.data) === null || _2 === void 0 ? void 0 : _2.Media.trailer) === null || _3 === void 0 ? void 0 : _3.site,
                        thumbnail: (_5 = (_4 = data.data) === null || _4 === void 0 ? void 0 : _4.Media.trailer) === null || _5 === void 0 ? void 0 : _5.thumbnail,
                    };
                }
                animeInfo.image =
                    (_18 = (_17 = (_13 = (_9 = (_8 = (_7 = (_6 = data.data) === null || _6 === void 0 ? void 0 : _6.Media) === null || _7 === void 0 ? void 0 : _7.coverImage) === null || _8 === void 0 ? void 0 : _8.extraLarge) !== null && _9 !== void 0 ? _9 : (_12 = (_11 = (_10 = data.data) === null || _10 === void 0 ? void 0 : _10.Media) === null || _11 === void 0 ? void 0 : _11.coverImage) === null || _12 === void 0 ? void 0 : _12.large) !== null && _13 !== void 0 ? _13 : (_16 = (_15 = (_14 = data.data) === null || _14 === void 0 ? void 0 : _14.Media) === null || _15 === void 0 ? void 0 : _15.coverImage) === null || _16 === void 0 ? void 0 : _16.medium) !== null && _17 !== void 0 ? _17 : data === null || data === void 0 ? void 0 : data.coverImage) !== null && _18 !== void 0 ? _18 : data === null || data === void 0 ? void 0 : data.bannerImage;
                animeInfo.popularity = (_21 = (_20 = (_19 = data.data) === null || _19 === void 0 ? void 0 : _19.Media) === null || _20 === void 0 ? void 0 : _20.popularity) !== null && _21 !== void 0 ? _21 : data === null || data === void 0 ? void 0 : data.popularity;
                animeInfo.color = (_25 = (_24 = (_23 = (_22 = data.data) === null || _22 === void 0 ? void 0 : _22.Media) === null || _23 === void 0 ? void 0 : _23.coverImage) === null || _24 === void 0 ? void 0 : _24.color) !== null && _25 !== void 0 ? _25 : data === null || data === void 0 ? void 0 : data.color;
                animeInfo.cover = (_29 = (_28 = (_27 = (_26 = data.data) === null || _26 === void 0 ? void 0 : _26.Media) === null || _27 === void 0 ? void 0 : _27.bannerImage) !== null && _28 !== void 0 ? _28 : data === null || data === void 0 ? void 0 : data.bannerImage) !== null && _29 !== void 0 ? _29 : animeInfo.image;
                animeInfo.description = (_32 = (_31 = (_30 = data.data) === null || _30 === void 0 ? void 0 : _30.Media) === null || _31 === void 0 ? void 0 : _31.description) !== null && _32 !== void 0 ? _32 : data === null || data === void 0 ? void 0 : data.description;
                switch ((_35 = (_34 = (_33 = data.data) === null || _33 === void 0 ? void 0 : _33.Media) === null || _34 === void 0 ? void 0 : _34.status) !== null && _35 !== void 0 ? _35 : data === null || data === void 0 ? void 0 : data.status) {
                    case "RELEASING":
                        animeInfo.status = types_1.MediaStatus.ONGOING;
                        break;
                    case "FINISHED":
                        animeInfo.status = types_1.MediaStatus.COMPLETED;
                        break;
                    case "NOT_YET_RELEASED":
                        animeInfo.status = types_1.MediaStatus.NOT_YET_AIRED;
                        break;
                    case "CANCELLED":
                        animeInfo.status = types_1.MediaStatus.CANCELLED;
                        break;
                    case "HIATUS":
                        animeInfo.status = types_1.MediaStatus.HIATUS;
                    default:
                        animeInfo.status = types_1.MediaStatus.UNKNOWN;
                }
                animeInfo.releaseDate = (_39 = (_38 = (_37 = (_36 = data.data) === null || _36 === void 0 ? void 0 : _36.Media) === null || _37 === void 0 ? void 0 : _37.startDate) === null || _38 === void 0 ? void 0 : _38.year) !== null && _39 !== void 0 ? _39 : data.year;
                animeInfo.startDate = {
                    year: (_42 = (_41 = (_40 = data === null || data === void 0 ? void 0 : data.data) === null || _40 === void 0 ? void 0 : _40.Media) === null || _41 === void 0 ? void 0 : _41.startDate) === null || _42 === void 0 ? void 0 : _42.year,
                    month: (_45 = (_44 = (_43 = data === null || data === void 0 ? void 0 : data.data) === null || _43 === void 0 ? void 0 : _43.Media) === null || _44 === void 0 ? void 0 : _44.startDate) === null || _45 === void 0 ? void 0 : _45.month,
                    day: (_48 = (_47 = (_46 = data.data) === null || _46 === void 0 ? void 0 : _46.Media) === null || _47 === void 0 ? void 0 : _47.startDate) === null || _48 === void 0 ? void 0 : _48.day,
                };
                animeInfo.endDate = {
                    year: (_51 = (_50 = (_49 = data === null || data === void 0 ? void 0 : data.data) === null || _49 === void 0 ? void 0 : _49.Media) === null || _50 === void 0 ? void 0 : _50.endDate) === null || _51 === void 0 ? void 0 : _51.year,
                    month: (_54 = (_53 = (_52 = data === null || data === void 0 ? void 0 : data.data) === null || _52 === void 0 ? void 0 : _52.Media) === null || _53 === void 0 ? void 0 : _53.endDate) === null || _54 === void 0 ? void 0 : _54.month,
                    day: (_57 = (_56 = (_55 = data === null || data === void 0 ? void 0 : data.data) === null || _55 === void 0 ? void 0 : _55.Media) === null || _56 === void 0 ? void 0 : _56.endDate) === null || _57 === void 0 ? void 0 : _57.day,
                };
                if ((_59 = (_58 = data.data) === null || _58 === void 0 ? void 0 : _58.Media.nextAiringEpisode) === null || _59 === void 0 ? void 0 : _59.airingAt)
                    animeInfo.nextAiringEpisode = {
                        airingTime: (_61 = (_60 = data.data) === null || _60 === void 0 ? void 0 : _60.Media.nextAiringEpisode) === null || _61 === void 0 ? void 0 : _61.airingAt,
                        timeUntilAiring: (_63 = (_62 = data.data) === null || _62 === void 0 ? void 0 : _62.Media.nextAiringEpisode) === null || _63 === void 0 ? void 0 : _63.timeUntilAiring,
                        episode: (_65 = (_64 = data.data) === null || _64 === void 0 ? void 0 : _64.Media.nextAiringEpisode) === null || _65 === void 0 ? void 0 : _65.episode,
                    };
                animeInfo.totalEpisodes =
                    (_68 = (_67 = (_66 = data.data) === null || _66 === void 0 ? void 0 : _66.Media) === null || _67 === void 0 ? void 0 : _67.episodes) !== null && _68 !== void 0 ? _68 : ((_70 = (_69 = data.data) === null || _69 === void 0 ? void 0 : _69.Media.nextAiringEpisode) === null || _70 === void 0 ? void 0 : _70.episode) - 1;
                animeInfo.currentEpisode = ((_73 = (_72 = (_71 = data.data) === null || _71 === void 0 ? void 0 : _71.Media) === null || _72 === void 0 ? void 0 : _72.nextAiringEpisode) === null || _73 === void 0 ? void 0 : _73.episode)
                    ? ((_75 = (_74 = data.data) === null || _74 === void 0 ? void 0 : _74.Media.nextAiringEpisode) === null || _75 === void 0 ? void 0 : _75.episode) - 1
                    : (_77 = (_76 = data.data) === null || _76 === void 0 ? void 0 : _76.Media) === null || _77 === void 0 ? void 0 : _77.episodes;
                animeInfo.rating = (_78 = data.data) === null || _78 === void 0 ? void 0 : _78.Media.averageScore;
                animeInfo.duration = (_79 = data.data) === null || _79 === void 0 ? void 0 : _79.Media.duration;
                animeInfo.genres = (_80 = data.data) === null || _80 === void 0 ? void 0 : _80.Media.genres;
                animeInfo.season = (_81 = data.data) === null || _81 === void 0 ? void 0 : _81.Media.season;
                animeInfo.studios = (_82 = data.data) === null || _82 === void 0 ? void 0 : _82.Media.studios.edges.map((item) => item.node.name);
                animeInfo.subOrDub = dub ? types_1.SubOrDub.DUB : types_1.SubOrDub.SUB;
                animeInfo.type = (_83 = data.data) === null || _83 === void 0 ? void 0 : _83.Media.format;
                animeInfo.recommendations = (_87 = (_86 = (_85 = (_84 = data.data) === null || _84 === void 0 ? void 0 : _84.Media) === null || _85 === void 0 ? void 0 : _85.recommendations) === null || _86 === void 0 ? void 0 : _86.edges) === null || _87 === void 0 ? void 0 : _87.map((item) => {
                    var _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _0, _1, _2, _3, _4, _5, _6, _7, _8, _9, _10, _11, _12;
                    return ({
                        id: (_b = item.node.mediaRecommendation) === null || _b === void 0 ? void 0 : _b.id,
                        malId: (_c = item.node.mediaRecommendation) === null || _c === void 0 ? void 0 : _c.idMal,
                        title: {
                            romaji: (_e = (_d = item.node.mediaRecommendation) === null || _d === void 0 ? void 0 : _d.title) === null || _e === void 0 ? void 0 : _e.romaji,
                            english: (_g = (_f = item.node.mediaRecommendation) === null || _f === void 0 ? void 0 : _f.title) === null || _g === void 0 ? void 0 : _g.english,
                            native: (_j = (_h = item.node.mediaRecommendation) === null || _h === void 0 ? void 0 : _h.title) === null || _j === void 0 ? void 0 : _j.native,
                            userPreferred: (_l = (_k = item.node.mediaRecommendation) === null || _k === void 0 ? void 0 : _k.title) === null || _l === void 0 ? void 0 : _l.userPreferred,
                        },
                        status: ((_m = item.node.mediaRecommendation) === null || _m === void 0 ? void 0 : _m.status) == "RELEASING"
                            ? types_1.MediaStatus.ONGOING
                            : ((_o = item.node.mediaRecommendation) === null || _o === void 0 ? void 0 : _o.status) == "FINISHED"
                                ? types_1.MediaStatus.COMPLETED
                                : ((_p = item.node.mediaRecommendation) === null || _p === void 0 ? void 0 : _p.status) == "NOT_YET_RELEASED"
                                    ? types_1.MediaStatus.NOT_YET_AIRED
                                    : ((_q = item.node.mediaRecommendation) === null || _q === void 0 ? void 0 : _q.status) == "CANCELLED"
                                        ? types_1.MediaStatus.CANCELLED
                                        : ((_r = item.node.mediaRecommendation) === null || _r === void 0 ? void 0 : _r.status) == "HIATUS"
                                            ? types_1.MediaStatus.HIATUS
                                            : types_1.MediaStatus.UNKNOWN,
                        episodes: (_s = item.node.mediaRecommendation) === null || _s === void 0 ? void 0 : _s.episodes,
                        image: (_y = (_v = (_u = (_t = item.node.mediaRecommendation) === null || _t === void 0 ? void 0 : _t.coverImage) === null || _u === void 0 ? void 0 : _u.extraLarge) !== null && _v !== void 0 ? _v : (_x = (_w = item.node.mediaRecommendation) === null || _w === void 0 ? void 0 : _w.coverImage) === null || _x === void 0 ? void 0 : _x.large) !== null && _y !== void 0 ? _y : (_0 = (_z = item.node.mediaRecommendation) === null || _z === void 0 ? void 0 : _z.coverImage) === null || _0 === void 0 ? void 0 : _0.medium,
                        cover: (_8 = (_5 = (_2 = (_1 = item.node.mediaRecommendation) === null || _1 === void 0 ? void 0 : _1.bannerImage) !== null && _2 !== void 0 ? _2 : (_4 = (_3 = item.node.mediaRecommendation) === null || _3 === void 0 ? void 0 : _3.coverImage) === null || _4 === void 0 ? void 0 : _4.extraLarge) !== null && _5 !== void 0 ? _5 : (_7 = (_6 = item.node.mediaRecommendation) === null || _6 === void 0 ? void 0 : _6.coverImage) === null || _7 === void 0 ? void 0 : _7.large) !== null && _8 !== void 0 ? _8 : (_10 = (_9 = item.node.mediaRecommendation) === null || _9 === void 0 ? void 0 : _9.coverImage) === null || _10 === void 0 ? void 0 : _10.medium,
                        rating: (_11 = item.node.mediaRecommendation) === null || _11 === void 0 ? void 0 : _11.meanScore,
                        type: (_12 = item.node.mediaRecommendation) === null || _12 === void 0 ? void 0 : _12.format,
                    });
                });
                animeInfo.characters = (_91 = (_90 = (_89 = (_88 = data.data) === null || _88 === void 0 ? void 0 : _88.Media) === null || _89 === void 0 ? void 0 : _89.characters) === null || _90 === void 0 ? void 0 : _90.edges) === null || _91 === void 0 ? void 0 : _91.map((item) => {
                    var _b, _c;
                    return ({
                        id: (_b = item.node) === null || _b === void 0 ? void 0 : _b.id,
                        role: item.role,
                        name: {
                            first: item.node.name.first,
                            last: item.node.name.last,
                            full: item.node.name.full,
                            native: item.node.name.native,
                            userPreferred: item.node.name.userPreferred,
                        },
                        image: (_c = item.node.image.large) !== null && _c !== void 0 ? _c : item.node.image.medium,
                        voiceActors: item.voiceActors.map((voiceActor) => {
                            var _b;
                            return ({
                                id: voiceActor.id,
                                language: voiceActor.languageV2,
                                name: {
                                    first: voiceActor.name.first,
                                    last: voiceActor.name.last,
                                    full: voiceActor.name.full,
                                    native: voiceActor.name.native,
                                    userPreferred: voiceActor.name.userPreferred,
                                },
                                image: (_b = voiceActor.image.large) !== null && _b !== void 0 ? _b : voiceActor.image.medium,
                            });
                        }),
                    });
                });
                animeInfo.relations = (_95 = (_94 = (_93 = (_92 = data.data) === null || _92 === void 0 ? void 0 : _92.Media) === null || _93 === void 0 ? void 0 : _93.relations) === null || _94 === void 0 ? void 0 : _94.edges) === null || _95 === void 0 ? void 0 : _95.map((item) => {
                    var _b, _c, _d, _e, _f, _g;
                    return ({
                        id: item.node.id,
                        relationType: item.relationType,
                        malId: item.node.idMal,
                        title: {
                            romaji: item.node.title.romaji,
                            english: item.node.title.english,
                            native: item.node.title.native,
                            userPreferred: item.node.title.userPreferred,
                        },
                        status: item.node.status == "RELEASING"
                            ? types_1.MediaStatus.ONGOING
                            : item.node.status == "FINISHED"
                                ? types_1.MediaStatus.COMPLETED
                                : item.node.status == "NOT_YET_RELEASED"
                                    ? types_1.MediaStatus.NOT_YET_AIRED
                                    : item.node.status == "CANCELLED"
                                        ? types_1.MediaStatus.CANCELLED
                                        : item.node.status == "HIATUS"
                                            ? types_1.MediaStatus.HIATUS
                                            : types_1.MediaStatus.UNKNOWN,
                        episodes: item.node.episodes,
                        image: (_c = (_b = item.node.coverImage.extraLarge) !== null && _b !== void 0 ? _b : item.node.coverImage.large) !== null && _c !== void 0 ? _c : item.node.coverImage.medium,
                        color: (_d = item.node.coverImage) === null || _d === void 0 ? void 0 : _d.color,
                        type: item.node.format,
                        cover: (_g = (_f = (_e = item.node.bannerImage) !== null && _e !== void 0 ? _e : item.node.coverImage.extraLarge) !== null && _f !== void 0 ? _f : item.node.coverImage.large) !== null && _g !== void 0 ? _g : item.node.coverImage.medium,
                        rating: item.node.meanScore,
                    });
                });
                if (this.provider instanceof gogoanime_1.default &&
                    !dub &&
                    (animeInfo.status === types_1.MediaStatus.ONGOING ||
                        (0, utils_1.range)({ from: 1940, to: new Date().getFullYear() + 1 }).includes(parseInt(animeInfo.releaseDate)))) {
                    try {
                        animeInfo.episodes = yield this.fetchDefaultEpisodeList({
                            idMal: animeInfo.malId,
                            season: data.data.Media.season,
                            startDate: { year: parseInt(animeInfo.releaseDate) },
                            title: { english: (_96 = animeInfo.title) === null || _96 === void 0 ? void 0 : _96.english, romaji: (_97 = animeInfo.title) === null || _97 === void 0 ? void 0 : _97.romaji },
                        }, dub, id);
                        animeInfo.episodes = (_98 = animeInfo.episodes) === null || _98 === void 0 ? void 0 : _98.map((episode) => {
                            if (!episode.image)
                                episode.image = animeInfo.image;
                            return episode;
                        });
                    }
                    catch (err) {
                        animeInfo.episodes = yield this.fetchDefaultEpisodeList({
                            idMal: animeInfo.malId,
                            season: data.data.Media.season,
                            startDate: { year: parseInt(animeInfo.releaseDate) },
                            title: { english: (_99 = animeInfo.title) === null || _99 === void 0 ? void 0 : _99.english, romaji: (_100 = animeInfo.title) === null || _100 === void 0 ? void 0 : _100.romaji },
                        }, dub, id);
                        animeInfo.episodes = (_101 = animeInfo.episodes) === null || _101 === void 0 ? void 0 : _101.map((episode) => {
                            if (!episode.image)
                                episode.image = animeInfo.image;
                            return episode;
                        });
                        return animeInfo;
                    }
                }
                else
                    animeInfo.episodes = yield this.fetchDefaultEpisodeList({
                        idMal: animeInfo.malId,
                        season: data.data.Media.season,
                        startDate: { year: parseInt(animeInfo.releaseDate) },
                        title: { english: (_102 = animeInfo.title) === null || _102 === void 0 ? void 0 : _102.english, romaji: (_103 = animeInfo.title) === null || _103 === void 0 ? void 0 : _103.romaji },
                        externalLinks: data.data.Media.externalLinks.filter((link) => link.type === "STREAMING"),
                    }, dub, id);
                animeInfo.episodes = (_104 = animeInfo.episodes) === null || _104 === void 0 ? void 0 : _104.map((episode) => {
                    if (!episode.image)
                        episode.image = animeInfo.image;
                    return episode;
                });
                if (fetchFiller) {
                    const { data: fillerData } = yield this.client.get(`https://raw.githubusercontent.com/TobyBridle/mal-id-filler-list/main/fillers/${animeInfo.malId}.json`, { validateStatus: () => true });
                    if (!fillerData.toString().startsWith("404")) {
                        fillerEpisodes = [];
                        fillerEpisodes === null || fillerEpisodes === void 0 ? void 0 : fillerEpisodes.push(...fillerData.episodes);
                    }
                }
                animeInfo.episodes = (_105 = animeInfo.episodes) === null || _105 === void 0 ? void 0 : _105.map((episode) => {
                    if (!episode.image)
                        episode.image = animeInfo.image;
                    if (fetchFiller && (fillerEpisodes === null || fillerEpisodes === void 0 ? void 0 : fillerEpisodes.length) > 0) {
                        if (fillerEpisodes[episode.number - 1])
                            episode.isFiller = new Boolean(fillerEpisodes[episode.number - 1]["filler-bool"]).valueOf();
                    }
                    return episode;
                });
                return animeInfo;
            }
            catch (error) {
                console.error(error);
                throw new Error(`Anilist Error: ${error.message}`);
            }
        });
    }
    getMediaSources(episodeId, ...args) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return this.provider.getMediaSources(episodeId, ...args);
            }
            catch (error) {
                throw new Error(`Failed to fetch episode sources from ${this.provider.metaData.name}: ${error}`);
            }
        });
    }
    getMediaServers(episodeId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return this.provider.getMediaServers(episodeId);
            }
            catch (err) {
                throw new Error(`Failed to fetch episode servers from ${this.provider.metaData.name}: ${err}`);
            }
        });
    }
}
_a = Anilist;
Anilist.Anime = _a;
Anilist.Manga = class Manga {
    /**
     * Maps anilist manga to any manga provider (mangadex, mangasee, etc)
     * @param provider MangaParser
     */
    constructor(provider) {
        /**
         *
         * @param query query to search for
         * @param page (optional) page number (default: `1`)
         * @param perPage (optional) number of results per page (default: `20`)
         */
        this.search = (query, page = 1, perPage = 20) => __awaiter(this, void 0, void 0, function* () {
            const options = {
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
                query: (0, queries_1.anilistSearchQuery)(query, page, perPage, "MANGA"),
            };
            try {
                const { data } = yield axios_1.default.post(new Anilist().anilistGraphqlUrl, options);
                const res = {
                    currentPage: data.data.Page.pageInfo.currentPage,
                    hasNextPage: data.data.Page.pageInfo.hasNextPage,
                    results: data.data.Page.media.map((item) => {
                        var _b, _c, _d, _e, _f, _g;
                        return ({
                            id: item.id.toString(),
                            malId: item.idMal,
                            title: {
                                romaji: item.title.romaji,
                                english: item.title.english,
                                native: item.title.native,
                                userPreferred: item.title.userPreferred,
                            } || item.title.romaji,
                            status: item.status == "RELEASING"
                                ? types_1.MediaStatus.ONGOING
                                : item.status == "FINISHED"
                                    ? types_1.MediaStatus.COMPLETED
                                    : item.status == "NOT_YET_RELEASED"
                                        ? types_1.MediaStatus.NOT_YET_AIRED
                                        : item.status == "CANCELLED"
                                            ? types_1.MediaStatus.CANCELLED
                                            : item.status == "HIATUS"
                                                ? types_1.MediaStatus.HIATUS
                                                : types_1.MediaStatus.UNKNOWN,
                            image: (_e = (_c = (_b = item.coverImage) === null || _b === void 0 ? void 0 : _b.extraLarge) !== null && _c !== void 0 ? _c : (_d = item.coverImage) === null || _d === void 0 ? void 0 : _d.large) !== null && _e !== void 0 ? _e : (_f = item.coverImage) === null || _f === void 0 ? void 0 : _f.medium,
                            cover: item.bannerImage,
                            popularity: item.popularity,
                            description: item.description,
                            rating: item.averageScore,
                            genres: item.genres,
                            color: (_g = item.coverImage) === null || _g === void 0 ? void 0 : _g.color,
                            totalChapters: item.chapters,
                            volumes: item.volumes,
                            type: item.format,
                            releaseDate: item.seasonYear,
                        });
                    }),
                };
                return res;
            }
            catch (err) {
                throw new Error(err.message);
            }
        });
        /**
         *
         * @param chapterId chapter id
         * @param args args to pass to the provider (if any)
         * @returns
         */
        this.getChapterPages = (chapterId, ...args) => {
            return this.provider.getChapterPages(chapterId, ...args);
        };
        this.getMediaInfo = (id, ...args) => __awaiter(this, void 0, void 0, function* () {
            var _b, _c, _d, _e, _f, _g, _h;
            const mangaInfo = {
                id: id,
                title: "",
            };
            const options = {
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
                query: (0, queries_1.anilistMediaDetailQuery)(id, "MANGA"),
            };
            try {
                const { data } = yield axios_1.default.post(new Anilist().anilistGraphqlUrl, options).catch((err) => {
                    console.log(err);
                    throw new Error("Media not found");
                });
                mangaInfo.malId = data.data.Media.idMal;
                mangaInfo.title = {
                    romaji: data.data.Media.title.romaji,
                    english: data.data.Media.title.english,
                    native: data.data.Media.title.native,
                    userPreferred: data.data.Media.title.userPreferred,
                };
                if ((_b = data.data.Media.trailer) === null || _b === void 0 ? void 0 : _b.id) {
                    mangaInfo.trailer = {
                        id: data.data.Media.trailer.id,
                        site: (_c = data.data.Media.trailer) === null || _c === void 0 ? void 0 : _c.site,
                        thumbnail: (_d = data.data.Media.trailer) === null || _d === void 0 ? void 0 : _d.thumbnail,
                    };
                }
                mangaInfo.image =
                    (_f = (_e = data.data.Media.coverImage.extraLarge) !== null && _e !== void 0 ? _e : data.data.Media.coverImage.large) !== null && _f !== void 0 ? _f : data.data.Media.coverImage.medium;
                mangaInfo.popularity = data.data.Media.popularity;
                mangaInfo.color = (_g = data.data.Media.coverImage) === null || _g === void 0 ? void 0 : _g.color;
                mangaInfo.cover = (_h = data.data.Media.bannerImage) !== null && _h !== void 0 ? _h : mangaInfo.image;
                mangaInfo.description = data.data.Media.description;
                switch (data.data.Media.status) {
                    case "RELEASING":
                        mangaInfo.status = types_1.MediaStatus.ONGOING;
                        break;
                    case "FINISHED":
                        mangaInfo.status = types_1.MediaStatus.COMPLETED;
                        break;
                    case "NOT_YET_RELEASED":
                        mangaInfo.status = types_1.MediaStatus.NOT_YET_AIRED;
                        break;
                    case "CANCELLED":
                        mangaInfo.status = types_1.MediaStatus.CANCELLED;
                        break;
                    case "HIATUS":
                        mangaInfo.status = types_1.MediaStatus.HIATUS;
                    default:
                        mangaInfo.status = types_1.MediaStatus.UNKNOWN;
                }
                mangaInfo.releaseDate = data.data.Media.startDate.year;
                mangaInfo.startDate = {
                    year: data.data.Media.startDate.year,
                    month: data.data.Media.startDate.month,
                    day: data.data.Media.startDate.day,
                };
                mangaInfo.endDate = {
                    year: data.data.Media.endDate.year,
                    month: data.data.Media.endDate.month,
                    day: data.data.Media.endDate.day,
                };
                mangaInfo.rating = data.data.Media.averageScore;
                mangaInfo.genres = data.data.Media.genres;
                mangaInfo.season = data.data.Media.season;
                mangaInfo.studios = data.data.Media.studios.edges.map((item) => item.node.name);
                mangaInfo.type = data.data.Media.format;
                mangaInfo.recommendations = data.data.Media.recommendations.edges.map((item) => {
                    var _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _0, _1, _2, _3, _4, _5, _6, _7, _8, _9, _10, _11, _12;
                    return ({
                        id: (_b = item.node.mediaRecommendation) === null || _b === void 0 ? void 0 : _b.id,
                        malId: (_c = item.node.mediaRecommendation) === null || _c === void 0 ? void 0 : _c.idMal,
                        title: {
                            romaji: (_e = (_d = item.node.mediaRecommendation) === null || _d === void 0 ? void 0 : _d.title) === null || _e === void 0 ? void 0 : _e.romaji,
                            english: (_g = (_f = item.node.mediaRecommendation) === null || _f === void 0 ? void 0 : _f.title) === null || _g === void 0 ? void 0 : _g.english,
                            native: (_j = (_h = item.node.mediaRecommendation) === null || _h === void 0 ? void 0 : _h.title) === null || _j === void 0 ? void 0 : _j.native,
                            userPreferred: (_l = (_k = item.node.mediaRecommendation) === null || _k === void 0 ? void 0 : _k.title) === null || _l === void 0 ? void 0 : _l.userPreferred,
                        },
                        status: ((_m = item.node.mediaRecommendation) === null || _m === void 0 ? void 0 : _m.status) == "RELEASING"
                            ? types_1.MediaStatus.ONGOING
                            : ((_o = item.node.mediaRecommendation) === null || _o === void 0 ? void 0 : _o.status) == "FINISHED"
                                ? types_1.MediaStatus.COMPLETED
                                : ((_p = item.node.mediaRecommendation) === null || _p === void 0 ? void 0 : _p.status) == "NOT_YET_RELEASED"
                                    ? types_1.MediaStatus.NOT_YET_AIRED
                                    : ((_q = item.node.mediaRecommendation) === null || _q === void 0 ? void 0 : _q.status) == "CANCELLED"
                                        ? types_1.MediaStatus.CANCELLED
                                        : ((_r = item.node.mediaRecommendation) === null || _r === void 0 ? void 0 : _r.status) == "HIATUS"
                                            ? types_1.MediaStatus.HIATUS
                                            : types_1.MediaStatus.UNKNOWN,
                        chapters: (_s = item.node.mediaRecommendation) === null || _s === void 0 ? void 0 : _s.chapters,
                        image: (_y = (_v = (_u = (_t = item.node.mediaRecommendation) === null || _t === void 0 ? void 0 : _t.coverImage) === null || _u === void 0 ? void 0 : _u.extraLarge) !== null && _v !== void 0 ? _v : (_x = (_w = item.node.mediaRecommendation) === null || _w === void 0 ? void 0 : _w.coverImage) === null || _x === void 0 ? void 0 : _x.large) !== null && _y !== void 0 ? _y : (_0 = (_z = item.node.mediaRecommendation) === null || _z === void 0 ? void 0 : _z.coverImage) === null || _0 === void 0 ? void 0 : _0.medium,
                        cover: (_8 = (_5 = (_2 = (_1 = item.node.mediaRecommendation) === null || _1 === void 0 ? void 0 : _1.bannerImage) !== null && _2 !== void 0 ? _2 : (_4 = (_3 = item.node.mediaRecommendation) === null || _3 === void 0 ? void 0 : _3.coverImage) === null || _4 === void 0 ? void 0 : _4.extraLarge) !== null && _5 !== void 0 ? _5 : (_7 = (_6 = item.node.mediaRecommendation) === null || _6 === void 0 ? void 0 : _6.coverImage) === null || _7 === void 0 ? void 0 : _7.large) !== null && _8 !== void 0 ? _8 : (_10 = (_9 = item.node.mediaRecommendation) === null || _9 === void 0 ? void 0 : _9.coverImage) === null || _10 === void 0 ? void 0 : _10.medium,
                        rating: (_11 = item.node.mediaRecommendation) === null || _11 === void 0 ? void 0 : _11.meanScore,
                        type: (_12 = item.node.mediaRecommendation) === null || _12 === void 0 ? void 0 : _12.format,
                    });
                });
                mangaInfo.characters = data.data.Media.characters.edges.map((item) => {
                    var _b, _c;
                    return ({
                        id: (_b = item.node) === null || _b === void 0 ? void 0 : _b.id,
                        role: item.role,
                        name: {
                            first: item.node.name.first,
                            last: item.node.name.last,
                            full: item.node.name.full,
                            native: item.node.name.native,
                            userPreferred: item.node.name.userPreferred,
                        },
                        image: (_c = item.node.image.large) !== null && _c !== void 0 ? _c : item.node.image.medium,
                    });
                });
                mangaInfo.relations = data.data.Media.relations.edges.map((item) => {
                    var _b, _c, _d, _e, _f, _g;
                    return ({
                        id: item.node.id,
                        relationType: item.relationType,
                        malId: item.node.idMal,
                        title: {
                            romaji: item.node.title.romaji,
                            english: item.node.title.english,
                            native: item.node.title.native,
                            userPreferred: item.node.title.userPreferred,
                        },
                        status: item.node.status == "RELEASING"
                            ? types_1.MediaStatus.ONGOING
                            : item.node.status == "FINISHED"
                                ? types_1.MediaStatus.COMPLETED
                                : item.node.status == "NOT_YET_RELEASED"
                                    ? types_1.MediaStatus.NOT_YET_AIRED
                                    : item.node.status == "CANCELLED"
                                        ? types_1.MediaStatus.CANCELLED
                                        : item.node.status == "HIATUS"
                                            ? types_1.MediaStatus.HIATUS
                                            : types_1.MediaStatus.UNKNOWN,
                        chapters: item.node.chapters,
                        image: (_c = (_b = item.node.coverImage.extraLarge) !== null && _b !== void 0 ? _b : item.node.coverImage.large) !== null && _c !== void 0 ? _c : item.node.coverImage.medium,
                        color: (_d = item.node.coverImage) === null || _d === void 0 ? void 0 : _d.color,
                        type: item.node.format,
                        cover: (_g = (_f = (_e = item.node.bannerImage) !== null && _e !== void 0 ? _e : item.node.coverImage.extraLarge) !== null && _f !== void 0 ? _f : item.node.coverImage.large) !== null && _g !== void 0 ? _g : item.node.coverImage.medium,
                        rating: item.node.meanScore,
                    });
                });
                mangaInfo.chapters = yield new Anilist().findManga(this.provider, {
                    english: mangaInfo.title.english,
                    romaji: mangaInfo.title.romaji,
                }, mangaInfo.malId);
                mangaInfo.chapters = mangaInfo.chapters.reverse();
                return mangaInfo;
            }
            catch (error) {
                throw Error(error.message);
            }
        });
        this.provider = provider || new mangasee123_1.default();
    }
};
exports.default = Anilist;
/**
 * Most of this code is from @consumet i have just modifed it a little
 * Its not intended for public use on use on my app (@ApolloTV)
 */
(() => __awaiter(void 0, void 0, void 0, function* () {
    const ext = new Anilist(new allanime_1.default());
    const info = yield ext.getMediaInfo("21");
    // const pages = await ext.getChapterPages(info.chapters![0].id);
    const pages = yield ext.getMediaSources(info.episodes[0].id, "default", true);
    console.log(pages);
}))();
