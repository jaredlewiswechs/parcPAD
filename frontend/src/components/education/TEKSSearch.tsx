import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { GlassPanel } from '@/components/shared/GlassPanel';
import { Button } from '@/components/shared/Button';
import { useEducationTeks } from '@/hooks/useNewton';

const GRADES   = ['K','1','2','3','4','5','6','7','8','9','10','11','12'];
const SUBJECTS = ['Math','Science','English','Social Studies','Technology'];

export const TEKSSearch: React.FC = () => {
  const [query,   setQuery]   = useState('');
  const [subject, setSubject] = useState('');
  const [grade,   setGrade]   = useState('');
  const [search,  setSearch]  = useState<{ q?: string; s?: string; g?: string }>({});

  const { data, isFetching } = useEducationTeks(
    search.q,
    search.s,
    search.g,
  );

  const results = data?.payload?.results ?? [];

  const doSearch = () => setSearch({ q: query || undefined, s: subject || undefined, g: grade || undefined });

  return (
    <div className="space-y-4">
      <GlassPanel padding="lg">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 flex items-center gap-2 glass-panel-inset px-3 py-2.5 rounded-xl">
            <Search size={16} className="text-stone-400 shrink-0" aria-hidden />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && doSearch()}
              placeholder="Search TEKS standards…"
              className="flex-1 bg-transparent outline-none text-base text-stone-800 dark:text-stone-100 placeholder:text-stone-400"
              aria-label="TEKS search query"
            />
          </div>
          <select
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="glass-panel-inset px-3 py-2.5 rounded-xl bg-transparent outline-none text-sm text-stone-700 dark:text-stone-200"
            aria-label="Subject filter"
          >
            <option value="">All Subjects</option>
            {SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select
            value={grade}
            onChange={(e) => setGrade(e.target.value)}
            className="glass-panel-inset px-3 py-2.5 rounded-xl bg-transparent outline-none text-sm text-stone-700 dark:text-stone-200"
            aria-label="Grade filter"
          >
            <option value="">All Grades</option>
            {GRADES.map((g) => <option key={g} value={g}>Grade {g}</option>)}
          </select>
          <Button onClick={doSearch} loading={isFetching} leftIcon={<Search size={16} />}>
            Search
          </Button>
        </div>
      </GlassPanel>

      {results.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm text-stone-400">{results.length} standards found</p>
          {results.map((std) => (
            <GlassPanel key={std.code} padding="md" className="animate-fade-in">
              <div className="flex items-start gap-3">
                <span className="font-mono text-sm font-bold text-sequoia-sky shrink-0 mt-0.5">
                  {std.code}
                </span>
                <div>
                  <p className="text-sm text-stone-700 dark:text-stone-200">{std.description}</p>
                  {std.keywords && std.keywords.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {std.keywords.map((kw) => (
                        <span key={kw} className="text-xs px-1.5 py-0.5 rounded-md bg-black/5 dark:bg-white/8 text-stone-500">
                          {kw}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </GlassPanel>
          ))}
        </div>
      )}

      {Object.keys(search).length > 0 && results.length === 0 && !isFetching && (
        <p className="text-center text-stone-400 py-8">No standards found. Try a different query.</p>
      )}
    </div>
  );
};
