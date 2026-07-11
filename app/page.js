'use client';

import { useAuth } from '@/components/AuthProvider';
import Link from 'next/link';
import styles from './page.module.css';

export default function Home() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className={styles.container}>
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <h1>Project Iris</h1>
          <p>Curriculum Auto-Alignment & Assessment Ingestion Tool</p>
          <p className={styles.subtitle}>
            Align BC, AB, and ON district assessments to provincial curriculum standards
          </p>
          <div className={styles.buttonGroup}>
            <Link href="/auth/sign-in">
              <button>Sign In</button>
            </Link>
            <Link href="/auth/sign-up">
              <button className={styles.secondary}>Sign Up</button>
            </Link>
          </div>
        </div>
        <div className={styles.features}>
          <h2>Features</h2>
          <ul>
            <li>Ingest district assessments (BC, AB, ON)</li>
            <li>Automatic alignment to curriculum standards</li>
            <li>AI-powered analysis and recommendations</li>
            <li>Validation and audit trails</li>
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Project Iris Dashboard</h1>
        <p>Welcome, {user.email}</p>
      </div>
      <div className={styles.grid}>
        <Link href="/dashboard/assessments">
          <div className={styles.tile}>
            <h3>My Assessments</h3>
            <p>Manage ingested assessments and alignments</p>
          </div>
        </Link>
        <Link href="/dashboard/standards">
          <div className={styles.tile}>
            <h3>Curriculum Standards</h3>
            <p>Browse and search standards by province</p>
          </div>
        </Link>
        <Link href="/dashboard/alignments">
          <div className={styles.tile}>
            <h3>Alignments</h3>
            <p>Review and validate assessment-standard mappings</p>
          </div>
        </Link>
        <Link href="/dashboard/settings">
          <div className={styles.tile}>
            <h3>Settings</h3>
            <p>Manage your account and preferences</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
