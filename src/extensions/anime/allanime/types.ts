export interface AllAnimeSearch {
  data: AllAnimeSearchData;
}

export interface AllAnimeInfo {
  data: AllAnimeInfoData;
}

export interface AllAnimeSearchData {
  shows: AllAnimeSearchShows;
}

export interface AllAnimeSearchShows {
  pageInfo: PageInfo;
  edges: AllAnimeSearchEdge[];
}

export interface AllAnimeSearchEdge {
  _id: string;
  name: string;
  englishName: null | string;
  nativeName: null | string;
  slugTime: null;
  thumbnail: string;
  lastEpisodeInfo: LastEpisodeInfo;
  lastEpisodeDate: LastEpisodeDate;
  type: null | string;
  season: Season | null;
  score: number | null;
  airedStart: AiredStart;
  availableEpisodes: AvailableEpisodes;
  episodeDuration: null | string;
  episodeCount: null | string;
  lastUpdateEnd: Date;
}

export interface AiredStart {
  hour?: number;
  minute?: number;
  year?: number;
  month?: number;
  date?: number;
}

export interface AvailableEpisodes {
  sub: number;
  dub: number;
  raw: number;
}

export interface LastEpisodeDate {
  dub: AiredStart;
  sub: AiredStart;
  raw: AiredStart;
}

export interface LastEpisodeInfo {
  sub: Raw;
  dub?: Dub;
  raw?: Raw;
}

export interface Dub {
  episodeString: string;
  notes?: string;
}

export interface Raw {
  episodeString: string;
}

export interface Season {
  quarter: string;
  year: number;
}

export interface PageInfo {
  total: null;
}

export interface AllAnimeInfoData {
  show: AllAnimeInfoShow;
}

export interface AllAnimeInfoShow {
  _id: string;
  name: string;
  englishName: null;
  nativeName: string;
  slugTime: null;
  thumbnail: string;
  lastEpisodeInfo: LastEpisodeInfo;
  lastEpisodeDate: LastEpisodeDate;
  type: string;
  season: Season;
  score: number;
  airedStart: Aired;
  availableEpisodes: AvailableEpisodes;
  episodeDuration: string;
  episodeCount: string;
  lastUpdateEnd: Date;
  description: string;
  thumbnails: string[];
  genres: any[];
  status: string | null;
  altNames: string[];
  averageScore: null;
  rating: string;
  broadcastInterval: string;
  banner: null;
  airedEnd: Aired;
  studios: string[];
  countryOfOrigin: null;
  characters: null;
  availableEpisodesDetail: AvailableEpisodesDetail;
  prevideos: any[];
  nameOnlyString: string;
  relatedShows: RelatedShow[];
  relatedMangas: any[];
  musics: null;
  isAdult: null;
  tags: any[];
  disqusIds: DisqusIDS;
  pageStatus: PageStatus;
}

export interface Aired {
  year: number;
  month: number;
  date: number;
}

export interface AvailableEpisodes {
  sub: number;
  dub: number;
  raw: number;
}

export interface AvailableEpisodesDetail {
  sub: string[];
  dub: string[];
  raw: any[];
}

export interface DisqusIDS {
  gg: string;
}

export interface LastEpisodeDateDub {
  hour: number;
  minute: number;
  year: number;
  month: number;
  date: number;
}

export interface Raw {}

export interface LastEpisodeInfoDub {
  episodeString: string;
}

export interface PageStatus {
  _id: string;
  notes: null;
  pageId: string;
  showId: string;
  views: string;
  likesCount: string;
  commentCount: string;
  dislikesCount: string;
  reviewCount: string;
  userScoreCount: string;
  userScoreTotalValue: number;
  userScoreAverValue: number;
  viewers: Viewers;
}

export interface Viewers {
  firstViewers: Viewer[];
  recViewers: Viewer[];
}

export interface Viewer {
  viewCount: number;
  lastWatchedDate: Date;
  user: User | null;
}

export interface User {
  _id: string;
  displayName: string;
  picture: null | string;
  hideMe: boolean | null;
  brief: null;
}

export interface RelatedShow {
  relation: string;
  showId: string;
}

export interface Season {
  quarter: string;
  year: number;
}

