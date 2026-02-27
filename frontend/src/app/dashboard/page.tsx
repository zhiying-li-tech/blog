'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Table, Button, Tag, Popconfirm, message, Space } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { postsApi } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { formatDate } from '@/lib/utils';
import type { PostListItem, Pagination } from '@/types/post';
import styles from '@/styles/pages/dashboard.module.scss';

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [posts, setPosts] = useState<PostListItem[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    page_size: 10,
    total: 0,
    total_pages: 0,
  });
  const [loading, setLoading] = useState(true);

  const fetchPosts = useCallback(async (page = 1) => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await postsApi.getList({ page, page_size: 10, author: user.id, status: '' });
      setPosts(res.data.data.items);
      setPagination(res.data.data.pagination);
    } catch {
      message.error('加载文章失败');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
      return;
    }
    fetchPosts();
  }, [user, router, fetchPosts]);

  const handleDelete = async (slug: string) => {
    try {
      await postsApi.delete(slug);
      message.success('文章已删除');
      fetchPosts(pagination.page);
    } catch {
      message.error('删除失败');
    }
  };

  const columns: ColumnsType<PostListItem> = [
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      render: (title: string, record) => (
        <Link href={`/posts/${record.slug}`} className={styles.postTitle}>
          {title}
        </Link>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => (
        <Tag color={status === 'published' ? 'green' : 'orange'}>
          {status === 'published' ? '已发布' : '草稿'}
        </Tag>
      ),
    },
    {
      title: '分类',
      dataIndex: ['category', 'name'],
      key: 'category',
      width: 120,
      render: (name: string) => name || '-',
    },
    {
      title: '阅读量',
      dataIndex: 'view_count',
      key: 'view_count',
      width: 80,
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 120,
      render: (date: string) => formatDate(date),
    },
    {
      title: '操作',
      key: 'actions',
      width: 150,
      render: (_, record) => (
        <Space>
          <Link href={`/posts/${record.slug}/edit`}>
            <Button type="link" size="small" icon={<EditOutlined />}>
              编辑
            </Button>
          </Link>
          <Popconfirm
            title="确定要删除这篇文章吗？"
            onConfirm={() => handleDelete(record.slug)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>我的文章</h1>
        <Link href="/posts/new">
          <Button type="primary" icon={<PlusOutlined />}>
            写文章
          </Button>
        </Link>
      </div>

      <div className={styles.tableWrap}>
        <Table
          columns={columns}
          dataSource={posts}
          rowKey="id"
          loading={loading}
          pagination={{
            current: pagination.page,
            total: pagination.total,
            pageSize: pagination.page_size,
            showSizeChanger: false,
            onChange: (page) => fetchPosts(page),
          }}
        />
      </div>
    </div>
  );
}
