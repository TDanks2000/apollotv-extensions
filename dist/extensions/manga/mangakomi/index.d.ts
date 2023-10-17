import { IReadableChapterPage, IReadableInfo, IReadableResult, ISearch, MetaData, ReadableParser } from "../../../types";
declare class Mangakomi extends ReadableParser {
    metaData: MetaData;
    protected baseUrl: string;
    protected apiURL: string;
    private headers;
    search(query: string, ...args: any[]): Promise<ISearch<IReadableResult>>;
    getMediaInfo(mangaId: string, ...args: any): Promise<IReadableInfo>;
    getChapterPages(chapterId: string, ...args: any): Promise<IReadableChapterPage[]>;
}
export default Mangakomi;
