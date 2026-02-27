import type { ApiResponse, PaginatedResponse, PostListItem } from '@/types/post';
import { API_BASE } from '@/lib/constants';
import SearchContent from './search-content';

async function searchPosts(q: string, page?: string) {
  const searchParams = new URLSearchParams();
  searchParams.set('q', q);
  if (page) searchParams.set('page', page);

  try {
    const res = await fetch(`${API_BASE}/api/posts/search?${searchParams.toString()}`, {
      cache: 'no-store',
    });
    if (!res.ok) {
      return { items: [], pagination: { page: 1, page_size: 10, total: 0, total_pages: 0 } };
    }
    const json: ApiResponse<PaginatedResponse<PostListItem>> = await res.json();
    return json.data;
  } catch {
    return { items: [], pagination: { page: 1, page_size: 10, total: 0, total_pages: 0 } };
  }
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: { q?: string; page?: string };
}) {
  const query = searchParams.q || '';
  const data = query.trim()
    ? await searchPosts(query, searchParams.page)
    : { items: [], pagination: { page: 1, page_size: 10, total: 0, total_pages: 0 } };

  return (
    <SearchContent
      query={query}
      posts={data.items}
      pagination={data.pagination}
    />
  );
}
