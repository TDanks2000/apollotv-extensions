export interface ITitle {
    romaji?: string;
    english?: string;
    native?: string;
    userPreferred?: string;
}
export interface IMediaResult {
    id: string;
    title: string | ITitle;
    url?: string;
    image?: string;
    cover?: string;
    status?: MediaStatus;
    rating?: number;
    type?: MediaFormat | TvType;
    releaseDate?: string;
    [x: string]: unknown;
}
export interface ISearch<T> {
    currentPage?: number;
    hasNextPage?: boolean;
    totalPages?: number;
    /**
     * total results must include results from all pages
     */
    totalResults?: number;
    results: T[];
}
export interface Trailer {
    id: string;
    site?: string;
    thumbnail?: string;
}
export interface FuzzyDate {
    year?: number;
    month?: number;
    day?: number;
}
export declare enum MediaFormat {
    TV = "TV",
    TV_SHORT = "TV_SHORT",
    MOVIE = "MOVIE",
    SPECIAL = "SPECIAL",
    OVA = "OVA",
    ONA = "ONA",
    MUSIC = "MUSIC",
    MANGA = "MANGA",
    NOVEL = "NOVEL",
    ONE_SHOT = "ONE_SHOT"
}
export interface IMediaInfo extends IMediaResult {
    malId?: number | string;
    genres?: string[];
    description?: string;
    status?: MediaStatus;
    totalEpisodes?: number;
    /**
     * @deprecated use `hasSub` or `hasDub` instead
     */
    subOrDub?: SubOrDub;
    hasSub?: boolean;
    hasDub?: boolean;
    synonyms?: string[];
    /**
     * two letter representation of coutnry: e.g JP for japan
     */
    countryOfOrigin?: string;
    isAdult?: boolean;
    isLicensed?: boolean;
    season?: string;
    studios?: string[];
    color?: string;
    cover?: string;
    trailer?: Trailer;
    episodes?: IMediaEpisode[];
    startDate?: FuzzyDate;
    endDate?: FuzzyDate;
    recommendations?: IMediaResult[];
    relations?: IMediaResult[];
}
export interface IMediaEpisode {
    id: string;
    title?: string;
    url?: string;
    season?: number;
    number?: number;
    description?: string;
    isFiller?: boolean;
    image?: string;
    releaseDate?: string;
    hasSub?: boolean | null | "UNKOWN";
    hasDub?: boolean | null | "UNKOWN";
    [x: string]: unknown;
}
export interface IEpisodeServer {
    name: string;
    url: string;
}
export interface IVideo {
    /**
     * The **MAIN URL** of the video provider that should take you to the video
     */
    url: string;
    /**
     * The Quality of the video should include the `p` suffix
     */
    quality?: string;
    /**
     * make sure to set this to `true` if the video is hls
     */
    isM3U8?: boolean;
    /**
     * set this to `true` if the video is dash (mpd)
     */
    isDASH?: boolean;
    /**
     * size of the video in **bytes**
     */
    size?: number;
    [x: string]: unknown;
}
export declare enum StreamingServers {
    AsianLoad = "asianload",
    GogoCDN = "gogocdn",
    StreamSB = "streamsb",
    MixDrop = "mixdrop",
    Mp4Upload = "mp4upload",
    UpCloud = "upcloud",
    VidCloud = "vidcloud",
    StreamTape = "streamtape",
    VizCloud = "vizcloud",
    MyCloud = "mycloud",
    Filemoon = "filemoon",
    VidStreaming = "vidstreaming",
    SmashyStream = "smashystream",
    StreamHub = "streamhub",
    StreamWish = "streamwish",
    VidMoly = "vidmoly"
}
export declare enum MediaStatus {
    ONGOING = "Ongoing",
    COMPLETED = "Completed",
    HIATUS = "Hiatus",
    CANCELLED = "Cancelled",
    NOT_YET_AIRED = "Not yet aired",
    UNKNOWN = "Unknown"
}
export declare enum SubOrDub {
    SUB = "sub",
    DUB = "dub"
}
export declare enum SubOrDubOrBoth {
    SUB = "sub",
    DUB = "dub",
    BOTH = "both"
}
export interface ISubtitle {
    /**
     * The id of the subtitle. **not** required
     */
    id?: string;
    /**
     * The **url** that should take you to the subtitle **directly**.
     */
    url: string;
    /**
     * The language of the subtitle
     */
    lang: string;
}
/**
 * The start, and the end of the intro or opening in seconds.
 */
