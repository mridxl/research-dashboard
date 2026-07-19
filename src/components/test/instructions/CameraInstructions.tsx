import { ArrowRight, Check, Info, Video, X } from 'lucide-react';

const CameraSVG = ({ size }: { size: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="text-white"
  >
    <path
      d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 6V18C21 19.1 20.1 20 19 20H5C3.9 20 3 19.1 3 18V6C3 4.9 3.9 4 5 4H8.5L9.5 3H14.5L15.5 4H19C20.1 4 21 4.9 21 6ZM12 7C9.24 7 7 9.24 7 12C7 14.76 9.24 17 12 17C14.76 17 17 14.76 17 12C17 9.24 14.76 7 12 7Z"
      fill="currentColor"
    />
  </svg>
);

export const CameraInstructions = () => {
  return (
    <div className="w-full max-w-6xl">
      <div className="mb-7">
        <h2 className="text-xl font-bold text-foreground">Camera Setup Instructions</h2>
        <p className="text-base text-muted-foreground">
          Ensure the camera is properly set up for the test.
        </p>
      </div>

      <div className="mb-8 grid grid-cols-[1fr_1fr_1fr] gap-6">
        {/* Setup Requirements */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-lg">
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary">
              <Info className="text-primary-foreground" size={18} />
            </div>
            <h3 className="text-lg font-semibold text-foreground">Setup Requirements</h3>
          </div>

          {/* Setup Requirements List */}
          <ul className="space-y-4 text-sm text-muted-foreground">
            <li className="flex items-center gap-3">
              <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-500">
                <Check size={10} className="text-white" />
              </div>
              <span>
                Camera must be positioned at the{' '}
                <strong className="font-semibold text-foreground">TOP CENTER</strong> of your screen
              </span>
            </li>
            <li className="flex items-center gap-3">
              <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-500">
                <Check size={10} className="text-white" />
              </div>
              <span>
                Camera should have{' '}
                <strong className="font-semibold text-foreground">NO TILT</strong> (0 degrees)
              </span>
            </li>
            <li className="flex items-center gap-3">
              <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-500">
                <Check size={10} className="text-white" />
              </div>
              <span>
                Ensure <strong className="font-semibold text-foreground">good lighting</strong> and
                clear view of the child&apos;s face
              </span>
            </li>
            <li className="flex items-center gap-3">
              <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-500">
                <Check size={10} className="text-white" />
              </div>
              <span>
                Position the child{' '}
                <strong className="font-semibold text-foreground">18-24 inches</strong> from the
                camera
              </span>
            </li>
          </ul>
        </div>

        {/* Camera Position */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-lg">
          <div className="mb-8 flex items-center justify-start gap-3 text-center">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-500">
              <CameraSVG size={20} />
            </div>
            <h3 className="text-lg font-semibold text-foreground">Camera Position</h3>
          </div>
          <div className="relative mx-auto aspect-video h-40 rounded-lg border-4 border-muted bg-slate-600/50">
            <div className="absolute left-1/2 top-0.5 flex h-8 w-8 -translate-x-1/2 transform items-center justify-center rounded-full bg-green-500 shadow-lg shadow-green-500/30">
              <CameraSVG size={16} />
            </div>

            <div className="absolute left-[58%] top-1.5 transform">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-500">
                <Check size={12} className="text-white" />
              </div>
            </div>

            <div className="absolute bottom-0.5 left-1/2 flex h-8 w-8 -translate-x-1/2 transform items-center justify-center rounded-full bg-slate-600 opacity-50">
              <CameraSVG size={16} />
            </div>

            <div className="absolute bottom-1.5 left-[58%] transform">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-red-500">
                <X size={12} className="text-white" />
              </div>
            </div>
          </div>

          <div className="mt-4 text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-green-500/10 px-3 py-1 text-sm font-medium text-green-500">
              <Check size={10} />
              Top Center Position
            </div>
          </div>
        </div>

        {/* Camera Tilt  */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-lg">
          <div className="mb-8 flex items-center justify-start gap-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-green-500">
              <Video className="text-white" size={17} />
            </div>
            <h3 className="text-lg font-semibold text-foreground">Camera Angle</h3>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-lg border border-green-500/20 bg-green-500/10 px-3 py-2">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500">
                  <div className="flex items-center space-x-1">
                    <Video className="text-white" size={16} />
                    <ArrowRight className="text-white" size={12} />
                  </div>
                </div>
                <span className="font-medium text-green-500">Level (0°)</span>
              </div>
              <Check size={16} className="text-green-500" />
            </div>

            <div className="flex items-center justify-between rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 opacity-75">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-600">
                  <div
                    className="flex items-center space-x-1"
                    style={{ transform: 'rotate(-15deg)' }}
                  >
                    <Video className="text-white" size={16} />
                    <ArrowRight className="text-white" size={12} />
                  </div>
                </div>
                <span className="font-medium text-red-500">Tilted Up</span>
              </div>
              <X size={16} className="text-red-500" />
            </div>

            <div className="flex items-center justify-between rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 opacity-75">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-600">
                  <div
                    className="flex items-center space-x-1"
                    style={{ transform: 'rotate(15deg)' }}
                  >
                    <Video className="text-white" size={16} />
                    <ArrowRight className="text-white" size={12} />
                  </div>
                </div>
                <span className="font-medium text-red-500">Tilted Down</span>
              </div>
              <X size={16} className="text-red-500" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
