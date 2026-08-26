/**
 * Role-Based Access Control definitions.
 * These are the single source of truth for role identifiers used across the
 * app, mirrored by the `roles` table and RLS policies in the database.
 *
 * IMPORTANT: This module encodes *UI-level* gating only. It must always be
 * backed by server-side checks and Supabase RLS. Never trust the client.
 */
export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  DOCTOR: 'doctor',
  NURSE: 'nurse',
  RECEPTIONIST: 'receptionist',
  PATIENT: 'patient',
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export const ALL_ROLES: Role[] = Object.values(ROLES);

export const STAFF_ROLES: Role[] = [
  ROLES.SUPER_ADMIN,
  ROLES.DOCTOR,
  ROLES.NURSE,
  ROLES.RECEPTIONIST,
];

export const ROLE_LABELS: Record<Role, string> = {
  [ROLES.SUPER_ADMIN]: 'Super Admin',
  [ROLES.DOCTOR]: 'Doctor',
  [ROLES.NURSE]: 'Nurse',
  [ROLES.RECEPTIONIST]: 'Receptionist',
  [ROLES.PATIENT]: 'Patient / Student',
};

/**
 * Coarse capability map for UI gating. Fine-grained record-level access is
 * enforced by RLS. Each capability lists the roles permitted to *see* or
 * *initiate* the corresponding action in the interface.
 */
export const CAPABILITIES = {
  MANAGE_USERS: [ROLES.SUPER_ADMIN],
  MANAGE_SETTINGS: [ROLES.SUPER_ADMIN],
  VIEW_AUDIT_LOGS: [ROLES.SUPER_ADMIN],
  MANAGE_DEPARTMENTS: [ROLES.SUPER_ADMIN],
  MANAGE_DOCTORS: [ROLES.SUPER_ADMIN],
  SEND_BULK_SMS: [ROLES.SUPER_ADMIN],
  EXPORT_REPORTS: [ROLES.SUPER_ADMIN],
  MANAGE_NOTIFICATIONS: [ROLES.SUPER_ADMIN],

  // Every worker (and the admin) can fill in / register patient details.
  REGISTER_PATIENT: [ROLES.SUPER_ADMIN, ROLES.DOCTOR, ROLES.NURSE, ROLES.RECEPTIONIST],
  SEARCH_PATIENTS: [ROLES.SUPER_ADMIN, ROLES.DOCTOR, ROLES.NURSE, ROLES.RECEPTIONIST],
  MANAGE_QUEUE: [ROLES.SUPER_ADMIN, ROLES.NURSE, ROLES.RECEPTIONIST],
  RECORD_VITALS: [ROLES.SUPER_ADMIN, ROLES.NURSE],
  MANAGE_APPOINTMENTS: [ROLES.SUPER_ADMIN, ROLES.DOCTOR, ROLES.NURSE, ROLES.RECEPTIONIST],

  CREATE_CONSULTATION: [ROLES.SUPER_ADMIN, ROLES.DOCTOR],
  CREATE_PRESCRIPTION: [ROLES.SUPER_ADMIN, ROLES.DOCTOR],
  REQUEST_LAB: [ROLES.SUPER_ADMIN, ROLES.DOCTOR],
  VIEW_CLINICAL_NOTES: [ROLES.SUPER_ADMIN, ROLES.DOCTOR, ROLES.NURSE],
  DISPENSE_MEDICATION: [ROLES.SUPER_ADMIN, ROLES.DOCTOR, ROLES.NURSE],
} as const;

export type Capability = keyof typeof CAPABILITIES;

/** Returns true when the given role is allowed the capability at the UI level. */
export function can(role: Role | null | undefined, capability: Capability): boolean {
  if (!role) return false;
  return (CAPABILITIES[capability] as readonly Role[]).includes(role);
}

/** True when the role is any staff (non-patient) role. */
export function isStaff(role: Role | null | undefined): boolean {
  return !!role && STAFF_ROLES.includes(role);
}
