import axios from "axios";
import {
  AnimappedRes,
  Genres,
  IEpisodeServer,
  IMediaEpisode,
  IMediaInfo,
  IMediaResult,
  IReadableChapter,
  IReadableChapterPage,
  IReadableInfo,
  IReadableResult,
  ISearch,
  ISource,
  ITitle,
  MediaProvier,
  MediaStatus,
  MetaData,
  ReadableParser,
  SubOrDub,
  SubOrDubOrBoth,
} from "../../../types";
import GogoAnime from "../../anime/gogoanime";
import { AdvancedSearch, MalsyncReturn } from "./types";
import { capitalizeFirstLetter, compareTwoStrings, getDays, range } from "../../../utils";
import {
  anilistAdvancedQuery,
  anilistAiringScheduleQuery,
  anilistCharacterQuery,
  anilistGenresQuery,
  anilistMediaDetailQuery,
  anilistPopularQuery,
  anilistSearchQuery,
  anilistSiteStatisticsQuery,
  anilistTrendingQuery,
  kitsuSearchQuery,
} from "./queries";

import * as metadata from "./extension.json";
import Mangasee123 from "../../manga/mangasee123";
import MangaDex from "../../manga/mangadex";

class Anilist extends MediaProvier {
  public metaData: MetaData = metadata;
  protected baseUrl: string = metadata.code.utils.mainURL;

  protected anilistGraphqlUrl: string = metadata.code.utils.apiURL;
  protected animapped_api_url: string = metadata.code.utils.animappedApiRrl;
  protected kitsuGraphqlUrl: string = metadata.code.utils.kitsuGraphqlUrl;

  provider: MediaProvier;

  private animapped_api_key?: string;

  constructor(provider?: MediaProvier, animapped_api_key?: string) {
    super();
    this.provider = provider || new GogoAnime();
    this.animapped_api_key = animapped_api_key ?? "";
  }

  async search(
    query: string,
    page: number = 1,
    perPage: number = 15
  ): Promise<ISearch<IMediaResult>> {
    const options = {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      query: anilistSearchQuery(query, page, perPage),
    };

    try {
      let { data, status } = await axios.post(this.anilistGraphqlUrl, options, {
        validateStatus: () => true,
      });

      const res: ISearch<IMediaResult> = {
        currentPage: data.data!.Page?.pageInfo?.currentPage ?? data.meta?.currentPage,
        hasNextPage:
          data.data!.Page?.pageInfo?.hasNextPage ?? data.meta?.currentPage != data.meta?.lastPage,
        results:
          data.data?.Page?.media?.map((item: any) => ({
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
            totalEpisodes: item.episodes ?? item.nextAiringEpisode?.episode - 1,
            currentEpisodeCount: item?.nextAiringEpisode
              ? item?.nextAiringEpisode?.episode - 1
              : item.episodes,
            type: item.format,
            releaseDate: item.seasonYear,
          })) ??
          data.data.map((item: any) => ({
            id: item.anilistId.toString(),
            malId: item.mappings!["mal"]!,
            title: item.title,
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
            image: item.coverImage ?? item.bannerImage,
            cover: item.bannerImage,
            popularity: item.popularity,
            description: item.description,
            rating: item.averageScore,
            genres: item.genre,
            color: item.color,
            totalEpisodes: item.currentEpisode,
            currentEpisodeCount: item?.nextAiringEpisode
              ? item?.nextAiringEpisode?.episode - 1
              : item.currentEpisode,
            type: item.format,
            releaseDate: item.year,
          })),
      };

      return res;
    } catch (err) {
      throw new Error((err as Error).message);
    }
  }

  async advancedSearch({
    query,
    type = "ANIME",
    page = 1,
    perPage = 20,
    format,
    sort,
    genres,
    id,
    year,
    status,
    season,
  }: AdvancedSearch): Promise<ISearch<IMediaResult>> {
    const options = {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      query: anilistAdvancedQuery(),
      variables: {
        search: query,
        type: type,
        page: page,
        size: perPage,
        format: format,
        sort: sort,
        genres: genres,
        id: id,
        year: year ? `${year}%` : undefined,
        status: status,
        season: season,
      },
    };

    if (genres) {
      genres.forEach((genre) => {
        if (!Object.values(Genres).includes(genre as Genres)) {
          throw new Error(`genre ${genre} is not valid`);
        }
      });
    }

    try {
      let { data, status } = await axios.post(this.anilistGraphqlUrl, options, {
        validateStatus: () => true,
      });

      if (status >= 500 && !query) throw new Error("No results found");

      const res: ISearch<IMediaResult> = {
        currentPage: data.data?.Page?.pageInfo?.currentPage ?? data.meta?.currentPage,
        hasNextPage:
          data.data?.Page?.pageInfo?.hasNextPage ?? data.meta?.currentPage != data.meta?.lastPage,
        totalPages: data.data?.Page?.pageInfo?.lastPage,
        totalResults: data.data?.Page?.pageInfo?.total,
        results: [],
      };

      res.results.push(
        ...(data.data?.Page?.media?.map((item: any) => ({
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
          image: item.coverImage.extraLarge ?? item.coverImage.large ?? item.coverImage.medium,
          cover: item.bannerImage,
          popularity: item.popularity,
          totalEpisodes: item.episodes ?? item.nextAiringEpisode?.episode - 1,
          currentEpisode: item.nextAiringEpisode?.episode - 1 ?? item.episodes,
          countryOfOrigin: item.countryOfOrigin,
          description: item.description,
          genres: item.genres,
          rating: item.averageScore,
          color: item.coverImage?.color,
          type: item.format,
          releaseDate: item.seasonYear,
        })) ??
          data.data?.map((item: any) => ({
            id: item.anilistId.toString(),
            malId: item.mappings["mal"],
            title: item.title,
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
            image: item.coverImage ?? item.bannerImage,
            cover: item.bannerImage,
            popularity: item.popularity,
            description: item.description,
            rating: item.averageScore,
            genres: item.genre,
            color: item.color,
            totalEpisodes: item.currentEpisode,
            type: item.format,
            releaseDate: item.year,
          })))
      );

      return res;
    } catch (err) {
      throw new Error((err as Error).message);
    }
  }

