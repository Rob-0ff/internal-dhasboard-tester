'use client';

import { useRef, useCallback } from 'react';

export function useSingleAndDoubleClick(
  actionSingleClick: () => void,
  actionDoubleClick: () => void,
  delay = 500
) {
  const clickTimeout = useRef<NodeJS.Timeout | null>(null);

  const handleClick = useCallback(() => {
    if (clickTimeout.current) {
      clearTimeout(clickTimeout.current);
      clickTimeout.current = null;
      actionDoubleClick();
      console.log("Double click action triggered");
    } else {
      clickTimeout.current = setTimeout(() => {
        actionSingleClick();
        console.log("Single click action triggered");
        clickTimeout.current = null;
      }, delay);
    }
  }, [actionSingleClick, actionDoubleClick, delay]);

  return handleClick;
}