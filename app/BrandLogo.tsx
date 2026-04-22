type BrandLogoProps = {
  className?: string;
};

export default function BrandLogo({ className = "" }: BrandLogoProps) {
  return (
    <span className={`brand-logo ${className}`.trim()}>
      <img
        src="/brand/timviz-logo-web.png"
        alt="Timviz"
        width={800}
        height={385}
        className="brand-logo-image"
      />
    </span>
  );
}
