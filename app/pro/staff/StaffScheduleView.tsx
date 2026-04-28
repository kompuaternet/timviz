"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import ProSidebar from "../ProSidebar";
import styles from "../pro.module.css";
import { useProLanguage } from "../useProLanguage";
import type { BusinessStaffSnapshot } from "../../../lib/pro-staff";
import { getDaySchedule } from "../../../lib/work-schedule";

type StaffScheduleViewProps = {
  professionalId: string;
  snapshot: BusinessStaffSnapshot;
};

const scheduleText = {
  ru: {
    sectionTitle: "Команда",
    people: "Участники команды",
    schedule: "График смен",
    title: "График смен",
    text:
      "Персональный график сотрудника влияет на его рабочий календарь и доступные слоты в онлайн-записи. Нажмите на строку мастера, чтобы открыть полное редактирование.",
    today: "На этой неделе",
    options: "Варианты",
    add: "Добавить",
    change: "Изменить",
    noWork: "Не работает",
    employee: "Член команды",
    hours: "ч",
    empty: "Сначала добавьте сотрудников в команду.",
    footer:
      "В этом разделе показан именно график сотрудников для бронирования. Общий режим компании используется как стартовый шаблон, но дальше каждый мастер живёт по своему расписанию."
  },
  uk: {
    sectionTitle: "Команда",
    people: "Учасники команди",
    schedule: "Графік змін",
    title: "Графік змін",
    text:
      "Персональний графік співробітника впливає на його календар і доступні слоти в онлайн-записі. Натисніть на рядок майстра, щоб відкрити повне редагування.",
    today: "На цьому тижні",
    options: "Варіанти",
    add: "Додати",
    change: "Змінити",
    noWork: "Не працює",
    employee: "Член команди",
    hours: "год",
    empty: "Спочатку додайте співробітників до команди.",
    footer:
      "Тут показано саме графік співробітників для бронювання. Загальний режим компанії використовується як стартовий шаблон, але далі кожен майстер живе за власним розкладом."
  },
  en: {
    sectionTitle: "Team",
    people: "Team members",
    schedule: "Shift schedule",
    title: "Shift schedule",
    text:
      "Each employee schedule affects their calendar and online booking availability. Click a specialist row to open the full editor.",
    today: "This week",
    options: "Options",
    add: "Add",
    change: "Change",
    noWork: "Not working",
    employee: "Team member",
    hours: "h",
    empty: "Add employees to the team first.",
    footer:
      "This section shows employee booking availability. The business schedule is only the starting template; each specialist now keeps a personal schedule."
  }
} as const;

function getLocale(language: "ru" | "uk" | "en") {
  if (language === "uk") return "uk-UA";
  if (language === "en") return "en-US";
  return "ru-RU";
}

function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function startOfWeek(date: Date) {
  const next = new Date(date);
  const shift = (next.getDay() + 6) % 7;
  next.setDate(next.getDate() - shift);
  next.setHours(0, 0, 0, 0);
  return next;
}

function addDays(base: Date, offset: number) {
  const next = new Date(base);
  next.setDate(base.getDate() + offset);
  return next;
}

