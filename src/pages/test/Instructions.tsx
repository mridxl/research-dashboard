import { useNavigate } from 'react-router';

import { ArrowRight } from 'lucide-react';

import { ExitTestDialog, useExitTestDialog } from '@/components/test/ExitTestDialog';
import { CalibrationInstructions } from '@/components/test/instructions/CalibrationInstructions';
import { CameraInstructions } from '@/components/test/instructions/CameraInstructions';

export const Instructions = () => {
  const navigate = useNavigate();
  const { showExitDialog, closeDialog } = useExitTestDialog();

  const handleNext = () => {
    navigate('/test/webcam-test');
  };

  return (
    <div className="dark flex min-h-screen flex-col items-center justify-start bg-background py-10 text-foreground">
      <div className="absolute top-6 left-6">
        <div className="inline-block relative">
          <div className="absolute inset-0 from-blue-500 to-purple-500 rounded-lg opacity-60 blur-lg bg-linear-to-r"></div>
          <h1 className="relative z-10 font-montserrat text-2xl font-semibold text-foreground">
            Aignosis
          </h1>
        </div>
      </div>

      <div className="flex flex-col items-center w-full max-w-7xl">
        <div className="mb-10 text-center">
          <h2 className="mb-2 text-3xl font-bold text-foreground underline underline-offset-4">
            Instructions
          </h2>
          <p className="text-md text-muted-foreground">
            Please read the following instructions carefully before starting the test.
          </p>
        </div>

        <CameraInstructions />
        <CalibrationInstructions />

        <div className="flex justify-center w-full max-w-md">
          <button
            onClick={handleNext}
            className="flex items-center justify-center gap-2 rounded-lg bg-primary font-semibold px-6 py-3 text-primary-foreground duration-200 hover:bg-primary/80 focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <span>Check System Configuration</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <ExitTestDialog isOpen={showExitDialog} onClose={closeDialog} />
    </div>
  );
};
