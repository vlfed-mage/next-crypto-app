import { useCallback, useEffect, useRef, useState } from 'react';

interface Size {
  width: number;
  height: number;
}

export function useContainerSize(): [
  ref: (node: HTMLDivElement | null) => void,
  size: Size,
] {
  const [size, setSize] = useState<Size>({ width: 0, height: 0 });
  const observerRef = useRef<ResizeObserver | null>(null);
  const nodeRef = useRef<HTMLDivElement | null>(null);

  const ref = useCallback((node: HTMLDivElement | null) => {
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }

    nodeRef.current = node;

    if (node) {
      const observer = new ResizeObserver((entries) => {
        const entry = entries[0];
        if (entry) {
          const { width, height } = entry.contentRect;
          setSize({ width, height });
        }
      });
      observer.observe(node);
      observerRef.current = observer;
    }
  }, []);

  useEffect(() => {
    return () => {
      observerRef.current?.disconnect();
    };
  }, []);

  return [ref, size];
}
