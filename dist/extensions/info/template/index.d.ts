import { IEpisodeServer, IMediaInfo, IMediaResult, ISearch, ISource, MediaProvier, MetaData } from "../../../types";
declare class Template extends MediaProvier {
    metaData: MetaData;
    protected baseUrl: string;
    protected apiURL: string;
    search(query: string, ...args: any[]): Promise<ISearch<IMediaResult>>;
    getMediaInfo(animeId: string, ...args: any): Promise<IMediaInfo>;
    getMediaSources(episodeId: string, ...args: any): Promise<ISource>;
    getMediaServers(episodeId: string): Promise<IEpisodeServer[]>;
}
export default Template;
