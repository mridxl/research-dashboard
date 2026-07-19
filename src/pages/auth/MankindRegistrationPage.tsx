import { useState } from 'react';
import { Link } from 'react-router';

import { AxiosError } from 'axios';
import { ArrowRight, Check, CheckCircle2, Mail } from 'lucide-react';
import { toast } from 'sonner';

import { PhoneInput } from '@/components/auth/PhoneInput';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { registerMankindMr, sendMankindOtp, verifyMankindOtp } from '@/lib/api/mankind';
import type { MankindMrDetails, MankindRegisterResponse } from '@/lib/api/types';
import {
  INDIAN_STATES,
  MANKIND_HEADQUARTERS,
  MANKIND_STATE_HEADS,
  MANKIND_TOP_LINE_MANAGERS,
} from '@/lib/constants/mankindRegistration';

type Step = 'phone' | 'otp' | 'form' | 'success';

const registrationSteps: { key: Step; label: string }[] = [
  { key: 'phone', label: 'Contact' },
  { key: 'otp', label: 'Verification' },
  { key: 'form', label: 'MR Details' },
  { key: 'success', label: 'Complete' },
];

const defaultMrDetails: MankindMrDetails = {
  employee_id: '',
  employee_name: '',
  state: '',
  state_head: '',
  top_line_manager: '',
  headquarters: '',
};

