import { Genres, IEpisodeServer, IMediaInfo, IMediaResult, IReadableChapterPage, IReadableInfo, IReadableResult, ISearch, ISource, MediaProvier, MetaData, ReadableParser } from "../../../types";
import { AdvancedSearch } from "./types";
declare class Anilist extends MediaProvier {
    metaData: MetaData;
    protected baseUrl: string;
    protected anilistGraphqlUrl: string;
    protected animapped_api_url: string;
    protected kitsuGraphqlUrl: string;
    provider: MediaProvier;
    private animapped_api_key?;
    constructor(provider?: MediaProvier, animapped_api_key?: string);
    search(query: string, page?: number, perPage?: number): Promise<ISearch<IMediaResult>>;
    advancedSearch({ query, type, page, perPage, format, sort, genres, id, year, status, season, }: AdvancedSearch): Promise<ISearch<IMediaResult>>;
    getMediaInfo(id: string, dub?: boolean, fetchFiller?: boolean): Promise<IMediaInfo>;
    getMediaSources(episodeId: string, ...args: any): Promise<ISource>;
    getMediaServers(episodeId: string): Promise<IEpisodeServer[]>;
    private fetchDefaultEpisodeList;
    private findAnime;
    private findAnimeSlug;
    private findMappingId;
    private findAnimeRaw;
    private findKitsuAnime;
    getTrendingAnime: (page?: number, perPage?: number) => Promise<ISearch<IMediaResult>>;
    getPopularAnime: (page?: number, perPage?: number) => Promise<ISearch<IMediaResult>>;
    getAiringSchedule: (page?: number, perPage?: number, weekStart?: number | string, weekEnd?: number | string, notYetAired?: boolean) => Promise<ISearch<IMediaResult>>;
    getRandomAnime: () => Promise<IMediaResult>;
    getStaffById: (id: number) => Promise<never>;
    getAnimeGenres: (genres: string[] | Genres[], page?: number, perPage?: number) => Promise<ISearch<IMediaResult>>;
    gethAnilistInfoById: (id: string) => Promise<IMediaInfo>;
    getCharacterInfoById: (id: string) => Promise<{
        id: any;
        name: {
            first: any;
            last: any;
            full: any;
            native: any;
            userPreferred: any;
            alternative: any;
            alternativeSpoiler: any;
        };
        image: any;
        description: any;
        gender: any;
        dateOfBirth: {
            year: any;
            month: any;
            day: any;
        };
        bloodType: any;
        age: any;
        hairColor: any;
        eyeColor: any;
        height: any;
        weight: any;
        occupation: any;
        partner: any;
        relatives: any;
        race: any;
        rank: any;
        previousPosition: any;
        dislikes: any;
        sign: any;
        zodicSign: any;
        zodicAnimal: any;
        themeSong: any;
        relations: any;
    }>;
    static Anime: typeof Anilist;
    static Manga: {
        new (provider?: ReadableParser): {
            provider: ReadableParser;
            /**
             *
             * @param query query to search for
             * @param page (optional) page number (default: `1`)
             * @param perPage (optional) number of results per page (default: `20`)
             */
            search: (query: string, page?: number, perPage?: number) => Promise<ISearch<IReadableResult>>;
            /**
             *
             * @param chapterId chapter id
             * @param args args to pass to the provider (if any)
             * @returns
             */
            getChapterPages: (chapterId: string, ...args: any) => Promise<IReadableChapterPage[]>;
            getMediaInfo: (id: string, ...args: any) => Promise<IReadableInfo>;
        };
    };
    private findMangaSlug;
    private findMangaRaw;
    private findManga;
}
export default Anilist;
/**
 * Most of this code is from @consumet i have just modifed it a little
 * Its not intended for public use on use on my app (@ApolloTV)
 */
