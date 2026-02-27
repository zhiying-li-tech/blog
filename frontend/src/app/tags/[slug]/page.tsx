import type { ApiResponse, PaginatedResponse, PostListItem } from '@/types/post';
import { API_BASE } from '@/lib/constants';
import TagContent from './tag-content';

export const revalidate = 30;

async function getTagPosts(slug: string, page?: string) {
  const searchParams = new URLSearchParams();
  searchParams.set('tag', slug);
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

export async function generateMetadata({ params }: { params: { slug: string } }) {
  return {
    title: `标签：${params.slug} - 博客系统`,
  };
}

export default async function TagPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { page?: string };
}) {
  const data = await getTagPosts(params.slug, searchParams.page);

  return (
    <TagContent
      tagSlug={params.slug}
      posts={data.items}
      pagination={data.pagination}
    />
  );
}
