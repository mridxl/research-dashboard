import { useMemo, useState } from 'react';

import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Calculator,
  CheckCircle2,
  Circle,
  ClipboardList,
  Loader2,
  ShieldCheck,
  User,
} from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import type { AssessmentPatientInfo } from '@/lib/api/research';
import {
  type FUResponses,
  getElevatedItems,
  MCHAT_R_FOLLOW_UP_FLOWS,
  mchatRFollowUpClassification,
  type MostOften,
} from '@/lib/assessments/mchat-r-follow-up-flows';
import {
  MCHAT_R_CLASSIFICATION_LABELS,
  MCHAT_R_QUESTIONS,
  type MCHATRClassification,
  mchatRScoreFromItems,
  pointToYesNo,
  yesNoToPoint,
} from '@/lib/assessments/mchat-r-scale';
import { cn } from '@/lib/utils';

import { MCHATRFollowUpFlowchart } from './MCHATRFollowUpFlowchart';
import {
  type AssessmentFormProps,
  defaultPatientInfo,
  patientInfoFromSession,
  useAssessmentSave,
} from './types';

/**
 * The follow-up shapes live here rather than in a shared types module: this is
 * the only form that has a two-stage interview. They mirror the middleware's
 * M-CHAT-R follow-up schema.
 */
export interface MCHATRFollowUpItemResult {
  score: number;
  responses: Record<string, boolean | string>;
  most_often?: MostOften | null;
}

export interface MCHATRFollowUp {
  status: 'not_started' | 'in_progress' | 'completed';
  items: Record<string, MCHATRFollowUpItemResult>;
  total_score?: number | null;
  classification?: 'negative' | 'positive' | null;
}

function buildEmptyItems(): Record<string, number> {
  return {};
}

type FormMode = 'screening' | 'follow_up';

export interface MCHATRFormData {
  patient_info: AssessmentPatientInfo;
  items: Record<string, number>;
  total_score?: number;
  classification?: string;
  follow_up?: MCHATRFollowUp;
}

interface MCHATRFormProps extends AssessmentFormProps<MCHATRFormData> {
  sessionPatient?: { name?: string; dob?: string; gender?: string } | null;
}

/**
 * Name / assessment date are validated by the shared save hook; only the
 * "every screening question answered" rule is specific to M-CHAT-R.
 */
function validateScreening(items: Record<string, number>): string | null {
  for (let i = 1; i <= 20; i++) {
    const point = items[String(i)];
    if (point !== 0 && point !== 1) return `Please answer screening question ${i}`;
  }
  return null;
}

