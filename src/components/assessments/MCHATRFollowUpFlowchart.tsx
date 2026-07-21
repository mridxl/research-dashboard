import { useMemo } from 'react';

import { ArrowDown } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import {
  type FUExample,
  type FUItemFlow,
  type FUResponses,
  ITEM12_NOISES,
  ITEM12_OTHER_TEXT_ID,
  ITEM12_REACTION_ONE,
  ITEM12_REACTION_ZERO,
  item12ReactionsVisible,
  type MostOften,
} from '@/lib/assessments/mchat-r-follow-up-flows';
import { cn } from '@/lib/utils';

interface MCHATRFollowUpFlowchartProps {
  flow: FUItemFlow;
  childName: string;
  responses: FUResponses;
  mostOften?: MostOften;
  readOnly?: boolean;
  onResponsesChange: (responses: FUResponses) => void;
  onMostOftenChange: (value: MostOften | undefined) => void;
}

function FlowBox({
  className,
  children,
  variant = 'default',
}: {
  className?: string;
  children: React.ReactNode;
  variant?: 'default' | 'zero' | 'one' | 'decision' | 'outcome';
}) {
  return (
    <div
      className={cn(
        'rounded-md border px-3 py-2.5 text-sm shadow-sm',
        variant === 'default' && 'border-border bg-card',
        variant === 'zero' && 'border-emerald-500/40 bg-emerald-500/5',
        variant === 'one' && 'border-rose-500/40 bg-rose-500/5',
        variant === 'decision' && 'border-amber-500/50 bg-amber-500/10',
        variant === 'outcome' && 'border-primary/50 bg-primary/10 font-semibold',
        className
      )}
    >
      {children}
    </div>
  );
}

function FlowArrow() {
  return (
    <div className="flex justify-center py-0.5 text-muted-foreground">
      <ArrowDown className="size-4" aria-hidden />
    </div>
  );
}

function YesNoNode({
  id,
  label,
  value,
  readOnly,
  onChange,
}: {
  id: string;
  label: string;
  value: boolean | undefined;
  readOnly?: boolean;
  onChange: (value: boolean) => void;
}) {
  const selected = value === true ? 'yes' : value === false ? 'no' : '';
  return (
    <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between">
      <span className="text-sm leading-snug">{label}</span>
      <RadioGroup
        value={selected}
        onValueChange={v => onChange(v === 'yes')}
        className="flex shrink-0 gap-1.5"
        disabled={readOnly}
      >
        <Label
          htmlFor={`${id}-yes`}
          className={cn(
            'flex cursor-pointer items-center gap-1 rounded border px-2.5 py-1 text-xs',
            selected === 'yes' ? 'border-primary bg-primary/10' : 'border-transparent bg-muted/60'
          )}
        >
          <RadioGroupItem value="yes" id={`${id}-yes`} className="size-3.5" />
          Yes
        </Label>
        <Label
          htmlFor={`${id}-no`}
          className={cn(
            'flex cursor-pointer items-center gap-1 rounded border px-2.5 py-1 text-xs',
            selected === 'no' ? 'border-primary bg-primary/10' : 'border-transparent bg-muted/60'
          )}
        >
          <RadioGroupItem value="no" id={`${id}-no`} className="size-3.5" />
          No
        </Label>
      </RadioGroup>
    </div>
  );
}

function Checklist({
  examples,
  responses,
  readOnly,
  variant,
  onChange,
}: {
  examples: FUExample[];
  responses: FUResponses;
  readOnly?: boolean;
  variant: 'default' | 'zero' | 'one';
  onChange: (id: string, value: boolean) => void;
}) {
  return (
    <FlowBox variant={variant} className="space-y-2.5">
      {examples.map(ex => (
        <YesNoNode
          key={ex.id}
          id={ex.id}
          label={ex.label}
          value={typeof responses[ex.id] === 'boolean' ? (responses[ex.id] as boolean) : undefined}
          readOnly={readOnly}
          onChange={v => onChange(ex.id, v)}
        />
      ))}
    </FlowBox>
  );
}

