import { IReadableChapterPage, IReadableInfo, IReadableResult, ISearch, MetaData, ReadableParser } from "../../../types";
declare class FlameScans extends ReadableParser {
    metaData: MetaData;
    protected baseUrl: string;
    protected apiURL: null;
    search(query: string, page?: number, perPage?: number): Promise<ISearch<IReadableResult>>;
    getMediaInfo(mangaId: string, ...args: any): Promise<IReadableInfo>;
    getChapterPages(chapterId: string, ...args: any): Promise<IReadableChapterPage[]>;
}
export default FlameScans;
