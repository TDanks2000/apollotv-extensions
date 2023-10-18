import {
  IEpisodeServer,
  IMediaInfo,
  IMediaResult,
  IReadableChapterPage,
  IReadableInfo,
  ISearch,
  ISource,
  MetaData,
  ReadableParser,
} from "../../../types";

import * as metadata from "./extension.json";

class Template extends ReadableParser {
  public metaData: MetaData = metadata;
  protected baseUrl: string = metadata.code.utils.mainURL;
  protected apiURL: string = metadata.code.utils.apiURL;

  search(query: string, ...args: any[]): Promise<unknown> {
    throw new Error("Method not implemented.");
  }

  getMediaInfo(mangaId: string, ...args: any): Promise<IReadableInfo> {
    throw new Error("Method not implemented.");
  }

  getChapterPages(chapterId: string, ...args: any): Promise<IReadableChapterPage[]> {
    throw new Error("Method not implemented.");
  }
}

export default Template;
