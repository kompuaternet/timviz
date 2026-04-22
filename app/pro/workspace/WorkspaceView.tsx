"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import styles from "../pro.module.css";
import LogoutButton from "./LogoutButton";
import ProSidebar from "../ProSidebar";
import type { WorkSchedule, WorkScheduleMode } from "../../../lib/work-schedule";

type WorkspaceSnapshot = {
  professional: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    country: string;
    timezone: string;
    language: string;
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
    addressDetails: string;
  };
  membership: {
    role: string;
    scope: "owner" | "member";
  };
  services: Array<{
    id: string;
    name: string;
  }>;
};

const ownerBookings = [
  { start: 165, height: 56, time: "11:00 - 11:45", client: "John Doe", service: "Стрижка" },
  { start: 318, height: 92, time: "13:00 - 14:15", client: "Jane Doe", service: "Цвет волос" }
];

const memberBookings = [
  { start: 170, height: 54, time: "11:15 - 12:00", client: "Anna K.", service: "Маникюр" },
  { start: 330, height: 74, time: "13:15 - 14:15", client: "Ira M.", service: "Педикюр" }
];

type WorkspaceViewProps = {
  professionalId: string;
};

export default function WorkspaceView({ professionalId }: WorkspaceViewProps) {
  const [snapshot, setSnapshot] = useState<WorkspaceSnapshot | null>(null);

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

  const isOwner = snapshot?.membership.scope === "owner";
  const bookings = isOwner ? ownerBookings : memberBookings;

  const initials = useMemo(() => {
    if (!snapshot) {
      return "RZ";
    }

    return `${snapshot.professional.firstName[0] ?? ""}${snapshot.professional.lastName[0] ?? ""}`.toUpperCase();
  }, [snapshot]);

  if (!snapshot) {
    return (
      <main className={styles.workspaceShell}>
        <section className={styles.workspaceMain}>
          <div className={styles.workspaceTopBar}>
            <strong>Загружаем рабочее пространство...</strong>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className={styles.workspaceShell}>
      <ProSidebar active="workspace" professionalId={professionalId} />

      <section className={styles.workspaceMain}>
        <div className={styles.workspaceTopBar}>
          <div className={styles.workspaceControls}>
            <div className={styles.pillControl}>Сегодня</div>
            <div className={styles.pillControl}>чт 9 апр.</div>
            <Link href="/pro/schedule" className={styles.pillControl}>
              Мой график
            </Link>
            <div className={styles.pillControl}>⚙︎</div>
          </div>

          <div className={styles.workspaceProfile}>
            <div className={styles.avatar}>{initials}</div>
            <div>
              <strong>{snapshot.business.name}</strong>
              <div>{isOwner ? "Владелец бизнеса" : snapshot.membership.role}</div>
            </div>
            <LogoutButton />
          </div>
        </div>

        <div className={styles.workspaceHeader}>
          <strong>{snapshot.business.categories.join(" · ")}</strong>
          <div>
            {isOwner
              ? `${snapshot.services.length} услуг · ${snapshot.business.serviceMode}`
              : `Работаю в составе ${snapshot.business.name}`}
          </div>
        </div>

        <div className={styles.workspaceGrid}>
          <div className={styles.hourColumn}>
            {Array.from({ length: 9 }, (_, index) => {
              const hour = index + 9;
              return (
                <div
                  key={hour}
                  className={styles.hourLabel}
                  style={{ top: `${index * 76 + 56}px` }}
                >
                  {`${hour}:00`}
                </div>
              );
            })}
          </div>

          <div className={styles.calendarBody}>
            <div className={styles.nowLine} style={{ top: "320px" }}>
              <span className={styles.nowBadge}>13:31</span>
            </div>

            {bookings.map((booking) => (
              <article
                key={booking.time}
                className={styles.bookingBlock}
                style={{ top: `${booking.start}px`, height: `${booking.height}px` }}
              >
                <span className={styles.bookingTime}>{booking.time}</span>
                <strong className={styles.bookingTitle}>{booking.client}</strong>
                <span>{booking.service}</span>
              </article>
            ))}
          </div>
        </div>
      </section>

      <aside className={styles.workspaceAside}>
        <div className={styles.asideHero}>
          <div className={styles.asideHeroTop}>
            <span className={styles.asideHeroLabel}>
              {isOwner ? "Owner Workspace" : "Pro Workspace"}
            </span>
            <span className={styles.asideHeroPill}>
              {isOwner ? "Premium" : "Personal"}
            </span>
          </div>
          <h3 className={styles.asideHeroTitle}>
            {isOwner ? snapshot.business.name : snapshot.professional.firstName}
          </h3>
          <p className={styles.asideHeroText}>
            {isOwner
              ? "Управление мастерами, услугами, ролями и всеми записями бизнеса в одном рабочем пространстве."
              : "Личный календарь мастера, свои записи, услуги и рабочая нагрузка в составе салона."}
          </p>
          <div className={styles.asideHeroMeta}>
            <span>{snapshot.business.accountType === "team" ? "Команда" : "Solo"}</span>
            <span>{snapshot.services.length} услуг</span>
            <span>{isOwner ? "Полный доступ" : "Ограниченный доступ"}</span>
          </div>
        </div>

        <div className={styles.asideCard}>
          <div className={styles.checklist}>
            <div className={styles.checkItem}>
              <span>Аккаунт сохранен в базе</span>
              <span className={styles.checkDone}>✓</span>
            </div>
            <div className={styles.checkItem}>
              <span>{isOwner ? "Бизнес создан" : "Подключение к салону завершено"}</span>
              <span className={styles.checkDone}>✓</span>
            </div>
            <div className={styles.checkItem}>
              <span>{isOwner ? "Настроить мастеров" : "Проверить свой график"}</span>
              <span className={styles.checkPending}>→</span>
            </div>
          </div>
        </div>

        <div className={styles.asideCard}>
          <div className={styles.miniList}>
            <div>
              <strong>Услуги в базе</strong>
              <div className={styles.generatedList}>
                {snapshot.services.map((service) => (
                  <span key={service.id} className={styles.generatedChip}>
                    {service.name}
                  </span>
                ))}
              </div>
            </div>
            {snapshot.business.addressDetails ? (
              <div>
                <strong>Адрес бизнеса</strong>
                <span className={styles.addressPreview}>{snapshot.business.addressDetails}</span>
              </div>
            ) : null}
            <div>
              <strong>Переходы</strong>
              <Link href="/catalog" className={styles.mutedLink}>
                Открыть клиентский каталог
              </Link>
            </div>
          </div>
        </div>
      </aside>
    </main>
  );
}
