import axios from "axios";
import {
  IEpisodeServer,
  IMediaInfo,
  IMediaResult,
  ISearch,
  ISource,
  MediaFormat,
  MediaProvier,
  MediaStatus,
  MetaData,
  StreamingServers,
} from "../../../types";

import fs from "node:fs";

import * as metadata from "./extension.json";
import {
  AllAnimeEpisodeInfo,
  AllAnimeEpisodeInfoData,
  AllAnimeInfo,
  AllAnimeLinks,
  AllAnimeSearch,
  AllAnimeServerInfo,
} from "./types";
import { AllAnimeDecryptor } from "./helpers/decrypt";
import { substringAfter } from "../../../utils";
import { Mp4Upload, StreamLare } from "../../../extractors";

enum AllAnimeServer {
  AllAnime = "AllAnime",
}

class AllAnime extends MediaProvier {
  public metaData: MetaData = metadata;
  protected baseUrl: string = metadata.code.utils.mainURL;
  protected apiURL: string = metadata.code.utils.apiURL;

  private ytAnimeCoversHost = "https://wp.youtube-anime.com/aln.youtube-anime.com";
  private idRegex = RegExp("${hostUrl}/manga/(\\w+)");
  private epNumRegex = RegExp("/[sd]ub/(\\d+)");

  private idHash = "9d7439c90f203e534ca778c4901f9aa2d3ad42c06243ab2c5e6b79612af32028";
  private episodeInfoHash = "c8f3ac51f598e630a1d09d7f7fb6924cff23277f354a23e473b962a367880f7d";
  private searchHash = "06327bc10dd682e1ee7e07b6db9c16e9ad2fd56c1b769e47513128cd5c9fc77a";
  private videoServerHash = "5f1a64b73793cc2234a389cf3a8f93ad82de7043017dd551f38f65b89daa65e0";

  async search(query: string, page: number = 1, ...args: any[]): Promise<ISearch<IMediaResult>> {
    const searchResult: ISearch<IMediaResult> = {
      currentPage: page,
      hasNextPage: false,
      results: [],
    };

    const variables = `{"search":{"query":"${query}"},"translationType":"sub"}`;

    try {
      const data = await this.graphqlQuery<AllAnimeSearch>(variables, this.searchHash);
      const edges = data?.data?.shows?.edges;

      if (!edges) return searchResult;

      for await (const item of edges) {
        searchResult.results.push({
          id: item._id,
          title: {
            english: item.englishName!,
            native: item.nativeName!,
            romaji: item.name,
            userPreferred: item.name,
          },
          image: item.thumbnail,
          rating: item.score!,
          releaseDate: item.airedStart.year?.toString(),
          type: item.type as MediaFormat,
        });
      }

      return searchResult;
    } catch (error) {
      throw new Error(`AllAnime Search Error: ${(error as Error).message}`);
    }
  }

  async getMediaInfo(animeId: string, dub: boolean = false, ...args: any): Promise<IMediaInfo> {
    const variables = `{"_id":"${animeId}"}`;

    const animeInfo: IMediaInfo = {
      id: animeId,
      title: "",
      url: `${this.baseUrl}${animeId}`,
      genres: [],
      totalEpisodes: 0,
    };
    try {
      const data = await this.graphqlQuery<AllAnimeInfo>(variables, this.idHash);

      const anime = data?.data?.show;

      animeInfo.title = {
        english: anime?.englishName!,
        native: anime?.nativeName!,
        romaji: anime?.name!,
        userPreferred: anime?.name,
      };
      animeInfo.url = `${this.baseUrl}/${animeId}`;
      animeInfo.genres = anime?.genres;
      animeInfo.totalEpisodes = parseInt(anime?.episodeCount!);
      animeInfo.image = anime?.thumbnail;
      animeInfo.cover = anime?.banner!;
      animeInfo.rating = anime?.score!;
      animeInfo.releaseDate = anime?.airedStart?.year?.toString();
      animeInfo.type = anime?.type as MediaFormat;
      animeInfo.description = anime?.description;
      switch (anime?.status) {
        case "Ongoing":
          animeInfo.status = MediaStatus.ONGOING;
          break;
        case "Completed":
          animeInfo.status = MediaStatus.COMPLETED;
          break;
        case "Upcoming":
          animeInfo.status = MediaStatus.NOT_YET_AIRED;
          break;
        default:
          animeInfo.status = MediaStatus.UNKNOWN;
          break;
      }
      animeInfo.endDate = anime?.airedEnd;
      animeInfo.startDate = anime?.airedStart;

      const epCount = dub === true ? anime!?.availableEpisodes.dub : anime!?.availableEpisodes.sub;
      const episodeVars = `{"showId":"${animeId}","episodeNumStart":0,"episodeNumEnd":${epCount}}`;

      const episodeInfo = await this.graphqlQuery<AllAnimeEpisodeInfo>(
        episodeVars,
        this.episodeInfoHash
      );

      animeInfo.episodes = [];

      if (episodeInfo?.data?.episodeInfos?.length! >= 0) {
        animeInfo.hasDub =
          episodeInfo?.data?.episodeInfos?.length! >= 1
            ? episodeInfo?.data?.episodeInfos[0]?.vidInforsdub !== null
            : false;
        animeInfo.hasSub =
          episodeInfo?.data?.episodeInfos?.length! >= 1
            ? episodeInfo?.data?.episodeInfos[0]?.vidInforssub !== null
            : false;

        for await (const episode of episodeInfo?.data?.episodeInfos!) {
          const images = episode.thumbnails?.map((image) =>
            !image?.includes("http") ? `${this.ytAnimeCoversHost}${image}` : image
          );

          animeInfo.episodes?.push({
            id: `${animeId}/${episode.episodeIdNum}`,
            title: episode.notes,
            number: episode.episodeIdNum,
            image: images![0],
            releaseDate:
              dub === true
                ? episode.uploadDates?.dub?.toString()
                : episode.uploadDates?.sub?.toString()!,
            hasDub: episode.vidInforsdub !== null,
            haSDub: episode.vidInforssub !== null,
          });
        }
      }

      return animeInfo;
    } catch (error) {
      throw new Error(`AllAnime Info Error: ${(error as Error).message}`);
    }
  }

