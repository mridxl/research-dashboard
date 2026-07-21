import { useCallback, useMemo, useState } from 'react';

import {
  ArrowLeft,
  ArrowRight,
  Baby,
  Check,
  ChevronRight,
  Loader2,
  MessageCircle,
  Save,
  X,
} from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useIsMobile } from '@/hooks/use-mobile';
import type { AssessmentPatientInfo } from '@/lib/api/research';
import {
  DST_CLASSIFICATION_LABELS,
  DST_MAX_SCALE_MONTHS,
  type DSTClassification,
  dstScoreFromItems,
  findNearestBandIndex,
  getBandCompletion,
  getDstAgeBandGroups,
} from '@/lib/assessments/dst-scale';
import { cn } from '@/lib/utils';

import {
  type AssessmentFormProps,
  defaultPatientInfo,
  patientInfoFromSession,
  useAssessmentSave,
} from './types';

export interface DSTFormData {
  patient_info: AssessmentPatientInfo;
  items: Record<string, number>;
  chronological_age_days?: number;
  developmental_age_days?: number;
  chronological_age_months?: number;
  developmental_age_months?: number;
  developmental_quotient?: number | null;
  classification?: DSTClassification | null;
  language_developmental_quotient?: number | null;
  language_classification?: DSTClassification | null;
}

type DSTPhase = 'setup' | 'interview' | 'review';

interface DSTAssessmentPanelProps extends AssessmentFormProps<DSTFormData> {
  sessionPatient?: { name?: string; dob?: string; gender?: string } | null;
}

function classificationBadgeClass(classification: DSTClassification | null | undefined): string {
  switch (classification) {
    case 'normal':
      return 'bg-emerald-500/15 text-emerald-800 border-emerald-500/30 dark:text-emerald-300';
    case 'borderline':
      return 'bg-amber-500/15 text-amber-900 border-amber-500/30 dark:text-amber-200';
    case 'mild_delay':
      return 'bg-orange-500/15 text-orange-900 border-orange-500/30 dark:text-orange-200';
    case 'moderate_delay':
      return 'bg-red-500/15 text-red-900 border-red-500/30 dark:text-red-200';
    case 'severe_delay':
      return 'bg-red-600/20 text-red-950 border-red-600/40 dark:text-red-200';
    default:
      return 'bg-muted text-muted-foreground';
  }
}

