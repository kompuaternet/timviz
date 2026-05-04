"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  clearScheduleReminder,
  hasPendingScheduleReminder
} from "../../lib/schedule-reminder";
import styles from "./pro.module.css";
import { useProLanguage } from "./useProLanguage";

type SidebarSection = "workspace" | "calendar" | "services" | "clients" | "staff" | "schedule" | "settings";

type ProSidebarProps = {
  active: SidebarSection;
  professionalId?: string;
  canManageStaff?: boolean;
};

function HomeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 11.5 12 5l8 6.5" />
      <path d="M6.5 10.8V20h11V10.8" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3.5" y="5.5" width="17" height="15" rx="2.5" />
      <path d="M7 3.8v3.2M17 3.8v3.2M3.5 9.5h17" />
    </svg>
  );
}

function TagIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m11 4 8.5 8.5a2.1 2.1 0 0 1 0 3L15.6 19a2.1 2.1 0 0 1-3 0L4.1 10.5V4H11Z" />
      <circle cx="8" cy="8" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function ClientIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="4.5" y="5" width="15" height="14" rx="2.5" />
      <circle cx="12" cy="10" r="2.3" />
      <path d="M8.8 15.4c.8-1.4 2.1-2.1 3.2-2.1s2.4.7 3.2 2.1" />
    </svg>
  );
}

function StaffIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="8" cy="9" r="2.6" />
      <circle cx="16.2" cy="8.3" r="2.1" />
      <path d="M4.8 18c.8-2.2 2.8-3.5 5.2-3.5s4.4 1.3 5.2 3.5" />
      <path d="M14.6 17.1c.5-1.5 1.7-2.4 3.2-2.4 1 0 2 .4 2.7 1.2" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="3.1" />
      <path d="M19.1 14.6a1 1 0 0 0 .2 1.1l.1.1a1.3 1.3 0 0 1 0 1.8l-.7.7a1.3 1.3 0 0 1-1.8 0l-.1-.1a1 1 0 0 0-1.1-.2 1 1 0 0 0-.6.9v.2a1.3 1.3 0 0 1-1.3 1.3h-1a1.3 1.3 0 0 1-1.3-1.3v-.2a1 1 0 0 0-.6-.9 1 1 0 0 0-1.1.2l-.1.1a1.3 1.3 0 0 1-1.8 0l-.7-.7a1.3 1.3 0 0 1 0-1.8l.1-.1a1 1 0 0 0 .2-1.1 1 1 0 0 0-.9-.6h-.2a1.3 1.3 0 0 1-1.3-1.3v-1a1.3 1.3 0 0 1 1.3-1.3h.2a1 1 0 0 0 .9-.6 1 1 0 0 0-.2-1.1l-.1-.1a1.3 1.3 0 0 1 0-1.8l.7-.7a1.3 1.3 0 0 1 1.8 0l.1.1a1 1 0 0 0 1.1.2 1 1 0 0 0 .6-.9v-.2a1.3 1.3 0 0 1 1.3-1.3h1a1.3 1.3 0 0 1 1.3 1.3v.2a1 1 0 0 0 .6.9 1 1 0 0 0 1.1-.2l.1-.1a1.3 1.3 0 0 1 1.8 0l.7.7a1.3 1.3 0 0 1 0 1.8l-.1.1a1 1 0 0 0-.2 1.1 1 1 0 0 0 .9.6h.2a1.3 1.3 0 0 1 1.3 1.3v1a1.3 1.3 0 0 1-1.3 1.3h-.2a1 1 0 0 0-.9.6Z" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M15.5 4.8h2.1a2 2 0 0 1 2 2v10.4a2 2 0 0 1-2 2h-2.1" />
      <path d="M10.2 16.8 15 12l-4.8-4.8" />
      <path d="M14.7 12H4.4" />
    </svg>
  );
}

const mainLinks = [
  { key: "workspace", href: "/pro/calendar", icon: <HomeIcon /> },
  { key: "calendar", href: "/pro/calendar", icon: <CalendarIcon /> },
  { key: "services", href: "/pro/services", icon: <TagIcon /> },
  { key: "clients", href: "/pro/clients", icon: <ClientIcon /> }
] as const;