  async getMediaSources(
    episodeId: string,
    server: StreamingServers | "default" = "default",
    dub: boolean = false
  ): Promise<ISource> {
    if (!episodeId || !episodeId.includes("/"))
      throw new Error(
        `Please provide a valid episode ID in the format "<animeId>/<episodeNumber>."`
      );

    try {
      const servers = await this.getMediaServers(episodeId, dub);

      let urls;
      switch (server) {
        case StreamingServers.Mp4Upload:
          urls = servers.find((server) => server.name.toLowerCase().includes("mp4upload"))!.url;
          return {
            sources: await new Mp4Upload().extract(new URL(urls)),
          };
        case StreamingServers.streamlare:
          urls = servers.find((server) => server.name.toLowerCase().includes("streamlare"))!.url;
          const resp = await new StreamLare().extract(new URL(urls));
          if (!resp) throw new Error("No source avaliable");
          return resp;
        default:
          urls = servers.filter((server) => server.url.startsWith("--"))!;

          const toReturn: ISource = {
            sources: [],
          };

          for await (const url of urls) {
            if (url.url.startsWith("--")) {
              url.url = AllAnimeDecryptor.oneDigitSymmetricXOR(56, url.url.replace("--", ""));
            }

            if (url.url.startsWith("/")) {
              try {
                const { data } = await axios.get<AllAnimeLinks>(
                  this.to_clock_json(`https://blog.allanime.day${url.url}`)
                );
                data.links.forEach((link) => {
                  toReturn.sources.push({
                    url: link.link,
                    isM3U8: link?.hls === true,
                    isDASH: link?.dash === true,
                    quality: link?.resolutionStr,
                  });
                });
              } catch (error) {
                continue;
              }
            }
          }
          return toReturn;
      }
    } catch (error) {
      console.error(error);

      throw new Error(`AllAnime Sources Error: ${(error as Error).message}`);
    }
  }

  async getMediaServers(episodeId: string, dub: boolean = false): Promise<IEpisodeServer[]> {
    if (!episodeId.includes("/"))
      throw new Error(
        `Please provide a valid episode ID in the format "<animeId>/<episodeNumber>."`
      );

    const videoServers: IEpisodeServer[] = [];

    const animeId = episodeId.split("/")[0];
    const episodeNumber = episodeId.split("/")[1]!;

    const variables = `{"showId":"${animeId}","translationType":"${
      dub === true ? "dub" : "sub"
    }","episodeString":"${episodeNumber}"}`;

    try {
      const data = await this.graphqlQuery<AllAnimeServerInfo>(variables, this.videoServerHash);
      const sources = data?.data?.episode?.sourceUrls;

      if (!sources) return [];

      for await (const source of sources) {
        let serverName = source.sourceName;
        let sourceNum = 2;

        while (videoServers.some((server) => server.name === serverName)) {
          serverName = `${source.sourceName} (${sourceNum})`;
          sourceNum++;
        }

        videoServers.push({
          name: serverName!,
          url: source.sourceUrl,
          type: source.type,
        });
      }

      return videoServers;
    } catch (error) {
      throw new Error(`Error parsing Servers: ${(error as Error).message}`);
    }
  }

  private to_clock_json(url: string): string {
    return url.replace("clock", "clock.json");
  }

  private async graphqlQuery<T>(variables: string, persistHash: string): Promise<T | null> {
    const extensions = `{"persistedQuery":{"version":1,"sha256Hash":"${persistHash}"}}`;

    const url = `${this.apiURL}?variables=${variables}&extensions=${extensions}`;

    const headers = {
      Origin: "https://allanime.to",
    };

    try {
      const response = await axios.get<T>(url, {
        headers,
      });
      return response.data;
    } catch (error) {
      throw new Error(`Error making GraphQL query:, ${(error as Error).message}`);
    }
  }
}

export default AllAnime;
