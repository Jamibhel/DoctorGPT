"use client";

import React, { useState, useEffect } from "react";
import { HospitalProvider } from "@/lib/state/hospital-store";
import { SessionProvider } from "@/lib/auth/session-context";
import { PWAProvider } from "@/lib/pwa/pwa-context";
import { AppShell } from "@/components/shell/AppShell";
import { SessionLockModal } from "@/components/shell/SessionLockModal";
import { DesktopHospitalWorkspace } from "@/components/desktop/DesktopHospitalWorkspace";
import { MobileHospitalApp } from "@/components/mobile/MobileHospitalApp";
import { DesignSystemShowcase } from "@/components/ui/DesignSystemShowcase";
import { runClinicalUnitTests } from "@/lib/services/__tests__/clinical-services.test";
import { Palette } from "lucide-react";

function BJIHospitalApp() {
  const [activeView, setActiveView] = useState("command");
  const [isMobileScreen, setIsMobileScreen] = useState(false);
  const [showDesignSystem, setShowDesignSystem] = useState(false);

  useEffect(() => {
    const testResults = runClinicalUnitTests();
    console.log("BJI MediSupport Clinical Engine Validation:", testResults);
  }, []);

  useEffect(() => {
    const checkWidth = () => {
      setIsMobileScreen(window.innerWidth < 768);
    };
    checkWidth();
    window.addEventListener("resize", checkWidth);
    return () => window.removeEventListener("resize", checkWidth);
  }, []);

  if (showDesignSystem) {
    return <DesignSystemShowcase onClose={() => setShowDesignSystem(false)} />;
  }

  return (
    <AppShell
      activeView={activeView}
      onSelectView={setActiveView}
      onOpenDesignSystem={() => setShowDesignSystem(true)}
    >
      {/* Session Inactivity & Shared-Device Lock Modal */}
      <SessionLockModal />

      {/* Responsive View Workspace */}
      {isMobileScreen ? (
        <MobileHospitalApp />
      ) : (
        <DesktopHospitalWorkspace externalView={activeView} />
      )}

      {/* Floating Design System Shortcut */}
      <div className="fixed bottom-3 right-3 z-30">
        <button
          type="button"
          onClick={() => setShowDesignSystem(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-bji-slate-900 text-white hover:bg-bji-slate-800 text-xs font-medium rounded-bji shadow-md border border-bji-slate-700 transition-colors"
          title="Inspect BJI MediSupport Design System"
        >
          <Palette className="w-3.5 h-3.5 text-bji-green-400" />
          <span className="hidden sm:inline">Stage 1: Design Tokens</span>
        </button>
      </div>
    </AppShell>
  );
}

export default function Root() {
  return (
    <HospitalProvider>
      <SessionProvider>
        <PWAProvider>
          <BJIHospitalApp />
        </PWAProvider>
      </SessionProvider>
    </HospitalProvider>
  );
}
