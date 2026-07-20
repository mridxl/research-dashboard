import { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router';

import { Loader2 } from 'lucide-react';

import { useAuth } from '@/hooks/useAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { isAuthenticated, isLoading, verifyAuth } = useAuth();
  const location = useLocation();

  const isTestRoute = location.pathname.startsWith('/test/');

  useEffect(() => {
    if (!isAuthenticated && !isLoading && !isTestRoute) {
      verifyAuth();
    }
  }, [isAuthenticated, isLoading, verifyAuth, isTestRoute]);

  if (isLoading && !isTestRoute) {
    return (
      <div className="flex fixed inset-0 z-50 flex-col justify-center items-center min-h-screen bg-background">
        <div className="flex flex-col justify-center items-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
          <p className="text-sm font-medium text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated && !isLoading) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};
