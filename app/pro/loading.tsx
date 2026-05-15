import styles from "./pro.module.css";

export default function ProLoading() {
  return (
    <main className={styles.workspaceShell} aria-busy="true">
      <aside className={styles.workspaceSidebar}>
        <div className={styles.workspaceSidebarTop}>
          {Array.from({ length: 4 }, (_, index) => (
            <span
              key={index}
              className={styles.workspaceNavButton}
              style={{ opacity: 0.42, pointerEvents: "none" }}
            />
          ))}
        </div>
        <div className={styles.workspaceSidebarBottom}>
          <span className={styles.workspaceNavButton} style={{ opacity: 0.42, pointerEvents: "none" }} />
        </div>
      </aside>

      <section className={styles.servicesPage}>
        <div className={styles.servicesHeroCompact}>
          <div>
            <p className={styles.eyebrow}>Timviz</p>
            <h1 style={{ minHeight: 42 }} />
            <p style={{ minHeight: 20, maxWidth: 520 }} />
          </div>
        </div>
        <section className={styles.servicesQuickStats}>
          {Array.from({ length: 3 }, (_, index) => (
            <article key={index}>
              <span style={{ minHeight: 16 }} />
              <strong style={{ minHeight: 28 }} />
              <small style={{ minHeight: 16 }} />
            </article>
          ))}
        </section>
      </section>
    </main>
  );
}
