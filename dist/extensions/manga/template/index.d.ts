import { IReadableChapterPage, IReadableInfo, MetaData, ReadableParser } from "../../../types";
declare class Template extends ReadableParser {
    metaData: MetaData;
    protected baseUrl: string;
    protected apiURL: string;
    search(query: string, ...args: any[]): Promise<unknown>;
    getMediaInfo(mangaId: string, ...args: any): Promise<IReadableInfo>;
    getChapterPages(chapterId: string, ...args: any): Promise<IReadableChapterPage[]>;
}
export default Template;
