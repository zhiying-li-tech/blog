export interface User {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  bio?: string;
  role: 'visitor' | 'author' | 'admin';
  created_at: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}
