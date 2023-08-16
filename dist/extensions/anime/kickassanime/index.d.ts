import { IEpisodeServer, IMediaInfo, IMediaResult, ISearch, ISource, MediaProvier, SubOrDub } from "../../../types";
declare class Kickassanime extends MediaProvier {
    protected baseUrl: string;
    protected apiURL: string;
    protected isDubAvailableSeparately: boolean;
    private headers;
    search(query: string, page?: number): Promise<ISearch<IMediaResult>>;
    getMediaInfo(id: string, subOrDub?: SubOrDub): Promise<IMediaInfo>;
    getMediaSources(showId: string, episodeId: `ep-${number}-${string}`, server?: "duck" | "bird" | "vidstreaming"): Promise<ISource>;
    getMediaServers(showId: string, episodeId: `ep-${number}-${string}`): Promise<IEpisodeServer[]>;
    private getImageUrl;
    private loadAllEps;
    private formatEpisode;
}
export default Kickassanime;
/**
 * THANK YOU ENIMAX FOR FIGURING MOST OF THIS OUT
 */
