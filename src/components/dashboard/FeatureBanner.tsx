import { useState } from 'react';
import { useNavigate } from 'react-router';

import { X } from 'lucide-react';

import { Button } from '@/components/ui/button';

interface FeatureBannerProps {
  featureId: string;
  title: string;
  description: string;
  actionLabel: string;
  actionUrl: string;
}

export const FeatureBanner = ({
  featureId,
  title,
  description,
  actionLabel,
  actionUrl,
}: FeatureBannerProps) => {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(() => {
    return !localStorage.getItem(`${featureId}_banner_dismissed`);
  });

  const handleDismiss = () => {
    localStorage.setItem(`${featureId}_banner_dismissed`, 'true');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="relative isolate flex items-center gap-x-6 overflow-hidden bg-primary px-6 py-2.5 sm:px-3.5 sm:before:flex-1 rounded-xl shadow-md border border-primary/20">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <p className="text-sm leading-6 text-primary-foreground">
          <strong className="font-semibold">{title}</strong>
          <span className="mx-2 inline-block mb-0.5 h-1 w-1 rounded-full bg-primary-foreground/50" />
          {description}
        </p>
        <Button
          variant="secondary"
          size="sm"
          className="h-7 text-xs flex-none rounded-full bg-background/20 hover:bg-background/30 text-primary-foreground border-none shadow-none cursor-pointer"
          onClick={() => navigate(actionUrl)}
        >
          {actionLabel}{' '}
          <span aria-hidden="true" className="ml-1">
            &rarr;
          </span>
        </Button>
      </div>
      <div className="flex flex-1 justify-end">
        <button
          type="button"
          className="-m-3 p-3 focus-visible:-outline-offset-4 text-primary-foreground/80 hover:text-primary-foreground"
          onClick={handleDismiss}
        >
          <span className="sr-only">Dismiss</span>
          <X className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
};
