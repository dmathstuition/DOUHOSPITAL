import {
  LayoutDashboard,
  Users,
  CalendarDays,
  ListOrdered,
  ClipboardList,
  Inbox,
  Stethoscope,
  Building2,
  FileText,
  FlaskConical,
  Pill,
  Cross,
  Bell,
  MessageSquare,
  BarChart3,
  ScrollText,
  ShieldCheck,
  Settings,
  Activity,
  type LucideIcon,
} from 'lucide-react';

const map: Record<string, LucideIcon> = {
  LayoutDashboard,
  Users,
  CalendarDays,
  ListOrdered,
  ClipboardList,
  Inbox,
  Stethoscope,
  Building2,
  FileText,
  FlaskConical,
  Pill,
  Cross,
  Bell,
  MessageSquare,
  BarChart3,
  ScrollText,
  ShieldCheck,
  Settings,
};

export function navIcon(name: string): LucideIcon {
  return map[name] ?? Activity;
}
