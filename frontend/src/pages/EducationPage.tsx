import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { BookOpen } from 'lucide-react';
import { PageContainer } from '@/components/layout/PageContainer';
import { LessonView } from '@/components/education/LessonView';
import { TEKSSearch } from '@/components/education/TEKSSearch';
import { CMFKDiagnostic } from '@/components/education/CMFKDiagnostic';
import { GlassPanel } from '@/components/shared/GlassPanel';
import { Button } from '@/components/shared/Button';
import { WitnessCard } from '@/components/shared/WitnessCard';
import { LoadingTrail } from '@/components/shared/LoadingTrail';
import { StatusLight } from '@/components/shared/StatusLight';
import { useEducationLesson, useVerify } from '@/hooks/useNewton';
import { puterChat, buildTeachPrompt } from '@/api/puter';
import type { LessonPayload, Witness, NewtonResult } from '@/api/newton';
import { clsx } from '@/lib/clsx';

type Tab = 'lessons' | 'teks' | 'cmfk';

const GRADES = ['K','1','2','3','4','5','6','7','8','9','10','11','12'];

const MD_COMPONENTS = {
  h1: ({ children }: { children?: React.ReactNode }) => <h1 className="text-xl font-bold mt-4 mb-2 text-stone-800 dark:text-stone-100">{children}</h1>,
  h2: ({ children }: { children?: React.ReactNode }) => <h2 className="text-base font-semibold mt-4 mb-1.5 text-stone-800 dark:text-stone-100">{children}</h2>,
  h3: ({ children }: { children?: React.ReactNode }) => <h3 className="text-sm font-semibold mt-3 mb-1 text-stone-700 dark:text-stone-200">{children}</h3>,
  p:  ({ children }: { children?: React.ReactNode }) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
  ul: ({ children }: { children?: React.ReactNode }) => <ul className="list-disc pl-4 mb-2 space-y-0.5">{children}</ul>,
  ol: ({ children }: { children?: React.ReactNode }) => <ol className="list-decimal pl-4 mb-2 space-y-0.5">{children}</ol>,
  li: ({ children }: { children?: React.ReactNode }) => <li className="leading-relaxed">{children}</li>,
  strong: ({ children }: { children?: React.ReactNode }) => <strong className="font-semibold text-stone-900 dark:text-stone-50">{children}</strong>,
  em: ({ children }: { children?: React.ReactNode }) => <em className="italic">{children}</em>,
  code: ({ children }: { children?: React.ReactNode }) => <code className="font-mono text-xs bg-black/5 dark:bg-white/10 px-1 py-0.5 rounded">{children}</code>,
  pre: ({ children }: { children?: React.ReactNode }) => <pre className="font-mono text-xs bg-black/5 dark:bg-white/10 p-3 rounded-lg overflow-auto my-2">{children}</pre>,
  blockquote: ({ children }: { children?: React.ReactNode }) => <blockquote className="border-l-2 border-sequoia-sage/40 pl-3 italic text-stone-600 dark:text-stone-400 my-2">{children}</blockquote>,
};

