'use client';

import { useEffect, useCallback, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

const STYLE_ID = 'route-progress-style';

function injectStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    #route-progress {
      position: fixed;
      top: 0;
      left: 0;
      height: 2px;
      background: #1677ff;
      z-index: 99999;
      transition: width 300ms ease;
      pointer-events: none;
    }
    #route-progress.done {
      transition: width 150ms ease, opacity 400ms 100ms ease;
      opacity: 0;
    }
  `;
  document.head.appendChild(style);
}

function getBar() {
  let bar = document.getElementById('route-progress');
  if (!bar) {
    bar = document.createElement('div');
    bar.id = 'route-progress';
    document.body.prepend(bar);
  }
  return bar;
}

export default function RouteProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isFirstRender = useRef(true);

  const finish = useCallback(() => {
    const bar = getBar();
    bar.style.width = '100%';
    bar.classList.add('done');
    setTimeout(() => {
      bar.style.width = '0%';
      bar.classList.remove('done');
    }, 500);
  }, []);

  useEffect(() => {
    injectStyles();
  }, []);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    finish();
  }, [pathname, searchParams, finish]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const anchor = (e.target as Element).closest('a');
      if (!anchor) return;
      const href = anchor.getAttribute('href');
      if (!href || href.startsWith('http') || href.startsWith('#')) return;

      const url = new URL(href, location.origin);
      if (url.origin !== location.origin) return;
      if (url.pathname === pathname && url.search === location.search) return;

      const bar = getBar();
      bar.classList.remove('done');
      bar.style.width = '0%';
      requestAnimationFrame(() => {
        bar.style.width = '70%';
      });
    };

    document.addEventListener('click', handleClick, true);
    return () => document.removeEventListener('click', handleClick, true);
  }, [pathname]);

  return null;
}
