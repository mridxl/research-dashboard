import { useState } from 'react';

import { BarChart3, Calculator, ClipboardList, Loader2, User } from 'lucide-react';

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
  ISAA_CLASSIFICATION_LABELS,
  ISAA_DOMAINS,
  ISAA_RATING_LABELS,
  ISAA_RATING_SHORT,
  type ISAAClassification,
  isaaScoreFromItems,
} from '@/lib/assessments/isaa-scale';
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

export interface ISAAFormData {
  patient_info: AssessmentPatientInfo;
  items: Record<string, number>;
  total_score?: number;
  classification?: string;
}

interface ISAAFormProps extends AssessmentFormProps<ISAAFormData> {
  sessionPatient?: { name?: string; dob?: string; gender?: string } | null;
}

export function ISAAForm({
  sessionId,
  existingData,
  readOnly,
  onSave,
  sessionPatient,
}: ISAAFormProps) {
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
  const { save, isLoading } = useAssessmentSave(sessionId, 'isaa', 'ISAA');

  const handlePatientInfoChange = <K extends keyof AssessmentPatientInfo>(
    key: K,
    value: AssessmentPatientInfo[K]
  ) => {
    setPatientInfo(prev => ({ ...prev, [key]: value }));
  };

  const setItemRating = (itemKey: string, value: number) => {
    setItems(prev => ({ ...prev, [itemKey]: value }));
  };

  const { total_score, classification } = isaaScoreFromItems(items);
  const ratedCount = Object.values(items).filter(value => value >= 1 && value <= 5).length;

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
          {/* Header */}
          <div className="flex gap-3 items-start">
            <div className="p-2.5 rounded-xl bg-primary/10 shrink-0">
              <ClipboardList className="w-6 h-6 text-primary" />
            </div>
            <div className="space-y-1">
              <h2 className="text-lg font-semibold tracking-tight">
                Indian Scale for Assessment of Autism (ISAA)
              </h2>
              <p className="max-w-xl text-sm text-muted-foreground">
                Rate each item from 1 (Rarely) to 5 (Always) based on observation and parent
                interview.
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
                  <Label htmlFor="isaa-name" className="text-muted-foreground">
                    Name of the child <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="isaa-name"
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
                  <Label htmlFor="isaa-dob" className="text-muted-foreground">
                    Date of birth
                  </Label>
                  <Input
                    id="isaa-dob"
                    type="date"
                    value={patientInfo.date_of_birth ?? ''}
                    onChange={e => handlePatientInfoChange('date_of_birth', e.target.value)}
                    disabled={readOnly}
                    className="h-9"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="isaa-assessment-date" className="text-muted-foreground">
                    Assessment date <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="isaa-assessment-date"
                    type="date"
                    value={patientInfo.assessment_date ?? ''}
                    onChange={e => handlePatientInfoChange('assessment_date', e.target.value)}
                    disabled={readOnly}
                    className="h-9"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="isaa-age" className="text-muted-foreground">
                    Age
                  </Label>
                  <Input
                    id="isaa-age"
                    value={String(patientInfo.age ?? '')}
                    onChange={e => handlePatientInfoChange('age', e.target.value)}
                    placeholder="e.g. 4 or 4 years"
                    disabled={readOnly}
                    className="h-9"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="isaa-notes" className="text-muted-foreground">
                  Impressions
                </Label>
                <Textarea
                  id="isaa-notes"
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

          {/* Score summary – prominent */}
          <Card
            className={cn(
              'border-2 bg-card',
              classification === 'severe' && 'border-destructive/30',
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
                  <span className="text-xs text-muted-foreground">/ 200</span>
                </div>
                <div className="flex gap-2 items-center">
                  <span className="text-sm text-muted-foreground">Classification</span>
                  <Badge
                    variant={
                      classification === 'severe'
                        ? 'destructive'
                        : classification === 'moderate'
                          ? 'default'
                          : 'secondary'
                    }
                    className="font-medium capitalize"
                  >
                    {ISAA_CLASSIFICATION_LABELS[classification as ISAAClassification] ??
                      classification}
                  </Badge>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground sm:grid-cols-4">
                <span>&lt;70: No autism</span>
                <span>70–106: Mild</span>
                <span>107–153: Moderate</span>
                <span>&gt;153: Severe</span>
              </div>
            </CardContent>
          </Card>

          {/* Scale legend – compact table */}
          <div className="p-3 rounded-lg border bg-muted/30">
            <div className="flex gap-2 items-center mb-2">
              <BarChart3 className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">Rating scale</span>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
              {[1, 2, 3, 4, 5].map(r => (
                <div
                  key={r}
                  className="flex gap-2 items-center px-3 py-2 text-sm rounded-md border bg-background"
                >
                  <span className="w-5 font-semibold tabular-nums">{r}</span>
                  <span className="truncate text-muted-foreground" title={ISAA_RATING_LABELS[r]}>
                    {ISAA_RATING_SHORT[r]}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Domain sections */}
          {ISAA_DOMAINS.map((domain, domainIdx) => (
            <Card
              key={domain.itemStart}
              className={cn('overflow-hidden', readOnly && 'opacity-95')}
            >
              <CardHeader className="pb-3 bg-muted/20">
                <div className="flex gap-3 items-center">
                  <span className="flex justify-center items-center w-8 h-8 text-sm font-semibold rounded-full shrink-0 bg-primary/10 text-primary">
                    {domainIdx + 1}
                  </span>
                  <CardTitle className="text-base">{domain.title}</CardTitle>
                  <span className="text-xs text-muted-foreground sm:ml-auto">
                    Items {domain.itemStart}–{domain.itemEnd}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="pt-4 space-y-1">
                {domain.statements.map((statement, idx) => {
                  const itemNum = domain.itemStart + idx;
                  const itemKey = String(itemNum);
                  const rawValue = items[itemKey];
                  const value = rawValue >= 1 && rawValue <= 5 ? rawValue : undefined;
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
                      <div className="flex gap-2 sm:min-w-[280px] sm:max-w-md">
                        <span className="flex justify-center items-center w-6 h-6 text-xs font-medium rounded shrink-0 bg-muted text-muted-foreground">
                          {itemNum}
                        </span>
                        <p className="text-sm font-medium leading-snug pt-0.5">{statement}</p>
                      </div>
                      <RadioGroup
                        value={value !== undefined ? String(value) : ''}
                        onValueChange={v => setItemRating(itemKey, Number(v))}
                        className="flex w-full flex-wrap justify-start gap-1 md:ml-auto md:w-auto md:shrink-0 sm:gap-2"
                        disabled={readOnly}
                      >
                        {[1, 2, 3, 4, 5].map(r => {
                          const id = `isaa-${itemKey}-${r}`;
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
                              <span className="text-xs font-normal">{r}</span>
                            </Label>
                          );
                        })}
                      </RadioGroup>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          ))}
        </div>
      </ScrollArea>

      {/* Pinned so Save stays reachable without scrolling past all 40 items. */}
      {!readOnly && (
        <div className="flex flex-col-reverse gap-3 px-4 py-3 border-t shrink-0 bg-background sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p className="text-xs text-muted-foreground">
            <span className="font-medium tabular-nums text-foreground">{ratedCount}</span> of 40
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
              'Save ISAA assessment'
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
