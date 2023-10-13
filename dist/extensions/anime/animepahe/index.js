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
const cheerio_1 = require("cheerio");
const extractors_1 = require("../../../extractors");
const types_1 = require("../../../types");
const metadata = __importStar(require("./extension.json"));
class AnimePahe extends types_1.MediaProvier {
    constructor() {
        super(...arguments);
        this.metaData = metadata;
        this.baseUrl = metadata.code.utils.mainURL;
        this.apiURL = metadata.code.utils.apiURL;
        this.getEpisodes = (session, page) => __awaiter(this, void 0, void 0, function* () {
            const res = yield this.client.get(`${this.baseUrl}/api?m=release&id=${session}&sort=episode_asc&page=${page}`);
            const epData = res.data.data;
            return [
                ...epData.map((item) => ({
                    id: item.anime_id,
                    number: item.episode,
                    title: item.title,
                    image: item.snapshot,
                    duration: item.duration,
                    url: `${this.baseUrl}/play/${session}/${item.session}`,
                })),
            ];
        });
    }
    search(query) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { data } = yield this.client.get(`${this.baseUrl}/api?m=search&q=${encodeURIComponent(query)}`);
                const res = {
                    results: data.data.map((item) => ({
                        id: `${item.id}/${item.session}`,
                        title: item.title,
                        image: item.poster,
                        rating: item.score,
                        releaseDate: item.year,
                        type: item.type,
                    })),
                };
                return res;
            }
            catch (err) {
                throw new Error(err.message);
            }
        });
    }
    getMediaInfo(animeId, episodePage = -1) {
        return __awaiter(this, void 0, void 0, function* () {
            const animeInfo = {
                id: animeId,
                title: "",
            };
            try {
                const url = `${this.baseUrl}/anime/${animeId.split("/")[1]}?anime_id=${animeId.split("/")[0]}`;
                const res = yield this.client.get(url);
                const $ = (0, cheerio_1.load)(res.data);
                console.log(`${this.baseUrl}/anime/${animeId.split("/")[1]}?anime_id=${animeId.split("/")[0]}`);
                animeInfo.title = $("div.title-wrapper > h1 > span").first().text();
                animeInfo.image = $("div.anime-poster a").attr("href");
                animeInfo.cover = `https:${$("div.anime-cover").attr("data-src")}`;
                animeInfo.description = $("div.anime-summary").text();
                animeInfo.genres = $("div.anime-genre ul li")
                    .map((i, el) => $(el).find("a").attr("title"))
                    .get();
                switch ($('div.col-sm-4.anime-info p:icontains("Status:") a').text().trim()) {
                    case "Currently Airing":
                        animeInfo.status = types_1.MediaStatus.ONGOING;
                        break;
                    case "Finished Airing":
                        animeInfo.status = types_1.MediaStatus.COMPLETED;
                        break;
                    default:
                        animeInfo.status = types_1.MediaStatus.UNKNOWN;
                }
                animeInfo.type = $("div.col-sm-4.anime-info > p:nth-child(2) > a")
                    .text()
                    .trim()
                    .toUpperCase();
                animeInfo.releaseDate = $("div.col-sm-4.anime-info > p:nth-child(5)")
                    .text()
                    .split("to")[0]
                    .replace("Aired:", "")
                    .trim();
                animeInfo.aired = $("div.col-sm-4.anime-info > p:nth-child(5)")
                    .text()
                    .replace("Aired:", "")
                    .trim()
                    .replace("\n", " ");
                animeInfo.studios = $("div.col-sm-4.anime-info > p:nth-child(7)")
                    .text()
                    .replace("Studio:", "")
                    .trim()
                    .split("\n");
                animeInfo.totalEpisodes = parseInt($("div.col-sm-4.anime-info > p:nth-child(3)").text().replace("Episodes:", ""));
                animeInfo.episodes = [];
                if (episodePage < 0) {
                    const { data: { last_page, data }, } = yield this.client.get(`${this.baseUrl}/api?m=release&id=${animeId.split("/")[1]}&sort=episode_asc&page=1`);
                    animeInfo.episodePages = last_page;
                    animeInfo.episodes.push(...data.map((item) => ({
                        id: `${animeId.split("/")[1]}/${item.session}`,
                        number: item.episode,
                        title: item.title,
                        image: item.snapshot,
                        duration: item.duration,
                        url: `${this.baseUrl}/play/${animeId.split("/")[1]}/${item.session}`,
                    })));
                    for (let i = 1; i < last_page; i++) {
                        animeInfo.episodes.push(...(yield this.getEpisodes(animeId.split("/")[1], i + 1)));
                    }
                }
                else {
                    animeInfo.episodes.push(...(yield this.getEpisodes(animeId.split("/")[1], episodePage)));
                }
                return animeInfo;
            }
            catch (err) {
                throw new Error(err.message);
            }
        });
    }
    getMediaSources(episodeId, ...args) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { data } = yield this.client.get(`${this.baseUrl}/play/${episodeId}`, {
                    headers: {
                        Referer: `${this.baseUrl}`,
                    },
                });
                const $ = (0, cheerio_1.load)(data);
                const links = $("div#resolutionMenu > button").map((i, el) => ({
                    url: $(el).attr("data-src"),
                    quality: $(el).text(),
                    audio: $(el).attr("data-audio"),
                }));
                const iSource = {
                    headers: {
                        Referer: "https://kwik.cx/",
                    },
                    sources: [],
                };
                for (const link of links) {
                    const res = yield new extractors_1.Kwik(this.proxyConfig).extract(new URL(link.url));
                    res[0].quality = link.quality;
                    res[0].isDub = link.audio === "eng";
                    iSource.sources.push(res[0]);
                }
                return iSource;
            }
            catch (err) {
                throw new Error(err.message);
            }
        });
    }
    getMediaServers(episodeId) {
        throw new Error("Method not implemented.");
    }
}
exports.default = AnimePahe;
