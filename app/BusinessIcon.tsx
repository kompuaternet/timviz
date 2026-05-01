type BusinessIconName =
  | "manicure"
  | "hairdressers"
  | "barbers"
  | "cosmetologists"
  | "massage"
  | "default";

type BusinessIconProps = {
  name: BusinessIconName;
  className?: string;
};

function IconPath({ name }: { name: BusinessIconName }) {
  switch (name) {
    case "manicure":
      return (
        <>
          <path d="M8.2 5.2c1.3-.9 2.8-.5 3.5.9l3 6c.5 1 .2 2.2-.7 2.9L11 17.5c-1 .8-2.5.6-3.2-.5L5.5 13" />
          <path d="M11.5 4.5l1.7 3.4" />
          <path d="M14.9 7.2l1.5 3" />
          <path d="M6 18.8c2.2-.4 4-.2 5.9 1.2" />
        </>
      );
    case "hairdressers":
      return (
        <>
          <circle cx="6" cy="6.5" r="2.5" />
          <circle cx="6" cy="17.5" r="2.5" />
          <path d="M8 8l10 8" />
          <path d="M8 16l10-8" />
        </>
      );
    case "barbers":
      return (
        <>
          <path d="M5 18l6-6" />
          <path d="M10.8 6.2l7 7" />
          <path d="M12.2 4.8l2.6-2.1 4.4 4.4-2.1 2.6" />
          <path d="M6.7 16.3l1.9 1.9" />
        </>
      );
    case "cosmetologists":
      return (
        <>
          <rect x="7" y="9" width="10" height="10" rx="2.2" />
          <path d="M9.5 9V7.6A2.5 2.5 0 0112 5h0a2.5 2.5 0 012.5 2.6V9" />
          <path d="M10 13h4" />
        </>
      );
    case "massage":
      return (
        <>
          <path d="M4 11h13c1.7 0 3 1.3 3 3v1" />
          <path d="M8 11V8.5A2.5 2.5 0 0110.5 6h1A2.5 2.5 0 0114 8.5V11" />
          <path d="M5 15h7" />
          <path d="M6 18h10" />
        </>
      );
    default:
      return (
        <>
          <rect x="5" y="5" width="14" height="14" rx="3" />
          <path d="M9 12h6" />
          <path d="M12 9v6" />
        </>
      );
  }
}

export default function BusinessIcon({ name, className }: BusinessIconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <g stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <IconPath name={name} />
      </g>
    </svg>
  );
}
