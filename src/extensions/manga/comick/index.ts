import axios, { AxiosError, AxiosResponse } from "axios";
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
import { USER_AGENT, capitalizeFirstLetter, substringBefore } from "../../../utils";
import { Comic, Cover, SearchResult } from "./types";

class ComicK extends ReadableParser {
  public metaData: MetaData = metadata;
  protected baseUrl: string = metadata.code.utils.mainURL;
  protected apiURL: string = metadata.code.utils.apiURL;

  private _axios() {
    return axios.create({
      baseURL: this.apiURL,
      headers: {
        "User-Agent": USER_AGENT,
      },
    });
  }

  async search(
    query: string,
    page: number = 1,
    perPage: number = 20
  ): Promise<ISearch<IReadableResult>> {
    if (page < 1) throw new Error("Page number must be greater than 1");
    if (perPage > 300) throw new Error("Limit must be less than or equal to 300");
    if (perPage * (page - 1) >= 10000) throw new Error("not enough results");

    try {
      const req = await this._axios().get<SearchResult[]>(
        `/v1.0/search?q=${encodeURIComponent(query)}&limit=${perPage}&page=${page}`
      );

      const results: ISearch<IReadableResult> = {
        currentPage: page,
        results: [],
      };

      const data = await req.data;

      for (const manga of data) {
        let cover: Cover | string | null = manga.md_covers ? manga.md_covers[0] : null;
        if (cover && cover.b2key != undefined) {
          cover = `https://meo.comick.pictures${cover.b2key}`;
        }

        results.results.push({
          id: manga.slug,
          title: manga.title ?? manga.slug,
          altTitles: manga.md_titles ? manga.md_titles.map((title) => title.title) : [],
          image: cover as string,
        });
      }

      return results;
    } catch (err) {
      throw new Error((err as Error).message);
    }
  }

  async getMediaInfo(mangaId: string, ...args: any): Promise<IReadableInfo> {
    try {
      const req = await this._axios().get(`/comic/${mangaId}`);
      const data: Comic = req.data.comic;

      const links = Object.values(data.links ?? []).filter((link) => link !== null);

      const mangaInfo: IReadableInfo = {
        id: data.hid,
        title: data.title,
        altTitles: data.md_titles ? data.md_titles.map((title) => title.title) : [],
        description: data.desc,
        genres: data.md_comic_md_genres?.map((genre) => genre.md_genres.name),
        status: data.status ?? 0 === 0 ? MediaStatus.ONGOING : MediaStatus.COMPLETED,
        image: `https://meo.comick.pictures${data.md_covers ? data.md_covers[0].b2key : ""}`,
        malId: data.links?.mal,
        links: links,
        chapters: [],
      };

      const allChapters = await this.getAllChapters(mangaId, 1);
      for (const chapter of allChapters) {
        mangaInfo.chapters?.push({
          id: chapter.hid,
          title: chapter.title ?? chapter.chap,
          chapterNumber: chapter.chap,
          volumeNumber: chapter.vol,
          releaseDate: chapter.created_at,
        });
      }

      return mangaInfo;
    } catch (err) {
      if ((err as AxiosError).code == "ERR_BAD_REQUEST")
        throw new Error(
          `[${this.metaData.name}] Bad request. Make sure you have entered a valid query.`
        );

      throw new Error((err as Error).message);
    }
  }

  async getChapterPages(chapterId: string, ...args: any): Promise<IReadableChapterPage[]> {
    try {
      const { data } = await this._axios().get(`/chapter/${chapterId}`);

      const pages: { img: string; page: number }[] = [];

      data.chapter.md_images.map((image: { b2key: string; w: string }, index: number) => {
        pages.push({
          img: `https://meo.comick.pictures/${image.b2key}?width=${image.w}`,
          page: index,
        });
      });

      return pages;
    } catch (err) {
      throw new Error((err as Error).message);
    }
  }

  private getAllChapters = async (mangaId: string, page: number): Promise<any[]> => {
    if (page <= 0) {
      page = 1;
    }
    const comicId = await this.getComicId(mangaId);
    const req = await this._axios().get(`/comic/${comicId}/chapters?page=${page}`);
    return req.data.chapters;
  };

  /**
   * @description Fetches the comic HID from the slug
   * @param id Comic slug
   * @returns Promise<string> empty if not found
   */
  private async getComicId(id: string): Promise<string> {
    const req = await this._axios().get(`/comic/${id}`);
    const data: Comic = req.data["comic"];
    return data ? data.hid : "";
  }
}

export default ComicK;

// (async () => {
//   const ext = new ComicK();
//   const search = await ext.search("One Piece");
//   const data = await ext.getMediaInfo(search.results[0].id);
//   const chapterPages = await ext.getChapterPages(data.chapters![0].id);
//   console.log(chapterPages);
// })();
