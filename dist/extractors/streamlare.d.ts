import { IVideo, ISource } from "../types";
import VideoExtractor from "../types/video-extractor";
declare class StreamLare extends VideoExtractor {
    protected serverName: string;
    protected sources: IVideo[];
    private readonly host;
    private readonly regex;
    private readonly USER_AGENT;
    extract(videoUrl: URL, userAgent?: string, ...args: any): Promise<ISource>;
}
export default StreamLare;
