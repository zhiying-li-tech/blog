'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Typography, Pagination, Empty } from 'antd';
import type { PostListItem, Pagination as PaginationType } from '@/types/post';
import PostCard from '@/components/post/PostCard';
import styles from '@/styles/pages/home.module.scss';

interface CategoryContentProps {
  categoryName: string;
  categorySlug: string;
  posts: PostListItem[];
  pagination: PaginationType;
  notFound?: boolean;
}

export default function CategoryContent({
  categoryName,
  categorySlug,
  posts,
  pagination,
  notFound,
}: CategoryContentProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', String(page));
    router.push(`/categories/${categorySlug}?${params.toString()}`);
  };

  if (notFound) {
    return (
      <div className={styles.container}>
        <div className={styles.empty}>
          <Empty description="分类不存在" />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <Typography.Title level={4} style={{ marginBottom: 24 }}>
        分类：{categoryName} ({pagination.total} 篇)
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
          <Empty description="该分类下暂无文章" />
        </div>
      )}
    </div>
  );
}
