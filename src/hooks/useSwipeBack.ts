import { CSSProperties, TouchEvent as ReactTouchEvent, useRef, useState } from 'react';

function hasHorizontalScrollableAncestor(
  target: EventTarget | null,
  boundary: HTMLElement | null
): boolean {
  let el = target instanceof HTMLElement ? target : null;
  while (el && el !== boundary) {
    if (el.scrollWidth > el.clientWidth + 4) {
      const style = window.getComputedStyle(el);
      if (style.overflowX === 'auto' || style.overflowX === 'scroll') {
        return true;
      }
    }
    el = el.parentElement;
  }
  return false;
}

function hasScrolledVerticalAncestor(
  target: EventTarget | null,
  boundary: HTMLElement | null
): boolean {
  let el = target instanceof HTMLElement ? target : null;
  while (el && el !== boundary) {
    if (el.scrollTop > 2) {
      return true;
    }
    el = el.parentElement;
  }
  if (boundary && boundary.scrollTop > 2) return true;
  return false;
}

/**
 * Native phone drag-to-go-back hook for modals & sheets.
 * Supports swiping sideways or pulling down from the top to smoothly dismiss.
 */
export function useSwipeBack(enabled: boolean, onBack: () => void) {
  const [offset, setOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);

  const stateRef = useRef<{
    active: boolean;
    startX: number;
    startY: number;
    lastX: number;
    lastY: number;
    startTime: number;
    axis: 'x' | 'y' | 'scroll' | null;
    canScrollUp: boolean;
  }>({
    active: false,
    startX: 0,
    startY: 0,
    lastX: 0,
    lastY: 0,
    startTime: 0,
    axis: null,
    canScrollUp: false,
  });

  function onTouchStart(e: ReactTouchEvent<HTMLDivElement>) {
    if (!enabled || e.touches.length !== 1) {
      stateRef.current.active = false;
      return;
    }
    const target = e.target as HTMLElement | null;
    if (
      target?.closest('input, textarea, select, [contenteditable="true"], [data-no-swipe]') ||
      hasHorizontalScrollableAncestor(target, e.currentTarget)
    ) {
      stateRef.current.active = false;
      return;
    }

    const touch = e.touches[0];
    stateRef.current = {
      active: true,
      startX: touch.clientX,
      startY: touch.clientY,
      lastX: touch.clientX,
      lastY: touch.clientY,
      startTime: Date.now(),
      axis: null,
      canScrollUp: hasScrolledVerticalAncestor(target, e.currentTarget),
    };
  }

  function onTouchMove(e: ReactTouchEvent<HTMLDivElement>) {
    const g = stateRef.current;
    if (!enabled || !g.active || e.touches.length !== 1) return;

    const touch = e.touches[0];
    const dx = touch.clientX - g.startX;
    const dy = touch.clientY - g.startY;

    if (g.axis === null) {
      if (Math.hypot(dx, dy) < 10) return;
      if (Math.abs(dx) > Math.abs(dy) * 1.25) {
        g.axis = 'x';
        setDragging(true);
      } else if (dy > 0 && !g.canScrollUp && Math.abs(dy) > Math.abs(dx) * 1.25) {
        g.axis = 'y';
        setDragging(true);
      } else {
        g.axis = 'scroll';
        g.active = false;
        return;
      }
    }

    g.lastX = touch.clientX;
    g.lastY = touch.clientY;

    if (g.axis === 'x') {
      setOffset({ x: dx, y: 0 });
    } else if (g.axis === 'y') {
      setOffset({ x: 0, y: Math.max(0, dy) });
    }
  }

  function onTouchEnd() {
    const g = stateRef.current;
    if (!g.active) return;
    const axis = g.axis;
    const dx = g.lastX - g.startX;
    const dy = g.lastY - g.startY;
    const elapsed = Math.max(1, Date.now() - g.startTime);

    g.active = false;
    g.axis = null;

    let shouldDismiss = false;
    if (axis === 'x') {
      const vx = Math.abs(dx) / elapsed;
      shouldDismiss = Math.abs(dx) >= 76 || (vx >= 0.38 && Math.abs(dx) >= 32);
    } else if (axis === 'y') {
      const vy = Math.max(0, dy) / elapsed;
      shouldDismiss = dy >= 88 || (vy >= 0.42 && dy >= 36);
    }

    setDragging(false);
    setOffset({ x: 0, y: 0 });

    if (shouldDismiss) {
      onBack();
    }
  }

  const dist = Math.hypot(offset.x, offset.y);
  const cardStyle: CSSProperties =
    dragging || dist > 0
      ? {
          transform: `translate3d(${offset.x}px, ${offset.y}px, 0)`,
          opacity: Math.max(0.55, 1 - dist / 420),
          willChange: 'transform, opacity',
          transition: dragging
            ? 'none'
            : 'transform var(--moamen-swipe-ms, 200ms) var(--moamen-ease, cubic-bezier(0.22, 1, 0.36, 1)), opacity var(--moamen-motion-ms, 180ms) ease',
        }
      : {
          transition:
            'transform var(--moamen-swipe-ms, 200ms) var(--moamen-ease, cubic-bezier(0.22, 1, 0.36, 1)), opacity var(--moamen-motion-ms, 180ms) ease',
        };

  return {
    swipeHandlers: {
      onTouchStart,
      onTouchMove,
      onTouchEnd,
      onTouchCancel: onTouchEnd,
    },
    cardStyle,
  };
}