export interface AllAnimeEpisodeInfo {
  data: AllAnimeEpisodeInfoData;
}

export interface AllAnimeEpisodeInfoData {
  episodeInfos: EpisodeInfo[];
}

export interface EpisodeInfo {
  episodeIdNum: number;
  notes: string;
  thumbnails: string[] | null;
  uploadDates: UploadDates | null;
  vidInforssub: VidInfos | null;
  vidInforsdub: VidInfos | null;
  vidInforsraw: VidInfos | null;
}

export interface UploadDates {
  sub: Date;
  dub: Date;
}

export interface VidInfos {
  vidResolution: number;
  vidPath: string;
  vidSize: number;
  vidDuration: number;
}

export interface AllAnimeServerInfo {
  data: Data;
}

export interface Data {
  episode: Episode;
}

export interface Episode {
  episodeString: string;
  uploadDate: UploadDate;
  sourceUrls: SourceURL[];
  thumbnail: null;
  notes: null;
  show: Show;
  pageStatus: PageStatus;
  episodeInfo: EpisodeInfo;
  versionFix: null;
}

export interface UploadDates {
  sub: Date;
  dub: Date;
}

export interface VidInfors {
  vidResolution: number;
  vidPath: string;
  vidSize: number;
  vidDuration: number;
}

export interface PageStatus {
  _id: string;
  notes: null;
  pageId: string;
  showId: string;
  views: string;
  likesCount: string;
  commentCount: string;
  dislikesCount: string;
  reviewCount: string;
  userScoreCount: string;
  userScoreTotalValue: number;
  userScoreAverValue: number;
  viewers: Viewers;
}

export interface Viewers {
  firstViewers: Viewer[];
  recViewers: Viewer[];
}

export interface Viewer {
  viewCount: number;
  lastWatchedDate: Date;
  user: User | null;
}

export interface Show {
  _id: string;
  name: string;
  englishName: string;
  nativeName: string;
  slugTime: null;
  thumbnail: string;
  lastEpisodeInfo: LastEpisodeInfo;
  lastEpisodeDate: LastEpisodeDate;
  type: string;
  season: Season;
  score: number;
  airedStart: UploadDate;
  availableEpisodes: AvailableEpisodes;
  episodeDuration: string;
  episodeCount: string;
  lastUpdateEnd: Date;
  description: string;
  broadcastInterval: string;
  banner: string;
  characters: Character[];
  availableEpisodesDetail: AvailableEpisodesDetail;
  nameOnlyString: string;
  isAdult: boolean;
  relatedShows: any[];
  relatedMangas: RelatedMangas[];
  altNames: string[];
  disqusIds: DisqusIDS;
}

export interface UploadDate {
  hour: number;
  minute: number;
  year: number;
  month: number;
  date: number;
  second?: number;
}

export interface AvailableEpisodes {
  sub: number;
  dub: number;
  raw: number;
}

export interface AvailableEpisodesDetail {
  sub: string[];
  dub: string[];
  raw: any[];
}

export interface Character {
  role: Role;
  name: Name;
  image: Image;
  aniListId: number;
  voiceActors: VoiceActor[];
}

export interface Image {
  large: string;
  medium: string;
}

export interface Name {
  full: string;
  native: string;
}

export enum Role {
  Main = "Main",
  Supporting = "Supporting",
}

export interface VoiceActor {
  language: Language;
  aniListId: number;
}

export enum Language {
  English = "ENGLISH",
  German = "GERMAN",
  Japanese = "JAPANESE",
}

export interface DisqusIDS {
  gg: string;
}

export interface Dub {
  episodeString: string;
}

export interface RelatedMangas {
  relation: string;
  mangaId: string;
}

export interface Season {
  quarter: string;
  year: number;
}

export interface SourceURL {
  sourceUrl: string;
  priority: number;
  sourceName: string;
  type: Type;
  className: ClassName;
  streamerId: StreamerID;
  sandbox?: string;
  downloads?: Downloads;
}

export enum ClassName {
  Empty = "",
  TextDanger = "text-danger",
  TextInfo = "text-info",
}

export interface Downloads {
  sourceName: string;
  downloadUrl: string;
}

export enum StreamerID {
  Allanime = "allanime",
}

export enum Type {
  Iframe = "iframe",
  Player = "player",
}
