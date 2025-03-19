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

export interface RandomSourceNews {
    firstSource: {
        name: string;
        data: NewsData[];
    };
    secondSource: {
        name: string;
        data: NewsData[];
    };
}

interface NewsState {
    news: NewsData[];
    isNewsLoading: boolean;
    newsError: string | null;
    fetchLatestNews: (limit: number) => Promise<void>;
    fetchNewsBySource: (source: string, limit: number) => Promise<void>; 
    fetchNewsFromRandomSources: (limit: number) => Promise<RandomSourceNews>;
}

const useNewsStore = create<NewsState>((set) =>({
    news: [],
    isNewsLoading: false,
    newsError: null,
    fetchLatestNews: async (limit: number) => {
        try {
            set({ isNewsLoading: true, newsError: null});
            const response = await fetch(`${API_URL}/news/latest/${limit}`);

            if(!response.ok) {
                throw new Error('Failed to fetch news');
            }

            const data = await response.json();
            set({ news: data, isNewsLoading: false });

        } catch (error) {
            set({ newsError: (error as Error).message, isNewsLoading: false });
        }
    },
    fetchNewsBySource: async (source: string, limit: number) => {
        try {
            set({ isNewsLoading: true, newsError: null });
            const response = await fetch(`${API_URL}/news/source/${source}/${limit}`);

            if(!response.ok) {
                throw new Error(`Failed to fetch news from ${source}`);
            }

            const data = await response.json();
            set({ news: data, isNewsLoading: false});

        } catch (error) {
            set({ newsError: (error as Error).message, isNewsLoading: false});
        }
    },
    fetchNewsFromRandomSources: async (limit: number) => {
        try {
            set({ isNewsLoading: true, newsError: null });
            const sourcesResponse = await fetch(`${API_URL}/news/sources/names`);

            if(!sourcesResponse.ok) {
                throw new Error('Failed to fetch sources');
            }

            const sourcesData = await sourcesResponse.json();

            if (sourcesData.length < 2) {
                throw Error('Not enough news sources available');
            }

            const randomSources: string[] = [];
            const availableSources = [...sourcesData];

            for(let i = 0; i < 2; i++) {
                const randomIndex = Math.floor(Math.random() * availableSources.length);
                randomSources.push(availableSources[randomIndex].name);
                availableSources.splice(randomIndex, 1);
            }

            const firstSourceResponse = await fetch(`${API_URL}/news/source/${randomSources[0]}/${limit}`)
            if (!firstSourceResponse.ok) {
                throw new Error(`Failed to fetch news from ${randomSources[0]}`);
            }
            const firstDataSet = await firstSourceResponse.json();

            const secondSourceResponse = await fetch(`${API_URL}/news/source/${randomSources[1]}/${limit}`)
            if (!secondSourceResponse.ok) {
                throw new Error(`Failed to fetch news from ${randomSources[1]}`);
            }
            const secondDataSet = await secondSourceResponse.json();

            set({ isNewsLoading: false, newsError: null });

            return {
                firstSource: {
                    name: randomSources[0],
                    data: firstDataSet
                },
                secondSource: {
                    name: randomSources[1],
                    data: secondDataSet
                }
            };
        } catch (error) {
            set({ newsError: (error as Error).message, isNewsLoading: false });
            return {
                firstSource: {
                    name: "Unknown",
                    data: []
                },
                secondSource: {
                    name: "Unknown",
                    data: []
                }
            };
        }
    },
}));

export default useNewsStore;