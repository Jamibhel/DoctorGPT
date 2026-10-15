"use client";

import React from "react";
import { useSession } from "@/lib/auth/session-context";
import { Permission, UserRole } from "@/types/hospital";
import { ShieldAlert, Lock, ArrowLeft, UserCheck } from "lucide-react";
import { Button, Badge } from "@/components/ui";

interface PermissionGuardProps {
  children: React.ReactNode;
  requiredPermission?: Permission;
  requiredRole?: UserRole | UserRole[];
  fallbackViewName?: string;
  onNavigateHome?: () => void;
}

export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  children,
  requiredPermission,
  requiredRole,
  fallbackViewName = "Command Center",
  onNavigateHome
}) => {
  const { currentUser, hasPermission, switchUser, availableUsers } = useSession();

  let isAuthorized = true;
  let reason = "";

  if (requiredPermission && !hasPermission(requiredPermission)) {
    isAuthorized = false;
    reason = `Your account does not have the '${requiredPermission}' clinical privilege.`;
  }

  if (requiredRole) {
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    if (!roles.includes(currentUser.role)) {
      isAuthorized = false;
      reason = `This clinical module is strictly restricted to [${roles.join(", ")}]. Current role: ${currentUser.role}.`;
    }
  }

  if (isAuthorized) {
    return <>{children}</>;
  }

  // Find users that have this required role for demonstration/authorized switching
  const authorizedDemonstrationUsers = availableUsers.filter((u) => {
    if (requiredRole) {
      const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
      return roles.includes(u.role);
    }
    return true;
  });

  return (
    <div className="p-8 max-w-2xl mx-auto my-12 bg-white rounded-bji border border-bji-red-300 shadow-sm space-y-5 animate-in fade-in">
      <div className="flex items-center gap-3 border-b border-bji-slate-100 pb-4">
        <div className="w-10 h-10 rounded-bji-sm bg-bji-red-50 text-bji-red-700 flex items-center justify-center shrink-0 border border-bji-red-200">
          <ShieldAlert className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-sm font-bold text-bji-slate-900 tracking-tight">
            Access Restricted: Insufficient Clinical Authorization
          </h2>
          <p className="text-meta text-bji-slate-500">
            Role-Based Access Control (RBAC) &amp; HIPAA Security Rule Safeguard
          </p>
        </div>
      </div>

      <div className="p-3.5 bg-bji-slate-50 rounded-bji border border-bji-slate-200 space-y-2 text-xs">
        <div className="flex items-center justify-between">
          <span className="text-bji-slate-500 font-medium">Authenticated Practitioner:</span>
          <span className="font-bold text-bji-slate-900">{currentUser.name}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-bji-slate-500 font-medium">Assigned Clinical Role:</span>
          <Badge tone="warning" size="xs">{currentUser.role}</Badge>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-bji-slate-500 font-medium">Access Violation:</span>
          <span className="text-bji-red-700 font-semibold">{reason}</span>
        </div>
      </div>

      <p className="text-xs text-bji-slate-600">
        Clinical protocols require that order entries, medication verification, and facility configuration be conducted exclusively by appropriately licensed, accredited practitioners.
      </p>

      {authorizedDemonstrationUsers.length > 0 && (
        <div className="pt-2 border-t border-bji-slate-100 space-y-2">
          <span className="text-[11px] font-bold uppercase text-bji-slate-500 tracking-wider block">
            Authorized Practitioners for this Module:
          </span>
          <div className="flex flex-wrap gap-2">
            {authorizedDemonstrationUsers.slice(0, 3).map((u) => (
              <Button
                key={u.id}
                variant="outline"
                size="xs"
                onClick={() => switchUser(u.id)}
                leftIcon={<UserCheck className="w-3 h-3 text-bji-green-700" />}
                className="bg-white border-bji-slate-300 hover:bg-bji-slate-50 text-bji-slate-800"
              >
                Switch to {u.name} ({u.role})
              </Button>
            ))}
          </div>
        </div>
      )}

      <div className="pt-3 border-t border-bji-slate-100 flex items-center justify-between">
        {onNavigateHome ? (
          <Button
            variant="primary"
            size="sm"
            onClick={onNavigateHome}
            leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}
          >
            Return to {fallbackViewName}
          </Button>
        ) : (
          <span />
        )}
        <span className="text-[10px] text-bji-slate-400 font-mono">
          Audit Event: SEC_RBAC_DENIED • Workstation ID {currentUser.facilityId}
        </span>
      </div>
    </div>
  );
};