export function MCHATRFollowUpFlowchart({
  flow,
  childName,
  responses,
  mostOften,
  readOnly,
  onResponsesChange,
  onMostOftenChange,
}: MCHATRFollowUpFlowchartProps) {
  const displayName = childName.trim() || '___________';
  const result = useMemo(() => flow.resolve(responses, mostOften), [flow, responses, mostOften]);

  const setValue = (id: string, value: boolean) => {
    if (readOnly) return;
    onResponsesChange({ ...responses, [id]: value });
    // Any checklist change can re-open the most-often tiebreaker.
    onMostOftenChange(undefined);
  };

  const setText = (id: string, value: string) => {
    if (readOnly) return;
    onResponsesChange({ ...responses, [id]: value });
  };

  const isItem12 = flow.itemNum === 12;
  const showItem12Reactions = isItem12 && item12ReactionsVisible(responses);
  const showMostOften = result.needsMostOften && mostOften === undefined;
  const visibleGates = (flow.gates ?? []).filter(
    g => !flow.isGateVisible || flow.isGateVisible(g.id, responses)
  );

  const questionText = flow.question.replace('{name}', displayName);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2 items-center">
        <Badge variant="outline">M-CHAT-R/F Follow-Up</Badge>
        <Badge variant="secondary">Item {flow.itemNum}</Badge>
        {result.score !== null && (
          <Badge variant={result.score === 1 ? 'destructive' : 'secondary'}>
            Score: {result.score}
          </Badge>
        )}
      </div>

      {/* Intro */}
      <FlowBox>
        <p className="font-medium">
          {flow.itemNum}. {questionText}
        </p>
        {flow.example && (
          <p className="mt-1 text-xs text-muted-foreground">(FOR EXAMPLE, {flow.example})</p>
        )}
      </FlowBox>

      <FlowArrow />

      <FlowBox variant="decision">
        You answered <strong>{flow.introAnswer}</strong> or did not answer this question.
      </FlowBox>

      {/* Scoring rule hint */}
      <FlowBox className="text-xs text-muted-foreground italic">{flow.scoreRule}</FlowBox>

      {flow.examplesPrompt && (
        <>
          <FlowArrow />
          <p className="text-sm font-medium text-center">{flow.examplesPrompt}</p>
        </>
      )}

      {/* Dual-column layout (items 1, 10, 11, 16) */}
      {flow.layout === 'dual' && !isItem12 && (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          <div className="space-y-2">
            <FlowBox variant="zero" className="text-center font-medium">
              0 examples (pass)
            </FlowBox>
            <FlowArrow />
            <Checklist
              examples={flow.zeroExamples ?? []}
              responses={responses}
              readOnly={readOnly}
              variant="zero"
              onChange={setValue}
            />
          </div>
          <div className="space-y-2">
            <FlowBox variant="one" className="text-center font-medium">
              1 examples (fail)
            </FlowBox>
            <FlowArrow />
            <Checklist
              examples={flow.oneExamples ?? []}
              responses={responses}
              readOnly={readOnly}
              variant="one"
              onChange={setValue}
            />
          </div>
        </div>
      )}

      {/* Single checklist layout */}
      {flow.layout === 'single' && (flow.examples?.length ?? 0) > 0 && (
        <>
          <FlowArrow />
          <Checklist
            examples={flow.examples ?? []}
            responses={responses}
            readOnly={readOnly}
            variant="default"
            onChange={setValue}
          />
        </>
      )}

      {/* Item 12 special: noise checklist, then reaction columns appear after 2+ */}
      {isItem12 && (
        <>
          <FlowArrow />
          <Checklist
            examples={ITEM12_NOISES}
            responses={responses}
            readOnly={readOnly}
            variant="default"
            onChange={setValue}
          />
          {responses['i12_other'] === true && (
            <FlowBox className="space-y-2">
              <Label htmlFor={ITEM12_OTHER_TEXT_ID} className="text-xs text-muted-foreground">
                Other (describe)
              </Label>
              <Textarea
                id={ITEM12_OTHER_TEXT_ID}
                value={
                  typeof responses[ITEM12_OTHER_TEXT_ID] === 'string'
                    ? (responses[ITEM12_OTHER_TEXT_ID] as string)
                    : ''
                }
                onChange={e => setText(ITEM12_OTHER_TEXT_ID, e.target.value)}
                placeholder="Describe the other noise the child reacts to"
                rows={2}
                disabled={readOnly}
                className="resize-none"
              />
            </FlowBox>
          )}
          {showItem12Reactions ? (
            <>
              <FlowArrow />
              <FlowBox variant="decision" className="text-center text-xs">
                Yes to two or more noises — how does he/she react?
              </FlowBox>
              <FlowArrow />
              <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                <div className="space-y-2">
                  <FlowBox variant="zero" className="text-center font-medium">
                    0 responses
                  </FlowBox>
                  <Checklist
                    examples={ITEM12_REACTION_ZERO}
                    responses={responses}
                    readOnly={readOnly}
                    variant="zero"
                    onChange={setValue}
                  />
                </div>
                <div className="space-y-2">
                  <FlowBox variant="one" className="text-center font-medium">
                    1 responses
                  </FlowBox>
                  <Checklist
                    examples={ITEM12_REACTION_ONE}
                    responses={responses}
                    readOnly={readOnly}
                    variant="one"
                    onChange={setValue}
                  />
                </div>
              </div>
            </>
          ) : (
            <FlowBox className="text-xs text-muted-foreground text-center">
              Yes to one or none → score resolves to 0.
            </FlowBox>
          )}
        </>
      )}

      {/* Sequential gates (single yes/no decisions) */}
      {visibleGates.map(gate => (
        <div key={gate.id}>
          <FlowArrow />
          <FlowBox variant="decision">
            <YesNoNode
              id={gate.id}
              label={gate.prompt}
              value={
                typeof responses[gate.id] === 'boolean'
                  ? (responses[gate.id] as boolean)
                  : undefined
              }
              readOnly={readOnly}
              onChange={v => setValue(gate.id, v)}
            />
          </FlowBox>
        </div>
      ))}

      {/* Most-often tiebreaker */}
      {showMostOften && (
        <>
          <FlowArrow />
          <FlowBox variant="decision">
            <p className="mb-2.5 font-medium">Which one does he/she do most often?</p>
            <RadioGroup
              value={mostOften ?? ''}
              onValueChange={v => onMostOftenChange(v as MostOften)}
              className="flex flex-wrap gap-3"
              disabled={readOnly}
            >
              <Label
                htmlFor={`${flow.itemNum}-mo-zero`}
                className={cn(
                  'flex cursor-pointer items-center gap-2 rounded-md border px-4 py-2',
                  mostOften === 'zero' ? 'border-primary bg-primary/10' : 'bg-muted/40'
                )}
              >
                <RadioGroupItem value="zero" id={`${flow.itemNum}-mo-zero`} />
                Most often is a <strong>0</strong> example → score <strong>0</strong>
              </Label>
              <Label
                htmlFor={`${flow.itemNum}-mo-one`}
                className={cn(
                  'flex cursor-pointer items-center gap-2 rounded-md border px-4 py-2',
                  mostOften === 'one' ? 'border-primary bg-primary/10' : 'bg-muted/40'
                )}
              >
                <RadioGroupItem value="one" id={`${flow.itemNum}-mo-one`} />
                Most often is a <strong>1</strong> example → score <strong>1</strong>
              </Label>
            </RadioGroup>
          </FlowBox>
        </>
      )}

      {/* Outcome */}
      {result.score !== null && (
        <>
          <FlowArrow />
          <FlowBox variant="outcome" className="flex justify-between items-center">
            <span>Follow-Up Item {flow.itemNum} result</span>
            <span
              className={cn(
                'flex justify-center items-center rounded border-2 size-10 text-lg font-bold',
                result.score === 0
                  ? 'border-emerald-600 text-emerald-700'
                  : 'border-rose-600 text-rose-700'
              )}
            >
              {result.score}
            </span>
          </FlowBox>
        </>
      )}
    </div>
  );
}