export default function ProSidebar({
  active,
  professionalId = "",
  canManageStaff = false
}: ProSidebarProps) {
  const router = useRouter();
  const { t } = useProLanguage();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [optimisticMobileActive, setOptimisticMobileActive] = useState<SidebarSection | null>(null);
  const [showScheduleReminder, setShowScheduleReminder] = useState(
    () => active !== "staff" && hasPendingScheduleReminder(professionalId)
  );
  const labels = {
    workspace: t.nav.home,
    calendar: t.nav.calendar,
    services: t.nav.services,
    clients: t.nav.clients,
    staff: t.nav.staff,
    schedule: t.nav.schedule
  };

  useEffect(() => {
    setOptimisticMobileActive(null);
  }, [active]);

  useEffect(() => {
    if (!professionalId) {
      setShowScheduleReminder(false);
      return;
    }

    if (active === "staff") {
      clearScheduleReminder(professionalId);
      setShowScheduleReminder(false);
      return;
    }

    setShowScheduleReminder(hasPendingScheduleReminder(professionalId));
  }, [active, professionalId]);

  const visibleMainLinks = [
    ...mainLinks,
    canManageStaff
      ? ({ key: "staff" as const, href: "/pro/staff/schedule", icon: <StaffIcon /> } as const)
      : ({ key: "schedule" as const, href: "/pro/schedule", icon: <CalendarIcon /> } as const)
  ];

  const mobileLinks = [
    { key: "calendar" as const, href: "/pro/calendar", label: t.nav.home, icon: <HomeIcon />, active: active === "workspace" || active === "calendar" },
    { key: "services" as const, href: "/pro/services", label: t.nav.services, icon: <TagIcon />, active: active === "services" },
    { key: "clients" as const, href: "/pro/clients", label: t.nav.clients, icon: <ClientIcon />, active: active === "clients" },
    canManageStaff
      ? { key: "staff" as const, href: "/pro/staff/schedule", label: t.nav.staff, icon: <StaffIcon />, active: active === "staff" }
      : { key: "schedule" as const, href: "/pro/schedule", label: t.nav.schedule, icon: <CalendarIcon />, active: active === "schedule" },
    { key: "settings" as const, href: "/pro/settings", label: t.nav.settings, icon: <SettingsIcon />, active: active === "settings" }
  ];

  async function handleLogout() {
    setIsLoggingOut(true);

    try {
      await fetch("/api/pro/logout", {
        method: "POST"
      });
    } finally {
      router.push("/pro/login");
      router.refresh();
    }
  }

  return (
    <>
      <aside className={styles.workspaceSidebar}>
        <div className={styles.workspaceSidebarTop}>
          {visibleMainLinks.map((link) => (
            <Link
              key={link.key}
              href={link.href}
              className={`${styles.workspaceNavButton} ${active === link.key ? styles.workspaceActive : ""}`}
              aria-label={labels[link.key]}
              title={labels[link.key]}
            >
              {link.icon}
              {link.key === "staff" && showScheduleReminder ? (
                <span className={styles.workspaceNavDot} aria-hidden="true" />
              ) : null}
            </Link>
          ))}
        </div>

        <div className={styles.workspaceSidebarBottom}>
          <Link
            href="/pro/settings"
            className={`${styles.workspaceNavButton} ${active === "settings" ? styles.workspaceActive : ""}`}
            aria-label={t.nav.settings}
            title={t.nav.settings}
          >
            <SettingsIcon />
          </Link>
          <button
            type="button"
            className={styles.workspaceNavButton}
            aria-label={isLoggingOut ? t.settings.logoutLoading : t.settings.logout}
            title={isLoggingOut ? t.settings.logoutLoading : t.settings.logout}
            disabled={isLoggingOut}
            onClick={() => {
              void handleLogout();
            }}
          >
            <LogoutIcon />
          </button>
        </div>
      </aside>

      <nav
        className={styles.mobileWorkspaceNav}
        aria-label={t.nav.home}
        style={{ gridTemplateColumns: `repeat(${mobileLinks.length}, minmax(0, 1fr))` }}
      >
        {mobileLinks.map((link) => (
          <Link
            key={link.key}
            href={link.href}
            className={`${styles.mobileWorkspaceNavLink} ${
              optimisticMobileActive === link.key || (!optimisticMobileActive && link.active)
                ? styles.mobileWorkspaceNavActive
                : ""
            }`}
            aria-label={link.label}
            title={link.label}
            onClick={() => setOptimisticMobileActive(link.key)}
          >
            <span className={styles.mobileWorkspaceNavIcon}>
              {link.icon}
              {link.key === "staff" && showScheduleReminder ? (
                <span className={styles.workspaceNavDot} aria-hidden="true" />
              ) : null}
            </span>
            <span className={styles.mobileWorkspaceNavLabel}>{link.label}</span>
          </Link>
        ))}
      </nav>

    </>
  );
}
