import { getLocalizedPath, type SiteLanguage } from "../lib/site-language";
import { getNicheSlug, nicheCards, nicheKeys } from "../lib/niche-pages";
import BusinessIcon from "./BusinessIcon";

type NicheLinksSectionProps = {
  language: SiteLanguage;
  title: string;
  subtitle: string;
  className?: string;
};

export default function NicheLinksSection({ language, title, subtitle, className }: NicheLinksSectionProps) {
  return (
    <section className={className ?? "niche-links-section"}>
      <div className="niche-links-head">
        <h2>{title}</h2>
        <p>{subtitle}</p>
      </div>
      <div className="niche-links-grid">
        {nicheKeys.map((key) => {
          const card = nicheCards[key][language];
          const slug = getNicheSlug(language, key);
          return (
            <a className="niche-link-card" href={getLocalizedPath(language, `/${slug}`)} key={key}>
              <span className="niche-link-icon" aria-hidden="true">
                <BusinessIcon name={key} className="niche-link-icon-svg" />
              </span>
              <h3>{card.shortTitle}</h3>
              <p>{card.description}</p>
              <span className="niche-link-arrow" aria-hidden="true">→</span>
            </a>
          );
        })}
      </div>
    </section>
  );
}
