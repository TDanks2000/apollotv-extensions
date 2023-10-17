"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const comick_1 = __importDefault(require("./comick"));
const flamescans_1 = __importDefault(require("./flamescans"));
const mangadex_1 = __importDefault(require("./mangadex"));
const mangakomi_1 = __importDefault(require("./mangakomi"));
const mangaPill_1 = __importDefault(require("./mangaPill"));
const mangasee123_1 = __importDefault(require("./mangasee123"));
exports.default = {
    ComicK: comick_1.default,
    FlameScans: flamescans_1.default,
    MangaDex: mangadex_1.default,
    Mangakomi: mangakomi_1.default,
    MangaPill: mangaPill_1.default,
    Mangasee123: mangasee123_1.default,
};
