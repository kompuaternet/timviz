"use client";

import { memo, useMemo, useState } from "react";

type ProfileAvatarProps = {
  avatarUrl?: string | null;
  initials?: string;
  label: string;
  className: string;
  imageClassName?: string;
  fallbackClassName?: string;
};

function buildFallbackInitials(label: string) {
  return label
    .split(/\s+/)
    .map((part) => part.trim()[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function ProfileAvatar({
  avatarUrl,
  initials,
  label,
  className,
  imageClassName,
  fallbackClassName
}: ProfileAvatarProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const normalizedAvatarUrl = typeof avatarUrl === "string" ? avatarUrl.trim() : "";
  const fallback = useMemo(
    () => (initials?.trim() || buildFallbackInitials(label) || "RZ").slice(0, 2).toUpperCase(),
    [initials, label]
  );
  const shouldShowImage = Boolean(normalizedAvatarUrl) && !imageFailed;

  return (
    <div className={className} title={label} aria-hidden="true">
      {shouldShowImage ? (
        <img
          src={normalizedAvatarUrl}
          alt=""
          className={imageClassName}
          referrerPolicy="no-referrer"
          onError={() => setImageFailed(true)}
        />
      ) : (
        <span className={fallbackClassName}>{fallback}</span>
      )}
    </div>
  );
}

function arePropsEqual(previous: ProfileAvatarProps, next: ProfileAvatarProps) {
  return (
    previous.avatarUrl === next.avatarUrl &&
    previous.initials === next.initials &&
    previous.label === next.label &&
    previous.className === next.className &&
    previous.imageClassName === next.imageClassName &&
    previous.fallbackClassName === next.fallbackClassName
  );
}

export default memo(ProfileAvatar, arePropsEqual);
