import { User } from "./comment";

export interface Discussion {
  id: number;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
  user_id: number;
  user: User;
  comment_count: number;
}

export interface DiscussionCreateDTO {
  title: string;
  content: string;
}

export interface DiscussionUpdateDTO {
  title?: string;
  content?: string;
}

export interface DiscussionCommentCreateDTO {
  content: string;
  discussion_id: number;
  parent_id: number | null;
}