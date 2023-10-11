import axios from "axios";
import {
  IReadableChapter,
  IReadableChapterPage,
  IReadableInfo,
  IReadableResult,
  ISearch,
  MediaStatus,
  MetaData,
  ReadableParser,
} from "../../../types";
import Mangasee123 from "../../manga/mangasee123";
import { anilistMediaDetailQuery, anilistSearchQuery } from "./queries";

import * as metadata from "./extension.json";

class AnilistManga extends ReadableParser {
  public metaData: MetaData = metadata;
  protected baseUrl: string = metadata.code.utils.mainURL;

  protected anilistGraphqlUrl: string = metadata.code.utils.apiURL;
  protected animapped_api_url: string = metadata.code.utils.animappedApiRrl;
  protected kitsuGraphqlUrl: string = metadata.code.utils.kitsuGraphqlUrl;

  provider: ReadableParser;

  constructor(provider?: ReadableParser) {
    super();
    this.provider = provider || new Mangasee123();
  }

  search = async (
    query: string,
    page: number = 1,
    perPage: number = 20
  ): Promise<ISearch<IReadableResult>> => {
    const options = {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      query: anilistSearchQuery(query, page, perPage, "MANGA"),
    };

    try {
      const { data } = await axios.post(this.anilistGraphqlUrl, options);

      const res: ISearch<IReadableResult> = {
        currentPage: data.data.Page.pageInfo.currentPage,
        hasNextPage: data.data.Page.pageInfo.hasNextPage,
        results: data.data.Page.media.map(
          (item: any): IReadableResult => ({
            id: item.id.toString(),
            malId: item.idMal,
            title:
              {
                romaji: item.title.romaji,
                english: item.title.english,
                native: item.title.native,
                userPreferred: item.title.userPreferred,
              } || item.title.romaji,
            status:
              item.status == "RELEASING"
                ? MediaStatus.ONGOING
                : item.status == "FINISHED"
                ? MediaStatus.COMPLETED
                : item.status == "NOT_YET_RELEASED"
                ? MediaStatus.NOT_YET_AIRED
                : item.status == "CANCELLED"
                ? MediaStatus.CANCELLED
                : item.status == "HIATUS"
                ? MediaStatus.HIATUS
                : MediaStatus.UNKNOWN,
            image: item.coverImage?.extraLarge ?? item.coverImage?.large ?? item.coverImage?.medium,
            cover: item.bannerImage,
            popularity: item.popularity,
            description: item.description,
            rating: item.averageScore,
            genres: item.genres,
            color: item.coverImage?.color,
            totalChapters: item.chapters,
            volumes: item.volumes,
            type: item.format,
            releaseDate: item.seasonYear,
          })
        ),
      };

      return res;
    } catch (err) {
      throw new Error((err as Error).message);
    }
  };

