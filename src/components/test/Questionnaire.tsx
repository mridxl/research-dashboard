import { useCallback, useEffect, useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Field, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupOption } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { questionnaireSchema } from '@/lib/validations/questionnaire';
import { validate } from '@/lib/validations/validate';

type Language = 'en' | 'hi';

const LANGUAGE_STORAGE_KEY = 'questionnaireLanguage';

const STRINGS = {
  en: {
    title: 'Child Development Questionnaire',
    subtitle: 'Please answer all questions to help us better assess your child.',
    birthHistory: 'Birth History',
    developmentalHistory: 'Developmental History',
    behavioralObservations: 'Behavioral Observations',
    additionalQuestions: 'Additional Questions',
    required: 'Required',
    submit: 'Submit',
    skip: 'Skip',
    // Birth History
    deliveryType: 'Delivery Type',
    normal: 'Normal',
    cesarean: 'Cesarean',
    gestationPeriod: 'Gestation period',
    preTerm: 'Pre term',
    fullTerm: 'Full term',
    criedImmediately: 'Cried Immediately after birth',
    nicuStay: 'NICU stay',
    birthWeight: 'Birth Weight (in kgs)',
    birthWeightPlaceholder: 'e.g., 2.80',
    yes: 'Yes',
    no: 'No',
    // Developmental History
    socialSmileBefore3Months: 'Did your child start socially smiling before 3 months',
    sittingBefore8Months: 'Did your child start sitting before 8 months',
    walkingBefore18Months: 'Did your child start walking before 18 months',
    speech: 'Speech',
    delayed: 'Delayed',
    // Behavioral Observations
    repetitiveBehaviour:
      'Does your child engage in repetitive behaviour? (hand flapping, toe walking, finger movements etc)',
    sensorySensitivity: 'Does your child get upset with loud noise/bright light/certain texture?',
    hyperactivity: 'Does your child show hyperactivity?',
    responseToName: 'Does your child respond to their name being called?',
    eyeContact: 'Does your child maintain eye contact?',
    // Additional Questions
    signsBefore3Years:
      'Did you notice these signs since the child was very young (before 3 years)?',
    strugglesDailyTasks:
      'Does your child struggle with simple daily tasks like eating, using the toilet, playing, or telling you what they need?',
    // Language switch
    english: 'English',
    hindi: 'हिंदी',
  },
  hi: {
    title: 'बाल विकास प्रश्नावली',
    subtitle: 'कृपया अपने बच्चे का बेहतर मूल्यांकन करने में हमारी मदद के लिए सभी प्रश्नों का उत्तर दें।',
    birthHistory: 'जन्म का इतिहास',
    developmentalHistory: 'विकास का इतिहास',
    behavioralObservations: 'व्यवहार संबंधी अवलोकन',
    additionalQuestions: 'अतिरिक्त प्रश्न',
    required: 'आवश्यक',
    submit: 'जमा करें',
    skip: 'छोड़ें',
    // Birth History
    deliveryType: 'प्रसव का प्रकार',
    normal: 'सामान्य',
    cesarean: 'सिजेरियन',
    gestationPeriod: 'गर्भावधि',
    preTerm: 'समय से पहले',
    fullTerm: 'पूर्ण अवधि',
    criedImmediately: 'जन्म के तुरंत बाद रोया',
    nicuStay: 'NICU में रहना',
    birthWeight: 'जन्म के समय वजन (किग्रा में)',
    birthWeightPlaceholder: 'उदा., 2.80',
    yes: 'हाँ',
    no: 'नहीं',
    // Developmental History
    socialSmileBefore3Months: 'क्या आपके बच्चे ने 3 महीने से पहले सामाजिक मुस्कान देना शुरू किया',
    sittingBefore8Months: 'क्या आपके बच्चे ने 8 महीने से पहले बैठना शुरू किया',
    walkingBefore18Months: 'क्या आपके बच्चे ने 18 महीने से पहले चलना शुरू किया',
    speech: 'बोलना',
    delayed: 'देरी से',
    // Behavioral Observations
    repetitiveBehaviour:
      'क्या आपका बच्चा दोहराव वाले व्यवहार में संलग्न होता है? (हाथ फड़फड़ाना, पैर की उंगलियों पर चलना, उंगलियों की हरकतें आदि)',
    sensorySensitivity: 'क्या आपका बच्चा तेज आवाज/तेज रोशनी/किसी विशेष बनावट से परेशान होता है?',
    hyperactivity: 'क्या आपका बच्चा अतिसक्रियता दिखाता है?',
    responseToName: 'क्या आपका बच्चा अपना नाम पुकारने पर प्रतिक्रिया करता है?',
    eyeContact: 'क्या आपका बच्चा आँख से आँख मिलाता है?',
    // Additional Questions
    signsBefore3Years: 'क्या आपने ये संकेत तब देखे जब बच्चा बहुत छोटा था (3 साल से पहले)?',
    strugglesDailyTasks:
      'क्या आपके बच्चे को खाने, शौचालय का उपयोग करने, खेलने, या अपनी जरूरतें बताने जैसे सरल दैनिक कार्यों में कठिनाई होती है?',
    // Language switch
    english: 'English',
    hindi: 'हिंदी',
  },
};

