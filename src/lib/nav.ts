import { ROLES, type Role } from '@/lib/rbac';

export interface NavItem {
  title: string;
  href: string;
  icon: string; // Lucide icon name, resolved in the sidebar
  roles: Role[];
}

/**
 * Admin/staff sidebar navigation. Each item declares which roles may see it.
 * This is UI gating only — every destination also enforces server-side auth
 * and RLS.
 */
export const dashboardNav: NavItem[] = [
  { title: 'Dashboard', href: '/dashboard', icon: 'LayoutDashboard', roles: [ROLES.SUPER_ADMIN, ROLES.DOCTOR, ROLES.NURSE, ROLES.RECEPTIONIST] },
  { title: 'My Patients', href: '/dashboard/my-patients', icon: 'ClipboardList', roles: [ROLES.SUPER_ADMIN, ROLES.DOCTOR] },
  { title: 'Patients', href: '/patients', icon: 'Users', roles: [ROLES.SUPER_ADMIN, ROLES.DOCTOR, ROLES.NURSE, ROLES.RECEPTIONIST] },
  { title: 'Registrations', href: '/dashboard/registrations', icon: 'Inbox', roles: [ROLES.SUPER_ADMIN, ROLES.NURSE, ROLES.RECEPTIONIST] },
  { title: 'Appointments', href: '/dashboard/appointments', icon: 'CalendarDays', roles: [ROLES.SUPER_ADMIN, ROLES.DOCTOR, ROLES.NURSE, ROLES.RECEPTIONIST] },
  { title: 'Waiting Queue', href: '/dashboard/queue', icon: 'ListOrdered', roles: [ROLES.SUPER_ADMIN, ROLES.NURSE, ROLES.RECEPTIONIST] },
  { title: 'Doctors', href: '/dashboard/doctors', icon: 'Stethoscope', roles: [ROLES.SUPER_ADMIN] },
  { title: 'Departments', href: '/dashboard/departments', icon: 'Building2', roles: [ROLES.SUPER_ADMIN] },
  { title: 'Medical Records', href: '/dashboard/records', icon: 'FileText', roles: [ROLES.SUPER_ADMIN, ROLES.DOCTOR, ROLES.NURSE] },
  { title: 'Laboratory', href: '/dashboard/laboratory', icon: 'FlaskConical', roles: [ROLES.SUPER_ADMIN, ROLES.DOCTOR, ROLES.NURSE] },
  { title: 'Prescriptions', href: '/dashboard/prescriptions', icon: 'Pill', roles: [ROLES.SUPER_ADMIN, ROLES.DOCTOR] },
  { title: 'Pharmacy', href: '/dashboard/pharmacy', icon: 'Cross', roles: [ROLES.SUPER_ADMIN, ROLES.NURSE] },
  { title: 'Notifications', href: '/dashboard/notifications', icon: 'Bell', roles: [ROLES.SUPER_ADMIN] },
  { title: 'SMS Campaigns', href: '/dashboard/sms', icon: 'MessageSquare', roles: [ROLES.SUPER_ADMIN] },
  { title: 'Reports', href: '/dashboard/reports', icon: 'BarChart3', roles: [ROLES.SUPER_ADMIN] },
  { title: 'Audit Logs', href: '/dashboard/audit', icon: 'ScrollText', roles: [ROLES.SUPER_ADMIN] },
  { title: 'Users', href: '/dashboard/users', icon: 'ShieldCheck', roles: [ROLES.SUPER_ADMIN] },
  { title: 'Settings', href: '/admin/settings', icon: 'Settings', roles: [ROLES.SUPER_ADMIN] },
];

export function navForRole(role: Role): NavItem[] {
  return dashboardNav.filter((item) => item.roles.includes(role));
}
