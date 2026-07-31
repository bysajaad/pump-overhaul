export const TILT_GRANTED_EVENT = "pump:tilt-granted";

type OrientationPermission = typeof DeviceOrientationEvent & {
  requestPermission?: () => Promise<"granted" | "denied">;
};

export async function requestTiltPermission(): Promise<boolean> {
  if (typeof window === "undefined" || !("DeviceOrientationEvent" in window)) return false;
  const orientation = DeviceOrientationEvent as OrientationPermission;
  try {
    const granted = orientation.requestPermission
      ? (await orientation.requestPermission()) === "granted"
      : true;
    if (granted) window.dispatchEvent(new Event(TILT_GRANTED_EVENT));
    return granted;
  } catch {
    return false;
  }
}
