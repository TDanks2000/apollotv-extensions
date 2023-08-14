import { AxiosRequestHeaders } from "axios";
import {
  IEpisodeServer,
  IMediaEpisode,
  IMediaInfo,
  IMediaResult,
  ISearch,
  ISource,
  MediaProvier,
  SubOrDub,
} from "../../../types";
import { USER_AGENT } from "../../../utils";

import * as metadata from "./extension.json";
import { Episode, EpisodeResult, Image, Info, Search } from "./types";

class Kickassanime extends MediaProvier {
  protected baseUrl = metadata.code.utils.mainURL;
  protected apiURL = metadata.code.utils.apiURL;

  protected isDubAvailableSeparately = true;

  private headers: AxiosRequestHeaders = {
    "User-Agent": USER_AGENT,
    "Content-type": "application/json",
    referer: `${this.baseUrl}/`,
    origin: this.baseUrl,
  };

  override async search(query: string, page: number = 1): Promise<ISearch<IMediaResult>> {
    const searchResult: ISearch<IMediaResult> = {
      currentPage: page,
      hasNextPage: false,
      results: [],
    };

    try {
      const { data } = await this.client.request<Search[]>({
        method: "POST",
        url: `${this.baseUrl}/api/search`,
        headers: this.headers,
        data: JSON.stringify({
          query,
        }),
      });

      data.forEach((item) => {
        searchResult.results.push({
          id: item.slug,
          url: `${this.baseUrl}/${item.slug}`,
          title: item.title,
          image: this.getImageUrl(item.poster),
          releaseDate: item.year.toString(),
        });
      });
    } catch (error) {
      console.error(error);
    }

    return searchResult;
  }

  override async getMediaInfo(id: string, subOrDub: SubOrDub): Promise<IMediaInfo> {
    const animeInfo: IMediaInfo = {
      id: "",
      title: "",
      url: `${this.baseUrl}${id}`,
      genres: [],
      episodes: [],
    };

    try {
      const { data } = await this.client
        .get<Info>(`${this.baseUrl}/api/show/${id}`, {
          headers: this.headers,
        })
        .catch((err) => {
          throw new Error(err);
        });

      animeInfo.id = data.slug;
      animeInfo.url = `${this.baseUrl}/${data.slug}`;
      animeInfo.title = data.title;
      animeInfo.genres = data.genres;
      animeInfo.episodeDuration = data.episode_duration;
      animeInfo.cover = this.getImageUrl(data.banner, "banner");
      animeInfo.image = this.getImageUrl(data.poster);
      animeInfo.releaseDate = data.year.toString();
      animeInfo.description = data.synopsis.split("\n").join("");
      animeInfo.season = data.season;

      const episodeBase = (subOrDub: "dub" | "sub") =>
        `${this.baseUrl}/api/show/${id}/episodes?lang=${subOrDub === "sub" ? "ja-JP" : "en-US"}`;

      const { data: episodeData } = await this.client.get<Episode>(episodeBase(subOrDub));

      if (episodeData.pages.length) {
        animeInfo.episodes = await this.loadAllEps(episodeData, episodeBase(subOrDub));
      }
    } catch (error) {
      console.log(error);
    }

    return animeInfo;
  }

  getMediaSources(episodeId: string, ...args: any): Promise<ISource> {
    throw new Error("Method not implemented.");
  }

  getMediaServers(episodeId: string): Promise<IEpisodeServer[]> {
    throw new Error("Method not implemented.");
  }

  private getImageUrl = (poster: Image, type: "banner" | "poster" = "poster") => {
    try {
      return `${this.baseUrl}/image/${type}/${poster.hq ?? poster.sm}.${
        poster.formats.includes("webp") ? "webp" : poster.formats[0]
      }`;
    } catch (err) {
      return "";
    }
  };

  private async loadAllEps(episode: Episode, url: string): Promise<IMediaEpisode[]> {
    const returnData: IMediaEpisode[] = [];
    const promises = [];

    try {
      for await (const item of episode.result) {
        returnData.push(this.formatEpisode(item));
      }

      if (episode.pages.length === 0) return returnData;

      for (let i = 0; i < episode.pages.length; i++) {
        if (i === 0) continue;
        promises.push(this.client.get<Episode>(`${url}&page=${episode.pages[i].number}`));
      }

      const results = await Promise.all(promises);

      for await (const result of results) {
        const { data } = result;
        for await (const item of data.result) {
          returnData.push(this.formatEpisode(item));
        }
      }
    } catch (error) {
      console.log(error);
    }

    return returnData;
  }

  private formatEpisode(episode: EpisodeResult): IMediaEpisode {
    return {
      id: episode.slug,
      title: episode.title,
      number: episode.episode_number,
      image: this.getImageUrl(episode.thumbnail),
      duration: episode.duration_ms,
    };
  }
}

export default Kickassanime;
