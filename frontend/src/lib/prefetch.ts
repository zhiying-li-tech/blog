let prefetched = false;

export function prefetchEditorChunk() {
  if (prefetched) return;
  prefetched = true;

  if (typeof window === 'undefined') return;

  const prefetch = () => {
    import('@uiw/react-md-editor').catch(() => {
      prefetched = false;
    });
  };

  if ('requestIdleCallback' in window) {
    (window as unknown as { requestIdleCallback: (cb: () => void) => void })
      .requestIdleCallback(prefetch);
  } else {
    setTimeout(prefetch, 2000);
  }
}
