import { create } from "zustand";
const API_URL = import.meta.env.VITE_API_URL;

export interface GameData {
    id: number;
    name: string;
    summary: string | null;
    storyline: string | null;
    cover_image_url: string;
    release_date: string;
    data_type: string;
    developers: string[] | null;
    genres: string[] | null;
    languages: string[] | null;
    screenshots: string[] | null;
    videos: string[] | null;
    rating: number | null;
}

export interface PaginationData {
    page: number;
    perPage: number;
    total_items: number;
    total_pages: number;
}

export interface PaginatedNews {
    items: GameData[];
    pagination: PaginationData;
}

export interface DeveloperData {
    id: number;
    name: string;
}

export interface PlatformData {
    id: number;
    name: string;
}

export interface GenreData {
    id: number;
    name: string;
}

export interface LanguageData {
    id: number;
    name: string;
}

interface GameState {
    topGames: GameData[];
    latestGames: GameData[];
    upcomingGames: GameData[];
    developers: DeveloperData[];
    platforms: PlatformData[];
    genres: GenreData[];
    languages: LanguageData[];
    pagination: PaginationData | null;
    isTopGamesLoading: boolean;
    isLatestGamesLoading: boolean;
    isUpcomingGamesLoading: boolean;
    isDevelopersLoading: boolean;
    isPlatformsLoading: boolean;
    isGenresLoading: boolean;
    isLanguagesLoading: boolean;
    topGamesError: string | null;
    latestGamesError: string | null;
    upcomingGamesError: string | null;
    developersError: string | null;
    platformsError: string | null;
    genresError: string | null;
    languagesError: string | null;
    fetchTopGames: (page: number, perPage: number, developer?: string, platform?: string, genre?: string, language?: string) => Promise<void>;
    fetchLatestGames: (page: number, perPage: number, developer?: string, platform?: string, genre?: string, language?: string) => Promise<void>;
    fetchUpcomingGames: (page: number, perPage: number, developer?: string, platform?: string, genre?: string, language?: string) => Promise<void>;
    fetchDevelopers: () => Promise<void>;
    fetchPlatforms: () => Promise<void>;
    fetchGenres: () => Promise<void>;
    fetchLanguages: () => Promise<void>;
}

