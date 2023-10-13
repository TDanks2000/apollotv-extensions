import { load } from "cheerio";
import { isText } from "domhandler";

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

class Mangasee123 extends ReadableParser {
  public metaData: MetaData = metadata;
  protected override baseUrl = metadata.code.utils.mainURL;

  async search(query: string): Promise<ISearch<IReadableResult>> {
    const matches = [];
    const sanitizedQuery = query.replace(/\s/g, "").toLowerCase();

    try {
      const { data } = await this.client.get(`https://mangasee123.com/_search.php`);

      for (const i in data) {
        const sanitizedAlts: string[] = [];

        const item = data[i];
        const altTitles: string[] = data[i]["a"];

        for (const alt of altTitles) {
          sanitizedAlts.push(alt.replace(/\s/g, "").toLowerCase());
        }

        if (
          item["s"].replace(/\s/g, "").toLowerCase().includes(sanitizedQuery) ||
          sanitizedAlts.includes(sanitizedQuery)
        ) {
          matches.push(item);
        }
      }

      const results = matches.map(
        (val): IReadableResult => ({
          id: val["i"],
          title: val["s"],
          altTitles: val["a"],
          image: `https://temp.compsci88.com/cover/${val["i"]}.jpg`,
          headerForImage: { Referer: this.baseUrl },
        })
      );

      return { results: results };
    } catch (err) {
      throw new Error((err as Error).message);
    }
  }

  async getMediaInfo(mangaId: string): Promise<IReadableInfo> {
    const mangaInfo: IReadableInfo = {
      id: mangaId,
      title: "",
    };
    const url = `${this.baseUrl}/manga`;

    try {
      const { data } = await this.client.get(`${url}/${mangaId}`);
      const $ = load(data);

      const schemaScript = $("body > script:nth-child(15)").get()[0].children[0];
      if (isText(schemaScript)) {
        const mainEntity = JSON.parse(schemaScript.data)["mainEntity"];

        mangaInfo.title = mainEntity["name"];
        mangaInfo.altTitles = mainEntity["alternateName"];
        mangaInfo.genres = mainEntity["genre"];
      }

      mangaInfo.image = $("img.bottom-5").attr("src");
      mangaInfo.headerForImage = { Referer: this.baseUrl };
      mangaInfo.description = $(".top-5 .Content").text();

      const contentScript = $("body > script:nth-child(16)").get()[0].children[0];
      if (isText(contentScript)) {
        const chaptersData = this.processScriptTagVariable(contentScript.data, "vm.Chapters = ");

        mangaInfo.chapters = chaptersData.map(
          (i: { [x: string]: any }): IReadableChapter => ({
            id: `${mangaId}-chapter-${this.processChapterNumber(i["Chapter"])}`,
            title: `${i["ChapterName"] ?? `Chapter ${this.processChapterNumber(i["Chapter"])}`}`,
            releaseDate: i["Date"],
          })
        );
      }

      return mangaInfo;
    } catch (err) {
      throw new Error((err as Error).message);
    }
  }

  async getChapterPages(chapterId: string): Promise<IReadableChapterPage[]> {
    const images: string[] = [];
    const url = `${this.baseUrl}/read-online/${chapterId}-page-1.html`;

    try {
      const { data } = await this.client.get(`${url}`);
      const $ = load(data);

      const chapterScript = $("body > script:nth-child(19)").get()[0].children[0];
      if (isText(chapterScript)) {
        const curChapter = this.processScriptTagVariable(chapterScript.data, "vm.CurChapter = ");
        const imageHost = this.processScriptTagVariable(chapterScript.data, "vm.CurPathName = ");
        const curChapterLength = Number(curChapter["Page"]);

        for (let i = 0; i < curChapterLength; i++) {
          const chapter = this.processChapterForImageUrl(chapterId.replace(/[^0-9.]/g, ""));
          const page = `${i + 1}`.padStart(3, "0");
          const mangaId = chapterId.split("-chapter-", 1)[0];
          // const imagePath = `https://${imageHost}/manga/${mangaId}/${chapter}-${page}.png`;

          const imagePath = `https://${imageHost}/manga/${mangaId}/${
            curChapter.Directory == "" ? "" : curChapter.Directory + "/"
          }${chapter}-${page}.png`;

          images.push(imagePath);
        }
      }

      const pages = images.map(
        (image, i): IReadableChapterPage => ({
          page: i + 1,
          img: image,
          headerForImage: { Referer: this.baseUrl },
        })
      );

      return pages;
    } catch (err) {
      throw new Error((err as Error).message);
    }
  }

  private processScriptTagVariable = (script: string, variable: string) => {
    const chopFront = script.substring(script.search(variable) + variable.length, script.length);
    const chapters = JSON.parse(chopFront.substring(0, chopFront.search(";")));

    return chapters;
  };

  private processChapterNumber = (chapter: string): string => {
    const decimal = chapter.substring(chapter.length - 1, chapter.length);
    chapter = chapter.replace(chapter[0], "").slice(0, -1);
    if (decimal == "0") return `${+chapter}`;

    if (chapter.startsWith("0")) chapter = chapter.replace(chapter[0], "");

    return `${+chapter}.${decimal}`;
  };

  private processChapterForImageUrl = (chapter: string): string => {
    if (!chapter.includes(".")) return chapter.padStart(4, "0");

    const values = chapter.split(".");
    const pad = values[0].padStart(4, "0");

    return `${pad}.${values[1]}`;
  };
}

export default Mangasee123;