export const MankindRegistrationPage = () => {
  const [step, setStep] = useState<Step>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpSessionId, setOtpSessionId] = useState('');
  const [otp, setOtp] = useState('');
  const [mrDetails, setMrDetails] = useState<MankindMrDetails>(defaultMrDetails);
  const [registrationDetails, setRegistrationDetails] = useState<MankindRegisterResponse | null>(
    null
  );
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const currentStepIndex = registrationSteps.findIndex(item => item.key === step);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber) {
      toast.error('Please enter phone number');
      return;
    }
    setIsSending(true);
    try {
      const response = await sendMankindOtp(phoneNumber);
      setOtpSessionId(response.otp_session_id);
      setOtp('');
      setStep('otp');
      toast.success('OTP sent successfully');
    } catch (err) {
      const errorMessage =
        err instanceof AxiosError
          ? err.response?.data?.detail || err.message
          : 'Failed to send OTP';
      toast.error(errorMessage);
    } finally {
      setIsSending(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) {
      toast.error('Please enter 6-digit OTP');
      return;
    }
    if (!otpSessionId) {
      toast.error('OTP session expired. Please send OTP again.');
      setStep('phone');
      return;
    }
    setIsVerifying(true);
    try {
      await verifyMankindOtp(phoneNumber, otpSessionId, otp);
      setStep('form');
      toast.success('OTP verified');
    } catch (err) {
      const errorMessage =
        err instanceof AxiosError
          ? err.response?.data?.detail || err.message
          : 'Failed to verify OTP';
      toast.error(errorMessage);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpSessionId) {
      toast.error('OTP session missing. Please restart registration.');
      setStep('phone');
      return;
    }
    if (
      !mrDetails.employee_id.trim() ||
      !mrDetails.employee_name.trim() ||
      !mrDetails.state ||
      !(mrDetails.state_head ?? '').trim() ||
      !(mrDetails.top_line_manager ?? '').trim() ||
      !mrDetails.headquarters
    ) {
      toast.error('Please fill all MR detail fields');
      return;
    }
    setIsSubmitting(true);
    try {
      const response = await registerMankindMr(phoneNumber, otpSessionId, {
        employee_id: mrDetails.employee_id.trim(),
        employee_name: mrDetails.employee_name.trim(),
        state: mrDetails.state,
        state_head: (mrDetails.state_head ?? '').trim(),
        top_line_manager: (mrDetails.top_line_manager ?? '').trim(),
        headquarters: mrDetails.headquarters,
      });
      setRegistrationDetails(response);
      setStep('success');
      toast.success('Registration completed');
    } catch (err) {
      const errorMessage =
        err instanceof AxiosError
          ? err.response?.data?.detail || err.message
          : 'Failed to register';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-radial-[ellipse_at_top] from-primary/15 via-background to-background px-4 py-8 md:py-12">
      <div className="mx-auto w-full max-w-6xl">
        <Card className="overflow-hidden border-primary/25 bg-card/95 shadow-2xl backdrop-blur">
          <div className="grid md:grid-cols-[260px_1fr]">
            <aside className="border-b border-border/70 bg-muted/15 p-5 md:border-b-0 md:border-r md:p-6">
              <div className="grid grid-cols-2 gap-2 md:grid-cols-1 md:gap-1.5">
                {registrationSteps.map((item, index) => {
                  const isDone = currentStepIndex > index;
                  const isCurrent = currentStepIndex === index;
                  return (
                    <div key={item.key} className="relative">
                      {index < registrationSteps.length - 1 && (
                        <span className="absolute left-[0.92rem] top-8 hidden h-6 w-px bg-border/80 md:block" />
                      )}
                      <div
                        className={`flex items-center gap-3 rounded-md px-2.5 py-2.5 text-sm transition-colors ${
                          isCurrent ? 'bg-primary/12 text-foreground' : 'text-muted-foreground/90'
                        }`}
                      >
                        <span
                          className={`flex h-6 w-6 items-center justify-center rounded-full border text-xs ${
                            isDone
                              ? 'border-primary bg-primary text-primary-foreground'
                              : isCurrent
                                ? 'border-primary/50 bg-primary/10 text-primary'
                                : 'border-border bg-background text-muted-foreground'
                          }`}
                        >
                          {isDone ? <Check className="h-3.5 w-3.5" /> : index + 1}
                        </span>
                        <span className="font-medium">{item.label}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </aside>

            <section className="flex min-h-[560px] flex-col">
              <div className="border-b border-border/70 px-6 py-7 md:px-10">
                <h1 className="text-3xl font-semibold tracking-tight text-foreground">
                  Mankind MR Registration
                </h1>
                <p className="mt-2 max-w-2xl text-base text-muted-foreground/95">
                  Complete the process to register yourself with Aignosis.
                </p>
              </div>

              <div className="flex-1 px-6 py-7 md:px-10">
                {step === 'phone' && (
                  <div className="mx-auto w-full max-w-4xl">
                    <div className="grid gap-6 lg:grid-cols-2">
                      <div className="space-y-6 rounded-xl border border-border/70 bg-muted/10 p-5 md:p-6">
                        <div>
                          <CardTitle className="text-2xl tracking-tight">
                            New User Registration
                          </CardTitle>
                          <CardDescription className="mt-2 text-base text-muted-foreground/95">
                            If you are a new user, continue with your WhatsApp mobile number to get
                            an OTP and sign in.
                          </CardDescription>
                        </div>
                        <form onSubmit={handleSendOtp} className="space-y-5">
                          <div className="space-y-2">
                            <label htmlFor="phone" className="text-sm font-medium text-foreground">
                              WhatsApp Mobile Number
                            </label>
                            <PhoneInput
                              value={phoneNumber}
                              onChange={value => setPhoneNumber(value ?? '')}
                              defaultCountry="IN"
                            />
                          </div>
                          <Button
                            type="submit"
                            disabled={!phoneNumber || isSending}
                            className="h-11 w-full rounded-lg font-medium shadow-sm disabled:opacity-50"
                          >
                            {isSending ? 'Sending OTP...' : 'Send OTP'}
                          </Button>
                        </form>
                      </div>

                      <div className="flex h-full min-h-[280px] flex-col justify-center rounded-xl border border-primary/25 bg-primary/5 p-5 md:p-6">
                        <h3 className="text-xl font-semibold tracking-tight text-foreground">
                          Already Registered?
                        </h3>
                        <p className="mt-2 text-sm text-muted-foreground">
                          If you already have an account, login directly and continue from your
                          dashboard.
                        </p>
                        <Button asChild className="mt-6 h-11 w-full rounded-lg font-medium">
                          <Link
                            to="/login"
                            className="inline-flex items-center justify-center gap-1"
                          >
                            Login here
                            <ArrowRight className="h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {step === 'otp' && (
                  <div className="mx-auto max-w-xl space-y-6">
                    <div>
                      <CardTitle className="text-2xl tracking-tight">OTP Verification</CardTitle>
                      <CardDescription className="mt-2 text-base text-muted-foreground/95">
                        Enter the 6-digit OTP sent to {phoneNumber}.
                      </CardDescription>
                    </div>
                    <div className="space-y-5">
                      <Button
                        variant="ghost"
                        onClick={() => setStep('phone')}
                        className="-ml-2 h-8 w-fit text-muted-foreground hover:text-foreground"
                      >
                        ← Back to Mobile Number
                      </Button>
                      <div className="flex justify-center rounded-lg border border-border/80 bg-muted/20 px-3 py-4">
                        <InputOTP maxLength={6} value={otp} onChange={setOtp} autoFocus>
                          <InputOTPGroup>
                            <InputOTPSlot index={0} className="h-12 w-12 text-lg" />
                            <InputOTPSlot index={1} className="h-12 w-12 text-lg" />
                            <InputOTPSlot index={2} className="h-12 w-12 text-lg" />
                            <InputOTPSlot index={3} className="h-12 w-12 text-lg" />
                            <InputOTPSlot index={4} className="h-12 w-12 text-lg" />
                            <InputOTPSlot index={5} className="h-12 w-12 text-lg" />
                          </InputOTPGroup>
                        </InputOTP>
                      </div>
                      <Button
                        onClick={handleVerifyOtp}
                        disabled={isVerifying || otp.length !== 6}
                        className="h-11 w-full rounded-lg font-medium shadow-sm disabled:opacity-50"
                      >
                        {isVerifying ? 'Verifying OTP...' : 'Verify OTP'}
                      </Button>
                    </div>
                  </div>
                )}

                {step === 'form' && (
                  <div className="mx-auto max-w-xl space-y-6">
                    <div>
                      <CardTitle className="text-2xl tracking-tight">MR Details</CardTitle>
                      <CardDescription className="mt-2 text-base text-muted-foreground/95">
                        Enter your employee and territory details for registration records.
                      </CardDescription>
                    </div>
                    <form onSubmit={handleRegister} className="space-y-4">
                      <div className="space-y-2">
                        <label htmlFor="employee-id" className="text-sm font-medium">
                          Employee ID
                        </label>
                        <Input
                          id="employee-id"
                          placeholder="Employee ID"
                          value={mrDetails.employee_id}
                          onChange={e =>
                            setMrDetails(prev => ({ ...prev, employee_id: e.target.value }))
                          }
                          autoComplete="username"
                        />
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="employee-name" className="text-sm font-medium">
                          Employee Name
                        </label>
                        <Input
                          id="employee-name"
                          placeholder="Full name"
                          value={mrDetails.employee_name}
                          onChange={e =>
                            setMrDetails(prev => ({ ...prev, employee_name: e.target.value }))
                          }
                          autoComplete="name"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">State</label>
                        <SearchableSelect
                          value={mrDetails.state}
                          onValueChange={value => setMrDetails(prev => ({ ...prev, state: value }))}
                          options={INDIAN_STATES}
                          placeholder="Select state"
                          searchPlaceholder="Search states..."
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">State Head</label>
                        <SearchableSelect
                          id="state-head"
                          value={mrDetails.state_head ?? ''}
                          onValueChange={value =>
                            setMrDetails(prev => ({ ...prev, state_head: value }))
                          }
                          options={MANKIND_STATE_HEADS}
                          placeholder="Select state head"
                          searchPlaceholder="Search state heads..."
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Top Line Manager</label>
                        <SearchableSelect
                          id="top-line-manager"
                          value={mrDetails.top_line_manager ?? ''}
                          onValueChange={value =>
                            setMrDetails(prev => ({ ...prev, top_line_manager: value }))
                          }
                          options={MANKIND_TOP_LINE_MANAGERS}
                          placeholder="Select top line manager"
                          searchPlaceholder="Search top line managers..."
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Headquarters</label>
                        <SearchableSelect
                          value={mrDetails.headquarters ?? ''}
                          onValueChange={value =>
                            setMrDetails(prev => ({ ...prev, headquarters: value }))
                          }
                          options={MANKIND_HEADQUARTERS}
                          placeholder="Select headquarters"
                          searchPlaceholder="Search headquarters..."
                        />
                      </div>
                      <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="mt-1 h-11 w-full rounded-lg font-medium shadow-sm disabled:opacity-50"
                      >
                        {isSubmitting ? 'Submitting Registration...' : 'Complete Registration'}
                      </Button>
                    </form>
                  </div>
                )}

                {step === 'success' && registrationDetails && (
                  <div className="mx-auto max-w-xl space-y-4 text-sm">
                    <div>
                      <CardTitle className="text-2xl tracking-tight">
                        Registration Completed
                      </CardTitle>
                      <CardDescription className="mt-2 text-base text-muted-foreground/95">
                        Your details have been submitted successfully.
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2 text-emerald-600">
                      <CheckCircle2 className="h-5 w-5" />
                      <span className="font-medium">Registration successful</span>
                    </div>
                    <div className="space-y-2 text-muted-foreground">
                      <p>
                        <span className="font-medium text-foreground">Account Name:</span>{' '}
                        {registrationDetails.clinic_name}
                      </p>
                      <p>
                        <span className="font-medium text-foreground">MR Number:</span>{' '}
                        {registrationDetails.mr_number}
                      </p>
                      <p>
                        <span className="font-medium text-foreground">Primary Contact:</span>{' '}
                        {registrationDetails.primary_contact_phone}
                      </p>
                    </div>
                    <div className="pt-1 flex items-start gap-2 flex-col text-muted-foreground">
                      You can now login to your account using your registered mobile number and OTP.
                      <Button variant="default" asChild>
                        <Link to="/login" className="inline-flex items-center gap-1">
                          Login
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              <div className="border-t border-border/70 px-5 py-4 md:px-8">
                In case of any problems or difficulties, please reach out at{' '}
                <a
                  href="mailto:support@aignosis.in"
                  className="inline-flex items-center self-end gap-1.5 font-medium text-foreground transition-colors hover:text-primary"
                >
                  <Mail className="h-4 w-4 text-primary" />
                  support@aignosis.in
                </a>
                .
              </div>
            </section>
          </div>
        </Card>
      </div>
    </div>
  );
};
