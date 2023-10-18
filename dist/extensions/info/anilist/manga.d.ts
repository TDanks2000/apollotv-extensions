import { IReadableChapterPage, IReadableInfo, IReadableResult, ISearch, MetaData, ReadableParser } from "../../../types";
declare class AnilistManga extends ReadableParser {
    metaData: MetaData;
    protected baseUrl: string;
    protected anilistGraphqlUrl: string;
    protected animapped_api_url: string;
    protected kitsuGraphqlUrl: string;
    provider: ReadableParser;
    constructor(provider?: ReadableParser);
    search: (query: string, page?: number, perPage?: number) => Promise<ISearch<IReadableResult>>;
    getMediaInfo(mangaId: string, ...args: any): Promise<IReadableInfo>;
    getChapterPages: (chapterId: string, ...args: any) => Promise<IReadableChapterPage[]>;
    private findMangaSlug;
    private findMangaRaw;
    private findManga;
}
export default AnilistManga;
