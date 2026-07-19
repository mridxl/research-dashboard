import { useState } from 'react';

import { ChevronLeft, ChevronRight, Dog, PlayCircle, Volume2 } from 'lucide-react';

import beepSound from '@/assets/instructions/beep-beep.mp3';
import calibrationGif from '@/assets/instructions/calibration.gif';
import namecall1 from '@/assets/instructions/namecall_1.webp';
import namecall2 from '@/assets/instructions/namecall_2.webp';

export const CalibrationInstructions = () => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const images = [
    { src: namecall1, alt: 'Name call example 1' },
    { src: namecall2, alt: 'Name call example 2' },
  ];

  const playBeepSound = () => {
    const audio = new Audio(beepSound);
    audio.play().catch(err => {
      console.warn('Could not play beep sound:', err);
    });
  };

  const nextImage = () => {
    setCurrentImageIndex(prev => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex(prev => (prev - 1 + images.length) % images.length);
  };

  return (
    <section className="mb-8 w-full max-w-6xl">
      <div className="mb-7">
        <h2 className="text-xl font-bold text-foreground">Test Instructions</h2>
        <p className="text-base text-muted-foreground">
          Follow these simple steps for a successful test
        </p>
      </div>

      <div className="mb-8 grid grid-cols-[1fr_1fr] gap-6">
        {/* Dog Face Clicking / Calibration */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-lg">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-yellow-500">
              <Dog className="text-white" size={20} />
            </div>
            <h3 className="text-lg font-semibold text-foreground">Calibration</h3>
          </div>
          <p className="text-base text-muted-foreground">
            During the calibration process, please{' '}
            <strong className="font-semibold text-foreground">click on the dog faces</strong> as
            they appear on the screen. Before clicking, ensure that the child is{' '}
            <strong className="font-semibold text-foreground">focused on the dog</strong>. This
            helps in accurately capturing their attention and response.
          </p>
          <div className="mt-5">
            <img
              src={calibrationGif}
              alt="Calibration process demonstration"
              className="mx-auto max-h-[300px] w-auto object-contain"
            />
          </div>
        </div>

        {/* Video Guidelines */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-lg">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500">
              <PlayCircle className="text-white" size={20} />
            </div>
            <h3 className="text-lg font-semibold text-foreground">Video</h3>
          </div>
          <p className="text-base text-muted-foreground">
            Have the child watch{' '}
            <strong className="font-semibold text-foreground">the complete video</strong> - without
            skipping or rewinding. When you hear a{' '}
            <span
              onClick={playBeepSound}
              className="inline-flex cursor-pointer items-baseline gap-1 font-semibold text-foreground underline underline-offset-2"
            >
              <Volume2 size={14} className="translate-y-0.5" />
              <strong className="font-semibold">beep sound</strong>
            </span>
            , call the child by their{' '}
            <strong className="font-semibold text-foreground">name</strong>. The images below show
            exactly when this happens.
          </p>

          {/* Image Slider */}
          <div className="mt-5">
            <div className="relative mx-auto max-w-md">
              <div className="relative rounded-lg">
                <img
                  src={images[currentImageIndex].src}
                  alt={images[currentImageIndex].alt}
                  className="h-auto w-full object-contain"
                />

                <button
                  onClick={prevImage}
                  className="absolute -left-10 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-background/50 text-foreground hover:bg-background/70"
                  aria-label="Previous image"
                >
                  <ChevronLeft size={16} />
                </button>

                <button
                  onClick={nextImage}
                  className="absolute -right-10 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-background/50 text-foreground hover:bg-background/70"
                  aria-label="Next image"
                >
                  <ChevronRight size={16} />
                </button>
              </div>

              <div className="mt-3 flex justify-center gap-2">
                {images.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`h-2 w-2 rounded-full transition-all ${
                      index === currentImageIndex
                        ? 'bg-blue-500'
                        : 'bg-muted-foreground/50 hover:bg-muted-foreground'
                    }`}
                    aria-label={`Go to image ${index + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
