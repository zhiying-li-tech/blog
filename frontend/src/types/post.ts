export interface AuthorInfo {
  id: string;
  username: string;
  avatar?: string;
}

export interface CategoryInfo {
  id: string;
  name: string;
  slug: string;
}

export interface TagInfo {
  id: string;
  name: string;
  slug: string;
}

export interface Post {
  id: string;
  title: string;
  slug: string;
  content: string;
  summary?: string;
  cover_image?: string;
  author: AuthorInfo;
  category?: CategoryInfo;
  tags: TagInfo[];
  status: 'draft' | 'published';
  view_count: number;
  published_at?: string;
  created_at: string;
  updated_at: string;
}

export interface PostListItem extends Omit<Post, 'content'> {}

export interface Pagination {
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: Pagination;
}

export interface ApiResponse<T = any> {
  code: number;
  message: string;
  data: T;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  post_count: number;
  created_at: string;
  updated_at: string;
}

export interface Tag {
  id: string;
  name: string;
  slug: string;
  created_at: string;
}
