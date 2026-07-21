import { useState } from 'react';

import { CheckCircle2, ClipboardCheck, Loader2 } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { useMutation } from '@/hooks/useMutation';
import { type GroundTruth, putSessionGroundTruth } from '@/lib/api/research';
import {
  CUSTOM_RESULT_PARAGRAPH_MAX_LENGTH,
  getPsychEvalOutcomeLabel,
  PSYCH_EVAL_CUSTOM_GROUP,
  PSYCH_EVAL_OUTCOME_GROUPS,
  type PsychEvalOutcome,
  togglePsychEvalOutcome,
} from '@/lib/assessments/outcomes';
import { cn } from '@/lib/utils';
import { groundTruthSchema } from '@/lib/validations/groundTruth';

interface ClinicalEvaluationPanelProps {
  sessionId: string;
  initial: GroundTruth | null | undefined;
  readOnly?: boolean;
  onSaved?: () => void;
}

/**
 * Ground-truth labelling for a research session.
 *
 * Deliberately narrower than the internal dashboard's psych-eval tab: presenting
 * concerns, behavioural observations and recommendations are omitted because the
 * research dashboard records labels for analysis, not consultation reports.
 */
export const ClinicalEvaluationPanel = ({
  sessionId,
  initial,
  readOnly = false,
  onSaved,
}: ClinicalEvaluationPanelProps) => {
  const [outcomes, setOutcomes] = useState<PsychEvalOutcome[]>(initial?.outcome_codes ?? []);
  const [customParagraph, setCustomParagraph] = useState(initial?.custom_result_paragraph ?? '');
  const [notes, setNotes] = useState(initial?.notes ?? '');
  const [validationError, setValidationError] = useState<string | null>(null);

  const saveMutation = useMutation({
    mutationFn: (payload: GroundTruth) => putSessionGroundTruth(sessionId, payload),
    showSuccessToast: true,
    successMessage: 'Ground truth saved',
    invalidateQueries: ['researchSessions'],
    onSuccess: () => onSaved?.(),
  });

  const isCustom = outcomes.includes('custom');

  const handleToggle = (code: PsychEvalOutcome) => {
    if (readOnly) return;
    setOutcomes(prev => togglePsychEvalOutcome(prev, code));
    setValidationError(null);
  };

  const handleSave = () => {
    if (readOnly) return;

    const parsed = groundTruthSchema.safeParse({
      schema_version: initial?.schema_version ?? 1,
      // Never written going forward — preserved so an old session keeps its
      // original label instead of silently losing it on the next save.
      clinician_diagnosis: initial?.clinician_diagnosis ?? null,
      outcome_codes: outcomes.length > 0 ? outcomes : null,
      custom_result_paragraph:
        isCustom && customParagraph.trim() !== '' ? customParagraph.trim() : null,
      notes: notes.trim() === '' ? null : notes.trim(),
    });

    if (!parsed.success) {
      setValidationError(parsed.error.issues[0]?.message ?? 'Invalid ground truth data');
      return;
    }

    setValidationError(null);
    saveMutation.mutate(parsed.data as GroundTruth);
  };

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
      <ScrollArea className="flex-1 min-h-0">
        <div className="px-4 py-5 space-y-6 sm:px-6">
          <div className="flex gap-3 items-start">
            <div className="p-2.5 rounded-xl bg-primary/10 shrink-0">
              <ClipboardCheck className="w-6 h-6 text-primary" />
            </div>
            <div className="space-y-1">
              <h2 className="text-lg font-semibold tracking-tight">Clinical evaluation</h2>
              <p className="max-w-xl text-sm text-muted-foreground">
                Ground-truth labels for this session. Editable any time — labels often arrive after
                the session.
              </p>
            </div>
          </div>

          {initial?.clinician_diagnosis && !initial?.outcome_codes?.length && (
            <div className="p-3 text-sm rounded-lg border border-amber-500/30 bg-amber-500/5">
              Previously labelled as{' '}
              <span className="font-medium">
                {getPsychEvalOutcomeLabel(initial.clinician_diagnosis)}
              </span>
              . Pick from the outcomes below to record it on the current scale.
            </div>
          )}

          <Separator />

          <Card>
            <CardHeader className="pb-4">
              <div className="flex gap-2 items-center">
                <CheckCircle2 className="w-4 h-4 text-muted-foreground" />
                <CardTitle className="text-base">Outcome</CardTitle>
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Select one or more clinical outcomes.
              </p>
            </CardHeader>
            <CardContent className="space-y-5">
              {[...PSYCH_EVAL_OUTCOME_GROUPS, PSYCH_EVAL_CUSTOM_GROUP].map(group => (
                <div key={group.label} className="space-y-3">
                  <div className="text-sm font-semibold text-foreground">{group.label}</div>
                  <div
                    className={cn(
                      'grid gap-3',
                      group.options.length > 1 ? 'md:grid-cols-2' : 'grid-cols-1'
                    )}
                  >
                    {group.options.map(option => {
                      const isSelected = outcomes.includes(option.value);
                      return (
                        <label
                          key={option.value}
                          htmlFor={`outcome-${option.value}`}
                          className={cn(
                            'relative flex rounded-lg border p-4 transition-all',
                            !readOnly && 'cursor-pointer hover:border-primary/50',
                            isSelected
                              ? 'border-primary bg-primary/5'
                              : 'border-muted bg-muted/30 hover:bg-muted/50'
                          )}
                        >
                          <Checkbox
                            id={`outcome-${option.value}`}
                            checked={isSelected}
                            disabled={readOnly}
                            onCheckedChange={() => handleToggle(option.value)}
                            className="mt-0.5 mr-3 shrink-0"
                          />
                          <div className="flex-1 space-y-2">
                            <div className="flex gap-2 items-center">
                              <Badge variant="secondary" className="text-sm font-semibold">
                                {option.label}
                              </Badge>
                              {isSelected && <CheckCircle2 className="w-4 h-4 text-primary" />}
                            </div>
                            <p className="text-sm leading-relaxed text-muted-foreground">
                              {option.description}
                            </p>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}

              {isCustom && (
                <div className="space-y-2">
                  <Label htmlFor="custom-result-paragraph" className="text-sm font-semibold">
                    Custom paragraph <span className="text-destructive">*</span>
                  </Label>
                  <Textarea
                    id="custom-result-paragraph"
                    placeholder="Record the clinical conclusion in your own words…"
                    value={customParagraph}
                    onChange={e => setCustomParagraph(e.target.value)}
                    className="min-h-[140px] resize-y"
                    rows={6}
                    maxLength={CUSTOM_RESULT_PARAGRAPH_MAX_LENGTH}
                    disabled={readOnly}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base">Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                id="ground-truth-notes"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Assessment details, referral context, etc."
                rows={4}
                maxLength={2000}
                disabled={readOnly}
              />
            </CardContent>
          </Card>
        </div>
      </ScrollArea>

      {/* Pinned so Save and any validation error stay visible while scrolling. */}
      {!readOnly && (
        <div className="flex flex-col-reverse gap-3 px-4 py-3 border-t shrink-0 bg-background sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p
            className={cn(
              'text-xs',
              validationError ? 'text-destructive' : 'text-muted-foreground'
            )}
          >
            {validationError ??
              (outcomes.length === 0
                ? 'No outcome selected — saving will clear the label.'
                : `${outcomes.length} outcome${outcomes.length === 1 ? '' : 's'} selected`)}
          </p>
          <Button
            onClick={handleSave}
            disabled={saveMutation.isPending}
            size="lg"
            className="w-full sm:w-auto sm:min-w-[180px]"
          >
            {saveMutation.isPending ? (
              <>
                <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                Saving…
              </>
            ) : (
              'Save clinical evaluation'
            )}
          </Button>
        </div>
      )}
    </div>
  );
};
