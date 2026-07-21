import { useState } from 'react';

import { ChevronRight } from 'lucide-react';
import { Calculator, ClipboardList, Loader2, User } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
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
  CARS2_CLASSIFICATION_LABELS,
  CARS2_ITEMS,
  CARS2_RATING_LABELS,
  CARS2_RATING_OPTIONS,
  type CARS2Classification,
  cars2ScoreFromItems,
} from '@/lib/assessments/cars2-scale';
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

export interface CARS2FormData {
  patient_info: AssessmentPatientInfo;
  items: Record<string, number>;
  total_score?: number;
  classification?: string;
}

interface CARS2FormProps extends AssessmentFormProps<CARS2FormData> {
  sessionPatient?: { name?: string; dob?: string; gender?: string } | null;
}

export function CARS2Form({
  sessionId,
  existingData,
  readOnly,
  onSave,
  sessionPatient,
}: CARS2FormProps) {
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
  const { save, isLoading } = useAssessmentSave(sessionId, 'cars2', 'CARS2');

  const handlePatientInfoChange = <K extends keyof AssessmentPatientInfo>(
    key: K,
    value: AssessmentPatientInfo[K]
  ) => {
    setPatientInfo(prev => ({ ...prev, [key]: value }));
  };

  const setItemRating = (itemKey: string, value: number) => {
    setItems(prev => ({ ...prev, [itemKey]: value }));
  };

  const { total_score, classification } = cars2ScoreFromItems(items);
  const ratedCount = Object.values(items).filter(v => v > 0).length;

  const handleSave = () => {
    if (readOnly) return;
    void save(patientInfo, { items }, onSave);
  };

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
                Childhood Autism Rating Scale, Second Edition (CARS II)
              </h2>
              <p className="max-w-xl text-sm text-muted-foreground">
                Rate each item 1–4 (half-points allowed: 1, 1.5, 2, 2.5, 3, 3.5, 4) based on direct
                observation. Total raw score 15–60.
              </p>
            </div>
          </div>

          <Separator />

          <Card className={cn(readOnly && 'opacity-95')}>
            <CardHeader className="pb-4">
              <div className="flex gap-2 items-center">
                <User className="w-4 h-4 text-muted-foreground" />
                <CardTitle className="text-base">Patient&apos;s Information</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="cars2-name" className="text-muted-foreground">
                    Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="cars2-name"
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
                  <Label htmlFor="cars2-dob" className="text-muted-foreground">
                    Date of birth
                  </Label>
                  <Input
                    id="cars2-dob"
                    type="date"
                    value={patientInfo.date_of_birth ?? ''}
                    onChange={e => handlePatientInfoChange('date_of_birth', e.target.value)}
                    disabled={readOnly}
                    className="h-9"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cars2-assessment-date" className="text-muted-foreground">
                    Assessment date <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="cars2-assessment-date"
                    type="date"
                    value={patientInfo.assessment_date ?? ''}
                    onChange={e => handlePatientInfoChange('assessment_date', e.target.value)}
                    disabled={readOnly}
                    className="h-9"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cars2-age" className="text-muted-foreground">
                    Age
                  </Label>
                  <Input
                    id="cars2-age"
                    value={String(patientInfo.age ?? '')}
                    onChange={e => handlePatientInfoChange('age', e.target.value)}
                    placeholder="e.g. 4 or 4 years"
                    disabled={readOnly}
                    className="h-9"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="cars2-notes" className="text-muted-foreground">
                  Notes
                </Label>
                <Textarea
                  id="cars2-notes"
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

          <Card
            className={cn(
              'border-2 bg-card',
              classification === 'severe' && 'border-destructive/30',
              classification === 'mild_moderate' && 'border-amber-500/30',
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
                  <span className="text-sm text-muted-foreground">Total raw score</span>
                  <span className="text-2xl font-bold tabular-nums">{total_score}</span>
                  <span className="text-xs text-muted-foreground">/ 60</span>
                </div>
                <div className="flex gap-2 items-center">
                  <span className="text-sm text-muted-foreground">Classification</span>
                  <Badge
                    variant={
                      classification === 'severe'
                        ? 'destructive'
                        : classification === 'mild_moderate'
                          ? 'default'
                          : 'secondary'
                    }
                    className="font-medium capitalize"
                  >
                    {CARS2_CLASSIFICATION_LABELS[classification as CARS2Classification] ??
                      classification}
                  </Badge>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground sm:grid-cols-3">
                <span>15–29.5: Non-autistic</span>
                <span>30–36.5: Mild–moderate</span>
                <span>37–60: Severe</span>
              </div>
            </CardContent>
          </Card>

          <div className="p-3 rounded-lg border bg-muted/30">
            <span className="text-sm font-medium text-muted-foreground">
              Rating scale (1 – 4 with half-points)
            </span>
            <div className="flex flex-wrap gap-2 mt-2">
              {CARS2_RATING_OPTIONS.map(r => (
                <div
                  key={r}
                  className="flex gap-2 items-center px-3 py-2 text-sm rounded-md border bg-background"
                >
                  <span className="w-7 font-semibold tabular-nums">{r}</span>
                  <span
                    className="truncate max-w-[200px] text-muted-foreground"
                    title={CARS2_RATING_LABELS[r]}
                  >
                    {CARS2_RATING_LABELS[r]}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {CARS2_ITEMS.map((item, idx) => {
            const rawValue = items[item.key];
            const value =
              rawValue >= 1 && rawValue <= 4 && CARS2_RATING_OPTIONS.includes(rawValue)
                ? rawValue
                : undefined;
            const displayValue = value !== undefined ? String(value) : '';
            return (
              <div
                key={item.key}
                className={cn(
                  'flex flex-col gap-3 py-4 border-b last:border-0',
                  'px-2 -mx-1 rounded-md transition-colors hover:bg-muted/20',
                  idx % 2 === 0 ? 'bg-muted/15' : 'bg-background'
                )}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-6">
                  <div className="flex gap-2 sm:min-w-[280px] sm:max-w-md shrink-0">
                    <span className="flex justify-center items-center w-6 h-6 text-xs font-medium rounded shrink-0 bg-muted text-muted-foreground">
                      {item.key}
                    </span>
                    <p className="text-sm font-medium leading-snug pt-0.5">{item.label}</p>
                  </div>
                  <RadioGroup
                    value={displayValue}
                    onValueChange={v => setItemRating(item.key, Number(v))}
                    className="flex w-full flex-wrap justify-start gap-1 md:ml-auto md:w-auto md:shrink-0 sm:gap-2"
                    disabled={readOnly}
                  >
                    {CARS2_RATING_OPTIONS.map(r => {
                      const id = `cars2-${item.key}-${r}`;
                      return (
                        <Label
                          key={r}
                          htmlFor={id}
                          className={cn(
                            'flex min-h-10 cursor-pointer items-center gap-1.5 rounded-md border px-2.5 py-1.5 transition-colors select-none whitespace-nowrap',
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
                          <span className="text-xs font-normal tabular-nums">{r}</span>
                        </Label>
                      );
                    })}
                  </RadioGroup>
                </div>
                <Collapsible className="pl-8 group">
                  <CollapsibleTrigger className="flex gap-1 items-center text-xs text-muted-foreground hover:text-foreground">
                    <ChevronRight className="size-3.5 transition-transform group-data-[state=open]:rotate-90" />
                    Rating descriptions (1–4)
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <ul className="pl-3 mt-2 space-y-2 text-xs border-l-2 text-muted-foreground border-muted">
                      {([1, 2, 3, 4] as const).map(anchor => (
                        <li key={anchor}>
                          <span className="font-medium text-foreground/80">{anchor}. </span>
                          {item.anchors[anchor]}
                        </li>
                      ))}
                    </ul>
                  </CollapsibleContent>
                </Collapsible>
              </div>
            );
          })}
        </div>
      </ScrollArea>

      {/* Pinned so Save stays reachable without scrolling past all the items. */}
      {!readOnly && (
        <div className="flex flex-col-reverse gap-3 px-4 py-3 border-t shrink-0 bg-background sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p className="text-xs text-muted-foreground">
            <span className="font-medium tabular-nums text-foreground">{ratedCount}</span> of 15
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
              'Save CARS2 assessment'
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
