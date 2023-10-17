import { IReadableChapterPage, IReadableInfo, IReadableResult, ISearch, MetaData, ReadableParser } from "../../../types";
declare class MangaDex extends ReadableParser {
    metaData: MetaData;
    protected baseUrl: string;
    protected apiURL: string;
    search(query: string, page?: number, perPage?: number): Promise<ISearch<IReadableResult>>;
    getMediaInfo(mangaId: string): Promise<IReadableInfo>;
    getChapterPages(chapterId: string): Promise<IReadableChapterPage[]>;
    private getAllChapters;
    private getCoverImage;
}
export default MangaDex;
