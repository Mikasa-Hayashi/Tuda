import { DeviceMotion } from 'expo-sensors';
import { useEffect, useState } from 'react';

/**
 * Angle (degrees, clockwise) to turn on-screen icons so they stay upright when the phone is
 * rotated while the interface itself stays portrait, like the system Camera app.
 * Upside-down is ignored (the last angle is kept).
 *
 * If the icons ever turn the wrong way on a device, flip DIRECTION.
 */
const DIRECTION = -1;

export function useDeviceRotation(): number {
  const [angle, setAngle] = useState(0);

  useEffect(() => {
    DeviceMotion.setUpdateInterval(150);
    let candidate = 0;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const subscription = DeviceMotion.addListener((m) => {
      const o = m.orientation;
      if (o !== 0 && o !== 90 && o !== -90) return;
      const next = o * DIRECTION;
      if (next === candidate) return;
      // Apply only once the new orientation has held for a moment, so a phone tilted near the
      // boundary does not make the icons flicker.
      candidate = next;
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => setAngle(next), 350);
    });
    return () => {
      subscription.remove();
      if (timer) clearTimeout(timer);
    };
  }, []);

  return angle;
}
