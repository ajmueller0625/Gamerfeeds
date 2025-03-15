import { create } from "zustand";
const API_URL = import.meta.env.VITE_API_URL;

export interface NewsData {
    id: number;
    title: string;
    description: string;
    image_url: string;
    source_url: string;
    content: string;
    author: string;
    source_name: string;
    published: string;
}

interface NewsState {
    news: NewsData[];
    isLoading: boolean;
    error: string | null;
    fetchLatestNews: (limit: number) => Promise<void>;
}

const useNewsStore = create<NewsState>((set) =>({
    news: [],
    isLoading: false,
    error: null,
    fetchLatestNews: async (limit: number) => {
        try {
            set({ isLoading: true, error: null});
            const response = await fetch(`${API_URL}/news/latest/${limit}`);

            if(!response.ok) {
                throw new Error('Failed to fetch news');
            }

            const data = await response.json();
            set({ news: data, isLoading: false });

        } catch (error) {
            set({ error: (error as Error).message, isLoading: false });
        }
    },
}));

export default useNewsStore;