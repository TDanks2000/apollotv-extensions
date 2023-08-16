import { VideoExtractor, IVideo, ISubtitle } from "../types";
declare class StreamHub extends VideoExtractor {
    protected serverName: string;
    protected sources: IVideo[];
    extract: (videoUrl: URL) => Promise<{
        sources: IVideo[];
    } & {
        subtitles: ISubtitle[];
    }>;
}
export default StreamHub;
