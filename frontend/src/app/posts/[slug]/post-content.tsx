'use client';

import { Avatar, Tag, Divider } from 'antd';
import { UserOutlined, ClockCircleOutlined, EyeOutlined, FolderOutlined } from '@ant-design/icons';
import dynamic from 'next/dynamic';
import type { Post } from '@/types/post';
import { formatDate } from '@/lib/utils';
import PostActions from './post-actions';
import styles from '@/styles/pages/post-detail.module.scss';

const MarkdownRenderer = dynamic(() => import('@/components/common/MarkdownRenderer'), {
  loading: () => <div style={{ padding: '40px 0', textAlign: 'center' }}>加载中...</div>,
});

interface PostContentProps {
  post: Post;
}

export default function PostContent({ post }: PostContentProps) {
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>{post.title}</h1>

        <div className={styles.meta}>
          <div className={styles.authorInfo}>
            <Avatar
              size={28}
              src={post.author.avatar}
              icon={!post.author.avatar ? <UserOutlined /> : undefined}
            />
            <span>{post.author.username}</span>
          </div>
          <span>
            <ClockCircleOutlined /> {formatDate(post.published_at || post.created_at, 'YYYY-MM-DD HH:mm')}
          </span>
          <span>
            <EyeOutlined /> {post.view_count} 阅读
          </span>
          {post.category && (
            <span>
              <FolderOutlined /> {post.category.name}
            </span>
          )}
        </div>

        {post.tags.length > 0 && (
          <div className={styles.tags}>
            {post.tags.map((tag) => (
              <Tag key={tag.id} color="blue">
                {tag.name}
              </Tag>
            ))}
          </div>
        )}
      </header>

      <Divider />

      <article className={styles.content}>
        <MarkdownRenderer content={post.content} />
      </article>

      <PostActions post={post} />
    </div>
  );
}
