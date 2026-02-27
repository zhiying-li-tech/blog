import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import type { ApiResponse, Post } from '@/types/post';
import { API_BASE } from '@/lib/constants';
import PostContent from './post-content';

export const revalidate = 60;

async function getPost(slug: string): Promise<Post | null> {
  try {
    const res = await fetch(`${API_BASE}/api/posts/${slug}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    const json: ApiResponse<Post> = await res.json();
    return json.data;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const post = await getPost(params.slug);
  if (!post) return { title: '文章未找到 - 博客系统' };
  return {
    title: `${post.title} - 博客系统`,
    description: post.summary || post.title,
  };
}

export default async function PostDetailPage({ params }: { params: { slug: string } }) {
  const post = await getPost(params.slug);
  if (!post) notFound();

  return <PostContent post={post} />;
}
