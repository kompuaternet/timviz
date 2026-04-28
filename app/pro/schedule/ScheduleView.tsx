"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import ProfileAvatar from "../../ProfileAvatar";
import styles from "../pro.module.css";
import LogoutButton from "../workspace/LogoutButton";
import ProSidebar from "../ProSidebar";
import { useProLanguage } from "../useProLanguage";
import WorkScheduleCard from "../workspace/WorkScheduleCard";
import type { CustomSchedule, WorkSchedule, WorkScheduleMode } from "../../../lib/work-schedule";

type WorkspaceSnapshot = {
  professional: {
    id: string;
    firstName: string;
    lastName: string;
    avatarUrl?: string;
    ownerMode: "owner" | "member";
  };
  business: {
    id: string;
    name: string;
    categories: string[];
    accountType: "solo" | "team";
    serviceMode: string;
    workScheduleMode: WorkScheduleMode;
    workSchedule: WorkSchedule;
    customSchedule: CustomSchedule;
  };
  membership: {
    role: string;
    scope: "owner" | "member";
  };
  memberSchedule: {
    workScheduleMode: WorkScheduleMode;
    workSchedule: WorkSchedule;
    customSchedule: CustomSchedule;
  };
  services: Array<{
    id: string;
    name: string;
  }>;
};

type ScheduleViewProps = {
  professionalId: string;
};

export default function ScheduleView({ professionalId }: ScheduleViewProps) {
  const { language, t } = useProLanguage();
  const [snapshot, setSnapshot] = useState<WorkspaceSnapshot | null>(null);
  const todayLabel = useMemo(
    () =>
      new Date().toLocaleDateString(language === "uk" ? "uk-UA" : language === "en" ? "en-US" : "ru-RU", {
        weekday: "short",
        day: "numeric",
        month: "short"
      }),
    [language]
  );

  useEffect(() => {
    if (!professionalId) {
      return;
    }

    void fetch(`/api/pro/workspace/${professionalId}`)
      .then((response) => response.json())
      .then((data) => {
        setSnapshot(data);
      });
  }, [professionalId]);

  const initials = useMemo(() => {
    if (!snapshot) {
      return "RZ";
    }

    return `${snapshot.professional.firstName?.[0] ?? ""}${snapshot.professional.lastName?.[0] ?? ""}`.toUpperCase() || "RZ";
  }, [snapshot]);

  if (!snapshot) {
    return (
      <main className={styles.workspaceShell}>
        <section className={styles.workspaceMain}>
          <div className={styles.workspaceTopBar}>
            <strong>{t.schedule.loading}</strong>
          </div>
        </section>
      </main>
    );
  }

  const isOwner = snapshot.membership.scope === "owner";

  return (
    <main className={`${styles.workspaceShell} ${styles.scheduleShell}`}>
      <ProSidebar
        active="schedule"
        professionalId={professionalId}
        canManageStaff={snapshot.membership.scope === "owner"}
      />

      <section className={styles.workspaceMain}>
        <div className={styles.workspaceTopBar}>
          <div className={styles.workspaceControls}>
            <button type="button" className={styles.pillControl}>
              {t.schedule.today}
            </button>
            <div className={styles.pillControl}>{todayLabel}</div>
            <Link href="/pro/schedule" className={`${styles.pillControl} ${styles.pillControlActive}`}>
              {t.schedule.mySchedule}
            </Link>
            <Link href="/pro/workspace" className={styles.pillControl}>
              {t.schedule.backToBookings}
            </Link>
          </div>

          <div className={styles.workspaceProfile}>
            <ProfileAvatar
              avatarUrl={snapshot.professional.avatarUrl}
              initials={initials}
              label={`${snapshot.professional.firstName} ${snapshot.professional.lastName}`.trim() || snapshot.business.name}
              className={styles.avatar}
              imageClassName={styles.avatarImage}
              fallbackClassName={styles.avatarFallback}
            />
            <div>
              <strong>{snapshot.business.name}</strong>
              <div>{isOwner ? t.schedule.owner : snapshot.membership.role}</div>
            </div>
            <LogoutButton />
          </div>
        </div>

        <div className={styles.schedulePageBody}>
          <WorkScheduleCard
            canEdit
            initialMode={snapshot.memberSchedule.workScheduleMode}
            initialSchedule={snapshot.memberSchedule.workSchedule}
            initialCustomSchedule={snapshot.memberSchedule.customSchedule}
            layout="page"
          />
        </div>
      </section>
    </main>
  );
}
