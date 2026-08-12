'use client';

import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Mail, CalendarClock, Inbox } from 'lucide-react';
import { Input } from '@/components/ui/input';

export interface AdminSubmission {
  id: number | string;
  form?: { id: number | string; title?: string | null } | number | string | null;
  submissionData?: Array<{ field?: string | null; value?: string | null }> | null;
  createdAt?: string | null;
}

function formName(f: AdminSubmission['form']): string {
  if (f && typeof f === 'object') return f.title || String(f.id);
  return f != null ? String(f) : '—';
}

function fmtDateTime(iso?: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleString();
}

function fieldLabel(key?: string | null): string {
  if (!key) return '';
  return key.charAt(0).toUpperCase() + key.slice(1);
}

export function LeadsPageClient({ submissions }: { submissions: AdminSubmission[] }) {
  const { t } = useTranslation();
  const [q, setQ] = useState('');

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return submissions;
    return submissions.filter(
      (sub) =>
        formName(sub.form).toLowerCase().includes(s) ||
        (sub.submissionData || []).some(
          (f) => (f.value || '').toLowerCase().includes(s) || (f.field || '').toLowerCase().includes(s),
        ),
    );
  }, [submissions, q]);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-foreground">
          {t('leads.title')}
          <span className="ml-2 text-base font-normal text-muted-foreground">({submissions.length})</span>
        </h1>
        <Input
          placeholder={t('leads.searchPlaceholder')}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="max-w-xs"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed bg-card py-16 text-center text-muted-foreground">
          <Inbox className="mb-2 h-8 w-8 opacity-50" />
          {t('leads.empty')}
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map((sub) => (
            <div key={String(sub.id)} className="rounded-lg border bg-card p-4 shadow-sm">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b pb-2.5">
                <span className="inline-flex items-center gap-1.5 font-medium text-foreground">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  {formName(sub.form)}
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                  <CalendarClock className="h-3.5 w-3.5" />
                  {fmtDateTime(sub.createdAt)}
                </span>
              </div>
              <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
                {(sub.submissionData || []).map((f, i) => (
                  <div key={i} className="min-w-0">
                    <dt className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{fieldLabel(f.field)}</dt>
                    <dd className="break-words text-sm text-foreground">{f.value || '—'}</dd>
                  </div>
                ))}
              </dl>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
