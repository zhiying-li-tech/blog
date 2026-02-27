'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Typography, Pagination, Empty } from 'antd';
import type { PostListItem, Pagination as PaginationType } from '@/types/post';
import PostCard from '@/components/post/PostCard';
import styles from '@/styles/pages/home.module.scss';

interface TagContentProps {
  tagSlug: string;
  posts: PostListItem[];
  pagination: PaginationType;
}

export default function TagContent({ tagSlug, posts, pagination }: TagContentProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', String(page));
    router.push(`/tags/${tagSlug}?${params.toString()}`);
  };

  return (
    <div className={styles.container}>
      <Typography.Title level={4} style={{ marginBottom: 24 }}>
        标签：{tagSlug} ({pagination.total} 篇)
      </Typography.Title>

      {posts.length > 0 ? (
        <>
          <div className={styles.postGrid}>
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>

          {pagination.total_pages > 1 && (
            <div className={styles.pagination}>
              <Pagination
                current={pagination.page}
                total={pagination.total}
                pageSize={pagination.page_size}
                onChange={handlePageChange}
                showSizeChanger={false}
              />
            </div>
          )}
        </>
      ) : (
        <div className={styles.empty}>
          <Empty description="该标签下暂无文章" />
        </div>
      )}
    </div>
  );
}
