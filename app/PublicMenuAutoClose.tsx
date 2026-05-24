"use client";

import { useEffect } from "react";

const MENU_SELECTOR = "details.public-menu, details.business-language-menu";

function closeMenu(menu: HTMLDetailsElement) {
  menu.open = false;
}

export default function PublicMenuAutoClose() {
  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      const target = event.target as Node | null;
      if (!target) return;

      document.querySelectorAll<HTMLDetailsElement>(`${MENU_SELECTOR}[open]`).forEach((menu) => {
        if (!menu.contains(target)) {
          closeMenu(menu);
        }
      });
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;

      document.querySelectorAll<HTMLDetailsElement>(`${MENU_SELECTOR}[open]`).forEach(closeMenu);
    }

    function handleToggle(event: Event) {
      const activeMenu = event.target;
      if (!(activeMenu instanceof HTMLDetailsElement) || !activeMenu.matches(MENU_SELECTOR) || !activeMenu.open) {
        return;
      }

      document.querySelectorAll<HTMLDetailsElement>(`${MENU_SELECTOR}[open]`).forEach((menu) => {
        if (menu !== activeMenu) {
          closeMenu(menu);
        }
      });
    }

    document.addEventListener("pointerdown", handlePointerDown, true);
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("toggle", handleToggle, true);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown, true);
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("toggle", handleToggle, true);
    };
  }, []);

  return null;
}
