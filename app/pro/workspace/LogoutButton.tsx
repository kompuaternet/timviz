"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import styles from "../pro.module.css";
import { getPostLogoutRedirectPath } from "../telegram-context";
import { useProLanguage } from "../useProLanguage";

export default function LogoutButton() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const { t } = useProLanguage();

  async function handleLogout() {
    setIsLoading(true);

    await fetch("/api/pro/logout", {
      method: "POST"
    });

    router.push(getPostLogoutRedirectPath("calendar"));
    router.refresh();
  }

  return (
    <button
      type="button"
      className={styles.ghostButton}
      disabled={isLoading}
      onClick={() => {
        void handleLogout();
      }}
    >
      {isLoading ? t.settings.logoutLoading : t.settings.logout}
    </button>
  );
}
