'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Loader2, FileUp, FileText, FlaskConical, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Dialog } from '@/components/ui/dialog';
import { EmptyState } from '@/components/shared/empty-state';
import { PatientPicker, type PickedPatient } from '@/components/shared/patient-picker';
import { formatDate } from '@/lib/utils';
import {
  createLabRequestAction,
  updateLabStatusAction,
  saveLabResultAction,
  getLabFileUrlAction,
} from '@/app/(dashboard)/dashboard/laboratory/actions';
import type { LabTestListItem } from '@/lib/data/clinical';
import type { LaboratoryTestRow } from '@/types/database';

type LabStatus = LaboratoryTestRow['status'];

const STATUS_FLOW: LabStatus[] = [
  'requested',
  'sample_collected',
  'processing',
  'result_ready',
  'reviewed',
];
const STATUS_LABEL: Record<LabStatus, string> = {
  requested: 'Requested',
  sample_collected: 'Sample Collected',
  processing: 'Processing',
  result_ready: 'Result Ready',
  reviewed: 'Reviewed',
};

export function LabManager({
  tests,
  canRequest,
}: {
  tests: LabTestListItem[];
  canRequest: boolean;
}) {
  const router = useRouter();
  const [requesting, setRequesting] = useState(false);
  const [resultFor, setResultFor] = useState<LabTestListItem | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);

  async function advance(t: LabTestListItem) {
    const idx = STATUS_FLOW.indexOf(t.status);
    if (idx < 0 || idx >= STATUS_FLOW.length - 1) return;
    setPendingId(t.id);
    await updateLabStatusAction(t.id, STATUS_FLOW[idx + 1]);
    setPendingId(null);
    router.refresh();
  }

  async function openFile(filePath: string) {
    const res = await getLabFileUrlAction(filePath);
    if (res.ok && res.url) window.open(res.url, '_blank', 'noopener');
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Laboratory</h1>
        {canRequest && (
          <Button onClick={() => setRequesting(true)}>
            <Plus /> New Request
          </Button>
        )}
      </div>

      {tests.length === 0 ? (
        <EmptyState icon={FlaskConical} title="No laboratory requests" />
      ) : (
        <div className="grid gap-2">
          {tests.map((t) => {
            const idx = STATUS_FLOW.indexOf(t.status);
            const canAdvance = idx >= 0 && idx < STATUS_FLOW.length - 1;
            return (
              <Card key={t.id} className="flex flex-wrap items-center gap-3 p-4">
                <div className="min-w-0 flex-1">
                  <p className="font-medium">
                    {t.test_name}
                    {t.priority !== 'routine' && (
                      <Badge variant="warning" className="ml-2 uppercase">{t.priority}</Badge>
                    )}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {t.patient_name} · {formatDate(t.requested_date)}
                    {t.clinical_reason ? ` · ${t.clinical_reason}` : ''}
                  </p>
                </div>
                <Badge variant={t.status === 'reviewed' ? 'success' : 'secondary'}>
                  {STATUS_LABEL[t.status]}
                </Badge>
                <div className="flex flex-wrap gap-1.5">
                  {canAdvance && (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pendingId === t.id}
                      onClick={() => advance(t)}
                    >
                      {pendingId === t.id ? <Loader2 className="animate-spin" /> : null}
                      → {STATUS_LABEL[STATUS_FLOW[idx + 1]]}
                    </Button>
                  )}
                  <Button variant="outline" size="sm" onClick={() => setResultFor(t)}>
                    <FileUp /> {t.has_result ? 'Update result' : 'Add result'}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {requesting && (
        <RequestDialog
          onClose={() => setRequesting(false)}
          onDone={() => {
            setRequesting(false);
            router.refresh();
          }}
        />
      )}

      {resultFor && (
        <ResultDialog
          test={resultFor}
          onOpenFile={openFile}
          onClose={() => setResultFor(null)}
          onDone={() => {
            setResultFor(null);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}

function RequestDialog({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const [patient, setPatient] = useState<PickedPatient | null>(null);
  const [testName, setTestName] = useState('');
  const [reason, setReason] = useState('');
  const [priority, setPriority] = useState<'routine' | 'urgent' | 'stat'>('routine');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit() {
    if (!patient) return setError('Select a patient.');
    if (testName.trim().length < 2) return setError('Enter a test name.');
    setPending(true);
    setError(null);
    const res = await createLabRequestAction({
      patient_id: patient.id,
      test_name: testName,
      clinical_reason: reason,
      priority,
    });
    setPending(false);
    if (res.ok) onDone();
    else setError(res.error ?? 'Unable to submit.');
  }

  return (
    <Dialog open onClose={onClose} title="New laboratory request">
      <div className="space-y-4">
        <PatientPicker selected={patient} onSelect={setPatient} onClear={() => setPatient(null)} />
        {patient && (
          <>
            <div className="space-y-2">
              <Label>Test name *</Label>
              <Input value={testName} onChange={(e) => setTestName(e.target.value)} placeholder="e.g. Full Blood Count" />
            </div>
            <div className="space-y-2">
              <Label>Clinical reason</Label>
              <Input value={reason} onChange={(e) => setReason(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select value={priority} onChange={(e) => setPriority(e.target.value as typeof priority)}>
                <option value="routine">Routine</option>
                <option value="urgent">Urgent</option>
                <option value="stat">STAT</option>
              </Select>
            </div>
            {error && (
              <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
            )}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={onClose}>Cancel</Button>
              <Button onClick={submit} disabled={pending}>
                {pending && <Loader2 className="animate-spin" />} Submit request
              </Button>
            </div>
          </>
        )}
      </div>
    </Dialog>
  );
}

function ResultDialog({
  test,
  onClose,
  onDone,
  onOpenFile,
}: {
  test: LabTestListItem;
  onClose: () => void;
  onDone: () => void;
  onOpenFile: (path: string) => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const formData = new FormData(e.currentTarget);
    formData.set('test_id', test.id);
    formData.set('patient_id', test.patient_id);
    const res = await saveLabResultAction(formData);
    setPending(false);
    if (res.ok) onDone();
    else setError(res.error ?? 'Unable to save result.');
  }

  return (
    <Dialog open onClose={onClose} title={`Result — ${test.test_name}`} description={test.patient_name}>
      <form onSubmit={submit} className="space-y-4">
        <div className="space-y-2">
          <Label>Result summary</Label>
          <textarea
            name="result_summary"
            rows={3}
            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2"><Label>Reference range</Label><Input name="reference_range" /></div>
          <div className="space-y-2"><Label>Interpretation</Label><Input name="interpretation" /></div>
        </div>
        <div className="space-y-2"><Label>Comments</Label><Input name="comments" /></div>
        <div className="space-y-2">
          <Label>Attach result file (PDF, JPG, PNG — max 10 MB)</Label>
          <Input name="file" type="file" accept="application/pdf,image/jpeg,image/png" />
          <p className="text-xs text-muted-foreground">
            Stored privately; shared only via short-lived signed links.
          </p>
        </div>

        {test.result_file_path && (
          <button
            type="button"
            onClick={() => onOpenFile(test.result_file_path as string)}
            className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
          >
            <FileText className="h-4 w-4" /> Open existing file <ExternalLink className="h-3 w-3" />
          </button>
        )}

        {error && (
          <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
        )}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={pending}>
            {pending && <Loader2 className="animate-spin" />} Save result
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
