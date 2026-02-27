'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Input, Button, Dropdown, Avatar, Space } from 'antd';
import {
  UserOutlined,
  EditOutlined,
  FileTextOutlined,
  LogoutOutlined,
  LoginOutlined,
  UserAddOutlined,
} from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { useAuthStore } from '@/stores/authStore';
import { prefetchEditorChunk } from '@/lib/prefetch';
import styles from '@/styles/layout/header.module.scss';

export default function Header() {
  const router = useRouter();
  const { user, fetchUser, logout } = useAuthStore();

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  useEffect(() => {
    if (user) prefetchEditorChunk();
  }, [user]);

  const handleSearch = (value: string) => {
    const q = value.trim();
    if (q) {
      router.push(`/search?q=${encodeURIComponent(q)}`);
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/');
    router.refresh();
  };

  const dropdownItems: MenuProps['items'] = [
    {
      key: 'write',
      icon: <EditOutlined />,
      label: <Link href="/posts/new" prefetch>写文章</Link>,
    },
    {
      key: 'my-posts',
      icon: <FileTextOutlined />,
      label: <Link href="/dashboard" prefetch>我的文章</Link>,
    },
    { type: 'divider' },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: handleLogout,
    },
  ];

  return (
    <header className={styles.header}>
      <Link href="/" className={styles.logo}>
        博客
      </Link>

      <div className={styles.search}>
        <Input.Search
          placeholder="搜索文章..."
          onSearch={handleSearch}
          allowClear
        />
      </div>

      <div className={styles.actions}>
        {user ? (
          <Dropdown menu={{ items: dropdownItems }} placement="bottomRight">
            <Space className={styles.userDropdown}>
              <Avatar
                size="small"
                src={user.avatar}
                icon={!user.avatar ? <UserOutlined /> : undefined}
              />
              <span>{user.username}</span>
            </Space>
          </Dropdown>
        ) : (
          <>
            <Link href="/auth/login">
              <Button type="text" icon={<LoginOutlined />}>
                登录
              </Button>
            </Link>
            <Link href="/auth/register">
              <Button type="primary" icon={<UserAddOutlined />}>
                注册
              </Button>
            </Link>
          </>
        )}
      </div>
    </header>
  );
}
