import { load } from "cheerio";

import {
  ReadableParser,
  ISearch,
  IReadableInfo,
  IReadableResult,
  IReadableChapterPage,
  IReadableChapter,
  MetaData,
} from "../../../types";

import * as metadata from "./extension.json";

class MangaPill extends ReadableParser {
  public metaData: MetaData = metadata;
  protected override baseUrl = metadata.code.utils.mainURL;

  async search(query: string): Promise<ISearch<IReadableResult>> {
    try {
      const { data } = await this.client.get(
        `${this.baseUrl}/search?q=${encodeURIComponent(query)}`
      );
      const $ = load(data);

      const results = $("div.container div.my-3.justify-end > div")
        .map(
          (i, el): IReadableResult => ({
            id: $(el).find("a").attr("href")?.split("/manga/")[1]!,
            title: $(el).find("div > a > div").text().trim(),
            image: $(el).find("a img").attr("data-src"),
          })
        )
        .get();

      return {
        results: results,
      };
    } catch (err) {
      //   console.log(err);
      throw new Error((err as Error).message);
    }
  }

  async getMediaInfo(mangaId: string): Promise<IReadableInfo> {
    const mangaInfo: IReadableInfo = {
      id: mangaId,
      title: "",
    };
    try {
      const { data } = await this.client.get(`${this.baseUrl}/manga/${mangaId}`);
      const $ = load(data);

      mangaInfo.title = $("div.container div.my-3 div.flex-col div.mb-3 h1").text().trim();
      mangaInfo.description = $("div.container div.my-3  div.flex-col p.text--secondary")
        .text()
        .split("\n")
        .join(" ")!;
      mangaInfo.releaseDate = $(
        'div.container div.my-3 div.flex-col div.gap-3.mb-3 div:contains("Year")'
      )
        .text()
        .split("Year\n")[1]
        .trim();
      mangaInfo.genres = $('div.container div.my-3 div.flex-col div.mb-3:contains("Genres")')
        .text()
        .split("\n")
        .filter((genre: string) => genre !== "Genres" && genre !== "")
        .map((genre) => genre.trim());

      mangaInfo.chapters = $("div.container div.border-border div#chapters div.grid-cols-1 a")
        .map(
          (i, el): IReadableChapter => ({
            id: $(el).attr("href")?.split("/chapters/")[1]!,
            title: $(el).text().trim(),
            chapter: $(el).text().split("Chapter ")[1],
          })
        )
        .get();

      return mangaInfo;
    } catch (err) {
      throw new Error((err as Error).message);
    }
  }

  async getChapterPages(chapterId: string): Promise<IReadableChapterPage[]> {
    try {
      const { data } = await this.client.get(`${this.baseUrl}/chapters/${chapterId}`);
      const $ = load(data);

      const chapterSelector = $("chapter-page");

      const pages = chapterSelector
        .map(
          (i, el): IReadableChapterPage => ({
            img: $(el).find("div picture img").attr("data-src")!,
            page: parseFloat($(el).find(`div[data-summary] > div`).text().split("page ")[1]),
          })
        )
        .get();

      return pages;
    } catch (err) {
      throw new Error((err as Error).message);
    }
  }
}

export default MangaPill;
