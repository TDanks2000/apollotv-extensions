import { VideoExtractor, IVideo } from "../types";
declare class Mp4Upload extends VideoExtractor {
    protected serverName: string;
    protected sources: IVideo[];
    extract: (videoUrl: URL) => Promise<IVideo[]>;
}
export default Mp4Upload;
