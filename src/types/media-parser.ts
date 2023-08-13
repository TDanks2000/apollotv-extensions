import { BaseParser, IMediaInfo, ISource, IEpisodeServer } from ".";

abstract class MediaProvier extends BaseParser {
  /**
   * if the provider has dub and it's avialable seperatly from sub set this to `true`
   */
  protected readonly isDubAvailableSeparately: boolean = false;
  /**
   * takes media id
   *
   * returns media info (including episodes)
   */
  abstract getMediaInfo(mediaId: string, ...args: any): Promise<IMediaInfo>;

  /**
   * takes episode id
   *
   * returns episode sources (video links)
   */
  abstract getMediaSources(episodeId: string, ...args: any): Promise<ISource>;

  /**
   * takes episode id
   *
   * returns episode servers (video links) available
   */
  abstract getMediaServers(
    episodeId: string,
    ...args: any
  ): Promise<IEpisodeServer[]>;
}

export default MediaProvier;