export default function StaffScheduleView({ professionalId, snapshot }: StaffScheduleViewProps) {
  const { language } = useProLanguage();
  const copy = scheduleText[language];
  const locale = getLocale(language);
  const [weekDate, setWeekDate] = useState(() => startOfWeek(new Date()));

  const weekDays = useMemo(
    () =>
      Array.from({ length: 7 }, (_, index) => {
        const date = addDays(weekDate, index);
        return {
          key: toDateKey(date),
          short: date.toLocaleDateString(locale, { weekday: "short" }),
          label: date.toLocaleDateString(locale, { day: "numeric", month: "short" })
        };
      }),
    [locale, weekDate]
  );

  const rangeLabel = `${weekDays[0]?.label} – ${weekDays[6]?.label}`;

  return (
    <main className={`${styles.workspaceShell} ${styles.scheduleShell}`}>
      <ProSidebar active="staff" professionalId={professionalId} canManageStaff />

      <section className={styles.staffStudioShell}>
        <aside className={styles.staffStudioSidebar}>
          <div className={styles.staffStudioSidebarCard}>
            <strong>{copy.sectionTitle}</strong>
            <nav className={styles.staffStudioLocalNav}>
              <Link href="/pro/staff" className={styles.staffStudioLocalLink}>
                {copy.people}
              </Link>
              <Link href="/pro/staff/schedule" className={`${styles.staffStudioLocalLink} ${styles.staffStudioLocalLinkActive}`}>
                {copy.schedule}
              </Link>
            </nav>
          </div>
        </aside>

        <section className={styles.staffStudioMain}>
          <div className={styles.staffStudioHeader}>
            <div>
              <h1 className={styles.staffStudioTitle}>{copy.title}</h1>
              <p className={styles.staffStudioText}>{copy.text}</p>
            </div>

            <div className={styles.staffStudioTopActions}>
              <button type="button" className={styles.staffStudioGhostButton}>
                {copy.options}
                <span aria-hidden="true">⌄</span>
              </button>
              <Link href="/pro/staff" className={styles.staffStudioPrimaryButton}>
                {copy.add}
              </Link>
            </div>
          </div>

          <div className={styles.staffScheduleToolbar}>
            <button
              type="button"
              className={styles.staffStudioGhostButton}
              onClick={() => setWeekDate(startOfWeek(new Date()))}
            >
              {copy.today}
            </button>
            <div className={styles.staffScheduleRange}>
              <button type="button" className={styles.staffScheduleArrow} onClick={() => setWeekDate(addDays(weekDate, -7))}>
                ‹
              </button>
              <strong>{rangeLabel}</strong>
              <button type="button" className={styles.staffScheduleArrow} onClick={() => setWeekDate(addDays(weekDate, 7))}>
                ›
              </button>
            </div>
          </div>

          {snapshot.members.length === 0 ? (
            <div className={styles.staffStudioEmpty}>{copy.empty}</div>
          ) : (
            <section className={styles.staffScheduleBoard}>
              <div className={styles.staffScheduleHead}>
                <div className={styles.staffScheduleMemberHead}>
                  <span>{copy.employee}</span>
                  <Link href="/pro/staff" className={styles.staffScheduleInlineLink}>
                    {copy.change}
                  </Link>
                </div>
                {weekDays.map((day) => (
                  <div key={day.key} className={styles.staffScheduleDayHead}>
                    <strong>{day.short}</strong>
                    <span>{day.label}</span>
                  </div>
                ))}
              </div>

              <div className={styles.staffScheduleRows}>
                {snapshot.members.map((member) => (
                  <article key={member.professional.id} className={styles.staffScheduleRow}>
                    <Link href={`/pro/staff/${member.professional.id}?tab=schedule`} className={styles.staffScheduleMemberCell}>
                      <div className={styles.staffScheduleMemberIdentity}>
                        <span className={styles.staffScheduleAvatar}>
                          {member.professional.avatarUrl ? (
                            <img src={member.professional.avatarUrl} alt="" />
                          ) : (
                            `${member.professional.firstName?.[0] ?? ""}${member.professional.lastName?.[0] ?? ""}`.trim() || "M"
                          )}
                        </span>
                        <div>
                          <strong>
                            {`${member.professional.firstName} ${member.professional.lastName}`.trim() ||
                              member.professional.email}
                          </strong>
                          <span>{member.membership.role}</span>
                        </div>
                      </div>
                    </Link>

                    {weekDays.map((day) => {
                      const daySchedule = getDaySchedule(
                        day.key,
                        member.membership.workSchedule,
                        member.membership.customSchedule
                      );
                      const label = daySchedule?.enabled
                        ? `${daySchedule.startTime} - ${daySchedule.endTime}`
                        : copy.noWork;

                      return (
                        <Link
                          key={`${member.professional.id}-${day.key}`}
                          href={`/pro/staff/${member.professional.id}?tab=schedule&date=${day.key}`}
                          className={`${styles.staffScheduleShiftCell} ${
                            daySchedule?.enabled ? styles.staffScheduleShiftCellActive : styles.staffScheduleShiftCellOff
                          }`}
                        >
                          {label}
                        </Link>
                      );
                    })}
                  </article>
                ))}
              </div>
            </section>
          )}

          <div className={styles.staffStudioNotice}>{copy.footer}</div>
        </section>
      </section>
    </main>
  );
}
