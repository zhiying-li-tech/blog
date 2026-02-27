'use client';

import { useRouter } from 'next/navigation';
import { Button, Popconfirm, message } from 'antd';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useAuthStore } from '@/stores/authStore';
import { postsApi } from '@/lib/api';
import type { Post } from '@/types/post';
import styles from '@/styles/pages/post-detail.module.scss';

interface PostActionsProps {
  post: Post;
}

export default function PostActions({ post }: PostActionsProps) {
  const router = useRouter();
  const { user } = useAuthStore();

  const canEdit = user && (user.id === post.author.id || user.role === 'admin');

  if (!canEdit) return null;

  const handleDelete = async () => {
    try {
      await postsApi.delete(post.slug);
      message.success('文章已删除');
      router.push('/');
      router.refresh();
    } catch {
      message.error('删除失败');
    }
  };

  return (
    <div className={styles.actions}>
      <Button
        type="primary"
        icon={<EditOutlined />}
        onClick={() => router.push(`/posts/${post.slug}/edit`)}
      >
        编辑
      </Button>
      <Popconfirm
        title="确定要删除这篇文章吗？"
        description="删除后无法恢复"
        onConfirm={handleDelete}
        okText="确定"
        cancelText="取消"
      >
        <Button danger icon={<DeleteOutlined />}>
          删除
        </Button>
      </Popconfirm>
    </div>
  );
}
