import { useState } from 'react';

import { Calculator, ClipboardList, Loader2, User } from 'lucide-react';

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
  VANDERBILT_CLASSIFICATION_LABELS,
  VANDERBILT_FREQUENCY_LABELS,
  VANDERBILT_HYPERACTIVITY_ITEMS,
  VANDERBILT_INATTENTION_ITEMS,
  VANDERBILT_PERFORMANCE_ITEMS,
  type VanderbiltClassification,
  vanderbiltScoreFromItems,
} from '@/lib/assessments/vanderbilt-scale';
import { cn } from '@/lib/utils';

import {
  type AssessmentFormProps,
  defaultPatientInfo,
  patientInfoFromSession,
  useAssessmentSave,
} from './types';

function buildEmptyItems(): Record<string, number> {
  return {};
}
function buildEmptyPerformance(): Record<string, number> {
  return {};
}

export interface VanderbiltFormData {
  patient_info: AssessmentPatientInfo;
  items: Record<string, number>;
  performance?: Record<string, number>;
  inattention_count?: number;
  hyperactivity_count?: number;
  classification?: string;
}

interface VanderbiltFormProps extends AssessmentFormProps<VanderbiltFormData> {
  sessionPatient?: { name?: string; dob?: string; gender?: string } | null;
}

export function VanderbiltForm({
  sessionId,
  existingData,
  readOnly,
  onSave,
  sessionPatient,
}: VanderbiltFormProps) {
  // Seeded at mount: the sheet keys this form by session and load state, so
  // fresh data always arrives as a remount rather than an in-place update.
  const [patientInfo, setPatientInfo] = useState<AssessmentPatientInfo>(() =>
    existingData
      ? { ...defaultPatientInfo, ...existingData.patient_info }
      : // First time filling this in — seed from the session rather than blank.
        patientInfoFromSession(sessionPatient)
  );
  const [items, setItems] = useState<Record<string, number>>(() =>
    existingData ? { ...existingData.items } : buildEmptyItems()
  );
  const [performance, setPerformance] = useState<Record<string, number>>(() =>
    existingData ? { ...(existingData.performance || {}) } : buildEmptyPerformance()
  );
  const { save, isLoading } = useAssessmentSave(sessionId, 'vanderbilt', 'Vanderbilt');

  const handlePatientInfoChange = <K extends keyof AssessmentPatientInfo>(
    key: K,
    value: AssessmentPatientInfo[K]
  ) => {
    setPatientInfo(prev => ({ ...prev, [key]: value }));
  };

  const setItem = (key: string, value: number) => {
    setItems(prev => ({ ...prev, [key]: value }));
  };
  const setPerf = (key: string, value: number) => {
    setPerformance(prev => ({ ...prev, [key]: value }));
  };

  const { inattention_count, hyperactivity_count, performance_impairment, classification } =
    vanderbiltScoreFromItems(items, performance);
  const ratedCount = Object.keys(items).filter(
    k => items[k] !== undefined && items[k] !== null
  ).length;

  const handleSave = () => {
    if (readOnly) return;
    void save(patientInfo, { items, performance }, onSave);
  };

  const renderSymptomRow = (
    key: string,
    label: string,
    value: number | undefined,
    setValue: (v: number) => void
  ) => (
    <div
      key={key}
      className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:gap-6 border-b last:border-0"
    >
      <p className="text-sm font-medium leading-snug flex-1 min-w-0 pt-0.5">{label}</p>
      <RadioGroup
        value={value !== undefined ? String(value) : ''}
        onValueChange={v => setValue(Number(v))}
        className="flex w-full flex-wrap justify-start gap-2 md:ml-auto md:w-auto md:shrink-0"
        disabled={readOnly}
      >
        {[0, 1, 2, 3].map(r => {
          const id = `vanderbilt-${key}-${r}`;
          return (
            <Label
              key={r}
              htmlFor={id}
              className={cn(
                'flex cursor-pointer items-center gap-1.5 rounded-md border px-3 py-2 transition-colors select-none whitespace-nowrap text-sm',
                !readOnly && 'hover:bg-muted',
                (value !== undefined ? String(value) : '') === String(r)
                  ? 'border-primary bg-primary/10'
                  : 'border-transparent bg-muted/50'
              )}
            >
              <RadioGroupItem
                value={String(r)}
                id={id}
                className="bg-transparent border-0 shadow-none size-4"
              />
              <span className="font-normal">{r}</span>
            </Label>
          );
        })}
      </RadioGroup>
    </div>
  );

  return (
    // No border/background here: the sheet already provides the frame, and a
    // second one reads as a stray box hugging the panel edges.
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
      <ScrollArea className="flex-1 min-h-0">
        <div className="px-4 py-5 space-y-6 sm:px-6">
          <div className="flex gap-3 items-start">
            <div className="p-2.5 rounded-xl bg-primary/10 shrink-0">
              <ClipboardList className="w-6 h-6 text-primary" />
            </div>
            <div className="space-y-1">
              <h2 className="text-lg font-semibold tracking-tight">
                Vanderbilt ADHD Diagnostic Parent Rating Scale
              </h2>
              <p className="max-w-xl text-sm text-muted-foreground">
                Rate 0–3 (Never / Occasionally / Often / Very Often). Positive = 2 or 3. ADHD
                requires 6+ in a domain plus performance impairment.
              </p>
            </div>
          </div>

          <Separator />

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
                  <Label className="text-muted-foreground">
                    Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
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
                  <Label className="text-muted-foreground">Date of birth</Label>
                  <Input
                    type="date"
                    value={patientInfo.date_of_birth ?? ''}
                    onChange={e => handlePatientInfoChange('date_of_birth', e.target.value)}
                    disabled={readOnly}
                    className="h-9"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground">
                    Assessment date <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    type="date"
                    value={patientInfo.assessment_date ?? ''}
                    onChange={e => handlePatientInfoChange('assessment_date', e.target.value)}
                    disabled={readOnly}
                    className="h-9"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Age</Label>
                  <Input
                    value={String(patientInfo.age ?? '')}
                    onChange={e => handlePatientInfoChange('age', e.target.value)}
                    placeholder="e.g. 6 years"
                    disabled={readOnly}
                    className="h-9"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-muted-foreground">Notes</Label>
                <Textarea
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

          <Card className={cn('border-2 bg-card', readOnly && 'opacity-95')}>
            <CardHeader className="pb-3">
              <div className="flex gap-2 items-center">
                <Calculator className="w-4 h-4 text-muted-foreground" />
                <CardTitle className="text-base">Score summary</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-4 items-center">
                <div className="flex gap-2 items-baseline">
                  <span className="text-sm text-muted-foreground">Inattention (positive)</span>
                  <span className="text-xl font-bold tabular-nums">{inattention_count}</span>
                  <span className="text-xs text-muted-foreground">/ 9</span>
                </div>
                <div className="flex gap-2 items-baseline">
                  <span className="text-sm text-muted-foreground">Hyperactivity (positive)</span>
                  <span className="text-xl font-bold tabular-nums">{hyperactivity_count}</span>
                  <span className="text-xs text-muted-foreground">/ 9</span>
                </div>
                <div className="flex gap-2 items-center">
                  <span className="text-sm text-muted-foreground">Performance impairment</span>
                  <Badge variant={performance_impairment ? 'destructive' : 'secondary'}>
                    {performance_impairment ? 'Yes' : 'No'}
                  </Badge>
                </div>
                <div className="flex gap-2 items-center">
                  <span className="text-sm text-muted-foreground">Classification</span>
                  <Badge variant="outline" className="font-medium">
                    {VANDERBILT_CLASSIFICATION_LABELS[classification as VanderbiltClassification] ??
                      classification}
                  </Badge>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                6+ positive in inattention and/or hyperactivity + performance impairment → ADHD
                type.
              </p>
            </CardContent>
          </Card>

          <div className="p-3 rounded-lg border bg-muted/30">
            <span className="text-sm font-medium text-muted-foreground">Frequency: </span>
            {[0, 1, 2, 3].map(r => (
              <span key={r} className="text-xs mr-3">
                {r}={VANDERBILT_FREQUENCY_LABELS[r]}
              </span>
            ))}
          </div>

          <Card className={cn('overflow-hidden', readOnly && 'opacity-95')}>
            <CardHeader className="pb-3 bg-muted/20">
              <CardTitle className="text-base">Inattention (1–9)</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-0">
              {VANDERBILT_INATTENTION_ITEMS.map(({ key, label }) =>
                renderSymptomRow(key, label, items[key] ?? undefined, v => setItem(key, v))
              )}
            </CardContent>
          </Card>

          <Card className={cn('overflow-hidden', readOnly && 'opacity-95')}>
            <CardHeader className="pb-3 bg-muted/20">
              <CardTitle className="text-base">Hyperactivity/Impulsivity (10–18)</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-0">
              {VANDERBILT_HYPERACTIVITY_ITEMS.map(({ key, label }) =>
                renderSymptomRow(key, label, items[key] ?? undefined, v => setItem(key, v))
              )}
            </CardContent>
          </Card>

          <Card className={cn('overflow-hidden', readOnly && 'opacity-95')}>
            <CardHeader className="pb-3 bg-muted/20">
              <CardTitle className="text-base">Performance (1–5: 4–5 = problem)</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-0">
              {VANDERBILT_PERFORMANCE_ITEMS.map(({ key, label }) => {
                const val = performance[key];
                const value = val >= 1 && val <= 5 ? val : undefined;
                return (
                  <div
                    key={key}
                    className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:gap-6 border-b last:border-0"
                  >
                    <p className="text-sm font-medium leading-snug flex-1 min-w-0 pt-0.5">
                      {label}
                    </p>
                    <RadioGroup
                      value={value !== undefined ? String(value) : ''}
                      onValueChange={v => setPerf(key, Number(v))}
                      className="flex w-full flex-wrap justify-start gap-2 md:ml-auto md:w-auto md:shrink-0"
                      disabled={readOnly}
                    >
                      {[1, 2, 3, 4, 5].map(r => {
                        const id = `vanderbilt-perf-${key}-${r}`;
                        return (
                          <Label
                            key={r}
                            htmlFor={id}
                            className={cn(
                              'flex cursor-pointer items-center gap-1.5 rounded-md border px-3 py-2 transition-colors select-none whitespace-nowrap text-sm',
                              !readOnly && 'hover:bg-muted',
                              (value !== undefined ? String(value) : '') === String(r)
                                ? 'border-primary bg-primary/10'
                                : 'border-transparent bg-muted/50'
                            )}
                          >
                            <RadioGroupItem
                              value={String(r)}
                              id={id}
                              className="bg-transparent border-0 shadow-none size-4"
                            />
                            <span className="font-normal">{r}</span>
                          </Label>
                        );
                      })}
                    </RadioGroup>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      </ScrollArea>

      {/* Pinned so Save stays reachable without scrolling past all the items. */}
      {!readOnly && (
        <div className="flex flex-col-reverse gap-3 px-4 py-3 border-t shrink-0 bg-background sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p className="text-xs text-muted-foreground">
            <span className="font-medium tabular-nums text-foreground">{ratedCount}</span> of 18
            items rated
          </p>
          <Button
            onClick={handleSave}
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
              'Save Vanderbilt assessment'
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
