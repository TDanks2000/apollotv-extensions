import { IReadableChapterPage, IReadableInfo, IReadableResult, ISearch, MetaData, ReadableParser } from "../../../types";
declare class ComicK extends ReadableParser {
    metaData: MetaData;
    protected baseUrl: string;
    protected apiURL: string;
    private _axios;
    search(query: string, page?: number, perPage?: number): Promise<ISearch<IReadableResult>>;
    getMediaInfo(mangaId: string, ...args: any): Promise<IReadableInfo>;
    getChapterPages(chapterId: string, ...args: any): Promise<IReadableChapterPage[]>;
    private getAllChapters;
    /**
     * @description Fetches the comic HID from the slug
     * @param id Comic slug
     * @returns Promise<string> empty if not found
     */
    private getComicId;
}
export default ComicK;
