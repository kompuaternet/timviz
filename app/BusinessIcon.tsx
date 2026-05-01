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
      return <path d="M8 20h16M9 16c2-3 4-5 7-8l3 3c-3 3-5 5-8 7" />;
    case "hairdressers":
      return <path d="M8 10l8 8M16 10l-8 8M19 8l2-2M5 20l2-2" />;
    case "barbers":
      return <path d="M8 20l12-12M11 9l9 9M8 8h4M18 18v4" />;
    case "cosmetologists":
      return <path d="M14 7l1.5 3.5L19 12l-3.5 1.5L14 17l-1.5-3.5L9 12l3.5-1.5L14 7zM7 18h14" />;
    case "massage":
      return <path d="M8 17c2-2 4-3 6-3s4 1 6 3M9 12c1-1 2-2 5-2s4 1 5 2M8 20h12" />;
    default:
      return <path d="M8 20h12M8 12h12M8 8h8" />;
  }
}

export default function BusinessIcon({ name, className }: BusinessIconProps) {
  return (
    <svg className={className} viewBox="0 0 28 28" fill="none" aria-hidden="true">
      <rect x="2" y="2" width="24" height="24" rx="8" fill="url(#bizGradient)" />
      <g stroke="#31295c" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <IconPath name={name} />
      </g>
      <defs>
        <linearGradient id="bizGradient" x1="4" y1="4" x2="24" y2="24" gradientUnits="userSpaceOnUse">
          <stop stopColor="#ECE9FF" />
          <stop offset="1" stopColor="#DED8FF" />
        </linearGradient>
      </defs>
    </svg>
  );
}
