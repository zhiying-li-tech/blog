import axios from 'axios';
import type { ApiResponse, PaginatedResponse, Post, PostListItem, Category, Tag } from '@/types/post';
import type { User, TokenResponse } from '@/types/user';
import { getToken, clearTokens } from './auth';

const api = axios.create({
  baseURL: '',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      clearTokens();
      if (typeof window !== 'undefined') {
        window.location.href = '/auth/login';
      }
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  register(data: { username: string; email: string; password: string }) {
    return api.post<ApiResponse<{ user: User; tokens: TokenResponse }>>('/api/auth/register', data);
  },

  login(data: { email: string; password: string }) {
    return api.post<ApiResponse<{ user: User; tokens: TokenResponse }>>('/api/auth/login', data);
  },

  refresh(refreshToken: string) {
    return api.post<ApiResponse<TokenResponse>>('/api/auth/refresh', {
      refresh_token: refreshToken,
    });
  },
};

export const postsApi = {
  getList(params?: { page?: number; page_size?: number; category?: string; tag?: string; author?: string; status?: string }) {
    return api.get<ApiResponse<PaginatedResponse<PostListItem>>>('/api/posts', { params });
  },

  getBySlug(slug: string) {
    return api.get<ApiResponse<Post>>(`/api/posts/${slug}`);
  },

  create(data: {
    title: string;
    content: string;
    summary?: string;
    cover_image?: string;
    category_id?: string;
    tag_ids?: string[];
    status?: 'draft' | 'published';
  }) {
    return api.post<ApiResponse<Post>>('/api/posts', data);
  },

  update(
    slug: string,
    data: {
      title?: string;
      content?: string;
      summary?: string;
      cover_image?: string;
      category_id?: string;
      tag_ids?: string[];
      status?: 'draft' | 'published';
    }
  ) {
    return api.put<ApiResponse<Post>>(`/api/posts/${slug}`, data);
  },

  delete(slug: string) {
    return api.delete<ApiResponse<null>>(`/api/posts/${slug}`);
  },

  search(params: { q: string; page?: number; page_size?: number }) {
    return api.get<ApiResponse<PaginatedResponse<PostListItem>>>('/api/posts/search', { params });
  },

  searchSuggest(q: string) {
    return api.get<ApiResponse<PostListItem[]>>('/api/posts/search/suggest', { params: { q } });
  },
};

export const categoriesApi = {
  getAll() {
    return api.get<ApiResponse<Category[]>>('/api/categories');
  },

  create(data: { name: string; slug: string; description?: string }) {
    return api.post<ApiResponse<Category>>('/api/categories', data);
  },

  update(id: string, data: { name?: string; slug?: string; description?: string }) {
    return api.put<ApiResponse<Category>>(`/api/categories/${id}`, data);
  },

  delete(id: string) {
    return api.delete<ApiResponse<null>>(`/api/categories/${id}`);
  },
};

export const tagsApi = {
  getAll() {
    return api.get<ApiResponse<Tag[]>>('/api/tags');
  },

  create(data: { name: string; slug: string }) {
    return api.post<ApiResponse<Tag>>('/api/tags', data);
  },

  delete(id: string) {
    return api.delete<ApiResponse<null>>(`/api/tags/${id}`);
  },
};

export const usersApi = {
  getMe() {
    return api.get<ApiResponse<User>>('/api/users/me');
  },

  updateMe(data: { username?: string; email?: string; avatar?: string; bio?: string }) {
    return api.put<ApiResponse<User>>('/api/users/me', data);
  },

  changePassword(data: { old_password: string; new_password: string }) {
    return api.put<ApiResponse<null>>('/api/users/me/password', data);
  },
};

export default api;
