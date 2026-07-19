const PREFERRED_CAMERA_NAME = 'kreo';

/**
 * Picks the preferred camera from the list (e.g. "Kreo") or null if not found.
 */
export function findPreferredCamera(cameras: MediaDeviceInfo[]): MediaDeviceInfo | null {
  return cameras.find(d => (d.label ?? '').toLowerCase().includes(PREFERRED_CAMERA_NAME)) ?? null;
}

/**
 * Returns a human-readable label for a camera by device id.
 */
export function getCameraLabel(deviceId: string, devices: MediaDeviceInfo[]): string {
  const device = devices.find(d => d.deviceId === deviceId);
  return device?.label ?? `Camera ${deviceId.slice(0, 8)}`;
}

/**
 * Returns the notice message about preferred camera usage.
 */
export function getCameraNotice(
  preferredDevice: MediaDeviceInfo | null,
  selectedDeviceId: string
): string {
  if (preferredDevice) {
    return selectedDeviceId === preferredDevice.deviceId
      ? 'Using suggested Web Camera: Kreo'
      : 'Please select suggested Web Camera: Kreo';
  }
  return 'Suggested Web Camera (Kreo) not found. Using available default camera.';
}
