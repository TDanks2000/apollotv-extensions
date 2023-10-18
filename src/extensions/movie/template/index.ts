import {
  IEpisodeServer,
  IMediaInfo,
  IMediaResult,
  ISearch,
  ISource,
  MediaProvier,
  MetaData,
} from "../../../types";

import * as metadata from "./extension.json";

class Template extends MediaProvier {
  public metaData: MetaData = metadata;
  protected baseUrl: string = metadata.code.utils.mainURL;
  protected apiURL: string = metadata.code.utils.apiURL;

  search(query: string, ...args: any[]): Promise<ISearch<IMediaResult>> {
    throw new Error("Method not implemented.");
  }

  getMediaInfo(animeId: string, ...args: any): Promise<IMediaInfo> {
    throw new Error("Method not implemented.");
  }

  getMediaSources(episodeId: string, ...args: any): Promise<ISource> {
    throw new Error("Method not implemented.");
  }

  getMediaServers(episodeId: string): Promise<IEpisodeServer[]> {
    throw new Error("Method not implemented.");
  }
}

export default Template;
