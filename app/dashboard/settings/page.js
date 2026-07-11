'use client';

import { useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';
import { signOut } from '@/lib/auth';
import styles from './page.module.css';

export default function SettingsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [error, setError] = useState('');

  if (loading) {
    return <div className={styles.container}><p>Loading...</p></div>;
  }

  if (!user) {
    router.push('/auth/sign-in');
    return null;
  }

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className={styles.container}>
      <h1>Settings</h1>
      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.card}>
        <h2>Account</h2>
        <div className={styles.field}>
          <label>Email</label>
          <p>{user.email}</p>
        </div>
      </div>

      <div className={styles.card}>
        <h2>Preferences</h2>
        <p>Additional settings coming soon.</p>
      </div>

      <div className={styles.card}>
        <h2>Danger Zone</h2>
        <button className={styles.danger} onClick={handleSignOut}>
          Sign Out
        </button>
      </div>
    </div>
  );
}
