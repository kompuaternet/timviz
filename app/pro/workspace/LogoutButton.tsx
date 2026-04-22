"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import styles from "../pro.module.css";

export default function LogoutButton() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  async function handleLogout() {
    setIsLoading(true);

    await fetch("/api/pro/logout", {
      method: "POST"
    });

    router.push("/pro/login");
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
      {isLoading ? "Выходим..." : "Выйти"}
    </button>
  );
}
