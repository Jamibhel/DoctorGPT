"use client";

import React from "react";
import { Permission } from "@/types/hospital";
import { useSession } from "@/lib/auth/session-context";
import { checkRolePermission } from "@/lib/auth/permissions-engine";

export interface PermissionGateProps {
  permission: Permission;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const PermissionGate: React.FC<PermissionGateProps> = ({
  permission,
  children,
  fallback = null,
}) => {
  const { currentUser, sessionType } = useSession();

  const isAllowed = checkRolePermission(
    sessionType === "PATIENT" ? "PATIENT" : currentUser.role,
    permission
  );

  if (!isAllowed) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};