export function DSTAssessmentPanel({
  sessionId,
  existingData,
  readOnly,
  onSave,
  sessionPatient,
}: DSTAssessmentPanelProps) {
  const isMobile = useIsMobile();
  const bands = useMemo(() => getDstAgeBandGroups(), []);
  // Seeded once at mount: the sheet keys this panel by session and load state,
  // so fresh data always arrives as a remount rather than an in-place update.
  // A saved assessment with both dates jumps straight to the interview, landing
  // on the band nearest the child's chronological age.
  const [seed] = useState(() => {
    if (!existingData) {
      // First time filling this in — seed from the session rather than blank.
      return {
        patientInfo: patientInfoFromSession(sessionPatient),
        items: {} as Record<string, number>,
        phase: 'setup' as DSTPhase,
        bandIndex: 0,
      };
    }

    const { date_of_birth, assessment_date } = existingData.patient_info;
    const hasDates = Boolean(date_of_birth && assessment_date);
    const scores = hasDates
      ? dstScoreFromItems(existingData.items, date_of_birth, assessment_date)
      : null;

    return {
      patientInfo: { ...defaultPatientInfo, ...existingData.patient_info },
      items: { ...existingData.items },
      phase: (hasDates ? 'interview' : 'setup') as DSTPhase,
      bandIndex: scores ? findNearestBandIndex(scores.chronological_age_months, bands) : 0,
    };
  });

  const [phase, setPhase] = useState<DSTPhase>(seed.phase);
  const [patientInfo, setPatientInfo] = useState<AssessmentPatientInfo>(seed.patientInfo);
  const [items, setItems] = useState<Record<string, number>>(seed.items);
  const [bandIndex, setBandIndex] = useState(seed.bandIndex);
  const { save, isLoading } = useAssessmentSave(sessionId, 'dst', 'DST');

  const scores = dstScoreFromItems(items, patientInfo.date_of_birth, patientInfo.assessment_date);

  const totalItems = useMemo(() => bands.reduce((n, b) => n + b.items.length, 0), [bands]);

  const totalAnswered = useMemo(
    () => Object.values(items).filter(v => v === 0 || v === 1).length,
    [items]
  );

  const overallProgress = Math.round((totalAnswered / totalItems) * 100);

  const currentBand = bands[bandIndex];

  const setItemPass = useCallback((itemKey: string, pass: boolean | null) => {
    setItems(prev => {
      const next = { ...prev };
      if (pass === null) delete next[itemKey];
      else next[itemKey] = pass ? 1 : 0;
      return next;
    });
  }, []);

  const handleStartInterview = () => {
    if (!patientInfo.name?.trim()) {
      toast.error("Please enter the child's name");
      return;
    }
    if (!patientInfo.date_of_birth?.trim()) {
      toast.error('Please enter date of birth');
      return;
    }
    if (!patientInfo.assessment_date?.trim()) {
      toast.error('Please enter the assessment date');
      return;
    }
    setBandIndex(findNearestBandIndex(scores.chronological_age_months, bands));
    setPhase('interview');
  };

  const handleSave = () => {
    if (readOnly) return;
    if (
      !patientInfo.name?.trim() ||
      !patientInfo.date_of_birth?.trim() ||
      !patientInfo.assessment_date?.trim()
    ) {
      toast.error('Complete patient setup before saving');
      setPhase('setup');
      return;
    }
    void save(patientInfo, { items }, onSave);
  };

  // A render function rather than a nested component: defining a component
  // during render remounts it on every parent render.
  const renderScoreStrip = (compact = false) => {
    const caAboveScale =
      scores.chronological_age_months != null &&
      scores.chronological_age_months > DST_MAX_SCALE_MONTHS;
    const allPassed = totalAnswered === totalItems && Object.values(items).every(v => v === 1);

    const cells = [
      {
        label: 'CA',
        value:
          scores.chronological_age_months != null ? `${scores.chronological_age_months} mo` : '—',
      },
      {
        label: 'DA',
        value:
          scores.developmental_age_months != null ? `${scores.developmental_age_months} mo` : '—',
      },
      {
        label: 'DQ',
        value: scores.developmental_quotient ?? '—',
        emphasize: true,
      },
      {
        label: 'Lang',
        value: scores.language_developmental_quotient ?? '—',
      },
    ] as const;

    return (
      <div className={cn('space-y-1.5', compact && 'space-y-1')}>
        <div
          className={cn(
            'grid gap-1.5',
            compact ? 'grid-cols-4' : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5'
          )}
        >
          {cells.map(cell => (
            <div
              key={cell.label}
              className={cn(
                'rounded-md border bg-background/80',
                compact ? 'px-1.5 py-1.5 text-center' : 'px-3 py-2'
              )}
            >
              <p
                className={cn(
                  'font-medium uppercase tracking-wide text-muted-foreground',
                  compact ? 'text-[9px]' : 'text-[10px]'
                )}
              >
                {cell.label}
              </p>
              <p
                className={cn(
                  'font-semibold tabular-nums',
                  compact ? 'text-xs' : 'text-sm',
                  'emphasize' in cell && cell.emphasize && !compact && 'text-lg font-bold'
                )}
              >
                {cell.value}
              </p>
            </div>
          ))}
          {!compact && (
            <div className="rounded-md border bg-background/80 px-3 py-2 sm:col-span-2 lg:col-span-1">
              <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                Result
              </p>
              {scores.classification ? (
                <Badge
                  variant="outline"
                  className={cn('mt-0.5', classificationBadgeClass(scores.classification))}
                >
                  {DST_CLASSIFICATION_LABELS[scores.classification]}
                </Badge>
              ) : (
                <p className="text-sm font-semibold">—</p>
              )}
            </div>
          )}
        </div>
        {compact && scores.classification ? (
          <Badge
            variant="outline"
            className={cn('w-fit text-[10px]', classificationBadgeClass(scores.classification))}
          >
            {DST_CLASSIFICATION_LABELS[scores.classification]}
          </Badge>
        ) : null}
        {caAboveScale && !compact ? (
          <p className="text-xs leading-relaxed text-muted-foreground">
            DST norms cover ages 0–15 years (180 months).{' '}
            {allPassed
              ? 'All milestones passed through the scale ceiling — DQ is reported as normal.'
              : 'Chronological age exceeds the scale; interpret DQ with this limit in mind.'}
          </p>
        ) : null}
      </div>
    );
  };

  if (phase === 'setup') {
    return (
      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto overscroll-contain px-4 py-5 scrollbar-thin sm:gap-5 sm:px-6">
        <div className="shrink-0">
          <h2 className="text-base font-semibold tracking-tight sm:text-lg">DST</h2>
        </div>

        <Card className="shrink-0 gap-0 py-0 shadow-none">
          <CardHeader className="space-y-1 px-3 py-3 sm:px-4 sm:py-4">
            <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
              <Baby className="size-4 shrink-0" />
              Child details
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 px-3 pb-3 sm:grid-cols-2 sm:gap-4 sm:px-4 sm:pb-4">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="dst-name">Name</Label>
              <Input
                id="dst-name"
                value={patientInfo.name}
                onChange={e => setPatientInfo(p => ({ ...p, name: e.target.value }))}
                disabled={readOnly}
                className="h-10 sm:h-9"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Gender</Label>
              <Select
                value={patientInfo.gender}
                onValueChange={v =>
                  setPatientInfo(p => ({ ...p, gender: v as AssessmentPatientInfo['gender'] }))
                }
                disabled={readOnly}
              >
                <SelectTrigger className="h-10 w-full sm:h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                  <SelectItem value="Others">Others</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dst-age">Age</Label>
              <Input
                id="dst-age"
                value={String(patientInfo.age ?? '')}
                onChange={e => setPatientInfo(p => ({ ...p, age: e.target.value }))}
                disabled={readOnly}
                className="h-10 sm:h-9"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dst-dob">Date of birth</Label>
              <Input
                id="dst-dob"
                type="date"
                value={patientInfo.date_of_birth?.slice(0, 10) ?? ''}
                onChange={e => setPatientInfo(p => ({ ...p, date_of_birth: e.target.value }))}
                disabled={readOnly}
                className="h-10 sm:h-9"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dst-dot">Assessment date</Label>
              <Input
                id="dst-dot"
                type="date"
                value={patientInfo.assessment_date?.slice(0, 10) ?? ''}
                onChange={e => setPatientInfo(p => ({ ...p, assessment_date: e.target.value }))}
                disabled={readOnly}
                className="h-10 sm:h-9"
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="dst-notes">Notes</Label>
              <Textarea
                id="dst-notes"
                value={patientInfo.notes ?? ''}
                onChange={e => setPatientInfo(p => ({ ...p, notes: e.target.value }))}
                disabled={readOnly}
                rows={2}
                placeholder="Optional"
              />
            </div>
          </CardContent>
        </Card>

        {!readOnly && (
          <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:flex-wrap">
            <Button
              type="button"
              onClick={handleStartInterview}
              className="h-10 w-full gap-2 sm:h-9 sm:w-auto"
            >
              Start interview
              <ChevronRight className="size-4" />
            </Button>
            {existingData && (
              <Button
                type="button"
                variant="outline"
                onClick={() => setPhase('review')}
                className="h-10 w-full sm:h-9 sm:w-auto"
              >
                View scores
              </Button>
            )}
          </div>
        )}
      </div>
    );
  }

  if (phase === 'review') {
    return (
      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto overscroll-contain px-4 py-5 scrollbar-thin sm:gap-5 sm:px-6">
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-2">
          <div className="min-w-0">
            <h2 className="text-base font-semibold sm:text-lg">DST summary</h2>
            <p className="truncate text-sm text-muted-foreground">{patientInfo.name}</p>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={() => setPhase('interview')}>
            Back
          </Button>
        </div>
        {renderScoreStrip(isMobile)}
        <Card className="gap-0 py-0 shadow-none">
          <CardHeader className="px-3 py-3 sm:px-4">
            <CardTitle className="text-sm sm:text-base">Progress</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 px-3 pb-3 sm:px-4 sm:pb-4">
            <div className="flex justify-between text-sm">
              <span>Items marked</span>
              <span className="font-medium tabular-nums">
                {totalAnswered} / {totalItems}
              </span>
            </div>
            <Progress value={overallProgress} className="h-2" />
          </CardContent>
        </Card>
        {!readOnly && (
          <Button
            type="button"
            onClick={handleSave}
            disabled={isLoading}
            className="h-10 w-full gap-2 sm:h-9 sm:w-fit"
          >
            {isLoading ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            Save assessment
          </Button>
        )}
      </div>
    );
  }

  const bandProgress = currentBand
    ? getBandCompletion(items, currentBand)
    : { answered: 0, total: 0, passed: 0 };

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="shrink-0 space-y-2 border-b bg-background/95 px-4 pt-4 pb-2.5 sm:space-y-3 sm:px-6 sm:pb-3">
        <div className="flex items-center justify-between gap-2">
          <p className="min-w-0 truncate text-sm font-semibold">{patientInfo.name || 'Child'}</p>
          <div className="flex shrink-0 gap-1.5">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 px-2"
              onClick={() => setPhase('setup')}
            >
              Setup
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 px-2"
              onClick={() => setPhase('review')}
            >
              Summary
            </Button>
            {!readOnly && (
              <Button
                type="button"
                size="sm"
                className="h-8 gap-1 px-2.5"
                onClick={handleSave}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Save className="size-3.5" />
                )}
                <span className="hidden xs:inline sm:inline">Save</span>
              </Button>
            )}
          </div>
        </div>
        {renderScoreStrip(isMobile)}
        <div className="space-y-1">
          <div className="flex justify-between text-[10px] text-muted-foreground sm:text-xs">
            <span>
              {totalAnswered}/{totalItems} marked
            </span>
            <span className="tabular-nums">{overallProgress}%</span>
          </div>
          <Progress value={overallProgress} className="h-1.5" />
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-3 px-4 pt-3 pb-4 sm:px-6 lg:flex-row lg:gap-4 lg:pt-4">
        <aside className="hidden w-52 shrink-0 lg:block">
          <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Age bands
          </p>
          <ScrollArea className="h-full pr-2">
            <nav className="space-y-1">
              {bands.map((band, idx) => {
                const prog = getBandCompletion(items, band);
                const complete = prog.answered === prog.total;
                const active = idx === bandIndex;
                return (
                  <button
                    key={band.label}
                    type="button"
                    onClick={() => setBandIndex(idx)}
                    className={cn(
                      'flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm transition-colors',
                      active ? 'bg-primary text-primary-foreground' : 'hover:bg-muted/80',
                      complete && !active && 'text-emerald-700 dark:text-emerald-400'
                    )}
                  >
                    {complete ? (
                      <Check className="size-3.5 shrink-0 opacity-80" />
                    ) : (
                      <span className="size-3.5 shrink-0 rounded-full border border-current opacity-40" />
                    )}
                    <span className="flex-1 truncate font-medium">{band.label}</span>
                    <span
                      className={cn(
                        'text-[10px] tabular-nums',
                        active ? 'opacity-90' : 'text-muted-foreground'
                      )}
                    >
                      {prog.answered}/{prog.total}
                    </span>
                  </button>
                );
              })}
            </nav>
          </ScrollArea>
        </aside>

        <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-3">
          <div className="lg:hidden">
            <Select value={String(bandIndex)} onValueChange={v => setBandIndex(Number(v))}>
              <SelectTrigger className="h-10 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {bands.map((band, idx) => {
                  const prog = getBandCompletion(items, band);
                  return (
                    <SelectItem key={band.label} value={String(idx)}>
                      {band.label} ({prog.answered}/{prog.total})
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {currentBand && (
            <>
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="truncate text-base font-semibold sm:text-xl">
                    {currentBand.label}
                  </h3>
                  <p className="text-[11px] text-muted-foreground sm:text-sm">
                    {bandIndex + 1}/{bands.length} · {bandProgress.passed} pass ·{' '}
                    {bandProgress.answered}/{bandProgress.total}
                  </p>
                </div>
                <div className="flex shrink-0 gap-1.5">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="size-9 p-0 sm:size-8"
                    disabled={bandIndex === 0}
                    onClick={() => setBandIndex(i => i - 1)}
                    aria-label="Previous band"
                  >
                    <ArrowLeft className="size-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="size-9 p-0 sm:size-8"
                    disabled={bandIndex >= bands.length - 1}
                    onClick={() => setBandIndex(i => i + 1)}
                    aria-label="Next band"
                  >
                    <ArrowRight className="size-4" />
                  </Button>
                </div>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain scrollbar-thin">
                <ul className="space-y-2 pb-2 sm:space-y-3 sm:pb-4">
                  {currentBand.items.map(item => {
                    const key = String(item.id);
                    const value = items[key];
                    return (
                      <li
                        key={key}
                        className={cn(
                          'rounded-lg border p-3 transition-colors sm:rounded-xl sm:p-4',
                          value === 1 && 'border-emerald-500/40 bg-emerald-500/5',
                          value === 0 && 'border-red-500/30 bg-red-500/5'
                        )}
                      >
                        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
                          <div className="min-w-0 flex-1 space-y-1.5">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="font-mono text-[10px] text-muted-foreground sm:text-xs">
                                #{item.id}
                              </span>
                              {item.is_language && (
                                <Badge variant="secondary" className="gap-1 px-1.5 text-[10px]">
                                  <MessageCircle className="size-3" />
                                  Lang
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm leading-snug sm:leading-relaxed">{item.text}</p>
                          </div>
                          {!readOnly && (
                            <div className="grid grid-cols-2 gap-2 sm:flex sm:shrink-0 sm:flex-wrap">
                              <Button
                                type="button"
                                size="sm"
                                variant={value === 1 ? 'default' : 'outline'}
                                className={cn(
                                  'h-10 gap-1 sm:h-8 sm:min-w-[4.5rem]',
                                  value === 1 && 'bg-emerald-600 hover:bg-emerald-700'
                                )}
                                onClick={() => setItemPass(key, value === 1 ? null : true)}
                              >
                                <Check className="size-3.5" />
                                Pass
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant={value === 0 ? 'destructive' : 'outline'}
                                className="h-10 gap-1 sm:h-8 sm:min-w-[4.5rem]"
                                onClick={() => setItemPass(key, value === 0 ? null : false)}
                              >
                                <X className="size-3.5" />
                                Fail
                              </Button>
                            </div>
                          )}
                          {readOnly && (
                            <Badge variant={value === 1 ? 'default' : 'secondary'}>
                              {value === 1 ? 'Pass' : value === 0 ? 'Fail' : '—'}
                            </Badge>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>

              <div className="shrink-0 border-t bg-background pt-2.5 sm:pt-3">
                {bandIndex < bands.length - 1 ? (
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="h-10 w-full gap-1 sm:h-8 sm:w-auto sm:ml-auto sm:flex"
                    onClick={() => setBandIndex(i => Math.min(bands.length - 1, i + 1))}
                  >
                    Next band
                    <ArrowRight className="size-4" />
                  </Button>
                ) : (
                  <Button
                    type="button"
                    size="sm"
                    className="h-10 w-full gap-1 sm:h-8 sm:w-auto sm:ml-auto sm:flex"
                    onClick={() => setPhase('review')}
                  >
                    Review & save
                    <ChevronRight className="size-4" />
                  </Button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
