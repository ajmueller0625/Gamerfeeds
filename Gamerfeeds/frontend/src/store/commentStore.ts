import { create } from "zustand";
import { Comment, GameCommentCreateDTO, NewsCommentCreateDTO, DiscussionCommentCreateDTO, CommentUpdateDTO } from "../types/comment";
import useAuthStore from "../store/authStore";

const API_URL = import.meta.env.VITE_API_URL;

interface CommentState {
  comments: Comment[];
  isLoading: boolean;
  error: string | null;
  
  fetchGameComments: (gameId: number) => Promise<void>;
  fetchNewsComments: (newsId: number) => Promise<void>;
  fetchDiscussionComments: (discussionId: number) => Promise<void>;
  addGameComment: (comment: GameCommentCreateDTO) => Promise<void>;
  addNewsComment: (comment: NewsCommentCreateDTO) => Promise<void>;
  addDiscussionComment: (comment: DiscussionCommentCreateDTO) => Promise<void>;
  updateComment: (commentId: number, update: CommentUpdateDTO) => Promise<void>;
  deleteComment: (commentId: number) => Promise<void>;
}

// Helper function to update a comment or its replies recursively
const updateCommentRecursive = (
  comments: Comment[],
  commentId: number,
  updatedComment: Comment | null // null means delete
): Comment[] => {
  return comments.reduce<Comment[]>((acc, comment) => {
    // If this is the comment to update/delete
    if (comment.id === commentId) {
      // If updatedComment is null, skip this comment (delete)
      if (updatedComment === null) {
        return acc;
      }
      // Otherwise, use the updated version
      return [...acc, updatedComment];
    }
    
    // If this comment has replies, process them recursively
    if (comment.replies && comment.replies.length > 0) {
      return [
        ...acc,
        {
          ...comment,
          replies: updateCommentRecursive(comment.replies, commentId, updatedComment),
        },
      ];
    }
    
    // Otherwise, keep the comment as is
    return [...acc, comment];
  }, []);
};

// Helper function to find a comment by ID and apply a transformation
const updateCommentReplies = (
  comments: Comment[],
  commentId: number,
  transform: (comment: Comment) => Comment
): Comment[] => {
  return comments.map((comment) => {
    // If this is the comment to transform
    if (comment.id === commentId) {
      return transform(comment);
    }
    
    // If this comment has replies, process them recursively
    if (comment.replies && comment.replies.length > 0) {
      return {
        ...comment,
        replies: updateCommentReplies(comment.replies, commentId, transform),
      };
    }
    
    // Otherwise, keep the comment as is
    return comment;
  });
};

// Helper function to check if the response is ok and handle various error cases
const handleResponse = async (response: Response) => {
  // Log the URL and status to help with debugging
  console.log(`API call to ${response.url} returned status: ${response.status}`);
  
  if (!response.ok) {
    // Try to get error details from response
    let errorMessage = 'An error occurred';
    try {
      const errorData = await response.json();
      errorMessage = errorData.detail || `Error: ${response.status}`;
      console.error("API error details:", errorData);
    } catch (e) {
      errorMessage = `Error: ${response.status} ${response.statusText}`;
      console.error("Failed to parse error response:", e);
    }
    throw new Error(errorMessage);
  }
  
  // For 204 No Content responses, return an empty object
  if (response.status === 204) {
    return {};
  }
  
  // Parse JSON for other successful responses
  try {
    return await response.json();
  } catch (error) {
    console.error("Failed to parse JSON response:", error);
    throw new Error("Invalid response format from server");
  }
};

// Helper to get the current auth token consistently
const getAuthToken = () => {
  // First try to get it from the store
  const storeToken = useAuthStore.getState().token;
  
  // If not in store, fallback to localStorage
  if (!storeToken) {
    return localStorage.getItem('token');
  }
  
  return storeToken;
};

