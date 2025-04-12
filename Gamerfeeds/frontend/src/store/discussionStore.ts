import { create } from "zustand";
import { Discussion, DiscussionCreateDTO, DiscussionUpdateDTO } from "../types/discussion";
import useAuthStore from "./authStore";

const API_URL = import.meta.env.VITE_API_URL;

interface DiscussionState {
  discussions: Discussion[];
  currentDiscussion: Discussion | null;
  isLoading: boolean;
  error: string | null;
  totalDiscussions: number;
  
  // Methods for fetching discussions
  fetchDiscussions: (page: number, limit: number) => Promise<void>;
  fetchDiscussion: (id: number) => Promise<void>;
  fetchTotalCount: () => Promise<void>;
  
  // Methods for managing discussions
  createDiscussion: (discussion: DiscussionCreateDTO) => Promise<Discussion | null>;
  updateDiscussion: (id: number, updates: DiscussionUpdateDTO) => Promise<void>;
  deleteDiscussion: (id: number) => Promise<void>;
  
  // Reset methods
  clearCurrentDiscussion: () => void;
  clearError: () => void;
}

// Helper function to check if the response is ok and handle various error cases
const handleResponse = async (response: Response) => {
  if (!response.ok) {
    let errorMessage = 'An error occurred';
    try {
      const errorData = await response.json();
      errorMessage = errorData.detail || `Error: ${response.status}`;
    } catch (e) {
      errorMessage = `Error: ${response.status} ${response.statusText}`;
    }
    throw new Error(errorMessage);
  }
  
  // For 204 No Content responses, return an empty object
  if (response.status === 204) {
    return {};
  }
  
  // Parse JSON for other successful responses
  return await response.json();
};

// Helper to get the current auth token consistently
const getAuthToken = () => {
  const storeToken = useAuthStore.getState().token;
  return storeToken || localStorage.getItem('token');
};

const useDiscussionStore = create<DiscussionState>((set, get) => ({
  discussions: [],
  currentDiscussion: null,
  isLoading: false,
  error: null,
  totalDiscussions: 0,
  
  fetchDiscussions: async (page: number, limit: number) => {
    set({ isLoading: true, error: null });
    try {
      const skip = (page - 1) * limit;
      const response = await fetch(`${API_URL}/discussions?skip=${skip}&limit=${limit}`);
      const data = await handleResponse(response);
      set({ discussions: data, isLoading: false });
    } catch (error) {
      console.error("Error fetching discussions:", error);
      set({
        error: error instanceof Error ? error.message : "Failed to load discussions",
        isLoading: false
      });
    }
  },
  
  fetchDiscussion: async (id: number) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`${API_URL}/discussions/${id}`);
      const data = await handleResponse(response);
      set({ currentDiscussion: data, isLoading: false });
    } catch (error) {
      console.error(`Error fetching discussion ${id}:`, error);
      set({
        error: error instanceof Error ? error.message : "Failed to load discussion",
        isLoading: false
      });
    }
  },
  
  fetchTotalCount: async () => {
    try {
      const response = await fetch(`${API_URL}/discussions/count`);
      const data = await handleResponse(response);
      set({ totalDiscussions: data.total });
    } catch (error) {
      console.error("Error fetching total discussions count:", error);
    }
  },
  
  createDiscussion: async (discussion: DiscussionCreateDTO) => {
    set({ isLoading: true, error: null });
    try {
      const token = getAuthToken();
      
      if (!token) {
        throw new Error('You must be logged in to create a discussion');
      }
      
      const response = await fetch(`${API_URL}/discussions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(discussion)
      });
      
      const newDiscussion = await handleResponse(response);
      
      // Update total count
      await get().fetchTotalCount();
      
      set({ isLoading: false });
      return newDiscussion;
    } catch (error) {
      console.error("Error creating discussion:", error);
      set({
        error: error instanceof Error ? error.message : "Failed to create discussion",
        isLoading: false
      });
      return null;
    }
  },
  
  updateDiscussion: async (id: number, updates: DiscussionUpdateDTO) => {
    set({ isLoading: true, error: null });
    try {
      const token = getAuthToken();
      
      if (!token) {
        throw new Error('You must be logged in to update a discussion');
      }
      
      const response = await fetch(`${API_URL}/discussions/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updates)
      });
      
      const updatedDiscussion = await handleResponse(response);
      
      // Update the current discussion if it's the one being edited
      const { currentDiscussion } = get();
      if (currentDiscussion && currentDiscussion.id === id) {
        set({ currentDiscussion: updatedDiscussion });
      }
      
      // Update in the list if present
      const { discussions } = get();
      const updatedDiscussions = discussions.map(d => 
        d.id === id ? { ...d, ...updatedDiscussion } : d
      );
      
      set({ discussions: updatedDiscussions, isLoading: false });
    } catch (error) {
      console.error(`Error updating discussion ${id}:`, error);
      set({
        error: error instanceof Error ? error.message : "Failed to update discussion",
        isLoading: false
      });
    }
  },
  
  deleteDiscussion: async (id: number) => {
    set({ isLoading: true, error: null });
    try {
      const token = getAuthToken();
      
      if (!token) {
        throw new Error('You must be logged in to delete a discussion');
      }
      
      const response = await fetch(`${API_URL}/discussions/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      await handleResponse(response);
      
      // Remove from the list if present
      const { discussions } = get();
      const updatedDiscussions = discussions.filter(d => d.id !== id);
      
      // Update total count
      await get().fetchTotalCount();
      
      set({
        discussions: updatedDiscussions,
        currentDiscussion: null,
        isLoading: false
      });
    } catch (error) {
      console.error(`Error deleting discussion ${id}:`, error);
      set({
        error: error instanceof Error ? error.message : "Failed to delete discussion",
        isLoading: false
      });
    }
  },
  
  clearCurrentDiscussion: () => set({ currentDiscussion: null }),
  
  clearError: () => set({ error: null })
}));

export default useDiscussionStore;