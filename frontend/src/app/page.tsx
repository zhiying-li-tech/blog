import type { ApiResponse, PaginatedResponse, PostListItem, Category } from '@/types/post';
import HomeContent from './home-content';
import { API_BASE } from '@/lib/constants';

export const revalidate = 30;

const EMPTY_PAGINATION = { page: 1, page_size: 10, total: 0, total_pages: 0 };

async function getPosts(params: { page?: string; category?: string; tag?: string }) {
  try {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.set('page', params.page);
    if (params.category) searchParams.set('category', params.category);
    if (params.tag) searchParams.set('tag', params.tag);

    const res = await fetch(`${API_BASE}/api/posts?${searchParams.toString()}`, {
      next: { revalidate: 30 },
    });

    if (!res.ok) return { items: [], pagination: EMPTY_PAGINATION };

    const json: ApiResponse<PaginatedResponse<PostListItem>> = await res.json();
    return json.data;
  } catch {
    return { items: [], pagination: EMPTY_PAGINATION };
  }
}

async function getCategories() {
  try {
    const res = await fetch(`${API_BASE}/api/categories`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return [];
    const json: ApiResponse<Category[]> = await res.json();
    return json.data;
  } catch {
    return [];
  }
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: { page?: string; category?: string; tag?: string };
}) {
  const [postsData, categories] = await Promise.all([
    getPosts(searchParams),
    getCategories(),
  ]);

  return (
    <HomeContent
      posts={postsData.items}
      pagination={postsData.pagination}
      categories={categories}
      currentCategory={searchParams.category}
    />
  );
}
