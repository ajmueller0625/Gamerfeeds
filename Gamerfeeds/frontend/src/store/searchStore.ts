import { create } from "zustand";
const API_URL = import.meta.env.VITE_API_URL;

// Define types for search results
export interface SearchResult {
  id: number;
  type: 'game' | 'news';
  name?: string;            // for games
  title?: string;           // for news
  summary?: string;         // for games
  description?: string;     // for news
  image_url: string;
  release_date?: string;    // for games
  published?: string;       // for news
  data_type?: string;       // for games
  developers?: string[];    // for games
  platforms?: string[];     // for games
  rating?: number;          // for games
  author?: string;          // for news
  source_name?: string;     // for news
}

export interface PaginationData {
  page: number;
  perPage: number;
  total_items: number;
  total_pages: number;
}

export interface SearchResponse {
  items: SearchResult[];
  pagination: PaginationData;
}

interface SearchState {
  results: SearchResult[];
  quickResults: SearchResult[]; // For dropdown results
  pagination: PaginationData | null;
  searchType: 'all' | 'games' | 'news';
  isSearching: boolean;
  isQuickSearching: boolean; // For dropdown search
  query: string;
  debouncedQuery: string; // Store the debounced query
  searchError: string | null;
  quickSearchError: string | null; // For dropdown search
  setSearchType: (type: 'all' | 'games' | 'news') => void;
  setQuery: (query: string) => void;
  setDebouncedQuery: (query: string) => void; // Set the debounced query
  searchContent: (page?: number, perPage?: number) => Promise<void>;
  quickSearch: (query: string) => void; // For dropdown search
  clearSearch: () => void;
  clearQuickSearch: () => void; // For dropdown search
}

// Fixed debounce function with proper typing
const debounce = <F extends (...args: any[]) => any>(
  func: F,
  wait: number
) => {
  let timeout: ReturnType<typeof setTimeout>;
  
  return function(...args: Parameters<F>) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

const useSearchStore = create<SearchState>((set, get) => {
  // Define the actual search function separate from the debounced one
  const performQuickSearch = async (query: string) => {
    if (!query.trim()) {
      set({
        quickResults: [],
        quickSearchError: null,
        isQuickSearching: false
      });
      return;
    }
    
    try {
      set({ isQuickSearching: true, quickSearchError: null });
      
      const url = `${API_URL}/search?query=${encodeURIComponent(query)}&type=all&page=1&perPage=6`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Quick search failed with status: ${response.status}`);
      }
      
      const data: SearchResponse = await response.json();
      
      set({
        quickResults: data.items,
        isQuickSearching: false,
        quickSearchError: null
      });
      
    } catch (error) {
      set({
        quickSearchError: (error as Error).message,
        isQuickSearching: false
      });
    }
  };

  return {
    results: [],
    quickResults: [],
    pagination: null,
    searchType: 'games',
    isSearching: false,
    isQuickSearching: false,
    query: "",
    debouncedQuery: "",
    searchError: null,
    quickSearchError: null,

    setSearchType: (type) => set({ searchType: type }),
    
    setQuery: (query) => set({ query }),
    
    setDebouncedQuery: (query) => set({ debouncedQuery: query }),
    
    searchContent: async (page = 1, perPage = 10) => {
      const { debouncedQuery, searchType } = get();
      
      if (!debouncedQuery.trim()) {
        set({ 
          results: [],
          pagination: null,
          searchError: null,
          isSearching: false
        });
        return;
      }
      
      try {
        set({ isSearching: true, searchError: null });
        
        const url = `${API_URL}/search?query=${encodeURIComponent(debouncedQuery)}&type=${searchType}&page=${page}&perPage=${perPage}`;
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error(`Search failed with status: ${response.status}`);
        }
        
        const data: SearchResponse = await response.json();
        
        set({
          results: data.items,
          pagination: data.pagination,
          isSearching: false,
          searchError: null
        });
        
      } catch (error) {
        set({
          searchError: (error as Error).message,
          isSearching: false
        });
      }
    },
    
    quickSearch: debounce((query: string) => {
      performQuickSearch(query);
    }, 300),
    
    clearSearch: () => set({
      results: [],
      pagination: null,
      query: "",
      debouncedQuery: "",
      searchError: null
    }),
    
    clearQuickSearch: () => set({
      quickResults: [],
      quickSearchError: null
    })
  };
});

export default useSearchStore;