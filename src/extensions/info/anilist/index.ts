import axios from "axios";
import {
  AnimappedRes,
  Genres,
  IEpisodeServer,
  IMediaInfo,
  IMediaResult,
  ISearch,
  ISource,
  ITitle,
  MediaProvier,
  MediaStatus,
  SubOrDub,
} from "../../../types";
import GogoAnime from "../../anime/gogoanime";
import { AdvancedSearch, MalsyncReturn } from "./types";
import { compareTwoStrings } from "../../../utils";
import { anilistAdvancedQuery, anilistMediaDetailQuery, anilistSearchQuery } from "./queries";

/**
 * Most of this code is from @consumet i have just modifed it a little
 * Its not intended for public use on use on my app (@ApolloTV)
 */

class Anilist {
  private readonly anilistGraphqlUrl = "https://graphql.anilist.co";
  private readonly mal_sync_api_url = "https://api.malsync.moe";
  private readonly animapped_api_url = "https://animapped.streamable.moe/api";
  provider: MediaProvier;

  private animapped_api_key?: string;

  constructor(provider?: MediaProvier, animapped_api_key?: string) {
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

      animeInfo.malId = data.data?.Media?.idMal ?? data?.mappings?.mal;
      animeInfo.title = data.data.Media
        ? {
            romaji: data.data.Media.title.romaji,
            english: data.data.Media.title.english,
            native: data.data.Media.title.native,
            userPreferred: data.data.Media.title.userPreferred,
          }
        : (data.data.title as ITitle);

      animeInfo.synonyms = data.data?.Media?.synonyms ?? data?.synonyms;
      animeInfo.isLicensed = data.data?.Media?.isLicensed ?? undefined;
      animeInfo.isAdult = data.data?.Media?.isAdult ?? undefined;
      animeInfo.countryOfOrigin = data.data?.Media?.countryOfOrigin ?? undefined;

      if (data.data?.Media?.trailer?.id) {
        animeInfo.trailer = {
          id: data.data.Media.trailer.id,
          site: data.data.Media.trailer?.site,
          thumbnail: data.data.Media.trailer?.thumbnail,
        };
      }
      animeInfo.image =
        data.data?.Media?.coverImage?.extraLarge ??
        data.data?.Media?.coverImage?.large ??
        data.data?.Media?.coverImage?.medium ??
        data.coverImage ??
        data.bannerImage;

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
        : data.data.Media?.episodes;
      animeInfo.rating = data.data.Media.averageScore;
      animeInfo.duration = data.data.Media.duration;
      animeInfo.genres = data.data.Media.genres;
      animeInfo.season = data.data.Media.season;
      animeInfo.studios = data.data.Media.studios.edges.map((item: any) => item.node.name);
      animeInfo.subOrDub = dub ? SubOrDub.DUB : SubOrDub.SUB;
      animeInfo.type = data.data.Media.format;
      animeInfo.recommendations = data.data.Media?.recommendations?.edges?.map((item: any) => ({
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

      const mappingId = await this.getMappingId(animeInfo.malId!?.toString(), dub);
      const episodes = await this.getEpisodes(mappingId!);
      animeInfo.providerId = mappingId;
      animeInfo.episodes = episodes;

      return animeInfo;
    } catch (error) {
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

  private async getMappingId(malId: string, dub: boolean = false) {
    if (!malId) return undefined;
    const { data } = await axios.get<MalsyncReturn>(`${this.mal_sync_api_url}/mal/anime/${malId}`);

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
        return dub ? s.title.toLowerCase().includes("dub") : !s.title.toLowerCase().includes("dub");
      } else return true;
    });

    if (possibleSource) return possibleSource.url.split("/").pop()!;

    if (!this.animapped_api_key) return undefined;

    const { data: animapped_data } = await axios.get<AnimappedRes>(
      `${this.animapped_api_url}/mal/${malId}?api_key=${this.animapped_api_key}`
    );

    const mappings = animapped_data?.mappings;

    const findMappingSite = Object.entries(mappings).find(([key, v]) => {
      return key === this.provider.metaData.name.toLowerCase();
    });

    if (!findMappingSite) return undefined;

    const findMapping = Object.entries(findMappingSite![1]).find(([key, v]) => {
      if (this.provider instanceof GogoAnime) {
        return dub ? key.toLowerCase().includes("dub") : !key.toLowerCase().includes("dub");
      } else return true;
    });

    if (findMapping?.[1]) return findMapping?.[1].id;
    return undefined;
  }

  private async getEpisodes(provider_id: string) {
    if (!provider_id) return [];
    const data = await this.provider.getMediaInfo(provider_id);
    return data.episodes;
  }
}

export default Anilist;
