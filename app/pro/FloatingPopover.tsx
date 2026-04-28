"use client";

import { type ReactNode, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

type FloatingPlacement = "bottom-start" | "bottom-end" | "top-start" | "top-end";

type FloatingPopoverProps = {
  open: boolean;
  anchorEl: HTMLElement | null;
  children: ReactNode;
  className?: string;
  placement?: FloatingPlacement;
  offset?: number;
  viewportPadding?: number;
  matchAnchorWidth?: boolean;
};

type FloatingPosition = {
  top: number;
  left: number;
  maxHeight: number;
  minWidth?: number;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export default function FloatingPopover({
  open,
  anchorEl,
  children,
  className,
  placement = "bottom-start",
  offset = 10,
  viewportPadding = 8,
  matchAnchorWidth = false
}: FloatingPopoverProps) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const [mounted, setMounted] = useState(false);
  const [position, setPosition] = useState<FloatingPosition | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useLayoutEffect(() => {
    if (!mounted || !open || !anchorEl || !panelRef.current) {
      return;
    }

    let frame = 0;

    const updatePosition = () => {
      if (!anchorEl.isConnected || !panelRef.current) {
        return;
      }

      const anchorRect = anchorEl.getBoundingClientRect();
      const panelRect = panelRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const preferredVertical = placement.startsWith("top") ? "top" : "bottom";
      const preferredHorizontal = placement.endsWith("end") ? "end" : "start";
      const availableAbove = anchorRect.top - viewportPadding;
      const availableBelow = viewportHeight - anchorRect.bottom - viewportPadding;
      const shouldOpenAbove =
        preferredVertical === "top"
          ? availableAbove >= panelRect.height + offset || availableAbove >= availableBelow
          : availableBelow < panelRect.height + offset && availableAbove > availableBelow;
      const actualVertical = shouldOpenAbove ? "top" : "bottom";
      const unclampedLeft =
        preferredHorizontal === "end" ? anchorRect.right - panelRect.width : anchorRect.left;
      const left = clamp(
        unclampedLeft,
        viewportPadding,
        Math.max(viewportPadding, viewportWidth - panelRect.width - viewportPadding)
      );
      const unclampedTop =
        actualVertical === "top"
          ? anchorRect.top - panelRect.height - offset
          : anchorRect.bottom + offset;
      const top = clamp(
        unclampedTop,
        viewportPadding,
        Math.max(viewportPadding, viewportHeight - panelRect.height - viewportPadding)
      );
      const maxHeight =
        actualVertical === "top"
          ? Math.max(160, anchorRect.top - offset - viewportPadding)
          : Math.max(160, viewportHeight - anchorRect.bottom - offset - viewportPadding);

      setPosition({
        top,
        left,
        maxHeight,
        minWidth: matchAnchorWidth ? Math.round(anchorRect.width) : undefined
      });
    };

    const requestUpdate = () => {
      cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(updatePosition);
    };

    requestUpdate();
    window.addEventListener("resize", requestUpdate);
    window.addEventListener("scroll", requestUpdate, true);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", requestUpdate);
      window.removeEventListener("scroll", requestUpdate, true);
    };
  }, [anchorEl, children, matchAnchorWidth, mounted, offset, open, placement, viewportPadding]);

  if (!mounted || !open || !anchorEl) {
    return null;
  }

  return createPortal(
    <div
      ref={panelRef}
      className={className}
      data-staff-floating-root
      style={{
        position: "fixed",
        top: position?.top ?? -9999,
        left: position?.left ?? -9999,
        maxHeight: position?.maxHeight,
        minWidth: position?.minWidth,
        zIndex: 2000,
        visibility: position ? "visible" : "hidden"
      }}
    >
      {children}
    </div>,
    document.body
  );
}