const useGameStore = create<GameState>((set) => ({
    topGames: [],
    latestGames: [],
    upcomingGames: [],
    developers: [],
    platforms: [],
    genres: [],
    languages: [],
    pagination: null,
    isTopGamesLoading: false,
    isLatestGamesLoading: false,
    isUpcomingGamesLoading: false,
    isDevelopersLoading: false,
    isPlatformsLoading: false,
    isGenresLoading: false,
    isLanguagesLoading: false,
    topGamesError: null,
    latestGamesError: null,
    upcomingGamesError: null,
    developersError: null,
    platformsError: null,
    genresError: null,
    languagesError: null,

    fetchTopGames: async (page: number, perPage: number, developer?: string, platform?: string, genre?: string, language?: string) => {
        try {
            set({ isTopGamesLoading: true, topGamesError: null });

            let url = `${API_URL}/games/topgames?page=${page}&perPage=${perPage}`;

            if (developer) {
                url += `&developers=${encodeURIComponent(developer)}`;
            }

            if (platform) {
                url += `&platforms=${encodeURIComponent(platform)}`;
            }

            if (genre) {
                url += `&genres=${encodeURIComponent(genre)}`;
            }

            if (language) {
                url += `&languages=${encodeURIComponent(language)}`;
            }

            const response = await fetch(url);

            if(!response.ok) {
                if (!response.ok) {
                    if (response.status === 404) {
                        set({
                            topGames: [],
                            pagination: {
                                page: page,
                                perPage: perPage,
                                total_items: 0,
                                total_pages: 0
                            },
                            isTopGamesLoading: false,
                            topGamesError: null,
                        });
                        return;
                    }
                    throw Error('Failed to fetch news')
                }
            }

            const data = await response.json();
            set({ 
                topGames: data.items,
                pagination: data.pagination, 
                isTopGamesLoading: false,
                topGamesError: null
            });

        } catch (error) {
            set({ topGamesError: (error as Error).message, isTopGamesLoading: false });
        }
    },
    
    fetchLatestGames: async (page: number, perPage: number, developer?: string, platform?: string, genre?: string, language?: string) => {
        try {
            set({ isLatestGamesLoading: true, latestGamesError: null });

            let url = `${API_URL}/games/latestgames?page=${page}&perPage=${perPage}`;

            if (developer) {
                url += `&developers=${encodeURIComponent(developer)}`;
            }

            if (platform) {
                url += `&platforms=${encodeURIComponent(platform)}`;
            }

            if (genre) {
                url += `&genres=${encodeURIComponent(genre)}`;
            }

            if (language) {
                url += `&languages=${encodeURIComponent(language)}`;
            }

            const response = await fetch(url);

            if(!response.ok) {
                if (!response.ok) {
                    if (response.status === 404) {
                        set({
                            latestGames: [],
                            pagination: {
                                page: page,
                                perPage: perPage,
                                total_items: 0,
                                total_pages: 0
                            },
                            isLatestGamesLoading: false,
                            latestGamesError: null,
                        });
                        return;
                    }
                    throw Error('Failed to fetch news')
                }
            }

            const data = await response.json();
            set({ 
                latestGames: data.items,
                pagination: data.pagination, 
                isLatestGamesLoading: false,
                latestGamesError: null
            });

        } catch (error) {
            set({ latestGamesError: (error as Error).message, isLatestGamesLoading: false });
        }
    },
    fetchUpcomingGames: async (page: number, perPage: number, developer?: string, platform?: string, genre?: string, language?: string) => {
        try {
            set({ isUpcomingGamesLoading: true, upcomingGamesError: null });

            let url = `${API_URL}/games/upcominggames?page=${page}&perPage=${perPage}`;

            if (developer) {
                url += `&developers=${encodeURIComponent(developer)}`;
            }

            if (platform) {
                url += `&platforms=${encodeURIComponent(platform)}`;
            }

            if (genre) {
                url += `&genres=${encodeURIComponent(genre)}`;
            }

            if (language) {
                url += `&languages=${encodeURIComponent(language)}`;
            }

            const response = await fetch(url);

            if(!response.ok) {
                if (!response.ok) {
                    if (response.status === 404) {
                        set({
                            upcomingGames: [],
                            pagination: {
                                page: page,
                                perPage: perPage,
                                total_items: 0,
                                total_pages: 0
                            },
                            isUpcomingGamesLoading: false,
                            upcomingGamesError: null,
                        });
                        return;
                    }
                    throw Error('Failed to fetch news')
                }
            }

            const data = await response.json();
            set({ 
                upcomingGames: data.items,
                pagination: data.pagination, 
                isUpcomingGamesLoading: false,
                upcomingGamesError: null
            });

        } catch (error) {
            set({ upcomingGamesError: (error as Error).message, isUpcomingGamesLoading: false });
        }
    },
    fetchDevelopers: async () => {
        try {
            set({ isDevelopersLoading: true, developersError: null });
            const response = await fetch(`${API_URL}/games/developers`);

            if (!response.ok) {
                throw Error('Failed to fetch developers');
            }

            const data = await response.json();
            set({ developers: data, isDevelopersLoading: false, developersError: null });

        } catch (error) {
            set({ developersError: (error as Error).message, isDevelopersLoading: false});
        }
    },
    fetchPlatforms: async () => {
        try {
            set({ isPlatformsLoading: true, platformsError: null });
            const response = await fetch(`${API_URL}/games/platforms`);

            if (!response.ok) {
                throw Error('Failed to fetch platforms');
            }

            const data = await response.json();
            set({ platforms: data, isPlatformsLoading: false, platformsError: null });

        } catch (error) {
            set({ platformsError: (error as Error).message, isPlatformsLoading: false});
        }
    },
    fetchGenres: async () => {
        try {
            set({ isGenresLoading: true, genresError: null });
            const response = await fetch(`${API_URL}/games/genres`);

            if (!response.ok) {
                throw Error('Failed to fetch genres');
            }

            const data = await response.json();
            set({ genres: data, isGenresLoading: false, genresError: null });

        } catch (error) {
            set({ genresError: (error as Error).message, isGenresLoading: false});
        }
    },
    fetchLanguages: async () => {
        try {
            set({ isLanguagesLoading: true, languagesError: null });
            const response = await fetch(`${API_URL}/games/languages`);

            if (!response.ok) {
                throw Error('Failed to fetch languages');
            }

            const data = await response.json();
            set({ languages: data, isLanguagesLoading: false, languagesError: null });

        } catch (error) {
            set({ languagesError: (error as Error).message, isLanguagesLoading: false});
        }
    },
}));

export default useGameStore;