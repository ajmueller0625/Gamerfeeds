import { create } from "zustand";
const API_URL = import.meta.env.VITE_API_URL;

export interface UserData{
    id: number;
    username: string;
    firstname: string;
    lastname: string;
    email: string;
    is_super: boolean;
}

// Define the auth store state interface
interface AuthState {
  token: string | null;
  userData: UserData | null;
  setToken: (token: string) => void;
  logout: () => void;
  setUserData: (userData: UserData) => void;
  fetchUser: () => Promise<void>;
}

const loadInitialState = (): Pick<AuthState, 'token' | 'userData'> => {
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
  return { token, userData };
};

const useAuthStore = create<AuthState>((set, get) => ({
    ...loadInitialState(),
    setToken: (token: string) => {
      localStorage.setItem("token", token); // Save the token to localStorage
      set(() => ({ token }));
    },
    logout: () => {
      localStorage.removeItem("token");
      localStorage.removeItem("userData");
  
      set(() => ({
        token: null,
        userData: null,
      }));
    },
    setUserData: (userData: UserData) => {
      localStorage.setItem("userData", JSON.stringify(userData)); // Save the user data to localStorage
      set(() => ({ userData }));
    },
    fetchUser: async () => {
      const { token, logout, setUserData } = get(); // Accessing current state and actions
      
      if (!token) {
        return;
      }
      
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
        // Handle error as needed
      }
    },
  }));
  
  export default useAuthStore;