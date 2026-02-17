import React, { useState } from 'react';
import { PageContainer } from '@/components/layout/PageContainer';
import { LessonView } from '@/components/education/LessonView';
import { TEKSSearch } from '@/components/education/TEKSSearch';
import { CMFKDiagnostic } from '@/components/education/CMFKDiagnostic';
import { GlassPanel } from '@/components/shared/GlassPanel';
import { Button } from '@/components/shared/Button';
import { WitnessCard } from '@/components/shared/WitnessCard';
import { LoadingTrail } from '@/components/shared/LoadingTrail';
import { useEducationLesson } from '@/hooks/useNewton';
import { clsx } from '@/lib/clsx';

type Tab = 'lessons' | 'teks' | 'cmfk';

const GRADES = ['K','1','2','3','4','5','6','7','8','9','10','11','12'];

export const EducationPage: React.FC = () => {
  const [tab,   setTab]   = useState<Tab>('lessons');
  const [topic, setTopic] = useState('');
  const [grade, setGrade] = useState('');

  const { mutate, data, isPending, error } = useEducationLesson();

  const TABS: { id: Tab; label: string }[] = [
    { id: 'lessons', label: 'Lessons'     },
    { id: 'teks',    label: 'TEKS Search' },
    { id: 'cmfk',    label: 'CMFK Diagnostic' },
  ];

  return (
    <PageContainer>
      <h1 className="heading-xl mb-6">Learning Trail</h1>

      {/* Tab strip */}
      <div className="flex gap-2 mb-6 glass-panel p-1.5 rounded-2xl w-fit flex-wrap">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={clsx(
              'px-4 py-2 rounded-xl text-sm font-medium transition-all duration-150',
              tab === t.id
                ? 'bg-sequoia-sage text-white shadow-sm'
                : 'text-stone-600 dark:text-stone-300 hover:bg-black/5 dark:hover:bg-white/8',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'teks' && <TEKSSearch />}
      {tab === 'cmfk' && <CMFKDiagnostic />}

      {tab === 'lessons' && (
        <div className="space-y-4">
          <GlassPanel padding="lg">
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && topic.trim() && mutate({ topic: topic.trim(), grade: grade || undefined })}
                placeholder="Topic (e.g. photosynthesis, quadratic equations, the Civil War…)"
                className="flex-1 glass-panel-inset px-3 py-2.5 rounded-xl bg-transparent outline-none text-base text-stone-800 dark:text-stone-100 placeholder:text-stone-400"
                aria-label="Lesson topic"
              />
              <select
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                className="glass-panel-inset px-3 py-2.5 rounded-xl bg-transparent outline-none text-sm text-stone-700 dark:text-stone-200"
                aria-label="Grade level"
              >
                <option value="">All Grades</option>
                {GRADES.map((g) => <option key={g} value={g}>Grade {g}</option>)}
              </select>
              <Button
                onClick={() => mutate({ topic: topic.trim(), grade: grade || undefined })}
                loading={isPending}
                disabled={!topic.trim()}
              >
                Generate Lesson
              </Button>
            </div>
          </GlassPanel>

          {isPending && (
            <div className="py-8 flex justify-center">
              <LoadingTrail message="Generating lesson…" size="lg" />
            </div>
          )}

          {error && (
            <div className="bg-sequoia-finfr/10 border border-sequoia-finfr/25 rounded-2xl p-4 text-sm text-sequoia-finfr" role="alert">
              {error instanceof Error ? error.message : 'Lesson generation failed'}
            </div>
          )}

          {data && !isPending && (
            <div className="space-y-4 animate-slide-up">
              <LessonView lesson={data.payload} />
              <WitnessCard witness={data.witness} />
            </div>
          )}
        </div>
      )}
    </PageContainer>
  );
};
