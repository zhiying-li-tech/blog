import type { ApiResponse, PaginatedResponse, PostListItem, Category } from '@/types/post';
import { API_BASE } from '@/lib/constants';
import CategoryContent from './category-content';

export const revalidate = 30;

async function getCategoryPosts(slug: string, page?: string) {
  const searchParams = new URLSearchParams();
  searchParams.set('category', slug);
  if (page) searchParams.set('page', page);

  try {
    const res = await fetch(`${API_BASE}/api/posts?${searchParams.toString()}`, {
      next: { revalidate: 30 },
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

async function getCategories(): Promise<Category[]> {
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

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const categories = await getCategories();
  const category = categories.find((c) => c.slug === params.slug);
  return {
    title: `${category?.name || '分类'} - 博客系统`,
  };
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { page?: string };
}) {
  const [data, categories] = await Promise.all([
    getCategoryPosts(params.slug, searchParams.page),
    getCategories(),
  ]);

  const category = categories.find((c) => c.slug === params.slug);

  return (
    <CategoryContent
      categoryName={category?.name || '未知分类'}
      categorySlug={params.slug}
      posts={data.items}
      pagination={data.pagination}
      notFound={!category}
    />
  );
}
