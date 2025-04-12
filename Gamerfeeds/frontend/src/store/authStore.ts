import { create } from "zustand";
const API_URL = import.meta.env.VITE_API_URL;

export interface UserData {
  id: number;
  username: string;
  firstname: string;
  lastname: string;
  email: string;
  is_superuser: boolean; // Note: Changed from is_super to is_superuser to match your model
}

// Define the auth store state interface
interface AuthState {
  token: string | null;
  userData: UserData | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  registrationSuccess: boolean; // New state to track successful registration
  
  // Existing methods
  setToken: (token: string) => void;
  logout: () => void;
  setUserData: (userData: UserData) => void;
  fetchUser: () => Promise<void>;
  
  // New methods for authentication features
  login: (username: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  clearError: () => void;
  resetRegistrationSuccess: () => void; // New method to reset registration success state
}

export interface RegisterData {
  username: string;
  firstname: string;
  lastname: string;
  email: string;
  password: string;
}

const loadInitialState = (): Pick<AuthState, 'token' | 'userData' | 'isAuthenticated'> => {
  const token = localStorage.getItem("token") || null;
  
  // Attempt to parse the user data from localStorage
  let userData: UserData | null = null;
  try {
    const userDataString = localStorage.getItem("userData");
    if (userDataString) {
      userData = JSON.parse(userDataString);
    }
  } catch (error) {
    console.error("Error parsing user data from localStorage:", error);
  }
  
  return { 
    token, 
    userData, 
    isAuthenticated: !!token && !!userData 
  };
};

const useAuthStore = create<AuthState>((set, get) => ({
  ...loadInitialState(),
  isLoading: false,
  error: null,
  registrationSuccess: false, // Initialize the new state
  
  setToken: (token: string) => {
    localStorage.setItem("token", token); // Save the token to localStorage
    set({ token, isAuthenticated: true });
  },
  
  logout: async () => {
    const { token } = get();
    
    set({ isLoading: true });
    
    try {
      // Call logout endpoint to invalidate token on server
      if (token) {
        await fetch(`${API_URL}/auth/logout`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
      }
    } catch (error) {
      console.error("Error during logout:", error);
    } finally {
      // Clean up local storage and reset state regardless of server response
      localStorage.removeItem("token");
      localStorage.removeItem("userData");
  
      set({
        token: null,
        userData: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },
  
  setUserData: (userData: UserData) => {
    localStorage.setItem("userData", JSON.stringify(userData)); // Save the user data to localStorage
    set({ userData, isAuthenticated: true });
  },
  
  fetchUser: async () => {
    const { token, logout, setUserData } = get(); // Accessing current state and actions
    
    if (!token) {
      return;
    }
    
    set({ isLoading: true });
    
    try {
      const response = await fetch(`${API_URL}/general/me`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.status === 200) {
        const userData: UserData = await response.json();
        setUserData(userData);
      } else if (response.status === 401) {
        logout();
      } else {
        console.error("Failed to fetch user data");
      }
    } catch (error) {
      console.error("There was an error fetching user data:", error);
    } finally {
      set({ isLoading: false });
    }
  },
  
  // New methods for authentication
  login: async (username: string, password: string) => {
    set({ isLoading: true, error: null });
    
    try {
      // Create form data for the login request
      const formData = new FormData();
      formData.append("username", username);
      formData.append("password", password);
      
      const response = await fetch(`${API_URL}/auth/token`, {
        method: "POST",
        body: formData,
      });
      
      if (response.ok) {
        const data = await response.json();
        // Store the token
        get().setToken(data.access_token);
        // Fetch user data
        await get().fetchUser();
      } else {
        const errorData = await response.json();
        set({ 
          error: errorData.detail || "Login failed. Please check your credentials.", 
          isLoading: false 
        });
      }
    } catch (error) {
      console.error("Login error:", error);
      set({
        error: "Login failed. Please try again later.",
        isLoading: false,
      });
    } finally {
      set({ isLoading: false });
    }
  },
  
  register: async (userData: RegisterData) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await fetch(`${API_URL}/auth/user/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      });
      
      if (response.ok) {
        // Set registration success instead of auto-login
        set({ isLoading: false, registrationSuccess: true });
      } else {
        const errorData = await response.json();
        set({ 
          error: errorData.detail || "Registration failed. Please try again.", 
          isLoading: false 
        });
      }
    } catch (error) {
      console.error("Registration error:", error);
      set({
        error: "Registration failed. Please try again later.",
        isLoading: false,
      });
    }
  },
  
  clearError: () => set({ error: null }),
  
  // New method to reset registration success state
  resetRegistrationSuccess: () => set({ registrationSuccess: false }),
}));

// Initialize auth state by fetching user data if token exists
if (typeof window !== "undefined") {
  const token = localStorage.getItem("token");
  if (token) {
    // Initialize headers for all future requests
    useAuthStore.getState().fetchUser();
  }
}

export default useAuthStore;