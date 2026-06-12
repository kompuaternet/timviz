import type { Metadata } from "next";
import GlobalLanguageSwitcher from "../../GlobalLanguageSwitcher";
import CreateAccountForm from "./CreateAccountForm";
import CreateAccountVisual from "./CreateAccountVisual";
import { buildMetadata, seoCopy } from "../../../lib/seo";
import { defaultSiteLanguage } from "../../../lib/site-language";
import styles from "../pro.module.css";

export const metadata: Metadata = buildMetadata(
  "/pro/create-account",
  seoCopy.createAccount[defaultSiteLanguage],
  defaultSiteLanguage,
  {
    image: "/social/timviz-signup-og-20260612.png"
  }
);

export default function ProCreateAccountPage() {
  return (
    <main className={styles.splitShell}>
      <section className={styles.formSide}>
        <div className={styles.createTopLanguage}>
          <GlobalLanguageSwitcher mode="inline" />
        </div>
        <CreateAccountForm />
      </section>
      <aside className={styles.visualSide}>
        <div className={styles.visualPhoto} />
        <div className={styles.visualOverlay} />
        <CreateAccountVisual />
      </aside>
    </main>
  );
}
