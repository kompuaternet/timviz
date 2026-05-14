"use client";

import Link from "next/link";

import styles from "./pro.module.css";

type PlanBadgeProps = {
  variant?: "menu";
  className?: string;
  href?: string;
  label?: string;
};

export function PlanBadge({ className = "", href, label = "PRO" }: PlanBadgeProps) {
  const mergedClassName = `${styles.planBadge} ${styles.planBadgeMenu} ${className}`.trim();
  const ariaLabel = "Тариф PRO активен";

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
