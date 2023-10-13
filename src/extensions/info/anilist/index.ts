import axios from "axios";
import {
  AnimappedRes,
  Genres,
  IEpisodeServer,
  IMediaEpisode,
  IMediaInfo,
  IMediaResult,
  ISearch,
  ISource,
  ITitle,
  MediaProvier,
  MediaStatus,
  MetaData,
  SubOrDub,
  SubOrDubOrBoth,
} from "../../../types";
import GogoAnime from "../../anime/gogoanime";
import { AdvancedSearch, MalsyncReturn } from "./types";
import { compareTwoStrings, range } from "../../../utils";
import {
  anilistAdvancedQuery,
  anilistMediaDetailQuery,
  anilistSearchQuery,
  kitsuSearchQuery,
} from "./queries";

import * as metadata from "./extension.json";
import { AnilistManga } from "./manga";
import AnimePahe from "../../anime/animepahe";

/**
 * Most of this code is from @consumet i have just modifed it a little
 * Its not intended for public use on use on my app (@ApolloTV)
 */

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

    this.Manga = new AnilistManga();
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

  async getMediaInfo(id: string, dub: boolean = false) {
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
    console.log(possibleAnime);

    // To avoid a new request, lets match and see if the anime show found is in sub/dub

    const expectedType = dub ? SubOrDubOrBoth.DUB : SubOrDubOrBoth.SUB;

    // Have this as a fallback in the meantime for compatibility
    if (possibleAnime.subOrDub) {
      if (possibleAnime.subOrDub != SubOrDubOrBoth.BOTH && possibleAnime.subOrDub != expectedType) {
        return undefined;
      }
    } else if ((!possibleAnime.hasDub && dub) || (!possibleAnime.hasSub && !dub)) {
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
      console.log("new episodes", possibleProviderEpisodes);
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
      possibleProviderEpisodes?.forEach((ep: any, i: any) => {
        const j = (i + 1).toString();
        newEpisodeList.push({
          id: ep.id as string,
          title: ep.title ?? episodesList.get(j)?.title ?? null,
          image: ep.image ?? episodesList.get(j)?.thumbnail ?? null,
          number: ep.number as number,
          createdAt: ep.createdAt ?? episodesList.get(j)?.createdAt ?? null,
          description: ep.description ?? episodesList.get(j)?.description ?? null,
          url: (ep.url as string) ?? null,
        });
      });
    }

    return newEpisodeList;
  };

  Manga: AnilistManga;
}

export default Anilist;