  async getMediaInfo(mangaId: string, ...args: any): Promise<IReadableInfo> {
    const mangaInfo: IReadableInfo = {
      id: mangaId,
      title: "",
    };

    const options = {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      query: anilistMediaDetailQuery(mangaId, "MANGA"),
    };

    try {
      const { data } = await axios.post(this.anilistGraphqlUrl, options).catch((err) => {
        throw new Error("Media not found");
      });

      mangaInfo.malId = data.data.Media.idMal;
      mangaInfo.title = {
        romaji: data.data.Media.title.romaji,
        english: data.data.Media.title.english,
        native: data.data.Media.title.native,
        userPreferred: data.data.Media.title.userPreferred,
      };

      if (data.data.Media.trailer?.id) {
        mangaInfo.trailer = {
          id: data.data.Media.trailer.id,
          site: data.data.Media.trailer?.site,
          thumbnail: data.data.Media.trailer?.thumbnail,
        };
      }
      mangaInfo.image =
        data.data.Media.coverImage.extraLarge ??
        data.data.Media.coverImage.large ??
        data.data.Media.coverImage.medium;

      mangaInfo.popularity = data.data.Media.popularity;
      mangaInfo.color = data.data.Media.coverImage?.color;
      mangaInfo.cover = data.data.Media.bannerImage ?? mangaInfo.image;
      mangaInfo.description = data.data.Media.description;
      switch (data.data.Media.status) {
        case "RELEASING":
          mangaInfo.status = MediaStatus.ONGOING;
          break;
        case "FINISHED":
          mangaInfo.status = MediaStatus.COMPLETED;
          break;
        case "NOT_YET_RELEASED":
          mangaInfo.status = MediaStatus.NOT_YET_AIRED;
          break;
        case "CANCELLED":
          mangaInfo.status = MediaStatus.CANCELLED;
          break;
        case "HIATUS":
          mangaInfo.status = MediaStatus.HIATUS;
        default:
          mangaInfo.status = MediaStatus.UNKNOWN;
      }
      mangaInfo.releaseDate = data.data.Media.startDate.year;
      mangaInfo.startDate = {
        year: data.data.Media.startDate.year,
        month: data.data.Media.startDate.month,
        day: data.data.Media.startDate.day,
      };
      mangaInfo.endDate = {
        year: data.data.Media.endDate.year,
        month: data.data.Media.endDate.month,
        day: data.data.Media.endDate.day,
      };
      mangaInfo.rating = data.data.Media.averageScore;
      mangaInfo.genres = data.data.Media.genres;
      mangaInfo.season = data.data.Media.season;
      mangaInfo.studios = data.data.Media.studios.edges.map((item: any) => item.node.name);
      mangaInfo.type = data.data.Media.format;
      mangaInfo.recommendations = data.data.Media.recommendations.edges.map((item: any) => ({
        id: item.node.mediaRecommendation?.id,
        malId: item.node.mediaRecommendation?.idMal,
        title: {
          romaji: item.node.mediaRecommendation?.title?.romaji,
          english: item.node.mediaRecommendation?.title?.english,
          native: item.node.mediaRecommendation?.title?.native,
          userPreferred: item.node.mediaRecommendation?.title?.userPreferred,
        },
        status:
          item.node.mediaRecommendation?.status == "RELEASING"
            ? MediaStatus.ONGOING
            : item.node.mediaRecommendation?.status == "FINISHED"
            ? MediaStatus.COMPLETED
            : item.node.mediaRecommendation?.status == "NOT_YET_RELEASED"
            ? MediaStatus.NOT_YET_AIRED
            : item.node.mediaRecommendation?.status == "CANCELLED"
            ? MediaStatus.CANCELLED
            : item.node.mediaRecommendation?.status == "HIATUS"
            ? MediaStatus.HIATUS
            : MediaStatus.UNKNOWN,
        chapters: item.node.mediaRecommendation?.chapters,
        image:
          item.node.mediaRecommendation?.coverImage?.extraLarge ??
          item.node.mediaRecommendation?.coverImage?.large ??
          item.node.mediaRecommendation?.coverImage?.medium,
        cover:
          item.node.mediaRecommendation?.bannerImage ??
          item.node.mediaRecommendation?.coverImage?.extraLarge ??
          item.node.mediaRecommendation?.coverImage?.large ??
          item.node.mediaRecommendation?.coverImage?.medium,
        rating: item.node.mediaRecommendation?.meanScore,
        type: item.node.mediaRecommendation?.format,
      }));

      mangaInfo.characters = data.data.Media.characters.edges.map((item: any) => ({
        id: item.node?.id,
        role: item.role,
        name: {
          first: item.node.name.first,
          last: item.node.name.last,
          full: item.node.name.full,
          native: item.node.name.native,
          userPreferred: item.node.name.userPreferred,
        },
        image: item.node.image.large ?? item.node.image.medium,
      }));

      mangaInfo.relations = data.data.Media.relations.edges.map((item: any) => ({
        id: item.node.id,
        relationType: item.relationType,
        malId: item.node.idMal,
        title: {
          romaji: item.node.title.romaji,
          english: item.node.title.english,
          native: item.node.title.native,
          userPreferred: item.node.title.userPreferred,
        },
        status:
          item.node.status == "RELEASING"
            ? MediaStatus.ONGOING
            : item.node.status == "FINISHED"
            ? MediaStatus.COMPLETED
            : item.node.status == "NOT_YET_RELEASED"
            ? MediaStatus.NOT_YET_AIRED
            : item.node.status == "CANCELLED"
            ? MediaStatus.CANCELLED
            : item.node.status == "HIATUS"
            ? MediaStatus.HIATUS
            : MediaStatus.UNKNOWN,
        chapters: item.node.chapters,
        image:
          item.node.coverImage.extraLarge ??
          item.node.coverImage.large ??
          item.node.coverImage.medium,
        color: item.node.coverImage?.color,
        type: item.node.format,
        cover:
          item.node.bannerImage ??
          item.node.coverImage.extraLarge ??
          item.node.coverImage.large ??
          item.node.coverImage.medium,
        rating: item.node.meanScore,
      }));

      mangaInfo.chapters = await this.findManga(
        this.provider,
        { english: mangaInfo.title.english!, romaji: mangaInfo.title.romaji! },
        mangaInfo.malId as number
      );

      mangaInfo.chapters = mangaInfo?.chapters?.reverse() ?? [];

      return mangaInfo;
    } catch (error) {
      throw Error((error as Error).message);
    }
  }

