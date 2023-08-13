import {
  MediaFormat,
  MediaStatus,
  StreamingServers,
  SubOrDub,
} from "../../../types/types";
import { load } from "cheerio";
import {
  IEpisodeServer,
  IMediaInfo,
  IMediaResult,
  ISearch,
  ISource,
  MediaProvier,
} from "../../../types";

import * as metadata from "./extension.json";
import { GogoCDN, StreamSB } from "../../../extractors";
import { USER_AGENT } from "../../../utils";

class GogoAnime extends MediaProvier {
  protected baseUrl: string = metadata.code.utils.mainURL;
  protected ajaxUrl: string = metadata.code.utils.apiURL;

  override async search(
    query: string,
    page: number = 1
  ): Promise<ISearch<IMediaResult>> {
    const searchResult: ISearch<IMediaResult> = {
      currentPage: page,
      hasNextPage: false,
      results: [],
    };

    try {
      const res = await this.client.get(
        `${this.baseUrl}/search.html?keyword=${encodeURIComponent(
          query
        )}&page=${page}`
      );

      const $ = load(res.data);

      searchResult.hasNextPage =
        $("div.anime_name.new_series > div > div > ul > li.selected").next()
          .length > 0;

      $("div.last_episodes > ul > li").each((i, el) => {
        searchResult.results.push({
          id: $(el).find("p.name > a").attr("href")?.split("/")[2]!,
          title: $(el).find("p.name > a").attr("title")!,
          url: `${this.baseUrl}/${$(el).find("p.name > a").attr("href")}`,
          image: $(el).find("div > a > img").attr("src"),
          releaseDate: $(el).find("p.released").text().trim(),
          subOrDub: $(el)
            .find("p.name > a")
            .text()
            .toLowerCase()
            .includes("dub")
            ? SubOrDub.DUB
            : SubOrDub.SUB,
        });
      });

      return searchResult;
    } catch (err) {
      throw new Error((err as Error).message);
    }
  }

