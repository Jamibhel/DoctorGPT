/**
 * BJI MediSupport - Granular Clinical & Operational RBAC Permissions Engine
 * Enforces role-based action authorization at runtime and UI component level.
 */

import { UserRole, Permission } from "@/types/hospital";

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  PHYSICIAN: [
    "patients:read",
    "patients:create",
    "patients:update",
    "encounters:read",
    "encounters:create",
    "encounters:update",
    "orders:read",
    "orders:create",
    "orders:cancel",
    "labs:read",
    "labs:create",
    "medications:read",
    "vitals:read",
    "vitals:create",
    "notes:create",
    "notes:sign",
    "notes:amend",
    "beds:read",
    "beds:manage",
    "staff:read",
    "audit:read",
  ],
  NURSE: [
    "patients:read",
    "encounters:read",
    "orders:read",
    "labs:read",
    "labs:create",
    "medications:read",
    "medications:administer",
    "vitals:read",
    "vitals:create",
    "notes:create",
    "beds:read",
    "beds:manage",
    "staff:read",
  ],
  PHARMACIST: [
    "patients:read",
    "encounters:read",
    "orders:read",
    "orders:cancel",
    "labs:read",
    "medications:read",
    "medications:verify",
    "medications:dispense",
    "notes:create",
    "staff:read",
    "audit:read",
  ],
  RADIOLOGIST: [
    "patients:read",
    "encounters:read",
    "orders:read",
    "labs:read",
    "notes:create",
    "notes:sign",
    "staff:read",
    "audit:read",
  ],
  SURGEON: [
    "patients:read",
    "patients:create",
    "patients:update",
    "encounters:read",
    "encounters:create",
    "encounters:update",
    "orders:read",
    "orders:create",
    "orders:cancel",
    "labs:read",
    "medications:read",
    "vitals:read",
    "vitals:create",
    "notes:create",
    "notes:sign",
    "beds:read",
    "beds:manage",
    "staff:read",
  ],
  LAB_TECH: [
    "patients:read",
    "encounters:read",
    "orders:read",
    "labs:read",
    "labs:create",
    "labs:verify",
    "notes:create",
  ],
  HOSPITAL_ADMINISTRATOR: [
    "patients:read",
    "encounters:read",
    "orders:read",
    "beds:read",
    "beds:manage",
    "staff:read",
    "staff:manage",
    "facility:settings",
    "facility:update_settings",
    "facility:manage_wards",
    "chart:write_notes",
    "audit:read",
  ],
  FACILITY_ADMIN: [
    "patients:read",
    "patients:create",
    "patients:update",
    "encounters:read",
    "encounters:create",
    "encounters:update",
    "orders:read",
    "orders:create",
    "orders:cancel",
    "labs:read",
    "labs:create",
    "labs:verify",
    "medications:read",
    "medications:verify",
    "medications:dispense",
    "medications:administer",
    "vitals:read",
    "vitals:create",
    "notes:create",
    "notes:sign",
    "notes:amend",
    "beds:read",
    "beds:manage",
    "staff:read",
    "staff:manage",
    "facility:settings",
    "facility:update_settings",
    "facility:manage_wards",
    "chart:write_notes",
    "audit:read",
  ],
  CLINICAL_STAFF: [
    "patients:read",
    "encounters:read",
    "vitals:read",
    "vitals:create",
    "notes:create",
    "chart:write_notes",
    "beds:read",
  ],
};

export const PATIENT_PORTAL_PERMISSIONS: Permission[] = [
  "patients:read",
  "encounters:read",
  "orders:read",
  "labs:read",
  "medications:read",
  "vitals:read",
];

export class PermissionDeniedError extends Error {
  constructor(public requiredPermission: Permission, public role: string) {
    super(`Access Denied: Role '${role}' lacks mandatory permission '${requiredPermission}'`);
    this.name = "PermissionDeniedError";
  }
}

/**
 * Checks if a given role possesses a required permission.
 */
export function checkRolePermission(role: UserRole | "PATIENT", permission: Permission): boolean {
  if (role === "PATIENT") {
    return PATIENT_PORTAL_PERMISSIONS.includes(permission);
  }
  const permissions = ROLE_PERMISSIONS[role] || [];
  return permissions.includes(permission);
}

/**
 * Enforces permission check, throwing an error if unauthorized.
 */
export function enforcePermission(role: UserRole | "PATIENT", permission: Permission): void {
  if (!checkRolePermission(role, permission)) {
    throw new PermissionDeniedError(permission, role);
  }
}
