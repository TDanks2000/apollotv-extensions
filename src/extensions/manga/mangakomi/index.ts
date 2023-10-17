import {
  IReadableChapterPage,
  IReadableInfo,
  IReadableResult,
  ISearch,
  ISource,
  MediaProvier,
  MetaData,
  ReadableParser,
} from "../../../types";

import * as metadata from "./extension.json";
import { MangakomiSearch } from "./types";

class Mangakomi extends ReadableParser {
  public metaData: MetaData = metadata;
  protected baseUrl: string = metadata.code.utils.mainURL;
  protected apiURL: string = metadata.code.utils.apiURL;

  private headers = { mode: "no-cors" };

  async search(query: string, ...args: any[]): Promise<ISearch<IReadableResult>> {
    const params = new URLSearchParams();
    params.append("action", "wp-manga-search-manga");
    params.append("title", query);

    try {
      const { data } = await this.client.request<MangakomiSearch>({
        url: this.apiURL,
        method: "POST",
        headers: {
          "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
          ...this.headers,
        },
        data: params,
      });

      const results: IReadableResult[] = data.data.map(
        (item): IReadableResult => ({
          id: `manga/${item.url.split("/manga/")[1].replace("/", "")}`,
          url: item.url,
          title: item.title,
        })
      );

      return { results };
    } catch (error) {
      console.error(error);
      throw new Error((error as Error).message);
    }
  }

  getMediaInfo(mangaId: string, ...args: any): Promise<IReadableInfo> {
    if (!mangaId.includes("http")) mangaId = `${this.baseUrl}/${mangaId}`;
    throw new Error("Method not implemented.");
  }

  getChapterPages(chapterId: string, ...args: any): Promise<IReadableChapterPage[]> {
    throw new Error("Method not implemented.");
  }
}

export default Mangakomi;

// (async () => {
//   const ext = new Mangakomi();
//   const search = await ext.search("One Piece");
//   console.log(search);
// })();
