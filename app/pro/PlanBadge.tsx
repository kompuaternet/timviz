"use client";

import Link from "next/link";

import styles from "./pro.module.css";

type PlanBadgeVariant = "header" | "menu";

type PlanBadgeProps = {
  variant?: PlanBadgeVariant;
  className?: string;
  href?: string;
  label?: string;
};

export function PlanBadge({ variant = "header", className = "", href, label = "PRO" }: PlanBadgeProps) {
  const variantClass = variant === "menu" ? styles.planBadgeMenu : styles.planBadgeHeader;
  const mergedClassName = `${styles.planBadge} ${variantClass} ${className}`.trim();
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