export const EducationPage: React.FC = () => {
  const [tab,   setTab]   = useState<Tab>('lessons');
  const [topic, setTopic] = useState('');
  const [grade, setGrade] = useState('');

  // Async flow state
  const [isSubmitting, setIsSubmitting]   = useState(false);
  const [loadingMsg, setLoadingMsg]       = useState('Generating lesson…');
  const [submitError, setSubmitError]     = useState<string | null>(null);
  const [lessonData, setLessonData]       = useState<LessonPayload | null>(null);
  const [puterContent, setPuterContent]   = useState<string | null>(null);
  const [witness, setWitness]             = useState<Witness | null>(null);
  const [verifyResult, setVerifyResult]   = useState<NewtonResult | null>(null);
  const [showCards, setShowCards]         = useState(false);

  const lessonMut = useEducationLesson();
  const verifyMut = useVerify();

  const TABS: { id: Tab; label: string }[] = [
    { id: 'lessons', label: 'Lessons'     },
    { id: 'teks',    label: 'TEKS Search' },
    { id: 'cmfk',    label: 'CMFK Diagnostic' },
  ];

  const handleGenerate = async () => {
    if (!topic.trim() || isSubmitting) return;
    setIsSubmitting(true);
    setSubmitError(null);
    setLessonData(null);
    setPuterContent(null);
    setWitness(null);
    setVerifyResult(null);
    setShowCards(false);

    try {
      // Step 1 — Newton structures the lesson (title + card scaffold)
      setLoadingMsg('Newton structuring lesson…');
      const res = await lessonMut.mutateAsync({
        topic: topic.trim(),
        grade: grade || undefined,
      });
      const stack = res.payload;
      setLessonData(stack);
      setWitness(res.witness);
      setVerifyResult(res.result);

      // Step 2 — puter.js writes real lesson content from Newton's structure
      if (typeof puter !== 'undefined') {
        try {
          setLoadingMsg('Ada writing lesson content…');
          const llmContent = await puterChat(buildTeachPrompt(topic.trim(), stack));

          // Step 3 — Newton verifies the lesson content
          setLoadingMsg('Newton verifying lesson…');
          const verifyRes = await verifyMut.mutateAsync({ content: llmContent });
          setWitness(verifyRes.witness);
          setVerifyResult(verifyRes.result);

          if (verifyRes.result === 'fin') {
            setPuterContent(llmContent);
          }
          // finfr: fall back to Newton card content (already set above)
        } catch {
          // puter.js unavailable — Newton card content already set, show that
        }
      }
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : 'Lesson generation failed — is Newton running?',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

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
          {/* Topic input */}
          <GlassPanel padding="lg">
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && topic.trim() && handleGenerate()}
                placeholder="Topic (e.g. photosynthesis, quadratic equations, the Civil War…)"
                className="flex-1 glass-panel-inset px-3 py-2.5 rounded-xl bg-transparent outline-none text-base text-stone-800 dark:text-stone-100 placeholder:text-stone-400"
                aria-label="Lesson topic"
                disabled={isSubmitting}
              />
              <select
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                className="glass-panel-inset px-3 py-2.5 rounded-xl bg-transparent outline-none text-sm text-stone-700 dark:text-stone-200"
                aria-label="Grade level"
                disabled={isSubmitting}
              >
                <option value="">All Grades</option>
                {GRADES.map((g) => <option key={g} value={g}>Grade {g}</option>)}
              </select>
              <Button
                onClick={handleGenerate}
                loading={isSubmitting}
                disabled={!topic.trim() || isSubmitting}
                leftIcon={<BookOpen size={16} />}
              >
                Generate Lesson
              </Button>
            </div>
          </GlassPanel>

          {/* Loading */}
          {isSubmitting && (
            <div className="py-8 flex justify-center">
              <LoadingTrail message={loadingMsg} size="lg" />
            </div>
          )}

          {/* Error */}
          {submitError && !isSubmitting && (
            <GlassPanel padding="md" status="finfr">
              <p className="text-sm text-sequoia-finfr font-medium">Error</p>
              <p className="text-sm text-stone-600 dark:text-stone-300 mt-1">{submitError}</p>
            </GlassPanel>
          )}

          {/* Result */}
          {lessonData && !isSubmitting && (
            <div className="space-y-4 animate-slide-up">

              {/* puter.js full lesson (preferred) */}
              {puterContent ? (
                <GlassPanel padding="lg" status={verifyResult ?? 'neutral'} className="relative">
                  {verifyResult && (
                    <div className="absolute top-3 right-3">
                      <StatusLight result={verifyResult} showLabel size="sm" />
                    </div>
                  )}
                  <h2 className="heading-lg mb-4 pr-24">{lessonData.title}</h2>
                  <div className="prose prose-stone dark:prose-invert prose-sm max-w-none text-stone-800 dark:text-stone-100">
                    <ReactMarkdown remarkPlugins={[remarkGfm]} components={MD_COMPONENTS}>
                      {puterContent}
                    </ReactMarkdown>
                  </div>

                  {/* Toggle to see Newton's card structure */}
                  <button
                    onClick={() => setShowCards((v) => !v)}
                    className="mt-4 text-xs text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 transition-colors"
                  >
                    {showCards ? 'Hide card structure ↑' : 'Show Newton card structure ↓'}
                  </button>
                  {showCards && (
                    <div className="mt-3 border-t border-black/5 dark:border-white/5 pt-3">
                      <LessonView lesson={lessonData} />
                    </div>
                  )}
                </GlassPanel>
              ) : (
                /* Fallback: Newton card-by-card view */
                <LessonView lesson={lessonData} />
              )}

              {witness && (
                <WitnessCard witness={witness} collapsible defaultOpen={false} />
              )}
            </div>
          )}
        </div>
      )}
    </PageContainer>
  );
};
