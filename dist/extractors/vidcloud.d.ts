import { VideoExtractor, IVideo, ISubtitle } from "../types";
declare class VidCloud extends VideoExtractor {
    protected serverName: string;
    protected sources: IVideo[];
    private readonly host;
    private readonly host2;
    extract: (videoUrl: URL, isAlternative?: boolean) => Promise<{
        sources: IVideo[];
    } & {
        subtitles: ISubtitle[];
    }>;
}
export default VidCloud;
