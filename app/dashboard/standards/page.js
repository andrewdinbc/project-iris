'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import styles from './page.module.css';

export default function StandardsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [standards, setStandards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    province: 'BC',
    subject: '',
    grade: '',
  });

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/sign-in');
      return;
    }

    if (user) {
      loadStandards();
    }
  }, [user, authLoading, router, filters]);

  const loadStandards = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('curriculum_standards')
        .select('*')
        .eq('province', filters.province);

      if (filters.subject) {
        query = query.eq('subject', filters.subject);
      }
      if (filters.grade) {
        query = query.eq('grade_level', filters.grade);
      }

      const { data, error } = await query.limit(100);

      if (error) throw error;
      setStandards(data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return <div className={styles.container}><p>Loading...</p></div>;
  }

  return (
    <div className={styles.container}>
      <h1>Curriculum Standards</h1>
      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.filters}>
        <select
          value={filters.province}
          onChange={(e) => setFilters({ ...filters, province: e.target.value })}
        >
          <option value="BC">British Columbia</option>
          <option value="AB">Alberta</option>
          <option value="ON">Ontario</option>
        </select>

        <input
          type="text"
          placeholder="Search subject..."
          value={filters.subject}
          onChange={(e) => setFilters({ ...filters, subject: e.target.value })}
        />

        <input
          type="text"
          placeholder="Grade level..."
          value={filters.grade}
          onChange={(e) => setFilters({ ...filters, grade: e.target.value })}
        />
      </div>

      {standards.length === 0 ? (
        <div className={styles.empty}>
          <p>No standards found. Try adjusting your filters.</p>
        </div>
      ) : (
        <div className={styles.list}>
          {standards.map((standard) => (
            <div key={standard.id} className={styles.item}>
              <div className={styles.header}>
                <h3>{standard.standard_name}</h3>
                <span className={styles.code}>{standard.standard_code}</span>
              </div>
              <p>{standard.description}</p>
              {standard.competency_domain && (
                <p className={styles.domain}>
                  <strong>Domain:</strong> {standard.competency_domain}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
