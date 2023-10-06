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
Object.defineProperty(exports, "__esModule", { value: true });
const types_1 = require("../../../types/types");
const cheerio_1 = require("cheerio");
const types_2 = require("../../../types");
const metadata = __importStar(require("./extension.json"));
const extractors_1 = require("../../../extractors");
const utils_1 = require("../../../utils");
class GogoAnime extends types_2.MediaProvier {
    constructor() {
        super(...arguments);
        this.metaData = metadata;
        this.baseUrl = metadata.code.utils.mainURL;
        this.ajaxUrl = metadata.code.utils.apiURL;
    }
    search(query, page = 1) {
        return __awaiter(this, void 0, void 0, function* () {
            const searchResult = {
                currentPage: page,
                hasNextPage: false,
                results: [],
            };
            try {
                const res = yield this.client.get(`${this.baseUrl}/search.html?keyword=${encodeURIComponent(query)}&page=${page}`);
                const $ = (0, cheerio_1.load)(res.data);
                searchResult.hasNextPage =
                    $("div.anime_name.new_series > div > div > ul > li.selected").next().length > 0;
                $("div.last_episodes > ul > li").each((i, el) => {
                    var _a;
                    searchResult.results.push({
                        id: (_a = $(el).find("p.name > a").attr("href")) === null || _a === void 0 ? void 0 : _a.split("/")[2],
                        title: $(el).find("p.name > a").attr("title"),
                        url: `${this.baseUrl}/${$(el).find("p.name > a").attr("href")}`,
                        image: $(el).find("div > a > img").attr("src"),
                        releaseDate: $(el).find("p.released").text().trim(),
                        subOrDub: $(el).find("p.name > a").text().toLowerCase().includes("dub")
                            ? types_1.SubOrDub.DUB
                            : types_1.SubOrDub.SUB,
                    });
                });
                return searchResult;
            }
            catch (err) {
                throw new Error(err.message);
            }
        });
    }
    getMediaInfo(mediaId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!mediaId.includes("gogoanime"))
                mediaId = `/category/${mediaId}`;
            const animeInfo = {
                id: "",
                title: "",
                url: `${this.baseUrl}${mediaId}`,
                genres: [],
                totalEpisodes: 0,
            };
            try {
                const res = yield this.client.get(`${this.baseUrl}/${mediaId}`);
                const $ = (0, cheerio_1.load)(res.data);
                animeInfo.id = new URL(animeInfo.url).pathname.split("/")[2];
                animeInfo.title = $("section.content_left > div.main_body > div:nth-child(2) > div.anime_info_body_bg > h1")
                    .text()
                    .trim();
                animeInfo.url = mediaId;
                animeInfo.image = $("div.anime_info_body_bg > img").attr("src");
                animeInfo.releaseDate = $("div.anime_info_body_bg > p:nth-child(7)")
                    .text()
                    .trim()
                    .split("Released: ")[1];
                animeInfo.description = $("div.anime_info_body_bg > p:nth-child(5)")
                    .text()
                    .trim()
                    .replace("Plot Summary: ", "");
                animeInfo.subOrDub = animeInfo.title.toLowerCase().includes("dub")
                    ? types_1.SubOrDub.DUB
                    : types_1.SubOrDub.SUB;
                animeInfo.type = $("div.anime_info_body_bg > p:nth-child(4) > a")
                    .text()
                    .trim()
                    .toUpperCase();
                animeInfo.status = types_1.MediaStatus.UNKNOWN;
                switch ($("div.anime_info_body_bg > p:nth-child(8) > a").text().trim()) {
                    case "Ongoing":
                        animeInfo.status = types_1.MediaStatus.ONGOING;
                        break;
                    case "Completed":
                        animeInfo.status = types_1.MediaStatus.COMPLETED;
                        break;
                    case "Upcoming":
                        animeInfo.status = types_1.MediaStatus.NOT_YET_AIRED;
                        break;
                    default:
                        animeInfo.status = types_1.MediaStatus.UNKNOWN;
                        break;
                }
                animeInfo.otherName = $("div.anime_info_body_bg > p:nth-child(9)")
                    .text()
                    .replace("Other name: ", "")
                    .replace(/;/g, ",");
                $("div.anime_info_body_bg > p:nth-child(6) > a").each((i, el) => {
                    var _a;
                    (_a = animeInfo.genres) === null || _a === void 0 ? void 0 : _a.push($(el).attr("title").toString());
                });
                const ep_start = $("#episode_page > li").first().find("a").attr("ep_start");
                const ep_end = $("#episode_page > li").last().find("a").attr("ep_end");
                const movie_id = $("#movie_id").attr("value");
                const alias = $("#alias_anime").attr("value");
                const html = yield this.client.get(`${this.ajaxUrl}/load-list-episode?ep_start=${ep_start}&ep_end=${ep_end}&id=${movie_id}&default_ep=${0}&alias=${alias}`);
                const $$ = (0, cheerio_1.load)(html.data);
                animeInfo.episodes = [];
                $$("#episode_related > li").each((i, el) => {
                    var _a, _b, _c;
                    (_a = animeInfo.episodes) === null || _a === void 0 ? void 0 : _a.push({
                        id: (_b = $(el).find("a").attr("href")) === null || _b === void 0 ? void 0 : _b.split("/")[1],
                        number: parseFloat($(el).find(`div.name`).text().replace("EP ", "")),
                        url: `${this.baseUrl}/${(_c = $(el).find(`a`).attr("href")) === null || _c === void 0 ? void 0 : _c.trim()}`,
                    });
                });
                animeInfo.episodes = animeInfo.episodes.reverse();
                animeInfo.totalEpisodes = parseInt(ep_end !== null && ep_end !== void 0 ? ep_end : "0");
                return animeInfo;
            }
            catch (err) {
                throw new Error(`failed to fetch anime info: ${err}`);
            }
        });
    }
    getMediaSources(episodeId, server = types_1.StreamingServers.VidStreaming) {
        return __awaiter(this, void 0, void 0, function* () {
            if (episodeId.startsWith("http")) {
                const serverUrl = new URL(episodeId);
                switch (server) {
                    case types_1.StreamingServers.GogoCDN:
                        return {
                            headers: { Referer: serverUrl.href },
                            sources: yield new extractors_1.GogoCDN().extract(serverUrl),
                            download: `https://gogohd.net/download${serverUrl.search}`,
                        };
                    case types_1.StreamingServers.StreamSB:
                        return {
                            headers: {
                                Referer: serverUrl.href,
                                watchsb: "streamsb",
                                "User-Agent": utils_1.USER_AGENT,
                            },
                            sources: yield new extractors_1.StreamSB().extract(serverUrl),
                            download: `https://gogohd.net/download${serverUrl.search}`,
                        };
                    default:
                        return {
                            headers: { Referer: serverUrl.href },
                            sources: yield new extractors_1.GogoCDN().extract(serverUrl),
                            download: `https://gogohd.net/download${serverUrl.search}`,
                        };
                }
            }
            try {
                const res = yield this.client.get(`${this.baseUrl}/${episodeId}`);
                const $ = (0, cheerio_1.load)(res.data);
                let serverUrl;
                switch (server) {
                    case types_1.StreamingServers.GogoCDN:
                        serverUrl = new URL(`https:${$("#load_anime > div > div > iframe").attr("src")}`);
                        break;
                    case types_1.StreamingServers.VidStreaming:
                        serverUrl = new URL(`${$("div.anime_video_body > div.anime_muti_link > ul > li.vidcdn > a").attr("data-video")}`);
                        break;
                    case types_1.StreamingServers.StreamSB:
                        serverUrl = new URL($("div.anime_video_body > div.anime_muti_link > ul > li.streamsb > a").attr("data-video"));
                        break;
                    default:
                        serverUrl = new URL(`https:${$("#load_anime > div > div > iframe").attr("src")}`);
                        break;
                }
                return yield this.getMediaSources(serverUrl.href, server);
            }
            catch (err) {
                throw new Error("Episode not found.");
            }
        });
    }
    getMediaServers(episodeId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!episodeId.startsWith(this.baseUrl))
                    episodeId = `/${episodeId}`;
                const res = yield this.client.get(`${this.baseUrl}/${episodeId}`);
                const $ = (0, cheerio_1.load)(res.data);
                const servers = [];
                $("div.anime_video_body > div.anime_muti_link > ul > li").each((i, el) => {
                    let url = $(el).find("a").attr("data-video");
                    if (!(url === null || url === void 0 ? void 0 : url.startsWith("http")))
                        url = `https:${url}`;
                    servers.push({
                        name: $(el).find("a").text().replace("Choose this server", "").trim(),
                        url: url,
                    });
                });
                return servers;
            }
            catch (err) {
                throw new Error("Episode not found.");
            }
        });
    }
}
exports.default = GogoAnime;