const useCommentStore = create<CommentState>((set, get) => ({
  comments: [],
  isLoading: false,
  error: null,
  
  fetchGameComments: async (gameId) => {
    set({ isLoading: true, error: null });
    try {
      // Get token using the helper function
      const token = getAuthToken();
      
      const response = await fetch(`${API_URL}/comments/game/${gameId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });
      
      const data = await handleResponse(response);
      set({ comments: data, isLoading: false });
    } catch (error) {
      console.error("Error fetching game comments:", error);
      set({
        error: error instanceof Error ? error.message : "Failed to load comments. Please try again later.",
        isLoading: false,
        comments: [], // Set empty comments to avoid showing old data
      });
    }
  },
  
  fetchNewsComments: async (newsId) => {
    set({ isLoading: true, error: null });
    try {
      // Get token using the helper function
      const token = getAuthToken();
      
      // Log request information for debugging
      console.log(`Fetching news comments for newsId: ${newsId}`);
      console.log(`API URL: ${API_URL}/comments/news/${newsId}`);
      console.log(`Auth token present: ${!!token}`);
      
      const response = await fetch(`${API_URL}/comments/news/${newsId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });
      
      const data = await handleResponse(response);
      set({ comments: data, isLoading: false });
    } catch (error) {
      console.error("Error fetching news comments:", error);
      set({
        error: error instanceof Error ? error.message : "Failed to load comments. Please try again later.",
        isLoading: false,
        comments: [], // Set empty comments to avoid showing old data
      });
    }
  },
  
  fetchDiscussionComments: async (discussionId) => {
    set({ isLoading: true, error: null });
    try {
      // Get token using the helper function
      const token = getAuthToken();
      
      const response = await fetch(`${API_URL}/discussions/${discussionId}/comments`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });
      
      const data = await handleResponse(response);
      set({ comments: data, isLoading: false });
    } catch (error) {
      console.error("Error fetching discussion comments:", error);
      set({
        error: error instanceof Error ? error.message : "Failed to load comments. Please try again later.",
        isLoading: false,
        comments: [], // Set empty comments to avoid showing old data
      });
    }
  },
  
  addGameComment: async (comment) => {
    set({ isLoading: true, error: null });
    try {
      // Get token using the helper function
      const token = getAuthToken();
      
      if (!token) {
        throw new Error('You must be logged in to add a comment');
      }
      
      const response = await fetch(`${API_URL}/comments/game`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(comment)
      });
      
      const newComment = await handleResponse(response);
      
      const { comments } = get();
      
      // If it's a top-level comment, add to the list
      if (!comment.parent_id) {
        set({
          comments: [newComment, ...comments],
          isLoading: false,
        });
      } else {
        // If it's a reply, find the parent and add to its replies
        const updatedComments = updateCommentReplies(
          comments,
          comment.parent_id,
          (parent) => ({
            ...parent,
            replies: [newComment, ...parent.replies],
          })
        );
        
        set({ comments: updatedComments, isLoading: false });
      }
    } catch (error) {
      console.error("Error adding game comment:", error);
      set({
        error: error instanceof Error ? error.message : "Failed to add comment. Please try again later.",
        isLoading: false,
      });
    }
  },
  
  addNewsComment: async (comment) => {
    set({ isLoading: true, error: null });
    try {
      // Get token using the helper function
      const token = getAuthToken();
      
      if (!token) {
        throw new Error('You must be logged in to add a comment');
      }
      
      const response = await fetch(`${API_URL}/comments/news`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(comment)
      });
      
      const newComment = await handleResponse(response);
      
      const { comments } = get();
      
      // If it's a top-level comment, add to the list
      if (!comment.parent_id) {
        set({
          comments: [newComment, ...comments],
          isLoading: false,
        });
      } else {
        // If it's a reply, find the parent and add to its replies
        const updatedComments = updateCommentReplies(
          comments,
          comment.parent_id,
          (parent) => ({
            ...parent,
            replies: [newComment, ...parent.replies],
          })
        );
        
        set({ comments: updatedComments, isLoading: false });
      }
    } catch (error) {
      console.error("Error adding news comment:", error);
      set({
        error: error instanceof Error ? error.message : "Failed to add comment. Please try again later.",
        isLoading: false,
      });
    }
  },
  
  addDiscussionComment: async (comment) => {
    set({ isLoading: true, error: null });
    try {
      // Get token using the helper function
      const token = getAuthToken();
      
      if (!token) {
        throw new Error('You must be logged in to add a comment');
      }
      
      const response = await fetch(`${API_URL}/discussions/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(comment)
      });
      
      const newComment = await handleResponse(response);
      
      const { comments } = get();
      
      // If it's a top-level comment, add to the list
      if (!comment.parent_id) {
        set({
          comments: [newComment, ...comments],
          isLoading: false,
        });
      } else {
        // If it's a reply, find the parent and add to its replies
        const updatedComments = updateCommentReplies(
          comments,
          comment.parent_id,
          (parent) => ({
            ...parent,
            replies: [newComment, ...parent.replies],
          })
        );
        
        set({ comments: updatedComments, isLoading: false });
      }
    } catch (error) {
      console.error("Error adding discussion comment:", error);
      set({
        error: error instanceof Error ? error.message : "Failed to add comment. Please try again later.",
        isLoading: false,
      });
    }
  },
  
  updateComment: async (commentId, update) => {
    set({ isLoading: true, error: null });
    try {
      // Get token using the helper function
      const token = getAuthToken();
      
      if (!token) {
        throw new Error('You must be logged in to update a comment');
      }
      
      const response = await fetch(`${API_URL}/comments/${commentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(update)
      });
      
      const updatedComment = await handleResponse(response);
      
      const { comments } = get();
      const updatedComments = updateCommentRecursive(
        comments,
        commentId,
        updatedComment
      );
      
      set({ comments: updatedComments, isLoading: false });
    } catch (error) {
      console.error("Error updating comment:", error);
      set({
        error: error instanceof Error ? error.message : "Failed to update comment. Please try again later.",
        isLoading: false,
      });
    }
  },
  
  deleteComment: async (commentId) => {
    set({ isLoading: true, error: null });
    try {
      // Get token using the helper function
      const token = getAuthToken();
      
      if (!token) {
        throw new Error('You must be logged in to delete a comment');
      }
      
      const response = await fetch(`${API_URL}/comments/${commentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      // For DELETE requests with 204 response, there's no JSON to parse
      if (response.status !== 204 && !response.ok) {
        await handleResponse(response);
      }
      
      const { comments } = get();
      const updatedComments = updateCommentRecursive(
        comments,
        commentId,
        null // null means delete
      );
      
      set({ comments: updatedComments, isLoading: false });
    } catch (error) {
      console.error("Error deleting comment:", error);
      set({
        error: error instanceof Error ? error.message : "Failed to delete comment. Please try again later.",
        isLoading: false,
      });
    }
  },
}));

export default useCommentStore;