import { useMemo, useState } from 'react';

import { Calculator, ClipboardList, Loader2, User } from 'lucide-react';
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
  AIIMS_RESPONSE_LABELS,
  AIIMS_SECTION_A_ITEMS,
  AIIMS_SECTION_A_KEYS,
  AIIMS_SECTION_B_ITEMS,
  aiimsAsdPresent,
  aiimsItemAppliesToAge,
  type AIIMSSectionB,
} from '@/lib/assessments/aiims-scale';
import { cn } from '@/lib/utils';

import {
  type AssessmentFormProps,
  defaultPatientInfo,
  patientInfoFromSession,
  useAssessmentSave,
} from './types';

function buildEmptySectionA(): Record<string, number> {
  return {};
}

function parseAgeYears(age: string | number | undefined): number | undefined {
  if (age === undefined || age === null) return undefined;
  const s = String(age).trim();
  if (!s) return undefined;
  const n = parseFloat(s);
  if (!Number.isNaN(n)) return n;
  const match = s.match(/(\d+(?:\.\d+)?)/);
  return match ? parseFloat(match[1]) : undefined;
}

export interface AIIMSFormData {
  patient_info: AssessmentPatientInfo;
  section_a: Record<string, number>;
  section_b?: AIIMSSectionB;
  asd_present?: boolean;
}

interface AIIMSFormProps extends AssessmentFormProps<AIIMSFormData> {
  sessionPatient?: { name?: string; dob?: string; gender?: string } | null;
}

