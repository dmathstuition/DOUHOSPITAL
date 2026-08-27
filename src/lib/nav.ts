import { ROLES, type Role } from '@/lib/rbac';

export type NavGroup = 'Overview' | 'Clinical' | 'Administration';

export interface NavItem {
  title: string;
  href: string;
  icon: string; // Lucide icon name, resolved in the sidebar
  roles: Role[];
  group: NavGroup;
}

/** The order groups are rendered in the labelled panel. */
export const navGroupOrder: NavGroup[] = ['Overview', 'Clinical', 'Administration'];

/**
 * Admin/staff sidebar navigation. Each item declares which roles may see it.
 * This is UI gating only — every destination also enforces server-side auth
 * and RLS.
 */
export const dashboardNav: NavItem[] = [
  { title: 'Dashboard', href: '/dashboard', icon: 'LayoutDashboard', roles: [ROLES.SUPER_ADMIN, ROLES.DOCTOR, ROLES.NURSE, ROLES.RECEPTIONIST], group: 'Overview' },
  { title: 'My Patients', href: '/dashboard/my-patients', icon: 'ClipboardList', roles: [ROLES.SUPER_ADMIN, ROLES.DOCTOR], group: 'Overview' },
  { title: 'Patients', href: '/patients', icon: 'Users', roles: [ROLES.SUPER_ADMIN, ROLES.DOCTOR, ROLES.NURSE, ROLES.RECEPTIONIST], group: 'Overview' },
  { title: 'Appointments', href: '/dashboard/appointments', icon: 'CalendarDays', roles: [ROLES.SUPER_ADMIN, ROLES.DOCTOR, ROLES.NURSE, ROLES.RECEPTIONIST], group: 'Overview' },
  { title: 'Waiting Queue', href: '/dashboard/queue', icon: 'ListOrdered', roles: [ROLES.SUPER_ADMIN, ROLES.NURSE, ROLES.RECEPTIONIST], group: 'Overview' },
  { title: 'Medical Records', href: '/dashboard/records', icon: 'FileText', roles: [ROLES.SUPER_ADMIN, ROLES.DOCTOR, ROLES.NURSE], group: 'Clinical' },
  { title: 'Laboratory', href: '/dashboard/laboratory', icon: 'FlaskConical', roles: [ROLES.SUPER_ADMIN, ROLES.DOCTOR, ROLES.NURSE], group: 'Clinical' },
  { title: 'Prescriptions', href: '/dashboard/prescriptions', icon: 'Pill', roles: [ROLES.SUPER_ADMIN, ROLES.DOCTOR], group: 'Clinical' },
  { title: 'Pharmacy', href: '/dashboard/pharmacy', icon: 'Cross', roles: [ROLES.SUPER_ADMIN, ROLES.NURSE], group: 'Clinical' },
  { title: 'Doctors', href: '/dashboard/doctors', icon: 'Stethoscope', roles: [ROLES.SUPER_ADMIN], group: 'Administration' },
  { title: 'Departments', href: '/dashboard/departments', icon: 'Building2', roles: [ROLES.SUPER_ADMIN], group: 'Administration' },
  { title: 'Notifications', href: '/dashboard/notifications', icon: 'Bell', roles: [ROLES.SUPER_ADMIN], group: 'Administration' },
  { title: 'SMS Campaigns', href: '/dashboard/sms', icon: 'MessageSquare', roles: [ROLES.SUPER_ADMIN], group: 'Administration' },
  { title: 'Reports', href: '/dashboard/reports', icon: 'BarChart3', roles: [ROLES.SUPER_ADMIN], group: 'Administration' },
  { title: 'Audit Logs', href: '/dashboard/audit', icon: 'ScrollText', roles: [ROLES.SUPER_ADMIN], group: 'Administration' },
  { title: 'Users', href: '/dashboard/users', icon: 'ShieldCheck', roles: [ROLES.SUPER_ADMIN], group: 'Administration' },
  { title: 'Settings', href: '/admin/settings', icon: 'Settings', roles: [ROLES.SUPER_ADMIN], group: 'Administration' },
];

/**
 * Curated primary destinations shown as icons in the slim brand rail (the rail
 * mirrors the day-to-day sections; the full labelled list lives in the panel).
 */
const railHrefs = [
  '/dashboard',
  '/dashboard/my-patients',
  '/patients',
  '/dashboard/appointments',
  '/dashboard/queue',
  '/dashboard/records',
  '/dashboard/doctors',
  '/dashboard/reports',
];

export function railForRole(role: Role): NavItem[] {
  const allowed = navForRole(role);
  return railHrefs
    .map((href) => allowed.find((i) => i.href === href))
    .filter((i): i is NavItem => Boolean(i));
}

export function groupedNav(items: NavItem[]): { group: NavGroup; items: NavItem[] }[] {
  return navGroupOrder
    .map((group) => ({ group, items: items.filter((i) => i.group === group) }))
    .filter((g) => g.items.length > 0);
}

export function navForRole(role: Role): NavItem[] {
  return dashboardNav.filter((item) => item.roles.includes(role));
}
