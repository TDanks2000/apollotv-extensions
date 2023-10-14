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
  AllAnimeSearch,
  AllAnimeServerInfo,
} from "./types";
import { AllAnimeDecryptor } from "./helpers/decrypt";
import { substringAfter } from "../../../utils";

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

    const data = await this.graphqlQuery<AllAnimeInfo>(variables, this.idHash);

    const anime = data?.data?.show;

    animeInfo.title = {
      english: anime?.englishName!,
      native: anime?.nativeName!,
      romaji: anime?.name!,
      userPreferred: anime?.name,
    };
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

    console.log(episodeInfo);

    animeInfo.episodes = [];
    if (episodeInfo?.data?.episodeInfos?.length! >= 0) {
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
  }

  async getMediaSources(
    episodeId: string,
    server: StreamingServers | AllAnimeServer = StreamingServers.VidStreaming,
    dub: boolean = false
  ): Promise<ISource> {
    if (!episodeId.includes("/"))
      throw new Error("Invalid episode id, episode id must include <animeId>/<episodeNumber>");

    const servers = await this.getMediaServers(episodeId, dub);

    for await (const source of servers) {
      let videoUrl;

      if (source.url.startsWith("##")) {
        videoUrl = AllAnimeDecryptor.decryptAllAnime(
          "1234567890123456789",
          substringAfter(source.url, "##")
        );
      } else if (source.url.startsWith("#")) {
        videoUrl = AllAnimeDecryptor.decryptAllAnime(
          "allanimenews",
          substringAfter(source.url, "#")
        );
      } else {
        videoUrl = source.url;
      }
    }

    // switch (server) {
    //   case
    // }

    throw new Error("Method not implemented.");
  }

  async getMediaServers(episodeId: string, dub: boolean = false): Promise<IEpisodeServer[]> {
    if (!episodeId.includes("/"))
      throw new Error("Invalid episode id, episode id must include <animeId>/<episodeNumber>");

    const videoServers: IEpisodeServer[] = [];

    const animeId = episodeId.split("/")[0];
    const episodeNumber = episodeId.split("/")[1]!;

    const variables = `{"showId":"${animeId}","translationType":"${
      dub === true ? "dub" : "sub"
    }","episodeString":"${episodeNumber}"}`;

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

      if (!source.sourceUrl.includes("http")) {
        const jsonUrl = `${source.sourceUrl.replace("clock", "clock.json").substring(1)}`;

        videoServers.push({
          name: serverName!,
          url: jsonUrl,
        });
      } else {
        videoServers.push({
          name: serverName,
          url: source.sourceUrl,
        });
      }
    }

    return videoServers;
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
      console.error("Error making GraphQL query:", (error as Error).message);
      return null;
    }
  }
}

export default AllAnime;

(async () => {
  const allAnime = new AllAnime();
  const info = await allAnime.getMediaInfo("ZxB3cadtyvKpa6n4B");
  const servers = await allAnime.getMediaServers(info.episodes![0].id!);

  console.log(servers);
})();