export function MCHATRForm({
  sessionId,
  existingData,
  readOnly,
  onSave,
  sessionPatient,
}: MCHATRFormProps) {
  // Seeded once at mount: the sheet keys this form by session and load state, so
  // fresh data always arrives as a remount rather than an in-place update. A
  // completed follow-up reopens in follow-up mode with its answers restored.
  const [seed] = useState(() => {
    const empty = {
      items: buildEmptyItems(),
      fuResponses: {} as Record<number, FUResponses>,
      fuMostOften: {} as Record<number, MostOften | undefined>,
      mode: 'screening' as FormMode,
    };

    if (!existingData) {
      // First time filling this in — seed from the session rather than blank.
      return { ...empty, patientInfo: patientInfoFromSession(sessionPatient) };
    }

    const patientInfo = { ...defaultPatientInfo, ...existingData.patient_info };
    const items = { ...existingData.items };
    const fu = existingData.follow_up;

    if (!fu?.items) {
      return { ...empty, patientInfo, items };
    }

    const fuResponses: Record<number, FUResponses> = {};
    const fuMostOften: Record<number, MostOften | undefined> = {};
    for (const [key, item] of Object.entries(fu.items)) {
      fuResponses[Number(key)] = (item.responses ?? {}) as FUResponses;
      fuMostOften[Number(key)] = item.most_often ?? undefined;
    }

    return {
      patientInfo,
      items,
      fuResponses,
      fuMostOften,
      mode: (fu.status === 'completed' ? 'follow_up' : 'screening') as FormMode,
    };
  });

  const [mode, setMode] = useState<FormMode>(seed.mode);
  const [patientInfo, setPatientInfo] = useState<AssessmentPatientInfo>(seed.patientInfo);
  const [items, setItems] = useState<Record<string, number>>(seed.items);
  const [fuResponses, setFuResponses] = useState<Record<number, FUResponses>>(seed.fuResponses);
  const [fuMostOften, setFuMostOften] = useState<Record<number, MostOften | undefined>>(
    seed.fuMostOften
  );
  const [activeIdx, setActiveIdx] = useState(0);
  const { save, isLoading } = useAssessmentSave(sessionId, 'mchat_r', 'M-CHAT-R');

  const handlePatientInfoChange = <K extends keyof AssessmentPatientInfo>(
    key: K,
    value: AssessmentPatientInfo[K]
  ) => {
    setPatientInfo(prev => ({ ...prev, [key]: value }));
  };

  const setItemYesNo = (itemNum: number, yesNo: 'yes' | 'no') => {
    setItems(prev => ({ ...prev, [String(itemNum)]: yesNoToPoint(itemNum, yesNo) }));
  };

  const { total_score, classification } = mchatRScoreFromItems(items);
  const showContinue = total_score > 2;
  const elevatedItems = useMemo(() => getElevatedItems(items), [items]);

  const itemResults = useMemo(() => {
    const results: Record<number, { score: 0 | 1 | null; needsMostOften: boolean }> = {};
    for (const n of elevatedItems) {
      results[n] = MCHAT_R_FOLLOW_UP_FLOWS[n].resolve(fuResponses[n] ?? {}, fuMostOften[n]);
    }
    return results;
  }, [elevatedItems, fuResponses, fuMostOften]);

  const resolvedCount = elevatedItems.filter(n => itemResults[n]?.score !== null).length;
  const allResolved = elevatedItems.length > 0 && resolvedCount === elevatedItems.length;
  const followUpTotal = elevatedItems.reduce(
    (sum, n) => sum + (itemResults[n]?.score === 1 ? 1 : 0),
    0
  );
  const followUpClassification = mchatRFollowUpClassification(followUpTotal);

  // `follow_up` is optional server-side: only send the key once the interview
  // has actually been started.
  const buildPayload = (followUp?: MCHATRFollowUp) => ({
    items,
    ...(followUp ? { follow_up: followUp } : {}),
  });

  const buildFollowUp = (status: 'in_progress' | 'completed'): MCHATRFollowUp => {
    const fuItems: MCHATRFollowUp['items'] = {};
    for (const n of elevatedItems) {
      const res = itemResults[n];
      if (res?.score === null || res?.score === undefined) continue;
      fuItems[String(n)] = {
        score: res.score,
        responses: (fuResponses[n] ?? {}) as Record<string, boolean | string>,
        ...(fuMostOften[n] ? { most_often: fuMostOften[n] } : {}),
      };
    }
    return {
      status,
      items: fuItems,
      total_score: followUpTotal,
      classification: followUpClassification,
    };
  };

  const handleSaveScreening = () => {
    if (readOnly) return;
    const validationError = validateScreening(items);
    if (validationError) {
      toast.error(validationError);
      return;
    }
    void save(patientInfo, buildPayload(), onSave);
  };

  const handleContinue = () => {
    if (readOnly) return;
    const validationError = validateScreening(items);
    if (validationError) {
      toast.error(validationError);
      return;
    }
    void save(patientInfo, buildPayload(), () => {
      setMode('follow_up');
      setActiveIdx(0);
      toast.info(`${elevatedItems.length} item(s) need follow-up.`);
    });
  };

  const handleSaveFollowUp = (status: 'in_progress' | 'completed') => {
    if (readOnly) return;
    if (status === 'completed' && !allResolved) {
      toast.error('Complete every follow-up item before finishing the interview');
      return;
    }
    void save(patientInfo, buildPayload(buildFollowUp(status)), onSave);
  };

  // -------------------------------------------------------------------------
  // Follow-up wizard view
  // -------------------------------------------------------------------------
  if (mode === 'follow_up') {
    const activeItemNum = elevatedItems[activeIdx];
    const activeFlow = activeItemNum ? MCHAT_R_FOLLOW_UP_FLOWS[activeItemNum] : undefined;

    return (
      // No border/background here: the sheet already provides the frame, and a
      // second one reads as a stray box hugging the panel edges.
      <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
        <ScrollArea className="flex-1 min-h-0">
          <div className="px-4 py-5 space-y-6 sm:px-6">
            <div className="flex flex-wrap gap-3 justify-between items-start">
              <div className="space-y-1">
                <h2 className="text-lg font-semibold tracking-tight">
                  M-CHAT-R/F Follow-Up Interview
                </h2>
                <p className="max-w-xl text-sm text-muted-foreground">
                  Administer the follow-up only for items that were elevated on screening. Walk each
                  flowchart until it resolves to a score of 0 or 1.
                </p>
              </div>
              {!readOnly && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full sm:w-auto"
                  onClick={() => setMode('screening')}
                >
                  <ArrowLeft className="mr-2 w-4 h-4" />
                  Back to screening
                </Button>
              )}
            </div>

            {/* Summary */}
            <Card>
              <CardContent className="flex flex-wrap gap-4 items-center pt-4 text-sm">
                <span>
                  Screening: <strong>{total_score}</strong> / 20
                </span>
                <Badge variant={classification === 'high' ? 'destructive' : 'default'}>
                  {MCHAT_R_CLASSIFICATION_LABELS[classification as MCHATRClassification]}
                </Badge>
                <Separator orientation="vertical" className="h-5" />
                <span>
                  Follow-up progress:{' '}
                  <strong>
                    {resolvedCount} / {elevatedItems.length}
                  </strong>
                </span>
                <span>
                  Follow-up score: <strong>{followUpTotal}</strong>
                </span>
                <Badge
                  variant={followUpClassification === 'positive' ? 'destructive' : 'secondary'}
                >
                  {followUpClassification === 'positive'
                    ? 'Screen positive (≥2)'
                    : 'Screen negative (0–1)'}
                </Badge>
              </CardContent>
            </Card>

            {/* Item navigator */}
            <div className="flex flex-wrap gap-2">
              {elevatedItems.map((n, idx) => {
                const res = itemResults[n];
                const isActive = idx === activeIdx;
                const done = res?.score !== null && res?.score !== undefined;
                return (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setActiveIdx(idx)}
                    className={cn(
                      'flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors',
                      isActive
                        ? 'border-primary bg-primary/10'
                        : 'border-border bg-card hover:bg-muted',
                      done && !isActive && 'border-emerald-500/40'
                    )}
                  >
                    {done ? (
                      <CheckCircle2 className="size-3.5 text-emerald-600" />
                    ) : (
                      <Circle className="size-3.5 text-muted-foreground" />
                    )}
                    Item {n}
                    {done && (
                      <span
                        className={cn(
                          'ml-0.5 rounded px-1 tabular-nums',
                          res?.score === 1 ? 'text-rose-600' : 'text-emerald-600'
                        )}
                      >
                        {res?.score}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <Separator />

            {/* Active flowchart */}
            {activeFlow && (
              <MCHATRFollowUpFlowchart
                flow={activeFlow}
                childName={patientInfo.name}
                responses={fuResponses[activeItemNum] ?? {}}
                mostOften={fuMostOften[activeItemNum]}
                readOnly={readOnly}
                onResponsesChange={r => setFuResponses(prev => ({ ...prev, [activeItemNum]: r }))}
                onMostOftenChange={mo => setFuMostOften(prev => ({ ...prev, [activeItemNum]: mo }))}
              />
            )}

            {/* Final verdict */}
            {allResolved && (
              <>
                <Separator />
                {(() => {
                  const isPositive = followUpClassification === 'positive';
                  const Icon = isPositive ? AlertTriangle : ShieldCheck;
                  const failedItems = elevatedItems.filter(n => itemResults[n]?.score === 1);
                  return (
                    <Card
                      className={cn(
                        'border-2 overflow-hidden',
                        isPositive
                          ? 'border-destructive/40 bg-destructive/5'
                          : 'border-emerald-500/40 bg-emerald-500/5'
                      )}
                    >
                      <CardContent className="space-y-4 p-4 sm:p-5">
                        <div className="flex flex-wrap gap-4 items-center">
                          <div
                            className={cn(
                              'flex justify-center items-center rounded-xl size-12 shrink-0',
                              isPositive ? 'bg-destructive/15' : 'bg-emerald-500/15'
                            )}
                          >
                            <Icon
                              className={cn(
                                'size-6',
                                isPositive ? 'text-destructive' : 'text-emerald-600'
                              )}
                            />
                          </div>
                          <div className="flex-1 min-w-[200px] space-y-0.5">
                            <p className="text-xs font-medium tracking-wide uppercase text-muted-foreground">
                              M-CHAT-R/F final verdict
                            </p>
                            <h3 className="text-xl font-bold tracking-tight">
                              {isPositive ? 'Screen Positive' : 'Screen Negative'}
                            </h3>
                          </div>
                          <div className="text-right">
                            <div className="flex flex-wrap gap-1.5 items-baseline sm:justify-end">
                              <span className="text-3xl font-bold tabular-nums">
                                {followUpTotal}
                              </span>
                              <span className="text-sm text-muted-foreground">
                                item{followUpTotal === 1 ? '' : 's'} failed
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Threshold for positive: 2+
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                          <div className="rounded-lg border bg-card p-3">
                            <p className="text-xs text-muted-foreground">Screening</p>
                            <p className="text-sm font-semibold">
                              {total_score} / 20 ·{' '}
                              {
                                MCHAT_R_CLASSIFICATION_LABELS[
                                  classification as MCHATRClassification
                                ]
                              }
                            </p>
                          </div>
                          <div className="rounded-lg border bg-card p-3">
                            <p className="text-xs text-muted-foreground">Items interviewed</p>
                            <p className="text-sm font-semibold">{elevatedItems.length}</p>
                          </div>
                          <div className="rounded-lg border bg-card p-3">
                            <p className="text-xs text-muted-foreground">Items failed (score 1)</p>
                            <p className="text-sm font-semibold">
                              {failedItems.length > 0
                                ? failedItems.map(n => `#${n}`).join(', ')
                                : 'None'}
                            </p>
                          </div>
                        </div>

                        <div
                          className={cn(
                            'rounded-lg p-3 text-sm',
                            isPositive
                              ? 'bg-destructive/10 text-destructive-foreground'
                              : 'bg-emerald-500/10'
                          )}
                        >
                          <p className="font-medium mb-1">Recommended action</p>
                          <p className="text-muted-foreground">
                            {isPositive
                              ? 'The child has screened positive on the M-CHAT-R/F. Refer for diagnostic evaluation and eligibility evaluation for early intervention as soon as possible.'
                              : 'The child has screened negative on the M-CHAT-R/F. No further action required unless surveillance indicates elevated likelihood for autism. Rescreen at future well-child visits.'}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })()}
              </>
            )}

            <p className="text-xs text-muted-foreground text-center">
              © 2009 Diana Robins, Deborah Fein, & Marianne Barton — Terminology update, March 2025
            </p>
          </div>
        </ScrollArea>

        {/* Pinned so the actions stay reachable without scrolling to the end. */}
        <div className="flex flex-col-reverse gap-3 px-4 py-3 border-t shrink-0 bg-background sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex flex-wrap gap-2 items-center">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 sm:flex-none"
              onClick={() => setActiveIdx(i => Math.max(0, i - 1))}
              disabled={activeIdx === 0}
            >
              <ArrowLeft className="mr-2 w-4 h-4" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 sm:flex-none"
              onClick={() => setActiveIdx(i => Math.min(elevatedItems.length - 1, i + 1))}
              disabled={activeIdx >= elevatedItems.length - 1}
            >
              Next
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
            <p className="text-xs text-muted-foreground">
              <span className="font-medium tabular-nums text-foreground">{resolvedCount}</span> of{' '}
              {elevatedItems.length} follow-up items resolved
            </p>
          </div>
          {!readOnly && (
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center">
              <Button
                variant="outline"
                className="w-full sm:w-auto"
                onClick={() => handleSaveFollowUp('in_progress')}
                disabled={isLoading}
              >
                Save progress
              </Button>
              <Button
                onClick={() => handleSaveFollowUp('completed')}
                disabled={isLoading || !allResolved}
                className="w-full sm:w-auto sm:min-w-[180px]"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                    Saving…
                  </>
                ) : (
                  'Complete follow-up'
                )}
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // Screening view
  // -------------------------------------------------------------------------
  const scoreSummary = (
    <Card
      className={cn(
        'border-2 bg-card',
        classification === 'high' && 'border-destructive/30',
        classification === 'moderate' && 'border-amber-500/30',
        readOnly && 'opacity-95'
      )}
    >
      <CardHeader className="pb-3">
        <div className="flex gap-2 items-center">
          <Calculator className="w-4 h-4 text-muted-foreground" />
          <CardTitle className="text-base">Score summary</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-6 items-center">
          <div className="flex gap-2 items-baseline">
            <span className="text-sm text-muted-foreground">Total score</span>
            <span className="text-2xl font-bold tabular-nums">{total_score}</span>
            <span className="text-xs text-muted-foreground">/ 20</span>
          </div>
          <div className="flex gap-2 items-center">
            <span className="text-sm text-muted-foreground">Classification</span>
            <Badge
              variant={
                classification === 'high'
                  ? 'destructive'
                  : classification === 'moderate'
                    ? 'default'
                    : 'secondary'
              }
              className="font-medium capitalize"
            >
              {MCHAT_R_CLASSIFICATION_LABELS[classification as MCHATRClassification] ??
                classification}
            </Badge>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-2 text-xs text-muted-foreground sm:grid-cols-3">
          <span>0–2: Low likelihood (screen negative)</span>
          <span>3–7: Moderate likelihood (Follow-Up; refer if 2+ elevated)</span>
          <span>8–20: High likelihood (screen positive; refer)</span>
        </div>
        {showContinue && (
          <p className="text-xs text-muted-foreground">
            Score is above 2. Use <strong>Continue Follow-Up</strong> to administer the M-CHAT-R/F
            Follow-Up for the {elevatedItems.length} elevated item(s).
            {classification === 'high' &&
              ' (For high-likelihood scores the follow-up is optional — referral is recommended.)'}
          </p>
        )}
      </CardContent>
    </Card>
  );

  const answeredCount = Object.keys(items).filter(
    k => items[k] !== undefined && items[k] !== null
  ).length;

  return (
    // No border/background here: the sheet already provides the frame, and a
    // second one reads as a stray box hugging the panel edges.
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
      <ScrollArea className="flex-1 min-h-0">
        <div className="px-4 py-5 space-y-6 sm:px-6">
          {/* Header */}
          <div className="flex gap-3 items-start">
            <div className="p-2.5 rounded-xl bg-primary/10 shrink-0">
              <ClipboardList className="w-6 h-6 text-primary" />
            </div>
            <div className="space-y-1">
              <h2 className="text-lg font-semibold tracking-tight">
                M-CHAT-R (Modified Checklist for Autism in Toddlers, Revised)
              </h2>
              <p className="max-w-xl text-sm text-muted-foreground">
                Please answer Yes or No for every question. Keep in mind how your child usually
                behaves. If you have seen your child do the behavior a few times but he or she does
                not usually do it, answer No.
              </p>
            </div>
          </div>

          <Separator />

          {/* Patient / Child details */}
          <Card className={cn(readOnly && 'opacity-95')}>
            <CardHeader className="pb-4">
              <div className="flex gap-2 items-center">
                <User className="w-4 h-4 text-muted-foreground" />
                <CardTitle className="text-base">Patient / Child details</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="mchatr-name" className="text-muted-foreground">
                    Name of the child <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="mchatr-name"
                    value={patientInfo.name}
                    onChange={e => handlePatientInfoChange('name', e.target.value)}
                    placeholder="Child's name"
                    disabled={readOnly}
                    className="h-9"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Gender</Label>
                  <Select
                    value={patientInfo.gender}
                    onValueChange={v =>
                      handlePatientInfoChange('gender', v as AssessmentPatientInfo['gender'])
                    }
                    disabled={readOnly}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                      <SelectItem value="Others">Others</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mchatr-dob" className="text-muted-foreground">
                    Date of birth
                  </Label>
                  <Input
                    id="mchatr-dob"
                    type="date"
                    value={patientInfo.date_of_birth ?? ''}
                    onChange={e => handlePatientInfoChange('date_of_birth', e.target.value)}
                    disabled={readOnly}
                    className="h-9"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mchatr-assessment-date" className="text-muted-foreground">
                    Assessment date <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="mchatr-assessment-date"
                    type="date"
                    value={patientInfo.assessment_date ?? ''}
                    onChange={e => handlePatientInfoChange('assessment_date', e.target.value)}
                    disabled={readOnly}
                    className="h-9"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mchatr-age" className="text-muted-foreground">
                    Age
                  </Label>
                  <Input
                    id="mchatr-age"
                    value={String(patientInfo.age ?? '')}
                    onChange={e => handlePatientInfoChange('age', e.target.value)}
                    placeholder="e.g. 4 or 4 years"
                    disabled={readOnly}
                    className="h-9"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="mchatr-notes" className="text-muted-foreground">
                  Impressions
                </Label>
                <Textarea
                  id="mchatr-notes"
                  value={patientInfo.notes ?? ''}
                  onChange={e => handlePatientInfoChange('notes', e.target.value)}
                  placeholder="Optional"
                  rows={2}
                  disabled={readOnly}
                  className="resize-none"
                />
              </div>
            </CardContent>
          </Card>

          {/* Score summary (top) */}
          {scoreSummary}

          <Separator />

          {/* Questions */}
          <Card className={cn('overflow-hidden', readOnly && 'opacity-95')}>
            <CardHeader className="pb-3 bg-muted/20">
              <CardTitle className="text-base">Questions</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-1">
              {MCHAT_R_QUESTIONS.map((question, idx) => {
                const itemNum = idx + 1;
                const itemKey = String(itemNum);
                const point = items[itemKey];
                const selectedYesNo =
                  point === 0 || point === 1 ? pointToYesNo(itemNum, point) : undefined;
                return (
                  <div
                    key={itemKey}
                    className={cn(
                      'flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:gap-6',
                      'border-b last:border-0',
                      'px-2 -mx-1 rounded-md transition-colors hover:bg-muted/20',
                      idx % 2 === 0 ? 'bg-muted/15' : 'bg-background'
                    )}
                  >
                    <div className="flex gap-2 sm:min-w-[280px] sm:max-w-md flex-1">
                      <span className="flex justify-center items-center w-6 h-6 text-xs font-medium rounded shrink-0 bg-muted text-muted-foreground">
                        {itemNum}
                      </span>
                      <p className="text-sm font-medium leading-snug pt-0.5">{question}</p>
                    </div>
                    <RadioGroup
                      value={selectedYesNo ?? ''}
                      onValueChange={v => setItemYesNo(itemNum, v as 'yes' | 'no')}
                      className="flex w-full flex-wrap justify-start gap-2 md:ml-auto md:w-auto md:shrink-0"
                      disabled={readOnly}
                    >
                      <Label
                        htmlFor={`mchatr-${itemKey}-yes`}
                        className={cn(
                          'flex min-h-10 cursor-pointer items-center gap-1.5 rounded-md border px-3 py-2 transition-colors select-none whitespace-nowrap',
                          !readOnly && 'hover:bg-muted',
                          selectedYesNo === 'yes'
                            ? 'border-primary bg-primary/10'
                            : 'border-transparent bg-muted/50'
                        )}
                      >
                        <RadioGroupItem
                          value="yes"
                          id={`mchatr-${itemKey}-yes`}
                          className="bg-transparent border-0 shadow-none size-4"
                        />
                        <span className="text-sm font-normal">Yes</span>
                      </Label>
                      <Label
                        htmlFor={`mchatr-${itemKey}-no`}
                        className={cn(
                          'flex min-h-10 cursor-pointer items-center gap-1.5 rounded-md border px-3 py-2 transition-colors select-none whitespace-nowrap',
                          !readOnly && 'hover:bg-muted',
                          selectedYesNo === 'no'
                            ? 'border-primary bg-primary/10'
                            : 'border-transparent bg-muted/50'
                        )}
                      >
                        <RadioGroupItem
                          value="no"
                          id={`mchatr-${itemKey}-no`}
                          className="bg-transparent border-0 shadow-none size-4"
                        />
                        <span className="text-sm font-normal">No</span>
                      </Label>
                    </RadioGroup>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Score summary (bottom) */}
          {scoreSummary}

          {readOnly && existingData?.follow_up?.items && (
            <div className="flex flex-col gap-3 pb-4 sm:flex-row sm:justify-end">
              <Button
                variant="outline"
                className="w-full sm:w-auto"
                onClick={() => setMode('follow_up')}
              >
                View follow-up interview
              </Button>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Pinned so the actions stay reachable without scrolling to the end. */}
      {!readOnly && (
        <div className="flex flex-col-reverse gap-3 px-4 py-3 border-t shrink-0 bg-background sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p className="text-xs text-muted-foreground">
            <span className="font-medium tabular-nums text-foreground">{answeredCount}</span> of 20
            questions answered
          </p>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center">
            {showContinue && (
              <Button
                variant="secondary"
                onClick={handleContinue}
                disabled={isLoading}
                size="lg"
                className="w-full sm:w-auto sm:min-w-[180px]"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                    Saving…
                  </>
                ) : (
                  'Continue Follow-Up'
                )}
              </Button>
            )}
            <Button
              onClick={handleSaveScreening}
              disabled={isLoading}
              size="lg"
              className="w-full sm:w-auto sm:min-w-[180px]"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                  Saving…
                </>
              ) : (
                'Save M-CHAT-R assessment'
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
