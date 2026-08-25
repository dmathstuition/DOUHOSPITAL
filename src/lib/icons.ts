import {
  Stethoscope,
  FlaskConical,
  Pill,
  Smile,
  Baby,
  HeartPulse,
  Ambulance,
  Activity,
  type LucideIcon,
} from 'lucide-react';

/** Resolve a Lucide icon by the string name stored in config/data. */
export const iconMap: Record<string, LucideIcon> = {
  Stethoscope,
  FlaskConical,
  Pill,
  Smile,
  Baby,
  HeartPulse,
  Ambulance,
};

export function getIcon(name: string): LucideIcon {
  return iconMap[name] ?? Activity;
}
