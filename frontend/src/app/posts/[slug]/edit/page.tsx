'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Form, Input, Select, Radio, Button, message, Skeleton } from 'antd';
import dynamic from 'next/dynamic';
import { postsApi, categoriesApi, tagsApi } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import type { Post, Category, Tag } from '@/types/post';
import styles from '@/styles/pages/post-editor.module.scss';

const MDEditor = dynamic(() => import('@uiw/react-md-editor'), {
  ssr: false,
  loading: () => (
    <div style={{ border: '1px solid #d9d9d9', borderRadius: 6, padding: 16, height: 450 }}>
      <Skeleton active paragraph={{ rows: 12 }} />
    </div>
  ),
});

export default function EditPostPage() {
  const router = useRouter();
  const params = useParams<{ slug: string }>();
  const { user } = useAuthStore();
  const [form] = Form.useForm();
  const [content, setContent] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
      return;
    }

    Promise.all([
      postsApi.getBySlug(params.slug),
      categoriesApi.getAll(),
      tagsApi.getAll(),
    ])
      .then(([postRes, catRes, tagRes]) => {
        const postData = postRes.data.data;
        setPost(postData);
        setContent(postData.content);
        setCategories(catRes.data.data);
        setTags(tagRes.data.data);

        form.setFieldsValue({
          title: postData.title,
          category_id: postData.category?.id,
          tag_ids: postData.tags.map((t) => t.id),
          summary: postData.summary,
          cover_image: postData.cover_image,
          status: postData.status,
        });
      })
      .catch(() => {
        message.error('加载文章失败');
        router.push('/');
      })
      .finally(() => setLoading(false));
  }, [user, router, params.slug, form]);

  const handleSubmit = useCallback(async (values: Record<string, unknown>) => {
    if (!content.trim()) {
      message.warning('请输入文章内容');
      return;
    }

    setSubmitting(true);
    try {
      await postsApi.update(params.slug, {
        title: values.title as string,
        content,
        summary: values.summary as string | undefined,
        cover_image: values.cover_image as string | undefined,
        category_id: values.category_id as string | undefined,
        tag_ids: values.tag_ids as string[] | undefined,
        status: values.status as 'draft' | 'published',
      });
      message.success('文章已更新');
      router.push(`/posts/${params.slug}`);
      router.refresh();
    } catch {
      message.error('更新失败，请重试');
    } finally {
      setSubmitting(false);
    }
  }, [content, router, params.slug]);

  if (!user) return null;

  if (loading) {
    return (
      <div className={styles.container}>
        <h1 className={styles.title}>编辑文章</h1>
        <div className={styles.form}>
          <Skeleton active paragraph={{ rows: 2 }} style={{ marginBottom: 24 }} />
          <Skeleton active paragraph={{ rows: 1 }} style={{ marginBottom: 24 }} />
          <Skeleton active paragraph={{ rows: 1 }} style={{ marginBottom: 24 }} />
          <div style={{ border: '1px solid #d9d9d9', borderRadius: 6, padding: 16, height: 450 }}>
            <Skeleton active paragraph={{ rows: 12 }} />
          </div>
        </div>
      </div>
    );
  }

  if (!post) return null;

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>编辑文章</h1>
      <div className={styles.form}>
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="title"
            label="标题"
            rules={[{ required: true, message: '请输入文章标题' }]}
          >
            <Input placeholder="请输入文章标题" maxLength={200} />
          </Form.Item>

          <Form.Item name="category_id" label="分类">
            <Select placeholder="选择分类" allowClear>
              {categories.map((cat) => (
                <Select.Option key={cat.id} value={cat.id}>
                  {cat.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="tag_ids" label="标签">
            <Select mode="multiple" placeholder="选择标签" allowClear>
              {tags.map((tag) => (
                <Select.Option key={tag.id} value={tag.id}>
                  {tag.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="summary" label="摘要">
            <Input.TextArea
              placeholder="文章摘要（可选）"
              rows={3}
              maxLength={500}
              showCount
            />
          </Form.Item>

          <Form.Item name="cover_image" label="封面图链接">
            <Input placeholder="https://example.com/image.jpg" />
          </Form.Item>

          <div className={styles.editorWrap}>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
              内容 <span style={{ color: '#ff4d4f' }}>*</span>
            </label>
            <MDEditor value={content} onChange={(val) => setContent(val || '')} height={450} />
          </div>

          <Form.Item name="status" label="发布状态">
            <Radio.Group>
              <Radio value="published">发布</Radio>
              <Radio value="draft">草稿</Radio>
            </Radio.Group>
          </Form.Item>

          <div className={styles.footer}>
            <Button onClick={() => router.back()}>取消</Button>
            <Button type="primary" htmlType="submit" loading={submitting}>
              保存
            </Button>
          </div>
        </Form>
      </div>
    </div>
  );
}
