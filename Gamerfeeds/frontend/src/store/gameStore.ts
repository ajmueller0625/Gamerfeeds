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

interface GameState {
    topGames: GameData[];
    latestGames: GameData[];
    isTopGamesLoading: boolean;
    isLatestGamesLoading: boolean;
    topGamesError: string | null;
    latestGamesError: string | null;
    fetchTopGames: (limit: number) => Promise<void>;
    fetchLatestGames: (limit: number) => Promise<void>;
}

const useGameStore = create<GameState>((set) => ({
    topGames: [],
    latestGames: [],
    isTopGamesLoading: false,
    isLatestGamesLoading: false,
    topGamesError: null,
    latestGamesError: null,
    
    fetchTopGames: async (limit: number) => {
        try {
            set({ isTopGamesLoading: true, topGamesError: null });

            const response = await fetch(`${API_URL}/games/topgames/${limit}`);

            if(!response.ok) {
                throw new Error('Failed to fetch top games');
            }

            const data = await response.json();
            set({ topGames: data, isTopGamesLoading: false });

        } catch (error) {
            set({ topGamesError: (error as Error).message, isTopGamesLoading: false });
        }
    },
    
    fetchLatestGames: async (limit: number) => {
        try {
            set({ isLatestGamesLoading: true, latestGamesError: null });

            const response = await fetch(`${API_URL}/games/latestgames/${limit}`);

            if(!response.ok) {
                throw new Error('Failed to fetch latest games');
            }

            const data = await response.json();
            set({ latestGames: data, isLatestGamesLoading: false });

        } catch (error) {
            set({ latestGamesError: (error as Error).message, isLatestGamesLoading: false });
        }
    },
}));

export default useGameStore;