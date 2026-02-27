'use client';

import Link from 'next/link';
import { Card, Avatar, Tag } from 'antd';
import { EyeOutlined, UserOutlined, ClockCircleOutlined } from '@ant-design/icons';
import type { PostListItem } from '@/types/post';
import { formatDate } from '@/lib/utils';
import styles from '@/styles/components/post-card.module.scss';

interface PostCardProps {
  post: PostListItem;
}

export default function PostCard({ post }: PostCardProps) {
  return (
    <Link href={`/posts/${post.slug}`} className={styles.cardLink}>
      <Card
        className={styles.card}
        hoverable
        cover={
          post.cover_image ? (
            <img
              alt={post.title}
              src={post.cover_image}
              className={styles.cover}
            />
          ) : null
        }
      >
        <h3 className={styles.title}>{post.title}</h3>

        {post.tags.length > 0 && (
          <div className={styles.tags}>
            {post.tags.map((tag) => (
              <Tag key={tag.id} color="blue">
                {tag.name}
              </Tag>
            ))}
          </div>
        )}

        {post.summary && (
          <p className={styles.summary}>{post.summary}</p>
        )}

        <div className={styles.meta}>
          <div className={styles.author}>
            <Avatar
              size={20}
              src={post.author.avatar}
              icon={!post.author.avatar ? <UserOutlined /> : undefined}
            />
            <span>{post.author.username}</span>
          </div>
          <div className={styles.stats}>
            <span>
              <ClockCircleOutlined /> {formatDate(post.published_at || post.created_at)}
            </span>
            <span>
              <EyeOutlined /> {post.view_count}
            </span>
          </div>
        </div>
      </Card>
    </Link>
  );
}
