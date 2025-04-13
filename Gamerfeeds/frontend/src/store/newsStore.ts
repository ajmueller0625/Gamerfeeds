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

export interface SourceData {
    id: number;
    name: string;
}

export interface PaginationData {
    page: number;
    perPage: number;
    total_items: number;
    total_pages: number;
}

export interface PaginatedNews {
    items: NewsData[];
    pagination: PaginationData;
}

interface NewsState {
    news: NewsData[];
    sources: SourceData[];
    pagination: PaginationData | null;
    isNewsLoading: boolean;
    isSourcesLoading: boolean;
    newsError: string | null;
    sourcesError: string | null;
    fetchNewsBySource: (source: string, limit: number) => Promise<void>; 
    fetchNewsFromRandomSources: (limit: number) => Promise<RandomSourceNews>;
    fetchAllSources: () => Promise<void>;
    fetchPaginatedNews: (page: number, perPage: number, source?: string, published?: string) => Promise<void>;
    fetchNewsByID: (id: number) => Promise<void>;
}

const useNewsStore = create<NewsState>((set) =>({
    news: [],
    sources: [],
    pagination: null,
    isNewsLoading: false,
    isSourcesLoading: false,
    newsError: null,
    sourcesError: null,
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
    fetchAllSources: async () => {
        try {
            set({ isSourcesLoading: true, sourcesError: null });
            const response = await fetch(`${API_URL}/news/sources/names`);

            if(!response.ok) {
                throw Error('Failed to fetch news');
            }

            const data = await response.json()

            set({ sources: data, isSourcesLoading: false, sourcesError: null });

        } catch(error) {
            set({ sourcesError: (error as Error).message, isSourcesLoading: false });
        }
    },
    fetchPaginatedNews: async (page: number, perPage: number, source?: string, published?: string) => {
        try {
            set({ isNewsLoading: true, newsError: null });
            let url = `${API_URL}/news?page=${page}&perPage=${perPage}`
            
            if (source) {
                url += `&source=${encodeURIComponent(source)}`;
            }

            if (published) {
                url += `&published_date=${encodeURIComponent(published)}`;
            }

            const response = await fetch(url);

            if (!response.ok) {
                if (response.status === 404) {
                    set({
                        news: [],
                        pagination: {
                            page: page,
                            perPage: perPage,
                            total_items: 0,
                            total_pages: 0
                        },
                        isNewsLoading: false,
                        newsError: null,
                    });
                    return;
                }
                throw Error('Failed to fetch news')
            }

            const data: PaginatedNews = await response.json()
            set({
                news: data.items,
                pagination: data.pagination,
                isNewsLoading: false,
                newsError: null
            });

        } catch(error) {
            set({ newsError: (error as Error).message, isNewsLoading: false });
        }
    },
    fetchNewsByID: async (id: number) => {
        try {
            set({ isNewsLoading: true, newsError: null });
            const response = await fetch(`${API_URL}/news/${id}`);

            if (!response.ok) {
                // Clear news array when not found or any other error
                set({news: [], isNewsLoading: false, newsError: `Failed to fetch news with id ${id}`});
                return;
            }

            const data = await response.json();
            set({news: data, isNewsLoading: false, newsError: null});
        
        } catch (error) {
            // Clear news array on error
            set({news: [], newsError: (error as Error).message, isNewsLoading: false});
        } 
    },
}));

export default useNewsStore;