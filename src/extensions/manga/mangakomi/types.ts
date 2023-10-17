export interface MangakomiSearch {
  success: boolean;
  data: MangakomiSearchData[];
}

export interface MangakomiSearchData {
  title: string;
  url: string;
  type: string;
}