interface QuestionnaireProps {
  setIsFormFilled: (filled: boolean) => void;
  onFormCollected: (data: QuestionnaireData) => void;
  onSkip?: () => void;
}

export interface QuestionnaireData {
  deliveryType: string;
  gestationPeriod: string;
  criedImmediately: string;
  nicuStay: string;
  birthWeightKg: number;
  socialSmileBefore3Months: string;
  sittingBefore8Months: string;
  walkingBefore18Months: string;
  speech: string;
  eyeContact: string;
  repetitiveBehaviour: string;
  hyperactivity: string;
  responseToName: string;
  sensorySensitivity: string;
  signsBefore3Years?: string;
  strugglesDailyTasks?: string;
}

type QuestionnaireFormState = Omit<QuestionnaireData, 'birthWeightKg'> & {
  birthWeightKg: string;
};

const getStoredLanguage = (): Language => {
  if (typeof window === 'undefined') return 'en';

  const stored = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
  return stored === 'hi' ? 'hi' : 'en';
};

export const Questionnaire = ({ setIsFormFilled, onFormCollected, onSkip }: QuestionnaireProps) => {
  const [language, setLanguage] = useState<Language>(() => getStoredLanguage());
  const t = STRINGS[language];

  useEffect(() => {
    if (typeof window === 'undefined') return;

    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  }, [language]);

  const [form, setForm] = useState<QuestionnaireFormState>({
    deliveryType: '',
    gestationPeriod: '',
    criedImmediately: '',
    nicuStay: '',
    birthWeightKg: '',
    socialSmileBefore3Months: '',
    sittingBefore8Months: '',
    walkingBefore18Months: '',
    speech: '',
    eyeContact: '',
    repetitiveBehaviour: '',
    hyperactivity: '',
    responseToName: '',
    sensorySensitivity: '',
    signsBefore3Years: '',
    strugglesDailyTasks: '',
  });

  const showFollowUps = useMemo(() => {
    return (
      form.eyeContact === 'No' ||
      form.repetitiveBehaviour === 'Yes' ||
      form.hyperactivity === 'Yes' ||
      form.responseToName === 'No' ||
      form.sensorySensitivity === 'Yes'
    );
  }, [
    form.eyeContact,
    form.repetitiveBehaviour,
    form.hyperactivity,
    form.responseToName,
    form.sensorySensitivity,
  ]);

  const handleChange = useCallback((name: keyof QuestionnaireFormState, value: string) => {
    setForm(prev => ({ ...prev, [name]: value }));
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const data = validate(questionnaireSchema, form);
    if (!data) return;

    setIsFormFilled(true);
    onFormCollected({
      ...form,
      birthWeightKg: Number(form.birthWeightKg),
    });
  };

  return (
    <div
      className="flex overflow-y-auto fixed inset-0 z-50 justify-center items-stretch min-h-screen bg-background dark text-foreground"
      role="dialog"
      aria-modal="true"
    >
      {/* Skip - Top Left */}
      {onSkip && (
        <div className="flex fixed top-8 left-10 z-60">
          <Button
            type="button"
            variant="secondary"
            className="rounded-full text-gray-300 hover:text-white hover:bg-white/10 cursor-pointer"
            onClick={() => onSkip()}
          >
            {t.skip}
          </Button>
        </div>
      )}
      {/* Language Toggle - Top Right */}
      <div className="flex fixed top-8 right-10 gap-3 items-center px-4 py-2 rounded-full backdrop-blur-sm z-60 bg-card/60">
        <span
          className={`text-sm font-medium transition-colors ${
            language === 'en' ? 'text-white' : 'text-gray-400'
          }`}
        >
          {t.english}
        </span>
        <Switch
          checked={language === 'hi'}
          onCheckedChange={checked => setLanguage(checked ? 'hi' : 'en')}
          aria-label="Toggle language between English and Hindi"
        />
        <span
          className={`text-sm font-medium transition-colors ${
            language === 'hi' ? 'text-white' : 'text-gray-400'
          }`}
        >
          {t.hindi}
        </span>
      </div>

      <div className="flex flex-col justify-start items-center py-14 mx-auto w-full max-w-4xl">
        <div className="flex flex-col items-center mb-6">
          <div className="inline-block relative m-auto">
            <div className="absolute inset-0 from-blue-500 rounded-lg opacity-60 blur-lg to-primary bg-linear-to-r"></div>
            <span className="relative z-10 text-4xl font-semibold tracking-wide text-white">
              Aignosis
            </span>
          </div>
          <h2 className="mt-6 text-2xl font-semibold text-center text-white font-raleway">
            {t.title}
          </h2>
          <p className="mt-2 max-w-lg text-sm text-center text-gray-300">{t.subtitle}</p>
        </div>

        <div className="px-4 pb-12 w-full md:px-8">
          <div className="p-8 w-full rounded-3xl shadow-2xl backdrop-blur-sm bg-card/40 md:p-12">
            <form onSubmit={onSubmit}>
              {/* Top Section: Birth History */}
              <div className="pb-8 mb-10 from-transparent to-transparent border-b border-gradient-to-r via-primary/50">
                <div className="flex items-center mb-6 space-x-3">
                  <div className="w-1 h-8 rounded-full bg-linear-to-b from-primary to-accent"></div>
                  <h3 className="text-2xl font-bold text-foreground font-raleway">
                    {t.birthHistory}
                  </h3>
                </div>
                <div className="grid grid-cols-1 gap-y-6 gap-x-8 md:grid-cols-2">
                  <Field>
                    <FieldLabel>
                      {t.deliveryType} <span className="text-red-400">*</span>
                    </FieldLabel>
                    <RadioGroup
                      value={form.deliveryType}
                      onValueChange={value => handleChange('deliveryType', value)}
                      className="flex flex-row gap-4"
                      required
                    >
                      <RadioGroupOption value="Normal" id="deliveryType-normal" label={t.normal} />
                      <RadioGroupOption
                        value="Cesarean"
                        id="deliveryType-cesarean"
                        label={t.cesarean}
                      />
                    </RadioGroup>
                  </Field>

                  <Field>
                    <FieldLabel>
                      {t.gestationPeriod} <span className="text-red-400">*</span>
                    </FieldLabel>
                    <RadioGroup
                      value={form.gestationPeriod}
                      onValueChange={value => handleChange('gestationPeriod', value)}
                      className="flex flex-row gap-4"
                      required
                    >
                      <RadioGroupOption
                        value="Pre term"
                        id="gestationPeriod-preterm"
                        label={t.preTerm}
                      />
                      <RadioGroupOption
                        value="Full term"
                        id="gestationPeriod-fullterm"
                        label={t.fullTerm}
                      />
                    </RadioGroup>
                  </Field>

                  <Field>
                    <FieldLabel>
                      {t.criedImmediately} <span className="text-red-400">*</span>
                    </FieldLabel>
                    <RadioGroup
                      value={form.criedImmediately}
                      onValueChange={value => handleChange('criedImmediately', value)}
                      className="flex flex-row gap-4"
                      required
                    >
                      <RadioGroupOption value="Yes" id="criedImmediately-yes" label={t.yes} />
                      <RadioGroupOption value="No" id="criedImmediately-no" label={t.no} />
                    </RadioGroup>
                  </Field>

                  <Field>
                    <FieldLabel>
                      {t.nicuStay} <span className="text-red-400">*</span>
                    </FieldLabel>
                    <RadioGroup
                      value={form.nicuStay}
                      onValueChange={value => handleChange('nicuStay', value)}
                      className="flex flex-row gap-4"
                      required
                    >
                      <RadioGroupOption value="Yes" id="nicuStay-yes" label={t.yes} />
                      <RadioGroupOption value="No" id="nicuStay-no" label={t.no} />
                    </RadioGroup>
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="birthWeightKg">
                      {t.birthWeight} <span className="text-red-400">*</span>
                    </FieldLabel>
                    <Input
                      id="birthWeightKg"
                      type="text"
                      value={form.birthWeightKg}
                      onChange={e => handleChange('birthWeightKg', e.target.value)}
                      placeholder={t.birthWeightPlaceholder}
                      required
                    />
                  </Field>
                </div>
              </div>

              {/* Developmental History Section */}
              <div className="pb-8 mb-10 from-transparent to-transparent border-b border-gradient-to-r via-primary/50">
                <div className="flex items-center mb-6 space-x-3">
                  <div className="w-1 h-8 rounded-full bg-linear-to-b from-primary to-accent"></div>
                  <h3 className="text-2xl font-bold text-foreground font-raleway">
                    {t.developmentalHistory}
                  </h3>
                </div>
                <div className="grid grid-cols-1 gap-y-6 gap-x-8 md:grid-cols-2">
                  <Field>
                    <FieldLabel>
                      {t.socialSmileBefore3Months} <span className="text-red-400">*</span>
                    </FieldLabel>
                    <RadioGroup
                      value={form.socialSmileBefore3Months}
                      onValueChange={value => handleChange('socialSmileBefore3Months', value)}
                      className="flex flex-row gap-4"
                      required
                    >
                      <RadioGroupOption
                        value="Yes"
                        id="socialSmileBefore3Months-yes"
                        label={t.yes}
                      />
                      <RadioGroupOption value="No" id="socialSmileBefore3Months-no" label={t.no} />
                    </RadioGroup>
                  </Field>

                  <Field>
                    <FieldLabel>
                      {t.sittingBefore8Months} <span className="text-red-400">*</span>
                    </FieldLabel>
                    <RadioGroup
                      value={form.sittingBefore8Months}
                      onValueChange={value => handleChange('sittingBefore8Months', value)}
                      className="flex flex-row gap-4"
                      required
                    >
                      <RadioGroupOption value="Yes" id="sittingBefore8Months-yes" label={t.yes} />
                      <RadioGroupOption value="No" id="sittingBefore8Months-no" label={t.no} />
                    </RadioGroup>
                  </Field>

                  <Field>
                    <FieldLabel>
                      {t.walkingBefore18Months} <span className="text-red-400">*</span>
                    </FieldLabel>
                    <RadioGroup
                      value={form.walkingBefore18Months}
                      onValueChange={value => handleChange('walkingBefore18Months', value)}
                      className="flex flex-row gap-4"
                      required
                    >
                      <RadioGroupOption value="Yes" id="walkingBefore18Months-yes" label={t.yes} />
                      <RadioGroupOption value="No" id="walkingBefore18Months-no" label={t.no} />
                    </RadioGroup>
                  </Field>

                  <Field>
                    <FieldLabel>
                      {t.speech} <span className="text-red-400">*</span>
                    </FieldLabel>
                    <RadioGroup
                      value={form.speech}
                      onValueChange={value => handleChange('speech', value)}
                      className="flex flex-row gap-4"
                      required
                    >
                      <RadioGroupOption value="Normal" id="speech-normal" label={t.normal} />
                      <RadioGroupOption value="Delayed" id="speech-delayed" label={t.delayed} />
                    </RadioGroup>
                  </Field>
                </div>
              </div>

              {/* Bottom Section: Behavioral Observations */}
              <div>
                <div className="flex items-center mb-6 space-x-3">
                  <div className="w-1 h-8 rounded-full bg-linear-to-b from-primary to-accent"></div>
                  <h3 className="text-2xl font-bold text-foreground font-raleway">
                    {t.behavioralObservations}
                  </h3>
                </div>
                <div className="grid grid-cols-1 gap-y-6 gap-x-8 items-end md:grid-cols-2">
                  <Field>
                    <FieldLabel>
                      {t.repetitiveBehaviour} <span className="text-red-400">*</span>
                    </FieldLabel>
                    <RadioGroup
                      value={form.repetitiveBehaviour}
                      onValueChange={value => handleChange('repetitiveBehaviour', value)}
                      className="flex flex-row gap-4"
                      required
                    >
                      <RadioGroupOption value="Yes" id="repetitiveBehaviour-yes" label={t.yes} />
                      <RadioGroupOption value="No" id="repetitiveBehaviour-no" label={t.no} />
                    </RadioGroup>
                  </Field>

                  <Field>
                    <FieldLabel>
                      {t.sensorySensitivity} <span className="text-red-400">*</span>
                    </FieldLabel>
                    <RadioGroup
                      value={form.sensorySensitivity}
                      onValueChange={value => handleChange('sensorySensitivity', value)}
                      className="flex flex-row gap-4"
                      required
                    >
                      <RadioGroupOption value="Yes" id="sensorySensitivity-yes" label={t.yes} />
                      <RadioGroupOption value="No" id="sensorySensitivity-no" label={t.no} />
                    </RadioGroup>
                  </Field>

                  <Field>
                    <FieldLabel>
                      {t.hyperactivity} <span className="text-red-400">*</span>
                    </FieldLabel>
                    <RadioGroup
                      value={form.hyperactivity}
                      onValueChange={value => handleChange('hyperactivity', value)}
                      className="flex flex-row gap-4"
                      required
                    >
                      <RadioGroupOption value="Yes" id="hyperactivity-yes" label={t.yes} />
                      <RadioGroupOption value="No" id="hyperactivity-no" label={t.no} />
                    </RadioGroup>
                  </Field>

                  <Field>
                    <FieldLabel>
                      {t.responseToName} <span className="text-red-400">*</span>
                    </FieldLabel>
                    <RadioGroup
                      value={form.responseToName}
                      onValueChange={value => handleChange('responseToName', value)}
                      className="flex flex-row gap-4"
                      required
                    >
                      <RadioGroupOption value="Yes" id="responseToName-yes" label={t.yes} />
                      <RadioGroupOption value="No" id="responseToName-no" label={t.no} />
                    </RadioGroup>
                  </Field>

                  <Field>
                    <FieldLabel>
                      {t.eyeContact} <span className="text-red-400">*</span>
                    </FieldLabel>
                    <RadioGroup
                      value={form.eyeContact}
                      onValueChange={value => handleChange('eyeContact', value)}
                      className="flex flex-row gap-4"
                      required
                    >
                      <RadioGroupOption value="Yes" id="eyeContact-yes" label={t.yes} />
                      <RadioGroupOption value="No" id="eyeContact-no" label={t.no} />
                    </RadioGroup>
                  </Field>
                </div>

                {showFollowUps && (
                  <div className="p-6 mt-10 rounded-2xl border shadow-inner animate-fadeIn border-border bg-card">
                    <div className="flex items-center mb-6 space-x-3">
                      <div className="w-1 h-6 from-orange-500 to-amber-500 rounded-full bg-linear-to-b"></div>
                      <h3 className="text-xl font-bold text-foreground font-raleway">
                        {t.additionalQuestions}
                      </h3>
                      <div className="px-2 py-1 text-xs font-semibold text-white bg-orange-500 rounded-full">
                        {t.required}
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-y-6 gap-x-8 items-end md:grid-cols-2">
                      <Field>
                        <FieldLabel className="mb-4">
                          {t.signsBefore3Years} <span className="text-red-400">*</span>
                        </FieldLabel>
                        <RadioGroup
                          value={form.signsBefore3Years}
                          onValueChange={value => handleChange('signsBefore3Years', value)}
                          className="flex flex-row gap-4"
                          required
                        >
                          <RadioGroupOption value="Yes" id="signsBefore3Years-yes" label={t.yes} />
                          <RadioGroupOption value="No" id="signsBefore3Years-no" label={t.no} />
                        </RadioGroup>
                      </Field>

                      <Field>
                        <FieldLabel>
                          {t.strugglesDailyTasks} <span className="text-red-400">*</span>
                        </FieldLabel>
                        <RadioGroup
                          value={form.strugglesDailyTasks}
                          onValueChange={value => handleChange('strugglesDailyTasks', value)}
                          className="flex flex-row gap-4"
                          required
                        >
                          <RadioGroupOption
                            value="Yes"
                            id="strugglesDailyTasks-yes"
                            label={t.yes}
                          />
                          <RadioGroupOption value="No" id="strugglesDailyTasks-no" label={t.no} />
                        </RadioGroup>
                      </Field>
                    </div>
                  </div>
                )}

                <div className="flex gap-3 justify-end items-center mt-10">
                  <Button type="submit" variant="outline" className="w-[150px] rounded-full">
                    {t.submit}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
