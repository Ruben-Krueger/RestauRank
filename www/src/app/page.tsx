import styles from "./page.module.css";
import Link from "next/link";

export default function Home() {
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <h1>Welcome</h1>
        <p>RestauRank is an easy way to align on restaurants with friends.</p>
        <div className={styles.ctas}>
          <Link href="/create" className="primary">
            Begin
          </Link>
        </div>
      </main>
    </div>
  );
}
