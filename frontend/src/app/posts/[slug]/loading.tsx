import { Skeleton, Divider } from 'antd';

export default function PostLoading() {
  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '32px 24px' }}>
      <Skeleton active title={{ width: '70%' }} paragraph={false} style={{ marginBottom: 16 }} />
      <Skeleton avatar active paragraph={{ rows: 0 }} style={{ marginBottom: 24 }} />
      <Divider />
      <Skeleton active paragraph={{ rows: 12 }} />
    </div>
  );
}
