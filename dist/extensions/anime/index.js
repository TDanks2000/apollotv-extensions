"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const animepahe_1 = __importDefault(require("./animepahe"));
const gogoanime_1 = __importDefault(require("./gogoanime"));
const kickassanime_1 = __importDefault(require("./kickassanime"));
exports.default = {
    AnimePahe: animepahe_1.default,
    GogoAnime: gogoanime_1.default,
    Kickassanime: kickassanime_1.default,
};
