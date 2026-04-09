'use client';

import { useEffect, useRef } from 'react';

interface ScrollAnchorProps {
  trackVisibility?: boolean;
}

export function ScrollAnchor({ trackVisibility }: ScrollAnchorProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isVisibleRef = useRef(true);

  useEffect(() => {
    if (!trackVisibility || !ref.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        isVisibleRef.current = entry.isIntersecting;
      },
      { threshold: 0 }
    );

    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [trackVisibility]);

  return <div ref={ref} className="h-px w-full" />;
}

export function useAutoScroll(dependency: unknown) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const shouldAutoScroll = useRef(true);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = el;
      shouldAutoScroll.current = scrollHeight - scrollTop - clientHeight < 100;
    };

    el.addEventListener('scroll', handleScroll);
    return () => el.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (shouldAutoScroll.current && scrollRef.current) {
      requestAnimationFrame(() => {
        scrollRef.current?.scrollTo({
          top: scrollRef.current.scrollHeight,
          behavior: 'smooth',
        });
      });
    }
  }, [dependency]);

  return scrollRef;
}
