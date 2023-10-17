export interface SearchResult {
    title: string;
    id: number;
    slug: string;
    rating: string;
    rating_count: number;
    follow_count: number;
    user_follow_count: number;
    content_rating: string;
    demographic: number;
    md_titles: [MDTitle];
    md_covers: Array<Cover>;
    highlight: string;
}
export interface Cover {
    vol: any;
    w: number;
    h: number;
    b2key: string;
}
export interface MDTitle {
    title: string;
}
export interface Comic {
    hid: string;
    title: string;
    country: string;
    status: number;
    links: ComicLinks;
    last_chapter: any;
    chapter_count: number;
    demographic: number;
    hentai: boolean;
    user_follow_count: number;
    follow_rank: number;
    comment_count: number;
    follow_count: number;
    desc: string;
    parsed: string;
    slug: string;
    mismatch: any;
    year: number;
    bayesian_rating: any;
    rating_count: number;
    content_rating: string;
    translation_completed: boolean;
    relate_from: Array<any>;
    mies: any;
    md_titles: Array<ComicTitles>;
    md_comic_md_genres: Array<ComicGenres>;
    mu_comics: {
        licensed_in_english: any;
        mu_comic_categories: Array<ComicCategories>;
    };
    md_covers: Array<Cover>;
    iso639_1: string;
    lang_name: string;
    lang_native: string;
}
export interface ComicLinks {
    al: string;
    ap: string;
    bw: string;
    kt: string;
    mu: string;
    amz: string;
    cdj: string;
    ebj: string;
    mal: string;
    raw: string;
}
export interface ComicTitles {
    title: string;
}
export interface ComicGenres {
    md_genres: {
        name: string;
        type: string | null;
        slug: string;
        group: string;
    };
}
export interface ComicCategories {
    mu_categories: {
        title: string;
        slug: string;
    };
    positive_vote: number;
    negative_vote: number;
}
export interface ChapterData {
    id: number;
    chap: string;
    title: string;
    vol: string;
    slug: string | null;
    lang: string;
    created_at: string;
    updated_at: string;
    up_count: number;
    down_count: number;
    group_name: string[];
    hid: string;
    md_groups: string[];
}
