'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import styles from './page.module.css';

export default function AlignmentsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [alignments, setAlignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all'); // all, validated, unvalidated

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/sign-in');
      return;
    }

    if (user) {
      loadAlignments();
    }
  }, [user, authLoading, router, filter]);

  const loadAlignments = async () => {
    try {
      setLoading(true);
      const { data: assessments, error: assessError } = await supabase
        .from('assessment_ingestion_records')
        .select('id')
        .eq('user_id', user.id);

      if (assessError) throw assessError;

      const assessmentIds = assessments.map((a) => a.id);
      if (assessmentIds.length === 0) {
        setAlignments([]);
        return;
      }

      let query = supabase
        .from('alignment_mappings')
        .select(
          `
          *,
          assessment_ingestion_records (assessment_name, subject, grade_level),
          curriculum_standards (standard_name, standard_code)
        `
        )
        .in('assessment_id', assessmentIds);

      if (filter === 'validated') {
        query = query.eq('validated_by_user', true);
      } else if (filter === 'unvalidated') {
        query = query.eq('validated_by_user', false);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      setAlignments(data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleValidate = async (alignmentId, validated) => {
    try {
      const { error } = await supabase
        .from('alignment_mappings')
        .update({
          validated_by_user: validated,
          validated_at: validated ? new Date().toISOString() : null,
        })
        .eq('id', alignmentId);

      if (error) throw error;
      loadAlignments();
    } catch (err) {
      setError(err.message);
    }
  };

  if (authLoading || loading) {
    return <div className={styles.container}><p>Loading...</p></div>;
  }

  return (
    <div className={styles.container}>
      <h1>Alignments</h1>
      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.filters}>
        <button
          className={filter === 'all' ? styles.active : ''}
          onClick={() => setFilter('all')}
        >
          All ({alignments.length})
        </button>
        <button
          className={filter === 'validated' ? styles.active : ''}
          onClick={() => setFilter('validated')}
        >
          Validated
        </button>
        <button
          className={filter === 'unvalidated' ? styles.active : ''}
          onClick={() => setFilter('unvalidated')}
        >
          Unvalidated
        </button>
      </div>

      {alignments.length === 0 ? (
        <div className={styles.empty}>
          <p>No alignments found.</p>
        </div>
      ) : (
        <div className={styles.list}>
          {alignments.map((alignment) => (
            <div key={alignment.id} className={styles.item}>
              <div className={styles.header}>
                <div>
                  <h4>{alignment.assessment_ingestion_records?.assessment_name}</h4>
                  <p className={styles.meta}>
                    {alignment.assessment_ingestion_records?.subject} • Grade {alignment.assessment_ingestion_records?.grade_level}
                  </p>
                </div>
                <div className={`${styles.confidence} ${styles[alignment.confidence]}`}>
                  {alignment.confidence}
                </div>
              </div>

              <div className={styles.mapping}>
                <div className={styles.item_text}>
                  <strong>Assessment Item:</strong>
                  <p>{alignment.assessment_item_text}</p>
                </div>
                <div className={styles.arrow}>→</div>
                <div className={styles.standard}>
                  <strong>Standard:</strong>
                  <p>{alignment.curriculum_standards?.standard_name}</p>
                  <span className={styles.code}>{alignment.curriculum_standards?.standard_code}</span>
                </div>
              </div>

              {alignment.alignment_rationale && (
                <div className={styles.rationale}>
                  <strong>Rationale:</strong>
                  <p>{alignment.alignment_rationale}</p>
                </div>
              )}

              <div className={styles.score}>
                <strong>Score:</strong> {(alignment.alignment_score * 100).toFixed(0)}%
              </div>

              <div className={styles.actions}>
                {alignment.validated_by_user ? (
                  <button
                    className={styles.validated}
                    onClick={() => handleValidate(alignment.id, false)}
                  >
                    ✓ Validated - Click to Unvalidate
                  </button>
                ) : (
                  <button
                    className={styles.unvalidated}
                    onClick={() => handleValidate(alignment.id, true)}
                  >
                    Validate Alignment
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
