import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';

import { AxiosError } from 'axios';
import { Mail } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { login } from '@/lib/api/auth';
import { useAuthStore } from '@/stores/authStore';

export const LoginPage = () => {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      toast.error('Please enter email and password');
      return;
    }

    setIsSubmitting(true);
    try {
      const authResponse = await login(email.trim(), password);
      useAuthStore.getState().login(authResponse.token);
      toast.success('Login successful');
      navigate('/dashboard');
    } catch (err) {
      console.error('Login error', err);
      const message =
        err instanceof AxiosError
          ? err.response?.data?.detail || err.response?.data?.message || 'Login failed'
          : err instanceof Error
            ? err.message
            : 'Login failed';
      toast.error(typeof message === 'string' ? message : 'Login failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      <div className="hidden relative overflow-hidden lg:flex lg:w-1/2 bg-linear-to-br from-primary via-primary/90 to-primary/70 dark:from-background dark:via-card dark:to-muted">
        <div className="relative z-10 flex flex-col justify-center px-16">
          <h1 className="text-5xl font-bold text-white dark:text-foreground mb-4">Aignosis Research</h1>
          <p className="text-xl text-white/80 dark:text-muted-foreground leading-relaxed">
            Secure data collection for
            <br />
            developmental research studies
          </p>
        </div>
      </div>

      <div className="flex flex-col justify-center p-4 w-full lg:w-1/2 lg:p-8 lg:px-12 bg-background">
        <div className="mx-auto space-y-6 w-full max-w-md">
          <Card className="shadow-xl bg-card border-border">
            <CardHeader className="pb-4 space-y-2">
              <CardTitle className="text-3xl font-bold text-card-foreground">Research Login</CardTitle>
              <CardDescription className="text-base text-muted-foreground">
                Sign in with your research account email and password
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="researcher@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                  />
                </div>
                <Button type="submit" disabled={isSubmitting} className="w-full h-11">
                  {isSubmitting ? 'Signing in...' : 'Sign in'}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="shadow-xl bg-card border-border">
            <CardContent className="p-6">
              <div className="flex gap-3 items-center">
                <div className="flex justify-center items-center w-10 h-10 rounded-lg bg-primary/10">
                  <Mail className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-card-foreground">Need an account?</h3>
                  <p className="text-sm text-muted-foreground">
                    Contact support@aignosis.in for research access
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
