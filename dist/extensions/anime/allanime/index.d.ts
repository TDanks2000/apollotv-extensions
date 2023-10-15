import { IEpisodeServer, IMediaInfo, IMediaResult, ISearch, ISource, MediaProvier, MetaData, StreamingServers } from "../../../types";
declare class AllAnime extends MediaProvier {
    metaData: MetaData;
    protected baseUrl: string;
    protected apiURL: string;
    private ytAnimeCoversHost;
    private idRegex;
    private epNumRegex;
    private idHash;
    private episodeInfoHash;
    private searchHash;
    private videoServerHash;
    search(query: string, page?: number, ...args: any[]): Promise<ISearch<IMediaResult>>;
    getMediaInfo(animeId: string, dub?: boolean, ...args: any): Promise<IMediaInfo>;
    getMediaSources(episodeId: string, server?: StreamingServers | "default", dub?: boolean): Promise<ISource>;
    getMediaServers(episodeId: string, dub?: boolean): Promise<IEpisodeServer[]>;
    private to_clock_json;
    private graphqlQuery;
}
export default AllAnime;
