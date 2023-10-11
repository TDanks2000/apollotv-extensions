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
const domhandler_1 = require("domhandler");
const types_1 = require("../../../types");
const metadata = __importStar(require("./extension.json"));
class Mangasee123 extends types_1.ReadableParser {
    constructor() {
        super(...arguments);
        this.metaData = metadata;
        this.baseUrl = metadata.code.utils.mainURL;
        this.processScriptTagVariable = (script, variable) => {
            const chopFront = script.substring(script.search(variable) + variable.length, script.length);
            const chapters = JSON.parse(chopFront.substring(0, chopFront.search(";")));
            return chapters;
        };
        this.processChapterNumber = (chapter) => {
            const decimal = chapter.substring(chapter.length - 1, chapter.length);
            chapter = chapter.replace(chapter[0], "").slice(0, -1);
            if (decimal == "0")
                return `${+chapter}`;
            if (chapter.startsWith("0"))
                chapter = chapter.replace(chapter[0], "");
            return `${+chapter}.${decimal}`;
        };
        this.processChapterForImageUrl = (chapter) => {
            if (!chapter.includes("."))
                return chapter.padStart(4, "0");
            const values = chapter.split(".");
            const pad = values[0].padStart(4, "0");
            return `${pad}.${values[1]}`;
        };
    }
    search(query) {
        return __awaiter(this, void 0, void 0, function* () {
            const matches = [];
            const sanitizedQuery = query.replace(/\s/g, "").toLowerCase();
            try {
                const { data } = yield this.client.get(`https://mangasee123.com/_search.php`);
                for (const i in data) {
                    const sanitizedAlts = [];
                    const item = data[i];
                    const altTitles = data[i]["a"];
                    for (const alt of altTitles) {
                        sanitizedAlts.push(alt.replace(/\s/g, "").toLowerCase());
                    }
                    if (item["s"].replace(/\s/g, "").toLowerCase().includes(sanitizedQuery) ||
                        sanitizedAlts.includes(sanitizedQuery)) {
                        matches.push(item);
                    }
                }
                const results = matches.map((val) => ({
                    id: val["i"],
                    title: val["s"],
                    altTitles: val["a"],
                    image: `https://temp.compsci88.com/cover/${val["i"]}.jpg`,
                    headerForImage: { Referer: this.baseUrl },
                }));
                return { results: results };
            }
            catch (err) {
                throw new Error(err.message);
            }
        });
    }
    getMediaInfo(mangaId) {
        return __awaiter(this, void 0, void 0, function* () {
            const mangaInfo = {
                id: mangaId,
                title: "",
            };
            const url = `${this.baseUrl}/manga`;
            try {
                const { data } = yield this.client.get(`${url}/${mangaId}`);
                const $ = (0, cheerio_1.load)(data);
                const schemaScript = $("body > script:nth-child(15)").get()[0].children[0];
                if ((0, domhandler_1.isText)(schemaScript)) {
                    const mainEntity = JSON.parse(schemaScript.data)["mainEntity"];
                    mangaInfo.title = mainEntity["name"];
                    mangaInfo.altTitles = mainEntity["alternateName"];
                    mangaInfo.genres = mainEntity["genre"];
                }
                mangaInfo.image = $("img.bottom-5").attr("src");
                mangaInfo.headerForImage = { Referer: this.baseUrl };
                mangaInfo.description = $(".top-5 .Content").text();
                const contentScript = $("body > script:nth-child(16)").get()[0].children[0];
                if ((0, domhandler_1.isText)(contentScript)) {
                    const chaptersData = this.processScriptTagVariable(contentScript.data, "vm.Chapters = ");
                    mangaInfo.chapters = chaptersData.map((i) => {
                        var _a;
                        return ({
                            id: `${mangaId}-chapter-${this.processChapterNumber(i["Chapter"])}`,
                            title: `${(_a = i["ChapterName"]) !== null && _a !== void 0 ? _a : `Chapter ${this.processChapterNumber(i["Chapter"])}`}`,
                            releaseDate: i["Date"],
                        });
                    });
                }
                return mangaInfo;
            }
            catch (err) {
                throw new Error(err.message);
            }
        });
    }
    getChapterPages(chapterId) {
        return __awaiter(this, void 0, void 0, function* () {
            const images = [];
            const url = `${this.baseUrl}/read-online/${chapterId}-page-1.html`;
            try {
                const { data } = yield this.client.get(`${url}`);
                const $ = (0, cheerio_1.load)(data);
                const chapterScript = $("body > script:nth-child(19)").get()[0].children[0];
                if ((0, domhandler_1.isText)(chapterScript)) {
                    const curChapter = this.processScriptTagVariable(chapterScript.data, "vm.CurChapter = ");
                    const imageHost = this.processScriptTagVariable(chapterScript.data, "vm.CurPathName = ");
                    const curChapterLength = Number(curChapter["Page"]);
                    console.log(curChapter);
                    for (let i = 0; i < curChapterLength; i++) {
                        const chapter = this.processChapterForImageUrl(chapterId.replace(/[^0-9.]/g, ""));
                        const page = `${i + 1}`.padStart(3, "0");
                        const mangaId = chapterId.split("-chapter-", 1)[0];
                        // const imagePath = `https://${imageHost}/manga/${mangaId}/${chapter}-${page}.png`;
                        const imagePath = `https://${imageHost}/manga/${mangaId}/${curChapter.Directory == "" ? "" : curChapter.Directory + "/"}${chapter}-${page}.png`;
                        images.push(imagePath);
                    }
                }
                const pages = images.map((image, i) => ({
                    page: i + 1,
                    img: image,
                    headerForImage: { Referer: this.baseUrl },
                }));
                return pages;
            }
            catch (err) {
                throw new Error(err.message);
            }
        });
    }
}
exports.default = Mangasee123;
