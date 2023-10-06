import { IEpisodeServer, IMediaInfo, IMediaResult, ISearch, ISource, MediaProvier } from "../../../types";
import { AdvancedSearch } from "./types";
/**
 * Most of this code is from @consumet i have just modifed it a little
 * Its not intended for public use on use on my app (@ApolloTV)
 */
declare class Anilist {
    private readonly anilistGraphqlUrl;
    private readonly mal_sync_api_url;
    private readonly animapped_api_url;
    provider: MediaProvier;
    private animapped_api_key?;
    constructor(provider?: MediaProvier, animapped_api_key?: string);
    search(query: string, page?: number, perPage?: number): Promise<ISearch<IMediaResult>>;
    advancedSearch({ query, type, page, perPage, format, sort, genres, id, year, status, season, }: AdvancedSearch): Promise<ISearch<IMediaResult>>;
    getMediaInfo(id: string, dub?: boolean): Promise<IMediaInfo>;
    getMediaSources(episodeId: string, ...args: any): Promise<ISource>;
    getMediaServers(episodeId: string): Promise<IEpisodeServer[]>;
    private getMappingId;
    private getEpisodes;
}
export default Anilist;
