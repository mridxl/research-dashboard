import { Clock } from 'lucide-react';

import { Card, CardContent, CardTitle } from '@/components/ui/card';

export const ComingSoon = () => {
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
      <Card className="w-full max-w-md border-dashed">
        <CardContent className="flex flex-col justify-center items-center px-6 py-16">
          <div className="p-4 mb-6 rounded-full bg-primary/10">
            <Clock className="w-12 h-12 text-primary" />
          </div>
          <CardTitle className="mb-3 text-2xl font-semibold text-center">Coming Soon</CardTitle>
          <p className="text-sm text-center text-muted-foreground">
            This feature is currently under development.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
