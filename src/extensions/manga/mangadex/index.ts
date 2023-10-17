import { AxiosError, AxiosResponse } from "axios";
import {
  IReadableChapterPage,
  IReadableInfo,
  IReadableResult,
  ISearch,
  MediaStatus,
  MetaData,
  ReadableParser,
} from "../../../types";

import * as metadata from "./extension.json";
import { encode } from "ascii-url-encoder";
import { capitalizeFirstLetter, substringBefore } from "../../../utils";

class MangaDex extends ReadableParser {
  public metaData: MetaData = metadata;
  protected baseUrl: string = metadata.code.utils.mainURL;
  protected apiURL: string = metadata.code.utils.apiURL;

  async search(
    query: string,
    page: number = 1,
    perPage: number = 20
  ): Promise<ISearch<IReadableResult>> {
    if (page <= 0) throw new Error("Page number must be greater than 0");
    if (perPage > 100) throw new Error("Limit must be less than or equal to 100");
    if (perPage * (page - 1) >= 10000) throw new Error("not enough results");

    try {
      const res = await this.client.get(
        `${this.apiURL}/manga?limit=${perPage}&title=${encode(query)}&limit=${perPage}&offset=${
          perPage * (page - 1)
        }&order[relevance]=desc`
      );

      if (res.data.result == "ok") {
        const results: ISearch<IReadableResult> = {
          currentPage: page,
          results: [],
        };

        for (const manga of res.data.data) {
          results.results.push({
            id: manga.id,
            title: Object.values(manga.attributes.title)[0] as string,
            altTitles: manga.attributes.altTitles,
            description: Object.values(manga.attributes.description)[0] as string,
            status: manga.attributes.status,
            releaseDate: manga.attributes.year,
            contentRating: manga.attributes.contentRating,
            lastVolume: manga.attributes.lastVolume,
            lastChapter: manga.attributes.lastChapter,
          });
        }

        return results;
      } else {
        throw new Error(res.data.message);
      }
    } catch (err) {
      if ((err as AxiosError).code == "ERR_BAD_REQUEST") {
        throw new Error("Bad request. Make sure you have entered a valid query.");
      }

      throw new Error((err as Error).message);
    }
  }

  async getMediaInfo(mangaId: string): Promise<IReadableInfo> {
    try {
      const { data } = await this.client.get(`${this.apiURL}/manga/${mangaId}`);
      const mangaInfo: IReadableInfo = {
        id: data.data.id,
        title: data.data.attributes.title.en,
        altTitles: data.data.attributes.altTitles,
        description: data.data.attributes.description,
        genres: data.data.attributes.tags
          .filter((tag: any) => tag.attributes.group === "genre")
          .map((tag: any) => tag.attributes.name.en),
        themes: data.data.attributes.tags
          .filter((tag: any) => tag.attributes.group === "theme")
          .map((tag: any) => tag.attributes.name.en),
        status: capitalizeFirstLetter(data.data.attributes.status) as MediaStatus,
        releaseDate: data.data.attributes.year,
        chapters: [],
      };

      const allChapters = await this.getAllChapters(mangaId, 0);
      for (const chapter of allChapters) {
        mangaInfo.chapters?.push({
          id: chapter.id,
          title: chapter.attributes.title ? chapter.attributes.title : chapter.attributes.chapter,
          chapterNumber: chapter.attributes.chapter,
          volumeNumber: chapter.attributes.volume,
          pages: chapter.attributes.pages,
        });
      }

      const findCoverArt = data.data.relationships.find((rel: any) => rel.type === "cover_art");
      const coverArt = await this.getCoverImage(findCoverArt?.id);
      mangaInfo.image = `${this.baseUrl}/covers/${mangaInfo.id}/${coverArt}`;

      return mangaInfo;
    } catch (err) {
      if ((err as AxiosError).code == "ERR_BAD_REQUEST")
        throw new Error(
          `[${this.metaData.name}] Bad request. Make sure you have entered a valid query.`
        );

      throw new Error((err as Error).message);
    }
  }

  async getChapterPages(chapterId: string): Promise<IReadableChapterPage[]> {
    try {
      const res = await this.client.get(`${this.apiURL}/at-home/server/${chapterId}`);
      const pages: { img: string; page: number }[] = [];

      for (const id of res.data.chapter.data) {
        pages.push({
          img: `${res.data.baseUrl}/data/${res.data.chapter.hash}/${id}`,
          page: parseInt(substringBefore(id, "-").replace(/[^0-9.]/g, "")),
        });
      }
      return pages;
    } catch (err) {
      throw new Error((err as Error).message);
    }
  }

  private getAllChapters = async (
    mangaId: string,
    offset: number,
    res?: AxiosResponse<any, any>
  ): Promise<any[]> => {
    if (res?.data?.offset + 96 >= res?.data?.total) {
      return [];
    }

    const response = await this.client.get(
      `${this.apiURL}/manga/${mangaId}/feed?offset=${offset}&limit=96&order[volume]=desc&order[chapter]=desc&translatedLanguage[]=en`
    );

    return [...response.data.data, ...(await this.getAllChapters(mangaId, offset + 96, response))];
  };

  private getCoverImage = async (coverId: string): Promise<string> => {
    const { data } = await this.client.get(`${this.apiURL}/cover/${coverId}`);

    const fileName = data.data.attributes.fileName;

    return fileName;
  };
}

export default MangaDex;

// (async () => {
//   const ext = new MangaDex();
//   const search = await ext.search("One Piece");
//   const data = await ext.getMediaInfo(search.results[0].id);
//   console.log(data);
// })();
