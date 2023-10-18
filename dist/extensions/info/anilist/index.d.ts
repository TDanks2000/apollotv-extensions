import { IEpisodeServer, IMediaInfo, IMediaResult, ISearch, ISource, MediaProvier, MetaData } from "../../../types";
import { AdvancedSearch } from "./types";
import AnilistManga from "./manga";
/**
 * Most of this code is from @consumet i have just modifed it a little
 * Its not intended for public use on use on my app (@ApolloTV)
 */
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
    Manga: AnilistManga;
}
export default Anilist;
