import { MetaData, StreamingServers } from "../../../types";
import { IEpisodeServer, IMediaInfo, IMediaResult, ISearch, ISource, MediaProvier } from "../../../types";
declare class FlixHQ extends MediaProvier {
    metaData: MetaData;
    protected baseUrl: string;
    search(query: string, page?: number): Promise<ISearch<IMediaResult>>;
    getMediaInfo(mediaId: string): Promise<IMediaInfo>;
    getMediaSources(episodeId: string, mediaId: string, server?: StreamingServers): Promise<ISource>;
    getMediaServers(episodeId: string, mediaId: string): Promise<IEpisodeServer[]>;
}
export default FlixHQ;
