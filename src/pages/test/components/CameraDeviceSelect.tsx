export interface CameraDeviceSelectProps {
  devices: MediaDeviceInfo[];
  selectedDeviceId: string;
  onDeviceChange: (deviceId: string) => void;
}

export function CameraDeviceSelect({
  devices,
  selectedDeviceId,
  onDeviceChange,
}: CameraDeviceSelectProps) {
  if (devices.length <= 1) return null;

  return (
    <div className="mb-6 w-full">
      <label htmlFor="camera-select" className="mb-3 block text-base font-semibold text-foreground">
        Camera Device
      </label>
      <div className="relative">
        <select
          id="camera-select"
          value={selectedDeviceId}
          onChange={e => onDeviceChange(e.target.value)}
          className="w-full cursor-pointer appearance-none rounded-lg border border-border bg-card px-4 py-3 pr-10 text-foreground transition-all duration-200 hover:border-primary focus:border-transparent focus:outline-none focus:ring-2 focus:ring-ring"
          aria-label="Select camera device"
        >
          {devices.map(device => (
            <option
              key={device.deviceId}
              value={device.deviceId}
              className="bg-card text-foreground"
            >
              {device.label ?? `Camera ${device.deviceId.slice(0, 8)}`}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3">
          <svg
            className="h-4 w-4 text-foreground"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
    </div>
  );
}
