import { BaseParser, IReadableInfo, IReadableChapterPage } from ".";

abstract class ReadableParser extends BaseParser {
  /**
   * takes manga id
   *
   * returns book info with chapters
   */
  abstract getMediaInfo(mangaId: string, ...args: any): Promise<IReadableInfo>;

  /**
   * takes chapter id
   *
   * returns chapter (image links)
   */
  abstract getChapterPages(chapterId: string, ...args: any): Promise<IReadableChapterPage[]>;
}

export default ReadableParser;
