import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useMutation } from '@/hooks/useMutation';
import {
  type ClinicianDiagnosis,
  type GroundTruth,
  putSessionGroundTruth,
} from '@/lib/api/research';
import { groundTruthSchema } from '@/lib/validations/groundTruth';

const DIAGNOSIS_OPTIONS: { value: ClinicianDiagnosis; label: string }[] = [
  { value: 'autistic', label: 'Autistic' },
  { value: 'not_autistic', label: 'Not autistic' },
  { value: 'uncertain', label: 'Uncertain' },
];

// Sentinel for "no selection" — Radix Select items cannot use an empty string value.
const DIAGNOSIS_UNSET = 'unset';

interface GroundTruthDialogProps {
  sessionId: string;
  participantName?: string;
  initial: GroundTruth | null | undefined;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const GroundTruthDialog = ({
  sessionId,
  participantName,
  initial,
  open,
  onOpenChange,
}: GroundTruthDialogProps) => {
  // Seeded at mount: the parent unmounts this dialog when it closes and keys it
  // by session, so a fresh session always gets a fresh form.
  const [diagnosis, setDiagnosis] = useState<string>(
    initial?.clinician_diagnosis ?? DIAGNOSIS_UNSET
  );
  const [notes, setNotes] = useState(initial?.notes ?? '');
  const [validationError, setValidationError] = useState<string | null>(null);

  const saveMutation = useMutation({
    mutationFn: (payload: GroundTruth) => putSessionGroundTruth(sessionId, payload),
    showSuccessToast: true,
    successMessage: 'Ground truth saved',
    invalidateQueries: ['researchSessions'],
    onSuccess: () => onOpenChange(false),
  });

  const handleSave = () => {
    const parsed = groundTruthSchema.safeParse({
      schema_version: initial?.schema_version ?? 1,
      clinician_diagnosis: diagnosis === DIAGNOSIS_UNSET ? null : diagnosis,
      notes: notes.trim() === '' ? null : notes.trim(),
    });

    if (!parsed.success) {
      setValidationError(parsed.error.issues[0]?.message ?? 'Invalid ground truth data');
      return;
    }

    setValidationError(null);
    saveMutation.mutate(parsed.data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Ground Truth</DialogTitle>
          <DialogDescription>
            Clinical labels for{' '}
            {participantName ? (
              <span className="capitalize">{participantName}</span>
            ) : (
              'this session'
            )}
            . Editable any time — labels often arrive after the session.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="clinician-diagnosis">Clinician diagnosis</Label>
            <Select value={diagnosis} onValueChange={setDiagnosis}>
              <SelectTrigger id="clinician-diagnosis" className="w-full">
                <SelectValue placeholder="Not recorded" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={DIAGNOSIS_UNSET}>Not recorded</SelectItem>
                {DIAGNOSIS_OPTIONS.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="ground-truth-notes">Notes</Label>
            <Textarea
              id="ground-truth-notes"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="CARS2 / INCLEN scores, assessment details, etc."
              rows={4}
              maxLength={2000}
            />
          </div>

          {validationError && <p className="text-sm text-destructive">{validationError}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saveMutation.isPending}>
            {saveMutation.isPending ? 'Saving...' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
