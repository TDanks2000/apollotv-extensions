import { IEpisodeServer, IMediaInfo, ISource, MediaProvier } from "../../types";

class Template extends MediaProvier {
  protected baseUrl: string = "";

  getMediaInfo(animeId: string, ...args: any): Promise<IMediaInfo> {
    throw new Error("Method not implemented.");
  }

  getMediaSources(episodeId: string, ...args: any): Promise<ISource> {
    throw new Error("Method not implemented.");
  }

  getMediaServers(episodeId: string): Promise<IEpisodeServer[]> {
    throw new Error("Method not implemented.");
  }

  search(query: string, ...args: any[]): Promise<unknown> {
    throw new Error("Method not implemented.");
  }
}

export default Template;
