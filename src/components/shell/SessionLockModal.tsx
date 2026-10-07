"use client";

import React, { useState } from "react";
import { useSession } from "@/lib/auth/session-context";
import { Button, Badge } from "@/components/ui";
import { Lock, Shield, ArrowRight, UserCheck, AlertCircle } from "lucide-react";

export const SessionLockModal: React.FC = () => {
  const { currentUser, isLocked, unlockSession, switchUser, availableUsers } = useSession();
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);
  const [isSwitchingUser, setIsSwitchingUser] = useState(false);

  if (!isLocked) return null;

  const handleUnlock = () => {
    const success = unlockSession(pin);
    if (!success) {
      setError(true);
      setPin("");
    } else {
      setError(false);
      setPin("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleUnlock();
    }
  };

  const handleDigitClick = (digit: string) => {
    if (pin.length < 4) {
      const nextPin = pin + digit;
      setPin(nextPin);
      if (nextPin.length === 4) {
        // Automatic submit when 4 digits reached
        const success = unlockSession(nextPin);
        if (!success) {
          setError(true);
          setPin("");
        } else {
          setError(false);
          setPin("");
        }
      }
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-bji-slate-900/80 backdrop-blur-xs select-none"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="lock-title"
    >
      <div className="w-full max-w-sm bg-white border border-bji-slate-300 rounded-bji-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Lock Header */}
        <div className="bg-bji-slate-900 text-white p-4 text-center space-y-1.5 border-b border-bji-slate-800">
          <div className="w-10 h-10 mx-auto rounded-full bg-bji-green-600/30 text-bji-green-400 border border-bji-green-500/40 flex items-center justify-center">
            <Lock className="w-5 h-5" />
          </div>
          <h2 id="lock-title" className="text-sm font-semibold tracking-tight">
            Workstation Secured • Inactivity Lock
          </h2>
          <p className="text-meta text-bji-slate-400">
            {currentUser.facilityName}
          </p>
        </div>

        {/* User Card */}
        <div className="p-4 border-b border-bji-slate-200 bg-bji-slate-50 flex items-center gap-3">
          <div className="w-9 h-9 rounded-bji bg-bji-green-700 text-white font-semibold text-xs flex items-center justify-center shrink-0">
            {currentUser.avatarInitials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-xs text-bji-slate-900 truncate">
                {currentUser.name}
              </span>
              <Badge tone="success" size="xs" variant="subtle">
                {currentUser.role}
              </Badge>
            </div>
            <p className="text-meta text-bji-slate-500 truncate">
              {currentUser.departmentName}
            </p>
          </div>
        </div>

        {/* PIN Entry Body */}
        <div className="p-4 space-y-4">
          {!isSwitchingUser ? (
            <>
              <div className="text-center space-y-1">
                <label className="text-xs font-semibold text-bji-slate-700 block">
                  Enter 4-Digit Clinician PIN
                </label>
                <p className="text-meta text-bji-slate-500">
                  (Default demo PIN: <span className="font-mono font-bold text-bji-slate-800">1234</span>)
                </p>

                {/* PIN Dots Display */}
                <div className="flex justify-center gap-3 py-2">
                  {[0, 1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className={`w-3.5 h-3.5 rounded-full border transition-all ${
                        pin.length > i
                          ? "bg-bji-green-600 border-bji-green-700 scale-110"
                          : "bg-bji-slate-100 border-bji-slate-300"
                      }`}
                    />
                  ))}
                </div>

                {error && (
                  <div className="flex items-center justify-center gap-1.5 text-meta text-bji-red-600 font-medium">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>Incorrect PIN. Please re-enter.</span>
                  </div>
                )}
              </div>

              {/* Touch Numeric Keypad (for Tablets and Touch Displays) */}
              <div className="grid grid-cols-3 gap-2 max-w-[220px] mx-auto">
                {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => handleDigitClick(d)}
                    className="h-10 rounded-bji border border-bji-slate-200 bg-white hover:bg-bji-slate-50 active:bg-bji-slate-100 text-sm font-semibold text-bji-slate-800 transition-colors shadow-xs"
                  >
                    {d}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setPin("")}
                  className="h-10 rounded-bji border border-bji-slate-200 bg-bji-slate-50 hover:bg-bji-slate-100 text-xs font-medium text-bji-slate-600 transition-colors"
                >
                  Clear
                </button>
                <button
                  type="button"
                  onClick={() => handleDigitClick("0")}
                  className="h-10 rounded-bji border border-bji-slate-200 bg-white hover:bg-bji-slate-50 active:bg-bji-slate-100 text-sm font-semibold text-bji-slate-800 transition-colors shadow-xs"
                >
                  0
                </button>
                <button
                  type="button"
                  onClick={handleUnlock}
                  disabled={pin.length === 0}
                  className="h-10 rounded-bji bg-bji-green-600 hover:bg-bji-green-700 active:bg-bji-green-800 disabled:opacity-40 text-white font-semibold flex items-center justify-center transition-colors"
                >
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              {/* Switch User Footer Action */}
              <div className="pt-2 border-t border-bji-slate-100 text-center">
                <button
                  type="button"
                  onClick={() => setIsSwitchingUser(true)}
                  className="text-meta font-medium text-bji-slate-600 hover:text-bji-slate-900 transition-colors underline"
                >
                  Not {currentUser.name}? Switch Clinician
                </button>
              </div>
            </>
          ) : (
            /* Switch User Screen */
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-bji-slate-800">
                  Select Active Clinician
                </span>
                <button
                  type="button"
                  onClick={() => setIsSwitchingUser(false)}
                  className="text-meta text-bji-slate-500 hover:text-bji-slate-800"
                >
                  Back
                </button>
              </div>

              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {availableUsers.map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => {
                      switchUser(u.id);
                      setIsSwitchingUser(false);
                      setPin("");
                      setError(false);
                    }}
                    className={`w-full flex items-center gap-2.5 p-2 rounded-bji border text-left transition-colors ${
                      u.id === currentUser.id
                        ? "bg-bji-green-50 border-bji-green-300"
                        : "bg-white border-bji-slate-200 hover:bg-bji-slate-50"
                    }`}
                  >
                    <div className="w-7 h-7 rounded-bji-sm bg-bji-slate-700 text-white text-[11px] font-bold flex items-center justify-center shrink-0">
                      {u.avatarInitials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold text-bji-slate-900 truncate">
                        {u.name}
                      </div>
                      <div className="text-[10px] text-bji-slate-500 truncate">
                        {u.role} • {u.departmentName}
                      </div>
                    </div>
                    {u.id === currentUser.id && (
                      <UserCheck className="w-3.5 h-3.5 text-bji-green-700 shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
