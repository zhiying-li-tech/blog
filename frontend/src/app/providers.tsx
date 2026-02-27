'use client';

import { Suspense } from 'react';
import { AntdRegistry } from '@ant-design/nextjs-registry';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import RouteProgress from '@/components/common/RouteProgress';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AntdRegistry>
      <ConfigProvider locale={zhCN}>
        <Suspense fallback={null}>
          <RouteProgress />
        </Suspense>
        {children}
      </ConfigProvider>
    </AntdRegistry>
  );
}
