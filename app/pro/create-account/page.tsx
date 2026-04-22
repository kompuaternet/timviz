import GlobalLanguageSwitcher from "../../GlobalLanguageSwitcher";
import CreateAccountForm from "./CreateAccountForm";
import CreateAccountVisual from "./CreateAccountVisual";
import styles from "../pro.module.css";

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