  async getMediaInfo(mediaId: string): Promise<IMediaInfo> {
    if (!mediaId.includes("gogoanime")) mediaId = `/category/${mediaId}`;

    const animeInfo: IMediaInfo = {
      id: "",
      title: "",
      url: `${this.baseUrl}${mediaId}`,
      genres: [],
      totalEpisodes: 0,
    };
    try {
      const res = await this.client.get(`${this.baseUrl}/${mediaId}`);

      const $ = load(res.data);

      animeInfo.id = new URL(animeInfo.url!).pathname.split("/")[2];
      animeInfo.title = $(
        "section.content_left > div.main_body > div:nth-child(2) > div.anime_info_body_bg > h1"
      )
        .text()
        .trim();
      animeInfo.url = mediaId;
      animeInfo.image = $("div.anime_info_body_bg > img").attr("src");
      animeInfo.releaseDate = $("div.anime_info_body_bg > p:nth-child(7)")
        .text()
        .trim()
        .split("Released: ")[1];
      animeInfo.description = $("div.anime_info_body_bg > p:nth-child(5)")
        .text()
        .trim()
        .replace("Plot Summary: ", "");

      animeInfo.subOrDub = animeInfo.title.toLowerCase().includes("dub")
        ? SubOrDub.DUB
        : SubOrDub.SUB;

      animeInfo.type = $("div.anime_info_body_bg > p:nth-child(4) > a")
        .text()
        .trim()
        .toUpperCase() as MediaFormat;

      animeInfo.status = MediaStatus.UNKNOWN;

      switch ($("div.anime_info_body_bg > p:nth-child(8) > a").text().trim()) {
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
      animeInfo.otherName = $("div.anime_info_body_bg > p:nth-child(9)")
        .text()
        .replace("Other name: ", "")
        .replace(/;/g, ",");

      $("div.anime_info_body_bg > p:nth-child(6) > a").each((i, el) => {
        animeInfo.genres?.push($(el).attr("title")!.toString());
      });

      const ep_start = $("#episode_page > li")
        .first()
        .find("a")
        .attr("ep_start");
      const ep_end = $("#episode_page > li").last().find("a").attr("ep_end");
      const movie_id = $("#movie_id").attr("value");
      const alias = $("#alias_anime").attr("value");

      const html = await this.client.get(
        `${
          this.ajaxUrl
        }/load-list-episode?ep_start=${ep_start}&ep_end=${ep_end}&id=${movie_id}&default_ep=${0}&alias=${alias}`
      );
      const $$ = load(html.data);

      animeInfo.episodes = [];
      $$("#episode_related > li").each((i, el) => {
        animeInfo.episodes?.push({
          id: $(el).find("a").attr("href")?.split("/")[1]!,
          number: parseFloat($(el).find(`div.name`).text().replace("EP ", "")),
          url: `${this.baseUrl}/${$(el).find(`a`).attr("href")?.trim()}`,
        });
      });
      animeInfo.episodes = animeInfo.episodes.reverse();

      animeInfo.totalEpisodes = parseInt(ep_end ?? "0");

      return animeInfo;
    } catch (err) {
      throw new Error(`failed to fetch anime info: ${err}`);
    }
  }

  async getMediaSources(
    episodeId: string,
    server: StreamingServers = StreamingServers.VidStreaming
  ): Promise<ISource> {
    if (episodeId.startsWith("http")) {
      const serverUrl = new URL(episodeId);
      switch (server) {
        case StreamingServers.GogoCDN:
          return {
            headers: { Referer: serverUrl.href },
            sources: await new GogoCDN().extract(serverUrl),
            download: `https://gogohd.net/download${serverUrl.search}`,
          };
        case StreamingServers.StreamSB:
          return {
            headers: {
              Referer: serverUrl.href,
              watchsb: "streamsb",
              "User-Agent": USER_AGENT,
            },
            sources: await new StreamSB().extract(serverUrl),
            download: `https://gogohd.net/download${serverUrl.search}`,
          };
        default:
          return {
            headers: { Referer: serverUrl.href },
            sources: await new GogoCDN().extract(serverUrl),
            download: `https://gogohd.net/download${serverUrl.search}`,
          };
      }
    }

    try {
      const res = await this.client.get(`${this.baseUrl}/${episodeId}`);

      const $ = load(res.data);

      let serverUrl: URL;

      switch (server) {
        case StreamingServers.GogoCDN:
          serverUrl = new URL(
            `https:${$("#load_anime > div > div > iframe").attr("src")}`
          );
          break;
        case StreamingServers.VidStreaming:
          serverUrl = new URL(
            `https:${$(
              "div.anime_video_body > div.anime_muti_link > ul > li.vidcdn > a"
            )
              .attr("data-video")
              ?.replace(".pro", ".net")}`
          );
          break;
        case StreamingServers.StreamSB:
          serverUrl = new URL(
            $(
              "div.anime_video_body > div.anime_muti_link > ul > li.streamsb > a"
            ).attr("data-video")!
          );
          break;
        default:
          serverUrl = new URL(
            `https:${$("#load_anime > div > div > iframe").attr("src")}`
          );
          break;
      }

      return await this.getMediaSources(serverUrl.href, server);
    } catch (err) {
      throw new Error("Episode not found.");
    }
  }

  async getMediaServers(episodeId: string): Promise<IEpisodeServer[]> {
    try {
      if (!episodeId.startsWith(this.baseUrl)) episodeId = `/${episodeId}`;

      const res = await this.client.get(`${this.baseUrl}/${episodeId}`);

      const $ = load(res.data);

      const servers: IEpisodeServer[] = [];

      $("div.anime_video_body > div.anime_muti_link > ul > li").each(
        (i, el) => {
          let url = $(el).find("a").attr("data-video");
          if (!url?.startsWith("http")) url = `https:${url}`;

          servers.push({
            name: $(el)
              .find("a")
              .text()
              .replace("Choose this server", "")
              .trim(),
            url: url,
          });
        }
      );

      return servers;
    } catch (err) {
      throw new Error("Episode not found.");
    }
  }
}

export default GogoAnime;
