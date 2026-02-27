'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Tabs, Pagination, Empty } from 'antd';
import type { PostListItem, Category, Pagination as PaginationType } from '@/types/post';
import PostCard from '@/components/post/PostCard';
import styles from '@/styles/pages/home.module.scss';

interface HomeContentProps {
  posts: PostListItem[];
  pagination: PaginationType;
  categories: Category[];
  currentCategory?: string;
}

export default function HomeContent({
  posts,
  pagination,
  categories,
  currentCategory,
}: HomeContentProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleCategoryChange = (key: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('page');
    if (key === 'all') {
      params.delete('category');
    } else {
      params.set('category', key);
    }
    router.push(`/?${params.toString()}`);
  };

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', String(page));
    router.push(`/?${params.toString()}`);
  };

  const tabItems = [
    { key: 'all', label: '全部' },
    ...categories.map((cat) => ({
      key: cat.slug,
      label: `${cat.name} (${cat.post_count})`,
    })),
  ];

  return (
    <div className={styles.container}>
      <div className={styles.categoryBar}>
        <Tabs
          activeKey={currentCategory || 'all'}
          items={tabItems}
          onChange={handleCategoryChange}
          size="small"
        />
      </div>

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
          <Empty description="暂无文章" />
        </div>
      )}
    </div>
  );
}