export interface Intro {
    start: number;
    end: number;
}
export interface ISource {
    headers?: {
        [k: string]: string;
    };
    intro?: Intro;
    subtitles?: ISubtitle[];
    sources: IVideo[];
    download?: string;
    embedURL?: string;
}
/**
 * Used **only** for movie/tvshow providers
 */
export declare enum TvType {
    TVSERIES = "TV Series",
    MOVIE = "Movie",
    ANIME = "Anime"
}
export declare enum Genres {
    ACTION = "Action",
    ADVENTURE = "Adventure",
    CARS = "Cars",
    COMEDY = "Comedy",
    DRAMA = "Drama",
    ECCHI = "Ecchi",
    FANTASY = "Fantasy",
    HORROR = "Horror",
    MAHOU_SHOUJO = "Mahou Shoujo",
    MECHA = "Mecha",
    MUSIC = "Music",
    MYSTERY = "Mystery",
    PSYCHOLOGICAL = "Psychological",
    ROMANCE = "Romance",
    SCI_FI = "Sci-Fi",
    SLICE_OF_LIFE = "Slice of Life",
    SPORTS = "Sports",
    SUPERNATURAL = "Supernatural",
    THRILLER = "Thriller"
}
export declare enum Topics {
    ANIME = "anime",
    ANIMATION = "animation",
    MANGA = "manga",
    GAMES = "games",
    NOVELS = "novels",
    LIVE_ACTION = "live-action",
    COVID_19 = "covid-19",
    INDUSTRY = "industry",
    MUSIC = "music",
    PEOPLE = "people",
    MERCH = "merch",
    EVENTS = "events"
}
export declare enum AvailableExtensionTypes {
    anime = "anime",
    manga = "manga",
    movie = "movie",
    cartoon = "cartoon"
}
export interface ProxyConfig {
    /**
     * The proxy URL
     * @example https://proxy.com
     **/
    url: string | string[];
    /**
     * X-API-Key header value (if any)
     **/
    key?: string;
    /**
     * The proxy rotation interval in milliseconds. (default: 5000)
     */
    rotateInterval?: number;
}
export interface IReadableResult {
    id: string;
    title: string | [lang: string][] | ITitle;
    altTitles?: string | string[] | [lang: string][];
    image?: string;
    description?: string | [lang: string][] | {
        [lang: string]: string;
    };
    status?: MediaStatus;
    releaseDate?: number | string;
    [x: string]: unknown;
}
export interface IReadableChapter {
    id: string;
    title: string | [lang: string][] | ITitle;
    altTitles?: string | string[] | [lang: string][];
    image?: string;
    description?: string | [lang: string][] | {
        [lang: string]: string;
    };
    status?: MediaStatus;
    releaseDate?: number | string;
    [x: string]: unknown;
}
export interface IReadableInfo extends IReadableResult {
    malId?: number | string;
    authors?: string[];
    genres?: string[];
    links?: string[];
    characters?: any[];
    recommendations?: IReadableResult[];
    chapters?: IReadableChapter[];
}
export interface IReadableChapterPage {
    img: string;
    page: number;
    [x: string]: unknown;
}
export interface MetaData {
    type: string;
    name: string;
    version: string;
    image: string;
    author: Author;
    code: Code;
}
export interface Author {
    name: string;
    image?: string | null;
    link?: string | null;
}
export interface Code {
    main: string;
    utils: Utils;
}
export interface Utils {
    mainURL: string;
    apiURL?: string | null;
    [x: string]: string | undefined | null;
}
export interface AnimeMapping {
    id: string;
    title: string;
    module: string;
}
export interface AnimeMappings {
    [key: string]: AnimeMapping;
}
export interface AnimappedRes {
    found: boolean;
    id: string;
    anilist_id: string;
    mal_id: string;
    title: string;
    year: string;
    mappings: {
        aniwatch?: AnimeMappings;
        gogoanime?: AnimeMappings;
        kickassanime?: AnimeMappings;
    };
    updated_at: string;
    created_at: string;
}
