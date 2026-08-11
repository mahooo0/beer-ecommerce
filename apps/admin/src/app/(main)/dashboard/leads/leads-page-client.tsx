'use client';

import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Inbox, Mail } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { AnalyticsPanel, StatCard } from '@/components/AnalyticsPanel';

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

  const distinctForms = useMemo(
    () => new Set(submissions.map((s) => formName(s.form))).size,
    [submissions],
  );

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">{t('leads.title')}</h1>
      </div>

      <div className="mb-4">
        <AnalyticsPanel title={t('leads.analytics.title')}>
          <div className="grid grid-cols-2 gap-3">
            <StatCard label={t('leads.analytics.total')} value={submissions.length} icon={<Inbox className="h-4 w-4 text-blue-600" />} color="bg-blue-50" />
            <StatCard label={t('leads.analytics.forms')} value={distinctForms} icon={<Mail className="h-4 w-4 text-purple-600" />} color="bg-purple-50" />
          </div>
        </AnalyticsPanel>
      </div>

      <div className="mb-3">
        <Input
          placeholder={t('leads.searchPlaceholder')}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('leads.columns.date')}</TableHead>
              <TableHead>{t('leads.columns.form')}</TableHead>
              <TableHead>{t('leads.columns.data')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((sub) => (
              <TableRow key={String(sub.id)}>
                <TableCell className="whitespace-nowrap align-top text-muted-foreground">{fmtDateTime(sub.createdAt)}</TableCell>
                <TableCell className="align-top font-medium text-foreground">{formName(sub.form)}</TableCell>
                <TableCell>
                  <dl className="grid gap-0.5">
                    {(sub.submissionData || []).map((f, i) => (
                      <div key={i} className="flex gap-2 text-sm">
                        <dt className="min-w-28 shrink-0 text-muted-foreground">{f.field}</dt>
                        <dd className="break-all text-foreground">{f.value}</dd>
                      </div>
                    ))}
                  </dl>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {filtered.length === 0 && (
          <div className="py-12 text-center text-muted-foreground">{t('leads.empty')}</div>
        )}
      </div>
    </div>
  );
}
