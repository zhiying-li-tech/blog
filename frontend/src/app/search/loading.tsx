import { Skeleton } from 'antd';

export default function SearchLoading() {
  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: '32px 24px' }}>
      <Skeleton active title={{ width: '40%' }} paragraph={false} style={{ marginBottom: 24 }} />
      <Skeleton active paragraph={{ rows: 2 }} style={{ marginBottom: 16 }} />
      <Skeleton active paragraph={{ rows: 2 }} style={{ marginBottom: 16 }} />
      <Skeleton active paragraph={{ rows: 2 }} />
    </div>
  );
}
