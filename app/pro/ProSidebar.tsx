"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  clearScheduleReminder,
  hasPendingScheduleReminder
} from "../../lib/schedule-reminder";
import SupportWidget from "./SupportWidget";
import styles from "./pro.module.css";
import { useProLanguage } from "./useProLanguage";

type SidebarSection = "workspace" | "calendar" | "services" | "clients" | "schedule" | "settings";

type ProSidebarProps = {
  active: SidebarSection;
  professionalId?: string;
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

function ScheduleIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="8.2" />
      <path d="M12 7.5v5l3.2 1.8" />
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

function HelpIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="8.4" />
      <path d="M9.7 9.4a2.5 2.5 0 1 1 4.1 2c-.9.7-1.4 1.2-1.4 2.2" />
      <circle cx="12" cy="17.3" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  );
}

const mainLinks = [
  { key: "workspace", href: "/pro/calendar", icon: <HomeIcon /> },
  { key: "calendar", href: "/pro/calendar", icon: <CalendarIcon /> },
  { key: "services", href: "/pro/services", icon: <TagIcon /> },
  { key: "clients", href: "/pro/clients", icon: <ClientIcon /> },
  { key: "schedule", href: "/pro/schedule", icon: <ScheduleIcon /> }
] as const;

export default function ProSidebar({ active, professionalId = "" }: ProSidebarProps) {
  const { t } = useProLanguage();
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [showScheduleReminder, setShowScheduleReminder] = useState(
    () => active !== "schedule" && hasPendingScheduleReminder(professionalId)
  );
  const labels = {
    workspace: t.nav.home,
    calendar: t.nav.calendar,
    services: t.nav.services,
    clients: t.nav.clients,
    schedule: t.nav.schedule
  };

  useEffect(() => {
    if (!professionalId) {
      setShowScheduleReminder(false);
      return;
    }

    if (active === "schedule") {
      clearScheduleReminder(professionalId);
      setShowScheduleReminder(false);
      return;
    }

    setShowScheduleReminder(hasPendingScheduleReminder(professionalId));
  }, [active, professionalId]);

  const mobileLinks = [
    { key: "calendar" as const, href: "/pro/calendar", label: t.nav.home, icon: <HomeIcon />, active: active === "workspace" || active === "calendar" },
    { key: "services" as const, href: "/pro/services", label: t.nav.services, icon: <TagIcon />, active: active === "services" },
    { key: "clients" as const, href: "/pro/clients", label: t.nav.clients, icon: <ClientIcon />, active: active === "clients" },
    { key: "schedule" as const, href: "/pro/schedule", label: t.nav.schedule, icon: <ScheduleIcon />, active: active === "schedule" },
    { key: "settings" as const, href: "/pro/settings", label: t.nav.settings, icon: <SettingsIcon />, active: active === "settings" }
  ];

  return (
    <>
      <aside className={styles.workspaceSidebar}>
        <div className={styles.workspaceSidebarTop}>
          {mainLinks.map((link) => (
            <Link
              key={link.key}
              href={link.href}
              className={`${styles.workspaceNavButton} ${active === link.key ? styles.workspaceActive : ""}`}
              aria-label={labels[link.key]}
              title={labels[link.key]}
            >
              {link.icon}
              {link.key === "schedule" && showScheduleReminder ? (
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
            aria-label={t.nav.help}
            title={t.nav.help}
            onClick={() => setIsSupportOpen(true)}
          >
            <HelpIcon />
          </button>
        </div>
      </aside>

      <nav className={styles.mobileWorkspaceNav} aria-label={t.nav.home}>
        {mobileLinks.map((link) => (
          <Link
            key={link.key}
            href={link.href}
            className={`${styles.mobileWorkspaceNavLink} ${link.active ? styles.mobileWorkspaceNavActive : ""}`}
            aria-label={link.label}
            title={link.label}
          >
            <span className={styles.mobileWorkspaceNavIcon}>
              {link.icon}
              {link.key === "schedule" && showScheduleReminder ? (
                <span className={styles.workspaceNavDot} aria-hidden="true" />
              ) : null}
            </span>
            <span className={styles.mobileWorkspaceNavLabel}>{link.label}</span>
          </Link>
        ))}
      </nav>

      <SupportWidget
        isOpen={isSupportOpen}
        onOpen={() => setIsSupportOpen(true)}
        onClose={() => setIsSupportOpen(false)}
      />
    </>
  );
}
