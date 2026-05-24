"use client";

import Link from "next/link";

import styles from "./pro.module.css";
import { useProLanguage } from "./useProLanguage";

type PlanBadgeProps = {
  variant?: "menu";
  className?: string;
  href?: string;
  label?: string;
};

export function PlanBadge({ className = "", href, label = "PRO" }: PlanBadgeProps) {
  const { language } = useProLanguage();
  const mergedClassName = `${styles.planBadge} ${styles.planBadgeMenu} ${className}`.trim();
  const ariaLabel = (
    {
      ru: "Тариф PRO активен",
      uk: "Тариф PRO активний",
      en: "PRO plan is active",
      fr: "Le forfait PRO est actif",
      pl: "Plan PRO jest aktywny",
      cs: "Tarif PRO je aktivní",
      es: "El plan PRO está activo",
      de: "PRO-Tarif ist aktiv"
    } as const
  )[language];

  if (href) {
    return (
      <Link href={href} className={mergedClassName} aria-label={ariaLabel} title={ariaLabel}>
        {label}
      </Link>
    );
  }

  return (
    <span className={mergedClassName} aria-label={ariaLabel} title={ariaLabel}>
      {label}
    </span>
  );
}
