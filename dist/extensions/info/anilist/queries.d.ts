export declare const anilistMediaDetailQuery: (id: string, type?: "ANIME" | "MANGA") => string;
export declare const anilistAdvancedQuery: () => string;
export declare const anilistSearchQuery: (query: string, page: number, perPage: number, type?: "ANIME" | "MANGA") => string;
export declare const anilistGenresQuery: (genres: string[], page?: number, perPage?: number) => string;
export declare const kitsuSearchQuery: (query: string) => string;
export declare const anilistTrendingQuery: (page?: number, perPage?: number, type?: "ANIME" | "MANGA") => string;
export declare const anilistPopularQuery: (page?: number, perPage?: number, type?: "ANIME" | "MANGA") => string;
export declare const anilistAiringScheduleQuery: (page: number | undefined, perPage: number | undefined, weekStart: number, weekEnd: number, notYetAired: boolean) => string;
export declare const anilistSiteStatisticsQuery: () => string;
export declare const anilistCharacterQuery: () => string;
export declare const anilistStaffQuery: () => string;
