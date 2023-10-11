import { AxiosRequestHeaders } from "axios";
import {
  IEpisodeServer,
  IMediaEpisode,
  IMediaInfo,
  IMediaResult,
  ISearch,
  ISource,
  MediaProvier,
  MetaData,
  SubOrDub,
} from "../../../types";
import { USER_AGENT } from "../../../utils";

import CryptoJS from "crypto-js";

import * as metadata from "./extension.json";
import { Episode, EpisodeInfo, EpisodeResult, Image, Info, Search } from "./types";

class Kickassanime extends MediaProvier {
  public metaData: MetaData = metadata;
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

  override async getMediaInfo(id: string, subOrDub: SubOrDub = SubOrDub.SUB): Promise<IMediaInfo> {
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
      throw new Error((error as Error).message);
    }

    return animeInfo;
  }

  override async getMediaSources(
    episodeId: `ep-${number}-${string}`,
    showId: string,
    server: "duck" | "bird" | "vidstreaming" = "bird"
  ): Promise<ISource> {
    try {
      const servers = await this.getMediaServers(showId, episodeId);

      const serverItem = servers.find((item) => item.name.toLowerCase() === server) || servers[0];

      if (!serverItem) throw new Error("Server not found");

      const name = serverItem.name.toLowerCase();
      const url = new URL(serverItem.url);
      const isBirb = name === "bird";
      const usesMid = name === "duck";
      let { data: order } = await this.client.get(
        "https://raw.githubusercontent.com/enimax-anime/gogo/main/KAA.json"
      );
      order = order[name];

      const { data: playerHTML } = await this.client.get(url.toString(), {
        headers: {
          "User-Agent": USER_AGENT,
        },
      });

      const cid = playerHTML.split("cid:")[1].split("'")[1].trim();
      const metaData = CryptoJS.enc.Hex.parse(cid).toString(CryptoJS.enc.Utf8);
      const sigArray = [];

      let key = "";

      try {
        const res = await this.client.get(
          `https://raw.githubusercontent.com/enimax-anime/kaas/${name}/key.txt`
        );
        if (res.status === 404) {
          throw new Error("Not found");
        } else {
          key = await res.data;
        }
      } catch (err) {
        const { data: duckKey } = await this.client.get(
          `https://raw.githubusercontent.com/enimax-anime/kaas/duck/key.txt`
        );
        key = duckKey;
      }

      const signatureItems: any = {
        SIG: playerHTML.split("signature:")[1].split("'")[1].trim(),
        USERAGENT: USER_AGENT,
        IP: metaData.split("|")[0],
        ROUTE: metaData.split("|")[1].replace("player.php", "source.php"),
        KEY: key,
        TIMESTAMP: Math.floor(Date.now() / 1000),
        MID: url.searchParams.get(usesMid ? "mid" : "id"),
      };

      for (const item of order) {
        sigArray.push(signatureItems[item]);
      }

      const sig = CryptoJS.SHA1(sigArray.join("")).toString(CryptoJS.enc.Hex);

      let { data: result } = await this.client.get(
        `${url.origin}${signatureItems.ROUTE}?${!usesMid ? "id" : "mid"}=${signatureItems.MID}${
          isBirb ? "" : "&e=" + signatureItems.TIMESTAMP
        }&s=${sig}`,
        {
          headers: {
            referer: `${url.origin}${signatureItems.ROUTE.replace("source.php", "player.php")}?${
              !usesMid ? "id" : "mid"
            }=${signatureItems.MID}`,
            "User-Agent": USER_AGENT,
          },
        }
      );
      result = result.data;

      const finalResult = JSON.parse(
        CryptoJS.AES.decrypt(result.split(":")[0], CryptoJS.enc.Utf8.parse(signatureItems.KEY), {
          mode: CryptoJS.mode.CBC,
          iv: CryptoJS.enc.Hex.parse(result.split(":")[1]),
          keySize: 256,
        }).toString(CryptoJS.enc.Utf8)
      );

      let hlsURL = "",
        dashURL = "";

      if (finalResult.hls) {
        hlsURL = finalResult.hls.startsWith("//") ? `https:${finalResult.hls}` : finalResult.hls;

        const hasSubtitles = finalResult.subtitles?.length > 0;

        return {
          sources: [
            {
              type: "HLS",
              name: "HLS",
              url: hlsURL,
            },
          ],
          subtitles: !hasSubtitles
            ? []
            : finalResult.subtitles.map((sub: any) => ({
                label: `${sub.name} - ${serverItem.name}`,
                file: sub.src.startsWith("//") ? `https:${sub.src}` : new URL(sub.src, url).href,
              })),
          intro: {
            start: finalResult.skip?.intro?.start,
            end: finalResult.skip?.intro?.end,
          },
        };
      }

      if (finalResult.dash) {
        dashURL = finalResult.dash.startsWith("//")
          ? `https:${finalResult.dash}`
          : finalResult.dash;

        const hasSubtitles = finalResult.subtitles?.length > 0;

        return {
          sources: [
            {
              type: "dash",
              name: "DASH",
              url: dashURL,
            },
          ],
          subtitles: !hasSubtitles
            ? []
            : finalResult.subtitles.map((sub: any) => ({
                label: `${sub.name} - ${serverItem.name}`,
                file: sub.src.startsWith("//") ? `https:${sub.src}` : new URL(sub.src, url).href,
              })),
          intro: {
            start: finalResult.skip?.intro?.start,
            end: finalResult.skip?.intro?.end,
          },
        };
      }

      throw new Error("No sources found");
    } catch (error) {
      console.error(error);
      throw new Error((error as Error).message);
    }
  }

  override async getMediaServers(
    showId: string,
    episodeId: `ep-${number}-${string}`
  ): Promise<IEpisodeServer[]> {
    try {
      const { data } = await this.client.get<EpisodeInfo>(
        `${this.apiURL}/show/${showId}/episode/${episodeId}`,
        {
          headers: {
            "User-Agent": USER_AGENT,
          },
        }
      );

      const servers: IEpisodeServer[] = [];

      for await (const server of data.servers) {
        servers.push({
          name: server.shortName,
          url: server.src,
        });
      }

      return servers;
    } catch (error) {
      throw new Error((error as Error).message);
    }
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
      throw new Error((error as Error).message);
    }

    return returnData;
  }

  private formatEpisode(episode: EpisodeResult): IMediaEpisode {
    return {
      id: `ep-${episode.episode_number}-${episode.slug}`,
      title: episode.title,
      number: episode.episode_number,
      image: this.getImageUrl(episode.thumbnail),
      duration: episode.duration_ms,
    };
  }
}

export default Kickassanime;

/**
 * THANK YOU ENIMAX FOR FIGURING MOST OF THIS OUT
 */