  async getMediaInfo(id: string, dub: boolean = false, fetchFiller: boolean = false) {
    const animeInfo: IMediaInfo = {
      id: id,
      title: "",
    };

    const options = {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      query: anilistMediaDetailQuery(id),
    };

    let fillerEpisodes: { number: string; "filler-bool": boolean }[];
    try {
      let { data, status } = await axios.post(this.anilistGraphqlUrl, options, {
        validateStatus: () => true,
      });

      if (status == 404)
        throw new Error(
          "Media not found. Perhaps the id is invalid or the anime is not in anilist"
        );
      if (status == 429)
        throw new Error("You have been ratelimited by anilist. Please try again later");
      if (status >= 500) throw new Error("Anilist seems to be down. Please try again later");
      if (status != 200 && status < 429)
        throw Error("Media not found. If the problem persists, please contact the developer");

      animeInfo.malId = data.data?.Media?.idMal ?? data?.mappings?.mal;
      animeInfo.title = data?.data?.Media
        ? {
            romaji: data.data?.Media.title.romaji,
            english: data.data?.Media.title.english,
            native: data.data?.Media.title.native,
            userPreferred: data.data?.Media.title.userPreferred,
          }
        : (data.data.title as ITitle);

      animeInfo.synonyms = data.data?.Media?.synonyms ?? data?.synonyms;
      animeInfo.isLicensed = data.data?.Media?.isLicensed ?? undefined;
      animeInfo.isAdult = data.data?.Media?.isAdult ?? undefined;
      animeInfo.countryOfOrigin = data.data?.Media?.countryOfOrigin ?? undefined;

      if (data.data?.Media?.trailer?.id) {
        animeInfo.trailer = {
          id: data.data?.Media.trailer.id,
          site: data.data?.Media.trailer?.site,
          thumbnail: data.data?.Media.trailer?.thumbnail,
        };
      }
      animeInfo.image =
        data.data?.Media?.coverImage?.extraLarge ??
        data.data?.Media?.coverImage?.large ??
        data.data?.Media?.coverImage?.medium ??
        data?.coverImage ??
        data?.bannerImage;

      animeInfo.popularity = data.data?.Media?.popularity ?? data?.popularity;
      animeInfo.color = data.data?.Media?.coverImage?.color ?? data?.color;
      animeInfo.cover = data.data?.Media?.bannerImage ?? data?.bannerImage ?? animeInfo.image;
      animeInfo.description = data.data?.Media?.description ?? data?.description;
      switch (data.data?.Media?.status ?? data?.status) {
        case "RELEASING":
          animeInfo.status = MediaStatus.ONGOING;
          break;
        case "FINISHED":
          animeInfo.status = MediaStatus.COMPLETED;
          break;
        case "NOT_YET_RELEASED":
          animeInfo.status = MediaStatus.NOT_YET_AIRED;
          break;
        case "CANCELLED":
          animeInfo.status = MediaStatus.CANCELLED;
          break;
        case "HIATUS":
          animeInfo.status = MediaStatus.HIATUS;
        default:
          animeInfo.status = MediaStatus.UNKNOWN;
      }
      animeInfo.releaseDate = data.data?.Media?.startDate?.year ?? data.year;
      animeInfo.startDate = {
        year: data?.data?.Media?.startDate?.year,
        month: data?.data?.Media?.startDate?.month,
        day: data.data?.Media?.startDate?.day,
      };
      animeInfo.endDate = {
        year: data?.data?.Media?.endDate?.year,
        month: data?.data?.Media?.endDate?.month,
        day: data?.data?.Media?.endDate?.day,
      };
      if (data.data?.Media.nextAiringEpisode?.airingAt)
        animeInfo.nextAiringEpisode = {
          airingTime: data.data?.Media.nextAiringEpisode?.airingAt,
          timeUntilAiring: data.data?.Media.nextAiringEpisode?.timeUntilAiring,
          episode: data.data?.Media.nextAiringEpisode?.episode,
        };
      animeInfo.totalEpisodes =
        data.data?.Media?.episodes ?? data.data?.Media.nextAiringEpisode?.episode - 1;
      animeInfo.currentEpisode = data.data?.Media?.nextAiringEpisode?.episode
        ? data.data?.Media.nextAiringEpisode?.episode - 1
        : data.data?.Media?.episodes;
      animeInfo.rating = data.data?.Media.averageScore;
      animeInfo.duration = data.data?.Media.duration;
      animeInfo.genres = data.data?.Media.genres;
      animeInfo.season = data.data?.Media.season;
      animeInfo.studios = data.data?.Media.studios.edges.map((item: any) => item.node.name);
      animeInfo.subOrDub = dub ? SubOrDub.DUB : SubOrDub.SUB;
      animeInfo.type = data.data?.Media.format;
      animeInfo.recommendations = data.data?.Media?.recommendations?.edges?.map((item: any) => ({
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
        episodes: item.node.mediaRecommendation?.episodes,
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

      animeInfo.characters = data.data?.Media?.characters?.edges?.map((item: any) => ({
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
        voiceActors: item.voiceActors.map((voiceActor: any) => ({
          id: voiceActor.id,
          language: voiceActor.languageV2,
          name: {
            first: voiceActor.name.first,
            last: voiceActor.name.last,
            full: voiceActor.name.full,
            native: voiceActor.name.native,
            userPreferred: voiceActor.name.userPreferred,
          },
          image: voiceActor.image.large ?? voiceActor.image.medium,
        })),
      }));

      animeInfo.relations = data.data?.Media?.relations?.edges?.map((item: any) => ({
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
        episodes: item.node.episodes,
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

      if (
        this.provider instanceof GogoAnime &&
        !dub &&
        (animeInfo.status === MediaStatus.ONGOING ||
          range({ from: 1940, to: new Date().getFullYear() + 1 }).includes(
            parseInt(animeInfo.releaseDate!)
          ))
      ) {
        try {
          animeInfo.episodes = await this.fetchDefaultEpisodeList(
            {
              idMal: animeInfo.malId! as number,
              season: data.data.Media.season,
              startDate: { year: parseInt(animeInfo.releaseDate!) },
              title: { english: animeInfo.title?.english!, romaji: animeInfo.title?.romaji! },
            },
            dub,
            id
          );
          animeInfo.episodes = animeInfo.episodes?.map((episode: IMediaEpisode) => {
            if (!episode.image) episode.image = animeInfo.image;

            return episode;
          });
        } catch (err) {
          animeInfo.episodes = await this.fetchDefaultEpisodeList(
            {
              idMal: animeInfo.malId! as number,
              season: data.data.Media.season,
              startDate: { year: parseInt(animeInfo.releaseDate!) },
              title: { english: animeInfo.title?.english!, romaji: animeInfo.title?.romaji! },
            },
            dub,
            id
          );

          animeInfo.episodes = animeInfo.episodes?.map((episode: IMediaEpisode) => {
            if (!episode.image) episode.image = animeInfo.image;

            return episode;
          });

          return animeInfo;
        }
      } else
        animeInfo.episodes = await this.fetchDefaultEpisodeList(
          {
            idMal: animeInfo.malId! as number,
            season: data.data.Media.season,
            startDate: { year: parseInt(animeInfo.releaseDate!) },
            title: { english: animeInfo.title?.english!, romaji: animeInfo.title?.romaji! },
            externalLinks: data.data.Media.externalLinks.filter(
              (link: any) => link.type === "STREAMING"
            ),
          },
          dub,
          id
        );

      animeInfo.episodes = animeInfo.episodes?.map((episode: IMediaEpisode) => {
        if (!episode.image) episode.image = animeInfo.image;

        return episode;
      });

      if (fetchFiller) {
        const { data: fillerData } = await this.client.get(
          `https://raw.githubusercontent.com/TobyBridle/mal-id-filler-list/main/fillers/${animeInfo.malId}.json`,
          { validateStatus: () => true }
        );

        if (!fillerData.toString().startsWith("404")) {
          fillerEpisodes = [];
          fillerEpisodes?.push(
            ...(fillerData.episodes as { number: string; "filler-bool": boolean }[])
          );
        }
      }

      animeInfo.episodes = animeInfo.episodes?.map((episode: IMediaEpisode) => {
        if (!episode.image) episode.image = animeInfo.image;

        if (fetchFiller && fillerEpisodes?.length > 0) {
          if (fillerEpisodes[episode.number! - 1])
            episode.isFiller = new Boolean(
              fillerEpisodes[episode.number! - 1]["filler-bool"]
            ).valueOf();
        }

        return episode;
      });

      return animeInfo;
    } catch (error) {
      console.error(error);
      throw new Error(`Anilist Error: ${(error as Error).message}`);
    }
  }

  async getMediaSources(episodeId: string, ...args: any): Promise<ISource> {
    try {
      return this.provider.getMediaSources(episodeId, ...args);
    } catch (error) {
      throw new Error(
        `Failed to fetch episode sources from ${this.provider.metaData.name}: ${error}`
      );
    }
  }

  async getMediaServers(episodeId: string): Promise<IEpisodeServer[]> {
    try {
      return this.provider.getMediaServers(episodeId);
    } catch (err) {
      throw new Error(
        `Failed to fetch episode servers from ${this.provider.metaData.name}: ${err}`
      );
    }
  }

  private fetchDefaultEpisodeList = async (
    Media: {
      idMal: number;
      title: { english: string; romaji: string };
      season: string;
      startDate: { year: number };
      externalLinks?: any;
    },
    dub: boolean,
    id: string
  ) => {
    let episodes: IMediaEpisode[] = [];

    episodes = await this.findAnime(
      { english: Media.title?.english!, romaji: Media.title?.romaji! },
      Media.season!,
      Media.startDate.year,
      Media.idMal as number,
      dub,
      id,
      Media.externalLinks
    );

    return episodes;
  };

  private findAnime = async (
    title: { romaji: string; english: string },
    season: string,
    startDate: number,
    malId: number,
    dub: boolean,
    anilistId: string,
    externalLinks?: any
  ): Promise<IMediaEpisode[]> => {
    title.english = title.english ?? title.romaji;
    title.romaji = title.romaji ?? title.english;

    title.english = title.english.toLowerCase();
    title.romaji = title.romaji.toLowerCase();

    if (title.english === title.romaji) {
      return (
        (await this.findAnimeSlug(
          title.english,
          season,
          startDate,
          malId,
          dub,
          anilistId,
          externalLinks
        )) ?? []
      );
    }

    const romajiPossibleEpisodes = await this.findAnimeSlug(
      title.romaji,
      season,
      startDate,
      malId,
      dub,
      anilistId,
      externalLinks
    );

    if (romajiPossibleEpisodes) {
      return romajiPossibleEpisodes;
    }

    const englishPossibleEpisodes = await this.findAnimeSlug(
      title.english,
      season,
      startDate,
      malId,
      dub,
      anilistId,
      externalLinks
    );
    return englishPossibleEpisodes ?? [];
  };

  private findAnimeSlug = async (
    title: string,
    season: string,
    startDate: number,
    malId: number,
    dub: boolean,
    anilistId: string,
    externalLinks?: any
  ): Promise<IMediaEpisode[] | undefined> => {
    const slug = title.replace(/[^0-9a-zA-Z]+/g, " ");

    let possibleAnime: any | undefined;

    let possibleSource = await this.findMappingId(malId, dub);

    if (!possibleSource) possibleAnime = await this.findAnimeRaw(slug);
    if (!possibleSource && !possibleAnime) return [];

    try {
      possibleAnime = await this.provider.getMediaInfo(possibleSource!);
    } catch (err) {
      console.error(err);
      possibleAnime = await this.findAnimeRaw(slug);
    }

    if (!possibleAnime) return undefined;

    // To avoid a new request, lets match and see if the anime show found is in sub/dub

    const expectedType = dub ? SubOrDubOrBoth.DUB : SubOrDubOrBoth.SUB;

    // Have this as a fallback in the meantime for compatibility
    if (possibleAnime.subOrDub) {
      if (possibleAnime.subOrDub != SubOrDubOrBoth.BOTH && possibleAnime.subOrDub != expectedType) {
        return undefined;
      }
    } else if (
      ((!possibleAnime.hasDub && dub) || (!possibleAnime.hasSub && !dub)) &&
      !this.provider.metaData.name.toLowerCase().includes("animepahe")
    ) {
      return undefined;
    }

    // if (this.provider instanceof Zoro) {
    //   // Set the correct episode sub/dub request type
    //   possibleAnime.episodes.forEach((_: any, index: number) => {
    //     if (possibleAnime.subOrDub === SubOrSub.BOTH) {
    //       possibleAnime.episodes[index].id = possibleAnime.episodes[index].id.replace(
    //         `$both`,
    //         dub ? '$dub' : '$sub'
    //       );
    //     }
    //   });
    // }

    // if (this.provider instanceof Crunchyroll) {
    //   const nestedEpisodes = Object.keys(possibleAnime.episodes)
    //     .filter((key: any) => key.toLowerCase().includes(dub ? 'dub' : 'sub'))
    //     .sort((first: any, second: any) => {
    //       return (
    //         (possibleAnime.episodes[first]?.[0].season_number ?? 0) -
    //         (possibleAnime.episodes[second]?.[0].season_number ?? 0)
    //       );
    //     })
    //     .map((key: any) => {
    //       const audio = key
    //         .replace(/[0-9]/g, '')
    //         .replace(/(^\w{1})|(\s+\w{1})/g, (letter: string) => letter.toUpperCase());
    //       possibleAnime.episodes[key].forEach((element: any) => (element.type = audio));
    //       return possibleAnime.episodes[key];
    //     });
    //   return nestedEpisodes.flat();
    // }

    // if (this.provider instanceof NineAnime) {
    //   possibleAnime.episodes.forEach((_: any, index: number) => {
    //     if (expectedType == SubOrSub.DUB) {
    //       possibleAnime.episodes[index].id = possibleAnime.episodes[index].dubId;
    //     }

    //     if (possibleAnime.episodes[index].dubId) {
    //       delete possibleAnime.episodes[index].dubId;
    //     }
    //   });
    //   possibleAnime.episodes = possibleAnime.episodes.filter((el: any) => el.id != undefined);
    // }

    const possibleProviderEpisodes = possibleAnime.episodes as IMediaEpisode[];

    if (
      typeof possibleProviderEpisodes[0]?.image !== "undefined" &&
      typeof possibleProviderEpisodes[0]?.title !== "undefined" &&
      typeof possibleProviderEpisodes[0]?.description !== "undefined"
    ) {
      return possibleProviderEpisodes;
    }

    const options = {
      headers: { "Content-Type": "application/json" },
      query: kitsuSearchQuery(slug),
    };

    const newEpisodeList = await this.findKitsuAnime(
      possibleProviderEpisodes,
      options,
      season,
      startDate
    );

    return newEpisodeList;
  };

  private findMappingId = async (malId: number, dub: boolean) => {
    if (!malId) return undefined;

    try {
      const { data } = await axios.get<MalsyncReturn>(
        `https://raw.githubusercontent.com/bal-mackup/mal-backup/master/mal/anime/${malId.toString()}.json`
      );

      // find site in sites
      if (!data) return undefined;

      const sitesT = data.Sites;

      let sites = Object.values(sitesT).map((v, i) => {
        const obj = [...Object.values(Object.values(sitesT)[i])];
        const pages: any = obj.map((v) => ({
          page: v.page,
          url: v.url,
          title: v.title,
        }));
        return pages;
      }) as {
        page: string;
        url: string;
        title: string;
      }[];

      sites = sites.flat();

      sites.sort((a, b) => {
        const targetTitle = data.title.toLowerCase();

        const firstRating = compareTwoStrings(targetTitle, a.title.toLowerCase());
        const secondRating = compareTwoStrings(targetTitle, b.title.toLowerCase());

        // Sort in descending order
        return secondRating - firstRating;
      });

      const possibleSource = sites.find((s) => {
        if (s.page.toLowerCase() !== this.provider.metaData.name.toLowerCase()) return false;
        if (this.provider instanceof GogoAnime) {
          return dub
            ? s.title.toLowerCase().includes("dub")
            : !s.title.toLowerCase().includes("dub");
        } else return true;
      });

      if (possibleSource) return possibleSource.url.split("/").pop()!;

      if (!this.animapped_api_key) return undefined;

      const { data: animapped_data } = await axios.get<AnimappedRes>(
        `${this.animapped_api_url}/mal/${malId}?api_key=${this.animapped_api_key}`
      );

      const mappings = animapped_data?.mappings;

      if (!mappings) return undefined;

      const findMappingSite = Object.entries(mappings).find(([key, v]) => {
        return key === this.provider.metaData.name.toLowerCase();
      });

      if (!findMappingSite || findMappingSite === null) return undefined;

      let findMapping;
      try {
        findMapping = Object.entries(findMappingSite![1]).find(([key, v]) => {
          if (this.provider instanceof GogoAnime) {
            return dub ? key.toLowerCase().includes("dub") : !key.toLowerCase().includes("dub");
          } else return true;
        });
      } catch (error) {
        return undefined;
      }

      return findMapping?.[1]?.id || undefined;
    } catch (error) {
      throw new Error(`Anilist Mapping Error: ${(error as Error).message}`);
    }
  };

  private findAnimeRaw = async (slug: string, externalLinks?: any) => {
    const findAnime = (await this.provider.search(slug)) as ISearch<IMediaResult>;

    if (findAnime.results.length === 0) return undefined;

    // Sort the retrieved info for more accurate results.

    let topRating = 0;

    findAnime.results.sort((a, b) => {
      const targetTitle = slug.toLowerCase();

      let firstTitle: string;
      let secondTitle: string;

      if (typeof a.title == "string") firstTitle = a.title as string;
      else firstTitle = a.title.english ?? a.title.romaji ?? "";

      if (typeof b.title == "string") secondTitle = b.title as string;
      else secondTitle = b.title.english ?? b.title.romaji ?? "";

      const firstRating = compareTwoStrings(targetTitle, firstTitle.toLowerCase());
      const secondRating = compareTwoStrings(targetTitle, secondTitle.toLowerCase());

      if (firstRating > topRating) {
        topRating = firstRating;
      }
      if (secondRating > topRating) {
        topRating = secondRating;
      }

      // Sort in descending order
      return secondRating - firstRating;
    });

    if (topRating >= 0.7) {
      return await this.provider.getMediaInfo(findAnime.results[0].id);
    }

    return undefined;
  };

  private findKitsuAnime = async (
    possibleProviderEpisodes: IMediaEpisode[],
    options: {},
    season?: string,
    startDate?: number
  ) => {
    const kitsuEpisodes = await this.client.post(this.kitsuGraphqlUrl, options);
    const episodesList = new Map();
    if (kitsuEpisodes?.data.data) {
      const { nodes } = kitsuEpisodes.data.data.searchAnimeByTitle;

      if (nodes) {
        nodes.forEach((node: any) => {
          if (
            node.season === season &&
            node.startDate.trim().split("-")[0] === startDate?.toString()
          ) {
            const episodes = node.episodes.nodes;

            for (const episode of episodes) {
              const i = episode?.number.toString().replace(/"/g, "");

              let name = undefined;
              let description = undefined;
              let thumbnail = undefined;

              if (episode?.description?.en)
                description = episode?.description.en
                  .toString()
                  .replace(/"/g, "")
                  .replace("\\n", "\n");
              if (episode?.thumbnail)
                thumbnail = episode?.thumbnail.original.url.toString().replace(/"/g, "");

              if (episode) {
                if (episode.titles?.canonical)
                  name = episode.titles.canonical.toString().replace(/"/g, "");
                episodesList.set(i, {
                  episodeNum: episode?.number.toString().replace(/"/g, ""),
                  title: name,
                  description,
                  createdAt: episode?.createdAt,
                  thumbnail,
                });
                continue;
              }
              episodesList.set(i, {
                episodeNum: undefined,
                title: undefined,
                description: undefined,
                createdAt: undefined,
                thumbnail,
              });
            }
          }
        });
      }
    }

    const newEpisodeList: IMediaEpisode[] = [];
    if (possibleProviderEpisodes?.length !== 0) {
      possibleProviderEpisodes?.forEach((ep, i) => {
        const j = (i + 1).toString();
        newEpisodeList.push({
          id: ep.id as string,
          title: ep.title ?? episodesList.get(j)?.title ?? null,
          image: ep.image ?? episodesList.get(j)?.thumbnail ?? null,
          number: (ep.number as number) ?? null,
          createdAt: ep.createdAt ?? episodesList.get(j)?.createdAt ?? null,
          description: ep.description ?? episodesList.get(j)?.description ?? null,
          url: (ep.url as string) ?? null,
          hasDub: ep.hasDub ?? "UNKOWN",
          hasSub: ep.hasSub ?? "UNKOWN",
        });
      });
    }

    return newEpisodeList;
  };

  getTrendingAnime = async (
    page: number = 1,
    perPage: number = 10
  ): Promise<ISearch<IMediaResult>> => {
    const options = {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      query: anilistTrendingQuery(page, perPage),
    };

    try {
      const { data } = await this.client.post(this.anilistGraphqlUrl, options);

      const res: ISearch<IMediaResult> = {
        currentPage: data.data.Page.pageInfo.currentPage,
        hasNextPage: data.data.Page.pageInfo.hasNextPage,
        results: data.data.Page.media.map((item: any) => ({
          id: item.id.toString(),
          malId: item.idMal,
          title:
            {
              romaji: item.title.romaji,
              english: item.title.english,
              native: item.title.native,
              userPreferred: item.title.userPreferred,
            } || item.title.romaji,
          image: item.coverImage.extraLarge ?? item.coverImage.large ?? item.coverImage.medium,
          trailer: {
            id: item.trailer?.id,
            site: item.trailer?.site,
            thumbnail: item.trailer?.thumbnail,
          },
          description: item.description,
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
          cover:
            item.bannerImage ??
            item.coverImage.extraLarge ??
            item.coverImage.large ??
            item.coverImage.medium,
          rating: item.averageScore,
          releaseDate: item.seasonYear,
          color: item.coverImage?.color,
          genres: item.genres,
          totalEpisodes: isNaN(item.episodes)
            ? 0
            : item.episodes ?? item.nextAiringEpisode?.episode - 1 ?? 0,
          duration: item.duration,
          type: item.format,
        })),
      };
      return res;
    } catch (err) {
      throw new Error((err as Error).message);
    }
  };

  getPopularAnime = async (
    page: number = 1,
    perPage: number = 10
  ): Promise<ISearch<IMediaResult>> => {
    const options = {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      query: anilistPopularQuery(page, perPage),
    };

    try {
      const { data } = await this.client.post(this.anilistGraphqlUrl, options);

      const res: ISearch<IMediaResult> = {
        currentPage: data.data.Page.pageInfo.currentPage,
        hasNextPage: data.data.Page.pageInfo.hasNextPage,
        results: data.data.Page.media.map((item: any) => ({
          id: item.id.toString(),
          malId: item.idMal,
          title:
            {
              romaji: item.title.romaji,
              english: item.title.english,
              native: item.title.native,
              userPreferred: item.title.userPreferred,
            } || item.title.romaji,
          image: item.coverImage.extraLarge ?? item.coverImage.large ?? item.coverImage.medium,
          trailer: {
            id: item.trailer?.id,
            site: item.trailer?.site,
            thumbnail: item.trailer?.thumbnail,
          },
          description: item.description,
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
          cover:
            item.bannerImage ??
            item.coverImage.extraLarge ??
            item.coverImage.large ??
            item.coverImage.medium,
          rating: item.averageScore,
          releaseDate: item.seasonYear,
          color: item.coverImage?.color,
          genres: item.genres,
          totalEpisodes: isNaN(item.episodes)
            ? 0
            : item.episodes ?? item.nextAiringEpisode?.episode - 1 ?? 0,
          duration: item.duration,
          type: item.format,
        })),
      };
      return res;
    } catch (err) {
      throw new Error((err as Error).message);
    }
  };

  getAiringSchedule = async (
    page: number = 1,
    perPage: number = 20,
    weekStart: number | string = (new Date().getDay() + 1) % 7,
    weekEnd: number | string = (new Date().getDay() + 7) % 7,
    notYetAired: boolean = false
  ): Promise<ISearch<IMediaResult>> => {
    let day1,
      day2 = undefined;

    if (typeof weekStart === "string" && typeof weekEnd === "string")
      [day1, day2] = getDays(
        capitalizeFirstLetter(weekStart.toLowerCase()),
        capitalizeFirstLetter(weekEnd.toLowerCase())
      );
    else if (typeof weekStart === "number" && typeof weekEnd === "number")
      [day1, day2] = [weekStart, weekEnd];
    else throw new Error("Invalid weekStart or weekEnd");

    const options = {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      query: anilistAiringScheduleQuery(page, perPage, day1, day2, notYetAired),
    };

    try {
      const { data } = await this.client.post(this.anilistGraphqlUrl, options);

      const res: ISearch<IMediaResult> = {
        currentPage: data.data.Page.pageInfo.currentPage,
        hasNextPage: data.data.Page.pageInfo.hasNextPage,
        results: data.data.Page.airingSchedules.map((item: any) => ({
          id: item.media.id.toString(),
          malId: item.media.idMal,
          episode: item.episode,
          airingAt: item.airingAt,
          title:
            {
              romaji: item.media.title.romaji,
              english: item.media.title.english,
              native: item.media.title.native,
              userPreferred: item.media.title.userPreferred,
            } || item.media.title.romaji,
          country: item.media.countryOfOrigin,
          image:
            item.media.coverImage.extraLarge ??
            item.media.coverImage.large ??
            item.media.coverImage.medium,
          description: item.media.description,
          cover:
            item.media.bannerImage ??
            item.media.coverImage.extraLarge ??
            item.media.coverImage.large ??
            item.media.coverImage.medium,
          genres: item.media.genres,
          color: item.media.coverImage?.color,
          rating: item.media.averageScore,
          releaseDate: item.media.seasonYear,
          type: item.media.format,
        })),
      };
      return res;
    } catch (err) {
      throw new Error((err as Error).message);
    }
  };

  getRandomAnime = async (): Promise<IMediaResult> => {
    const options = {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      query: anilistSiteStatisticsQuery(),
    };

    try {
      // const {
      //   data: { data },
      // } = await this.client.post(this.anilistGraphqlUrl, options);

      // const selectedAnime = Math.floor(
      //   Math.random() * data.SiteStatistics.anime.nodes[data.SiteStatistics.anime.nodes.length - 1].count
      // );
      // const { results } = await this.advancedSearch(undefined, 'ANIME', Math.ceil(selectedAnime / 50), 50);

      const { data: data } = await this.client.get(
        "https://raw.githubusercontent.com/TDanks2000/anilistIds/main/anime_ids.txt"
      );

      const ids = data?.trim().split("\n");
      const selectedAnime = Math.floor(Math.random() * ids.length);
      return await this.getMediaInfo(ids[selectedAnime]);
    } catch (err) {
      throw new Error((err as Error).message);
    }
  };

  getStaffById = async (id: number) => {
    throw new Error("Not implemented yet");
  };

  getAnimeGenres = async (genres: string[] | Genres[], page: number = 1, perPage: number = 20) => {
    if (genres.length === 0) throw new Error("No genres specified");

    for (const genre of genres)
      if (!Object.values(Genres).includes(genre as Genres)) throw new Error("Invalid genre");

    const options = {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      query: anilistGenresQuery(genres, page, perPage),
    };
    try {
      const { data } = await this.client.post(this.anilistGraphqlUrl, options);

      const res: ISearch<IMediaResult> = {
        currentPage: data.data.Page.pageInfo.currentPage,
        hasNextPage: data.data.Page.pageInfo.hasNextPage,
        results: data.data.Page.media.map((item: any) => ({
          id: item.id.toString(),
          malId: item.idMal,
          title:
            {
              romaji: item.title.romaji,
              english: item.title.english,
              native: item.title.native,
              userPreferred: item.title.userPreferred,
            } || item.title.romaji,
          image: item.coverImage.extraLarge ?? item.coverImage.large ?? item.coverImage.medium,
          trailer: {
            id: item.trailer?.id,
            site: item.trailer?.site,
            thumbnail: item.trailer?.thumbnail,
          },
          description: item.description,
          cover:
            item.bannerImage ??
            item.coverImage.extraLarge ??
            item.coverImage.large ??
            item.coverImage.medium,
          rating: item.averageScore,
          releaseDate: item.seasonYear,
          color: item.coverImage?.color,
          genres: item.genres,
          totalEpisodes: isNaN(item.episodes)
            ? 0
            : item.episodes ?? item.nextAiringEpisode?.episode - 1 ?? 0,
          duration: item.duration,
          type: item.format,
        })),
      };
      return res;
    } catch (err) {
      throw new Error((err as Error).message);
    }
  };

  gethAnilistInfoById = async (id: string) => {
    const animeInfo: IMediaInfo = {
      id: id,
      title: "",
    };

    const options = {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      query: anilistMediaDetailQuery(id),
    };

    try {
      const { data } = await this.client.post(this.anilistGraphqlUrl, options).catch(() => {
        throw new Error("Media not found");
      });
      animeInfo.malId = data.data.Media.idMal;
      animeInfo.title = {
        romaji: data.data.Media.title.romaji,
        english: data.data.Media.title.english,
        native: data.data.Media.title.native,
        userPreferred: data.data.Media.title.userPreferred,
      };

      if (data.data.Media.trailer?.id) {
        animeInfo.trailer = {
          id: data.data.Media.trailer?.id,
          site: data.data.Media.trailer?.site,
          thumbnail: data.data.Media.trailer?.thumbnail,
        };
      }

      animeInfo.synonyms = data.data.Media.synonyms;
      animeInfo.isLicensed = data.data.Media.isLicensed;
      animeInfo.isAdult = data.data.Media.isAdult;
      animeInfo.countryOfOrigin = data.data.Media.countryOfOrigin;

      animeInfo.image =
        data.data.Media.coverImage.extraLarge ??
        data.data.Media.coverImage.large ??
        data.data.Media.coverImage.medium;

      animeInfo.cover = data.data.Media.bannerImage ?? animeInfo.image;
      animeInfo.description = data.data.Media.description;
      switch (data.data.Media.status) {
        case "RELEASING":
          animeInfo.status = MediaStatus.ONGOING;
          break;
        case "FINISHED":
          animeInfo.status = MediaStatus.COMPLETED;
          break;
        case "NOT_YET_RELEASED":
          animeInfo.status = MediaStatus.NOT_YET_AIRED;
          break;
        case "CANCELLED":
          animeInfo.status = MediaStatus.CANCELLED;
          break;
        case "HIATUS":
          animeInfo.status = MediaStatus.HIATUS;
        default:
          animeInfo.status = MediaStatus.UNKNOWN;
      }
      animeInfo.releaseDate = data.data.Media.startDate.year;
      if (data.data.Media.nextAiringEpisode?.airingAt)
        animeInfo.nextAiringEpisode = {
          airingTime: data.data.Media.nextAiringEpisode?.airingAt,
          timeUntilAiring: data.data.Media.nextAiringEpisode?.timeUntilAiring,
          episode: data.data.Media.nextAiringEpisode?.episode,
        };

      animeInfo.totalEpisodes =
        data.data.Media?.episodes ?? data.data.Media.nextAiringEpisode?.episode - 1;
      animeInfo.currentEpisode = data.data.Media?.nextAiringEpisode?.episode
        ? data.data.Media.nextAiringEpisode?.episode - 1
        : data.data.Media?.episodes || undefined;
      animeInfo.rating = data.data.Media.averageScore;
      animeInfo.duration = data.data.Media.duration;
      animeInfo.genres = data.data.Media.genres;
      animeInfo.studios = data.data.Media.studios.edges.map((item: any) => item.node.name);
      animeInfo.season = data.data.Media.season;
      animeInfo.popularity = data.data.Media.popularity;
      animeInfo.type = data.data.Media.format;
      animeInfo.startDate = {
        year: data.data.Media.startDate?.year,
        month: data.data.Media.startDate?.month,
        day: data.data.Media.startDate?.day,
      };
      animeInfo.endDate = {
        year: data.data.Media.endDate?.year,
        month: data.data.Media.endDate?.month,
        day: data.data.Media.endDate?.day,
      };
      animeInfo.recommendations = data.data.Media.recommendations.edges.map((item: any) => ({
        id: item.node.mediaRecommendation.id,
        malId: item.node.mediaRecommendation.idMal,
        title: {
          romaji: item.node.mediaRecommendation.title.romaji,
          english: item.node.mediaRecommendation.title.english,
          native: item.node.mediaRecommendation.title.native,
          userPreferred: item.node.mediaRecommendation.title.userPreferred,
        },
        status:
          item.node.mediaRecommendation.status == "RELEASING"
            ? MediaStatus.ONGOING
            : item.node.mediaRecommendation.status == "FINISHED"
            ? MediaStatus.COMPLETED
            : item.node.mediaRecommendation.status == "NOT_YET_RELEASED"
            ? MediaStatus.NOT_YET_AIRED
            : item.node.mediaRecommendation.status == "CANCELLED"
            ? MediaStatus.CANCELLED
            : item.node.mediaRecommendation.status == "HIATUS"
            ? MediaStatus.HIATUS
            : MediaStatus.UNKNOWN,
        episodes: item.node.mediaRecommendation.episodes,
        image:
          item.node.mediaRecommendation.coverImage.extraLarge ??
          item.node.mediaRecommendation.coverImage.large ??
          item.node.mediaRecommendation.coverImage.medium,
        cover:
          item.node.mediaRecommendation.bannerImage ??
          item.node.mediaRecommendation.coverImage.extraLarge ??
          item.node.mediaRecommendation.coverImage.large ??
          item.node.mediaRecommendation.coverImage.medium,
        rating: item.node.mediaRecommendation.meanScore,
        type: item.node.mediaRecommendation.format,
      }));

      animeInfo.characters = data.data.Media.characters.edges.map((item: any) => ({
        id: item.node.id,
        role: item.role,
        name: {
          first: item.node.name.first,
          last: item.node.name.last,
          full: item.node.name.full,
          native: item.node.name.native,
          userPreferred: item.node.name.userPreferred,
        },
        image: item.node.image.large ?? item.node.image.medium,
        voiceActors: item.voiceActors.map((voiceActor: any) => ({
          id: voiceActor.id,
          language: voiceActor.languageV2,
          name: {
            first: voiceActor.name.first,
            last: voiceActor.name.last,
            full: voiceActor.name.full,
            native: voiceActor.name.native,
            userPreferred: voiceActor.name.userPreferred,
          },
          image: voiceActor.image.large ?? voiceActor.image.medium,
        })),
      }));
      animeInfo.color = data.data.Media.coverImage?.color;
      animeInfo.relations = data.data.Media.relations.edges.map((item: any) => ({
        id: item.node.id,
        malId: item.node.idMal,
        relationType: item.relationType,
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
        episodes: item.node.episodes,

        image:
          item.node.coverImage.extraLarge ??
          item.node.coverImage.large ??
          item.node.coverImage.medium,
        cover:
          item.node.bannerImage ??
          item.node.coverImage.extraLarge ??
          item.node.coverImage.large ??
          item.node.coverImage.medium,
        rating: item.node.meanScore,
        type: item.node.format,
      }));

      return animeInfo;
    } catch (err) {
      throw new Error((err as Error).message);
    }
  };

  getCharacterInfoById = async (id: string) => {
    const options = {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      query: anilistCharacterQuery(),
      variables: {
        id: id,
      },
    };

    try {
      const {
        data: {
          data: { Character },
        },
      } = await this.client.post(this.anilistGraphqlUrl, options);

      const height = Character.description.match(/__Height:__(.*)/)?.[1].trim();
      const weight = Character.description.match(/__Weight:__(.*)/)?.[1].trim();
      const hairColor = Character.description.match(/__Hair Color:__(.*)/)?.[1].trim();
      const eyeColor = Character.description.match(/__Eye Color:__(.*)/)?.[1].trim();
      const relatives = Character.description
        .match(/__Relatives:__(.*)/)?.[1]
        .trim()
        .split(/(, \[)/g)
        .filter((g: string) => !g.includes(", ["))
        .map((r: string) => ({
          id: r.match(/\/(\d+)/)?.[1],
          name: r.match(/([^)]+)\]/)?.[1].replace(/\[/g, ""),
          relationship: r.match(/\(([^)]+)\).*?(\(([^)]+)\))/)?.[3],
        }));
      const race = Character.description
        .match(/__Race:__(.*)/)?.[1]
        .split(", ")
        .map((r: string) => r.trim());
      const rank = Character.description.match(/__Rank:__(.*)/)?.[1];
      const occupation = Character.description.match(/__Occupation:__(.*)/)?.[1];
      const previousPosition = Character.description
        .match(/__Previous Position:__(.*)/)?.[1]
        ?.trim();
      const partner = Character.description
        .match(/__Partner:__(.*)/)?.[1]
        .split(/(, \[)/g)
        .filter((g: string) => !g.includes(", ["))
        .map((r: string) => ({
          id: r.match(/\/(\d+)/)?.[1],
          name: r.match(/([^)]+)\]/)?.[1].replace(/\[/g, ""),
        }));
      const dislikes = Character.description.match(/__Dislikes:__(.*)/)?.[1];
      const sign = Character.description.match(/__Sign:__(.*)/)?.[1];
      const zodicSign = Character.description.match(/__Zodiac sign:__(.*)/)?.[1]?.trim();
      const zodicAnimal = Character.description.match(/__Zodiac Animal:__(.*)/)?.[1]?.trim();
      const themeSong = Character.description.match(/__Theme Song:__(.*)/)?.[1]?.trim();
      Character.description = Character.description.replace(
        /__Theme Song:__(.*)\n|__Race:__(.*)\n|__Height:__(.*)\n|__Relatives:__(.*)\n|__Rank:__(.*)\n|__Zodiac sign:__(.*)\n|__Zodiac Animal:__(.*)\n|__Weight:__(.*)\n|__Eye Color:__(.*)\n|__Hair Color:__(.*)\n|__Dislikes:__(.*)\n|__Sign:__(.*)\n|__Partner:__(.*)\n|__Previous Position:__(.*)\n|__Occupation:__(.*)\n/gm,
        ""
      );

      const characterInfo = {
        id: Character.id,
        name: {
          first: Character.name?.first,
          last: Character.name?.last,
          full: Character.name?.full,
          native: Character.name?.native,
          userPreferred: Character.name?.userPreferred,
          alternative: Character.name?.alternative,
          alternativeSpoiler: Character.name?.alternativeSpoiler,
        },
        image: Character.image?.large ?? Character.image?.medium,
        description: Character.description,
        gender: Character.gender,
        dateOfBirth: {
          year: Character.dateOfBirth?.year,
          month: Character.dateOfBirth?.month,
          day: Character.dateOfBirth?.day,
        },
        bloodType: Character.bloodType,
        age: Character.age,
        hairColor: hairColor,
        eyeColor: eyeColor,
        height: height,
        weight: weight,
        occupation: occupation,
        partner: partner,
        relatives: relatives,
        race: race,
        rank: rank,
        previousPosition: previousPosition,
        dislikes: dislikes,
        sign: sign,
        zodicSign: zodicSign,
        zodicAnimal: zodicAnimal,
        themeSong: themeSong,
        relations: Character.media.edges?.map((v: any) => ({
          id: v.node.id,
          malId: v.node.idMal,
          role: v.characterRole,
          title: {
            romaji: v.node.title?.romaji,
            english: v.node.title?.english,
            native: v.node.title?.native,
            userPreferred: v.node.title?.userPreferred,
          },
          status:
            v.node.status == "RELEASING"
              ? MediaStatus.ONGOING
              : v.node.status == "FINISHED"
              ? MediaStatus.COMPLETED
              : v.node.status == "NOT_YET_RELEASED"
              ? MediaStatus.NOT_YET_AIRED
              : v.node.status == "CANCELLED"
              ? MediaStatus.CANCELLED
              : v.node.status == "HIATUS"
              ? MediaStatus.HIATUS
              : MediaStatus.UNKNOWN,
          episodes: v.node.episodes,
          image:
            v.node.coverImage?.extraLarge ?? v.node.coverImage?.large ?? v.node.coverImage?.medium,
          rating: v.node.averageScore,
          releaseDate: v.node.startDate?.year,
          type: v.node.format,
          color: v.node.coverImage?.color,
        })),
      };

      return characterInfo;
    } catch (err) {
      throw new Error((err as Error).message);
    }
  };

  static Anime = this;

  static Manga = class Manga {
    provider: ReadableParser;

    /**
     * Maps anilist manga to any manga provider (mangadex, mangasee, etc)
     * @param provider MangaParser
     */
    constructor(provider?: ReadableParser) {
      this.provider = provider || new Mangasee123();
    }

    /**
     *
     * @param query query to search for
     * @param page (optional) page number (default: `1`)
     * @param perPage (optional) number of results per page (default: `20`)
     */
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
        const { data } = await axios.post(new Anilist().anilistGraphqlUrl, options);

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
              image:
                item.coverImage?.extraLarge ?? item.coverImage?.large ?? item.coverImage?.medium,
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

    /**
     *
     * @param chapterId chapter id
     * @param args args to pass to the provider (if any)
     * @returns
     */
    getChapterPages = (chapterId: string, ...args: any): Promise<IReadableChapterPage[]> => {
      return this.provider.getChapterPages(chapterId, ...args);
    };

    getMediaInfo = async (id: string, ...args: any): Promise<IReadableInfo> => {
      const mangaInfo: IReadableInfo = {
        id: id,
        title: "",
      };

      const options = {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        query: anilistMediaDetailQuery(id, "MANGA"),
      };

      try {
        const { data } = await axios.post(new Anilist().anilistGraphqlUrl, options).catch((err) => {
          console.log(err);
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

        mangaInfo.chapters = await new Anilist().findManga(
          this.provider,
          {
            english: mangaInfo.title.english!,
            romaji: mangaInfo.title.romaji!,
          },
          mangaInfo.malId as number
        );
        mangaInfo.chapters = mangaInfo.chapters.reverse();

        return mangaInfo;
      } catch (error) {
        throw Error((error as Error).message);
      }
    };
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

export default Anilist;

/**
 * Most of this code is from @consumet i have just modifed it a little
 * Its not intended for public use on use on my app (@ApolloTV)
 */

(async () => {
  const ext = new Anilist.Manga(new MangaDex());
  const info = await ext.getMediaInfo("64053");
  console.log(info);
})();
