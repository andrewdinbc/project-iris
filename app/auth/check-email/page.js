import Link from 'next/link';
import styles from './page.module.css';

export default function CheckEmail() {
  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1>Check Your Email</h1>
        <p>
          We've sent a confirmation link to your email address. Please click the link to verify your account.
        </p>
        <p className={styles.note}>
          If you don't see the email, check your spam folder.
        </p>
        <Link href="/">
          <button>Back to Home</button>
        </Link>
      </div>
    </div>
  );
}
