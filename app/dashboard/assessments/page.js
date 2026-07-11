'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import styles from './page.module.css';

export default function AssessmentsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/sign-in');
      return;
    }

    if (user) {
      loadAssessments();
    }
  }, [user, authLoading, router]);

  const loadAssessments = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('assessment_ingestion_records')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAssessments(data || []);
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
      <h1>My Assessments</h1>
      {error && <div className={styles.error}>{error}</div>}
      
      <div className={styles.header}>
        <button onClick={() => router.push('/dashboard/assessments/new')}>
          + New Assessment
        </button>
      </div>

      {assessments.length === 0 ? (
        <div className={styles.empty}>
          <p>No assessments yet. Create one to get started.</p>
        </div>
      ) : (
        <div className={styles.table}>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Subject</th>
                <th>Grade</th>
                <th>Province</th>
                <th>Status</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {assessments.map((assessment) => (
                <tr key={assessment.id}>
                  <td>
                    <a href={`/dashboard/assessments/${assessment.id}`}>
                      {assessment.assessment_name}
                    </a>
                  </td>
                  <td>{assessment.subject}</td>
                  <td>{assessment.grade_level}</td>
                  <td>{assessment.province}</td>
                  <td>{assessment.status}</td>
                  <td>{new Date(assessment.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
