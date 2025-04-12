export interface User {
    id: number;
    username: string;
    firstname: string;
    lastname: string;
    email: string;
    avatar?: string;
  }
  
  export interface Comment {
    id: number;
    content: string;
    created_at: string;
    updated_at: string;
    user_id: number;
    parent_id: number | null;
    user: {
      id: number;
      username: string;
      firstname: string;
      lastname: string;
      email: string;
      avatar?: string;
    };
    replies: Comment[];
    content_type: string;
    content_id: number;
  }
  
  export interface CommentUpdateDTO {
    content: string;
  }
  
  export interface GameCommentCreateDTO {
    content: string;
    game_id: number;
    parent_id: number | null;
  }
  
  export interface NewsCommentCreateDTO {
    content: string;
    news_id: number;
    parent_id: number | null;
  }
  
  export interface DiscussionCommentCreateDTO {
    content: string;
    discussion_id: number;
    parent_id: number | null;
  }