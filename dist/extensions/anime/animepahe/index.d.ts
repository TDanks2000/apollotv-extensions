import { IEpisodeServer, IMediaInfo, IMediaResult, ISearch, ISource, MediaProvier, MetaData } from "../../../types";
declare class AnimePahe extends MediaProvier {
    metaData: MetaData;
    protected baseUrl: string;
    protected apiURL: string;
    search(query: string): Promise<ISearch<IMediaResult>>;
    getMediaInfo(animeId: string, episodePage?: number): Promise<IMediaInfo>;
    getMediaSources(episodeId: string, ...args: any): Promise<ISource>;
    getMediaServers(episodeId: string): Promise<IEpisodeServer[]>;
    private getEpisodes;
}
export default AnimePahe;