export function AIIMSForm({
  sessionId,
  existingData,
  readOnly,
  onSave,
  sessionPatient,
}: AIIMSFormProps) {
  // Seeded at mount: the sheet keys this form by session and load state, so
  // fresh data always arrives as a remount rather than an in-place update.
  const [patientInfo, setPatientInfo] = useState<AssessmentPatientInfo>(() =>
    existingData
      ? { ...defaultPatientInfo, ...existingData.patient_info }
      : // First time filling this in — seed from the session rather than blank.
        patientInfoFromSession(sessionPatient)
  );
  const [sectionA, setSectionA] = useState<Record<string, number>>(() =>
    existingData ? { ...existingData.section_a } : buildEmptySectionA()
  );
  const [sectionB, setSectionB] = useState<AIIMSSectionB>(() =>
    existingData ? { ...(existingData.section_b || {}) } : {}
  );
  const { save, isLoading } = useAssessmentSave(sessionId, 'aiims', 'AIIMS');

  const ageYears = useMemo(() => parseAgeYears(patientInfo.age), [patientInfo.age]);

  const asd_present = aiimsAsdPresent(sectionA, sectionB);

  const handlePatientInfoChange = <K extends keyof AssessmentPatientInfo>(
    key: K,
    value: AssessmentPatientInfo[K]
  ) => {
    setPatientInfo(prev => ({ ...prev, [key]: value }));
  };

  const setSectionAValue = (key: string, value: number) => {
    setSectionA(prev => ({ ...prev, [key]: value }));
  };

  const setSectionBValue = (key: string, value: number | string) => {
    setSectionB(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    if (readOnly) return;
    // AIIMS additionally requires age: the server-side validator rejects a blank
    // age and the form uses it to pick the age-conditional question variants.
    const ageStr = String(patientInfo.age ?? '').trim();
    if (!ageStr) {
      toast.error("Please enter the child's age (required for age-based questions)");
      return;
    }
    const payloadSectionB: Record<string, number | string> = {
      ...sectionB,
      '9': sectionB['9'] ?? '',
    };
    void save(patientInfo, { section_a: sectionA, section_b: payloadSectionB }, onSave);
  };

  const answeredCount = AIIMS_SECTION_A_KEYS.filter(
    k => sectionA[k] !== undefined && sectionA[k] !== null
  ).length;

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
                AIIMS Modified INDT-ASD Diagnostic Evaluation for ASD (DSM-5)
              </h2>
              <p className="max-w-xl text-sm text-muted-foreground">
                Section A: Ask / Observe / Yes / No / Unsure. Age is required for age-based question
                variants. Complete Section B (1–9) based on responses from Section A.
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
                  <Label className="text-muted-foreground">
                    Age <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    value={String(patientInfo.age ?? '')}
                    onChange={e => handlePatientInfoChange('age', e.target.value)}
                    placeholder="e.g. 4 or 4 years"
                    disabled={readOnly}
                    className="h-9"
                  />
                  <p className="text-xs text-muted-foreground">
                    Required. Used to show the correct question for &lt;4 years vs 4+ years.
                  </p>
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
                <CardTitle className="text-base">Summary</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 items-center">
                <span className="text-sm text-muted-foreground">ASD present (DSM-5)</span>
                <Badge variant={asd_present ? 'destructive' : 'secondary'}>
                  {asd_present ? 'Yes' : 'No'}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Separator />

          <Card className={cn('overflow-hidden', readOnly && 'opacity-95')}>
            <CardHeader className="pb-3 bg-muted/20">
              <CardTitle className="text-base">
                Section A – Ask / Observe / Yes / No / Unsure
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-4 min-w-0">
                {AIIMS_SECTION_A_ITEMS.map((item, idx) => {
                  const applies = aiimsItemAppliesToAge(item, ageYears);
                  const value =
                    sectionA[item.key] === 0 || sectionA[item.key] === 1 || sectionA[item.key] === 2
                      ? sectionA[item.key]
                      : undefined;
                  const showAlt = item.askTextAlt && item.ageConditionAlt;
                  const appliesAlt =
                    item.ageConditionAlt === '>=4'
                      ? (ageYears ?? 0) >= 4
                      : item.ageConditionAlt === '<4'
                        ? (ageYears ?? 99) < 4
                        : false;
                  return (
                    <div
                      key={item.key}
                      className={cn(
                        'flex flex-col gap-3 py-3 border-b last:border-0 px-2 -mx-1 rounded-md hover:bg-muted/20',
                        idx % 2 === 0 ? 'bg-muted/15' : 'bg-background'
                      )}
                    >
                      <div className="flex gap-2 items-start">
                        <span className="flex justify-center items-center w-12 h-6 text-xs font-medium rounded shrink-0 bg-muted text-muted-foreground">
                          {item.key}
                        </span>
                        <div className="flex-1 space-y-1">
                          {showAlt ? (
                            <>
                              <p className="text-sm leading-snug">
                                <span className={cn(applies && 'font-medium')}>
                                  (Child &lt;4 years) {item.askText}
                                  {applies && ' ← applies'}
                                </span>
                              </p>
                              <p className="text-sm leading-snug">
                                <span className={cn(appliesAlt && 'font-medium')}>
                                  (Child ≥4 years) {item.askTextAlt}
                                  {appliesAlt && ' ← applies'}
                                </span>
                              </p>
                            </>
                          ) : (
                            <p className="text-sm leading-snug">{item.askText}</p>
                          )}
                          {item.observeText ? (
                            <p className="text-xs text-muted-foreground italic">
                              Observe: {item.observeText}
                            </p>
                          ) : null}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 md:ml-14">
                        <RadioGroup
                          value={value !== undefined ? String(value) : ''}
                          onValueChange={v => setSectionAValue(item.key, Number(v))}
                          className="flex flex-wrap gap-2"
                          disabled={readOnly}
                        >
                          {[0, 1, 2].map(r => {
                            const id = `aiims-a-${item.key}-${r}`;
                            return (
                              <Label
                                key={r}
                                htmlFor={id}
                                className={cn(
                                  'flex min-h-10 cursor-pointer items-center gap-1.5 rounded-md border px-3 py-2 transition-colors select-none whitespace-nowrap text-sm',
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
                                <span className="font-normal">{AIIMS_RESPONSE_LABELS[r]}</span>
                              </Label>
                            );
                          })}
                        </RadioGroup>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card className={cn('overflow-hidden', readOnly && 'opacity-95')}>
            <CardHeader className="pb-3 bg-muted/20">
              <div className="flex gap-3 items-center">
                <span className="flex justify-center items-center w-8 h-8 text-sm font-semibold rounded-full shrink-0 bg-primary/10 text-primary">
                  B
                </span>
                <CardTitle className="text-base">
                  Section B (1–9) – Complete based on responses from Section A
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-4 space-y-1">
              {AIIMS_SECTION_B_ITEMS.map(({ key, label }, idx) => {
                if (key === '9') {
                  const val = sectionB['9'] ?? '';
                  return (
                    <div
                      key={key}
                      className={cn(
                        'flex flex-col gap-3 py-4 sm:flex-row sm:items-start sm:gap-6',
                        'border-b last:border-0',
                        'px-2 -mx-1 rounded-md transition-colors hover:bg-muted/20',
                        idx % 2 === 0 ? 'bg-muted/15' : 'bg-background'
                      )}
                    >
                      <div className="flex gap-2 sm:min-w-[280px] sm:max-w-md">
                        <span className="flex justify-center items-center w-6 h-6 text-xs font-medium rounded shrink-0 bg-muted text-muted-foreground">
                          {key}
                        </span>
                        <Label className="text-sm font-medium leading-snug pt-0.5 text-foreground">
                          {label}
                        </Label>
                      </div>
                      <div className="w-full min-w-0 sm:flex-1">
                        <Textarea
                          value={typeof val === 'string' ? val : ''}
                          onChange={e => setSectionBValue('9', e.target.value)}
                          placeholder="Additional notes"
                          rows={3}
                          disabled={readOnly}
                          className="resize-none min-w-0"
                        />
                      </div>
                    </div>
                  );
                }
                const raw = sectionB[key as '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8'];
                const value = raw === 0 || raw === 1 ? raw : undefined;
                return (
                  <div
                    key={key}
                    className={cn(
                      'flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:gap-6',
                      'border-b last:border-0',
                      'px-2 -mx-1 rounded-md transition-colors hover:bg-muted/20',
                      idx % 2 === 0 ? 'bg-muted/15' : 'bg-background'
                    )}
                  >
                    <div className="flex gap-2 sm:min-w-[280px] sm:max-w-md">
                      <span className="flex justify-center items-center w-6 h-6 text-xs font-medium rounded shrink-0 bg-muted text-muted-foreground">
                        {key}
                      </span>
                      <p className="text-sm font-medium leading-snug pt-0.5">{label}</p>
                    </div>
                    <RadioGroup
                      value={value !== undefined ? String(value) : ''}
                      onValueChange={v => setSectionBValue(key, Number(v))}
                      className="flex w-full flex-wrap justify-start gap-1 md:ml-auto md:w-auto md:shrink-0 sm:gap-2"
                      disabled={readOnly}
                    >
                      <Label
                        htmlFor={`aiims-b-${key}-0`}
                        className={cn(
                          'flex min-h-10 cursor-pointer items-center gap-1.5 rounded-md border px-2.5 py-1.5 transition-colors select-none whitespace-nowrap',
                          !readOnly && 'hover:bg-muted',
                          (value !== undefined ? String(value) : '') === '0'
                            ? 'border-primary bg-primary/10'
                            : 'border-transparent bg-muted/50'
                        )}
                      >
                        <RadioGroupItem
                          value="0"
                          id={`aiims-b-${key}-0`}
                          className="bg-transparent border-0 shadow-none size-4"
                        />
                        <span className="text-xs font-normal">0</span>
                      </Label>
                      <Label
                        htmlFor={`aiims-b-${key}-1`}
                        className={cn(
                          'flex min-h-10 cursor-pointer items-center gap-1.5 rounded-md border px-2.5 py-1.5 transition-colors select-none whitespace-nowrap',
                          !readOnly && 'hover:bg-muted',
                          (value !== undefined ? String(value) : '') === '1'
                            ? 'border-primary bg-primary/10'
                            : 'border-transparent bg-muted/50'
                        )}
                      >
                        <RadioGroupItem
                          value="1"
                          id={`aiims-b-${key}-1`}
                          className="bg-transparent border-0 shadow-none size-4"
                        />
                        <span className="text-xs font-normal">1</span>
                      </Label>
                    </RadioGroup>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      </ScrollArea>

      {/* Pinned so the actions stay reachable without scrolling to the end. */}
      {!readOnly && (
        <div className="flex flex-col-reverse gap-3 px-4 py-3 border-t shrink-0 bg-background sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p className="text-xs text-muted-foreground">
            <span className="font-medium tabular-nums text-foreground">{answeredCount}</span> of{' '}
            {AIIMS_SECTION_A_KEYS.length} Section A items answered
          </p>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center">
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
                'Save AIIMS assessment'
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
