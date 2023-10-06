import { ReadableParser, ISearch, IReadableInfo, IReadableResult, IReadableChapterPage, MetaData } from "../../../types";
declare class Mangasee123 extends ReadableParser {
    metaData: MetaData;
    protected baseUrl: string;
    search(query: string): Promise<ISearch<IReadableResult>>;
    getMediaInfo(mangaId: string): Promise<IReadableInfo>;
    getChapterPages(chapterId: string): Promise<IReadableChapterPage[]>;
    private processScriptTagVariable;
    private processChapterNumber;
    private processChapterForImageUrl;
}
export default Mangasee123;
