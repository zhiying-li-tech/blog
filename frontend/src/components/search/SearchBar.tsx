'use client';

import { useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { AutoComplete, Input } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { postsApi } from '@/lib/api';

interface Suggestion {
  value: string;
  label: string;
  slug: string;
}

export default function SearchBar() {
  const router = useRouter();
  const [options, setOptions] = useState<Suggestion[]>([]);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  const handleSearch = (value: string) => {
    const q = value.trim();
    if (q) {
      router.push(`/search?q=${encodeURIComponent(q)}`);
    }
  };

  const handleInputChange = useCallback((value: string) => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    if (!value.trim()) {
      setOptions([]);
      return;
    }

    debounceTimer.current = setTimeout(async () => {
      try {
        const res = await postsApi.searchSuggest(value.trim());
        const suggestions = res.data.data;
        setOptions(
          (Array.isArray(suggestions) ? suggestions : []).map((item: { title: string; slug: string }) => ({
            value: item.title,
            label: item.title,
            slug: item.slug,
          }))
        );
      } catch {
        setOptions([]);
      }
    }, 300);
  }, []);

  const handleSelect = (_value: string, option: Suggestion) => {
    router.push(`/posts/${option.slug}`);
  };

  return (
    <AutoComplete
      options={options}
      onSearch={handleInputChange}
      onSelect={handleSelect}
      style={{ width: '100%' }}
    >
      <Input.Search
        placeholder="搜索文章..."
        onSearch={handleSearch}
        allowClear
        enterButton={<SearchOutlined />}
      />
    </AutoComplete>
  );
}
