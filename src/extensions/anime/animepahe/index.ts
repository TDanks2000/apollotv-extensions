import { IMediaEpisode } from "./../../../types/types";
import { load } from "cheerio";
import { Kwik } from "../../../extractors";
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
} from "../../../types";

import * as metadata from "./extension.json";
import fs from "fs";
import { AnimePaheEpisodes, AnimePaheSearch } from "./types";

class AnimePahe extends MediaProvier {
  public metaData: MetaData = metadata;
  protected baseUrl: string = metadata.code.utils.mainURL;
  protected apiURL: string = metadata.code.utils.apiURL;

  async search(query: string): Promise<ISearch<IMediaResult>> {
    try {
      const { data } = await this.client.get<AnimePaheSearch>(
        `${this.baseUrl}/api?m=search&q=${encodeURIComponent(query)}`
      );

      const res = {
        results: data.data.map((item: any) => ({
          id: `${item.id}/${item.session}`,
          title: item.title,
          image: item.poster,
          rating: item.score,
          releaseDate: item.year,
          type: item.type,
        })),
      };

      return res;
    } catch (err) {
      throw new Error((err as Error).message);
    }
  }

  async getMediaInfo(animeId: string, episodePage: number = -1): Promise<IMediaInfo> {
    const animeInfo: IMediaInfo = {
      id: animeId,
      title: "",
    };

    try {
      const url =
        animeId.split("/").length > 1
          ? `${this.baseUrl}/anime/${animeId.split("/")[1]}?anime_id=${animeId.split("/")[0]}`
          : `${this.baseUrl}/anime/${animeId}`;

      const res = await this.client.get(url);
      const $ = load(res.data);

      animeInfo.title = $("div.title-wrapper > h1 > span").first().text();
      animeInfo.image = $("div.anime-poster a").attr("href");
      animeInfo.cover = `https:${$("div.anime-cover").attr("data-src")}`;
      animeInfo.description = $("div.anime-summary").text();
      animeInfo.genres = $("div.anime-genre ul li")
        .map((i, el) => $(el).find("a").attr("title"))
        .get();

      switch ($('div.col-sm-4.anime-info p:icontains("Status:") a').text().trim()) {
        case "Currently Airing":
          animeInfo.status = MediaStatus.ONGOING;
          break;
        case "Finished Airing":
          animeInfo.status = MediaStatus.COMPLETED;
          break;
        default:
          animeInfo.status = MediaStatus.UNKNOWN;
      }
      animeInfo.type = $("div.col-sm-4.anime-info > p:nth-child(2) > a")
        .text()
        .trim()
        .toUpperCase() as MediaFormat;
      animeInfo.releaseDate = $("div.col-sm-4.anime-info > p:nth-child(5)")
        .text()
        .split("to")[0]
        .replace("Aired:", "")
        .trim();
      animeInfo.aired = $("div.col-sm-4.anime-info > p:nth-child(5)")
        .text()
        .replace("Aired:", "")
        .trim()
        .replace("\n", " ");
      animeInfo.studios = $("div.col-sm-4.anime-info > p:nth-child(7)")
        .text()
        .replace("Studio:", "")
        .trim()
        .split("\n");
      animeInfo.totalEpisodes = parseInt(
        $("div.col-sm-4.anime-info > p:nth-child(3)").text().replace("Episodes:", "")
      );

      animeInfo.episodes = [];

      const animeIDReal = animeId.split("/").length > 1 ? animeId.split("/")[1] : animeId;

      if (episodePage < 0) {
        const {
          data: { last_page, data },
        } = await this.client.get<AnimePaheEpisodes>(
          `${this.baseUrl}/api?m=release&id=${animeIDReal}&sort=episode_asc&page=1`
        );

        animeInfo.hasDub = data[0].audio === "eng";
        animeInfo.hasSub = data[0].audio === "eng" || data[0].audio === "jpn";
        animeInfo.episodePages = last_page;

        animeInfo.episodes.push(
          ...data.map(
            (item) =>
              ({
                id: `${animeIDReal}/${item.session}`,
                number: item.episode,
                title: item.title,
                image: item.snapshot,
                duration: item.duration,
                url: `${this.baseUrl}/play/${animeIDReal}/${item.session}`,
                hasDub: item.audio === "eng",
                hasSub: item.audio === "eng" || item.audio === "jpn",
              } as IMediaEpisode)
          )
        );

        for (let i = 1; i < last_page; i++) {
          animeInfo.episodes.push(...(await this.getEpisodes(animeIDReal, i + 1)));
        }
      } else {
        animeInfo.episodes.push(...(await this.getEpisodes(animeIDReal, episodePage)));
      }

      return animeInfo;
    } catch (err) {
      throw new Error((err as Error).message);
    }
  }

  async getMediaSources(episodeId: string, ...args: any): Promise<ISource> {
    try {
      const { data } = await this.client.get(`${this.baseUrl}/play/${episodeId}`, {
        headers: {
          Referer: `${this.baseUrl}`,
        },
      });

      const $ = load(data);

      const links = $("div#resolutionMenu > button").map((i, el) => ({
        url: $(el).attr("data-src")!,
        quality: $(el).text(),
        audio: $(el).attr("data-audio"),
      }));

      const iSource: ISource = {
        headers: {
          Referer: "https://kwik.cx/",
        },
        sources: [],
      };

      for (const link of links) {
        const res = await new Kwik(this.proxyConfig).extract(new URL(link.url));
        res[0].quality = link.quality;
        res[0].isDub = link.audio === "eng";
        iSource.sources.push(res[0]);
      }

      return iSource;
    } catch (err) {
      throw new Error((err as Error).message);
    }
  }

  getMediaServers(episodeId: string): Promise<IEpisodeServer[]> {
    throw new Error("Method not implemented.");
  }

  private getEpisodes = async (session: string, page: number): Promise<IMediaEpisode[]> => {
    const res = await this.client.get<AnimePaheEpisodes>(
      `${this.baseUrl}/api?m=release&id=${session}&sort=episode_asc&page=${page}`
    );

    const epData = res.data.data;

    return [
      ...epData.map(
        (item): IMediaEpisode => ({
          id: item.anime_id.toString(),
          number: item.episode,
          title: item.title,
          image: item.snapshot,
          duration: item.duration,
          url: `${this.baseUrl}/play/${session}/${item.session}`,
          hasDub: item.audio === "eng",
          hasSub: item.audio === "eng" || item.audio === "jpn",
        })
      ),
    ] as IMediaEpisode[];
  };
}

export default AnimePahe;
