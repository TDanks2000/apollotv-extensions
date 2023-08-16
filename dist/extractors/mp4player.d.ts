import { VideoExtractor, IVideo, ISubtitle } from "../types";
declare class Mp4Player extends VideoExtractor {
    protected serverName: string;
    protected sources: IVideo[];
    private readonly domains;
    extract: (videoUrl: URL) => Promise<{
        sources: IVideo[];
    } & {
        subtitles: ISubtitle[];
    }>;
}
export default Mp4Player;