  getChapterPages = (chapterId: string, ...args: any): Promise<IReadableChapterPage[]> => {
    return this.provider.getChapterPages(chapterId, ...args);
  };

  private findMangaSlug = async (
    provider: ReadableParser,
    title: string,
    malId: number
  ): Promise<IReadableChapter[]> => {
    const slug = title.replace(/[^0-9a-zA-Z]+/g, " ");

    let possibleManga: any;

    if (!malId) {
      possibleManga = await this.findMangaRaw(provider, slug, title);
    }

    const malAsyncReq = await this.client.get(
      `https://raw.githubusercontent.com/bal-mackup/mal-backup/master/mal/manga/${malId}.json`,
      {
        validateStatus: () => true,
      }
    );

    if (malAsyncReq.status !== 200) {
      possibleManga = await this.findMangaRaw(provider, slug, title);
    }

    const sitesT = malAsyncReq.data.Sites as {
      [k: string]: { [k: string]: { url: string; page: string; title: string } };
    };

    let sites = Object.values(sitesT).map((v, i) => {
      const obj: any = [...Object.values(Object.values(sitesT)[i])];
      const pages: any = obj.map((v: any) => ({ page: v.page, url: v.url, title: v.title }));
      return pages;
    }) as any[];

    sites = sites.flat();

    const possibleSource = sites.find(
      (s) => s.page.toLowerCase() === provider.metaData.name.toLowerCase()
    );

    if (possibleSource) {
      possibleManga = await provider.getMediaInfo(possibleSource.url.split("/").pop()!);
    } else {
      possibleManga = await this.findMangaRaw(provider, slug, title);
    }

    const possibleProviderChapters = possibleManga.chapters;
    return possibleProviderChapters;
  };

  private findMangaRaw = async (provider: ReadableParser, slug: string, title: string) => {
    const findAnime = (await provider.search(slug)) as ISearch<IReadableResult>;

    if (findAnime.results.length === 0) return [];
    // TODO: use much better way than this

    const possibleManga = findAnime.results.find(
      (manga: IReadableChapter) =>
        title.toLowerCase() == (typeof manga.title === "string" ? manga.title.toLowerCase() : "")
    );

    if (!possibleManga) {
      return (await provider.getMediaInfo(findAnime.results[0].id)) as IReadableInfo;
    }
    return (await provider.getMediaInfo(possibleManga.id)) as IReadableInfo;
  };

  private findManga = async (
    provider: ReadableParser,
    title: { romaji: string; english: string },
    malId: number
  ): Promise<IReadableChapter[]> => {
    title.english = title.english ?? title.romaji;
    title.romaji = title.romaji ?? title.english;

    title.english = title.english.toLowerCase();
    title.romaji = title.romaji.toLowerCase();

    if (title.english === title.romaji)
      return await this.findMangaSlug(provider, title.english, malId);

    const romajiPossibleEpisodes = this.findMangaSlug(provider, title.romaji, malId);

    if (romajiPossibleEpisodes) {
      return romajiPossibleEpisodes;
    }

    const englishPossibleEpisodes = this.findMangaSlug(provider, title.english, malId);
    return englishPossibleEpisodes;
  };
}

export { AnilistManga };
