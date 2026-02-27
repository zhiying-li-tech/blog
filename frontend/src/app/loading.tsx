import { Skeleton } from 'antd';

export default function Loading() {
  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: '32px 24px' }}>
      <Skeleton active paragraph={{ rows: 1 }} style={{ marginBottom: 24 }} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 24 }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} style={{ border: '1px solid #f0f0f0', borderRadius: 8, padding: 20 }}>
            <Skeleton active paragraph={{ rows: 3 }} />
          </div>
        ))}
      </div>
    </div>
  );
}
