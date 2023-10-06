import { MetaData, StreamingServers } from "../../../types/types";
import { IEpisodeServer, IMediaInfo, IMediaResult, ISearch, ISource, MediaProvier } from "../../../types";
declare class GogoAnime extends MediaProvier {
    metaData: MetaData;
    protected baseUrl: string;
    protected ajaxUrl: string;
    search(query: string, page?: number): Promise<ISearch<IMediaResult>>;
    getMediaInfo(mediaId: string): Promise<IMediaInfo>;
    getMediaSources(episodeId: string, server?: StreamingServers): Promise<ISource>;
    getMediaServers(episodeId: string): Promise<IEpisodeServer[]>;
}
export default GogoAnime;
