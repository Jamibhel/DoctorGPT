"use client";

import React, { useState, useEffect } from "react";
import { HospitalProvider } from "@/lib/state/hospital-store";
import { DesktopHospitalWorkspace } from "@/components/desktop/DesktopHospitalWorkspace";
import { MobileHospitalApp } from "@/components/mobile/MobileHospitalApp";
import { DesignSystemShowcase } from "@/components/ui/DesignSystemShowcase";
import { runClinicalUnitTests } from "@/lib/services/__tests__/clinical-services.test";
import { Palette, Layout } from "lucide-react";

function BJIHospitalApp() {
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
    <div className="min-h-screen bg-[#F8FAFC] relative">
      {isMobileScreen ? <MobileHospitalApp /> : <DesktopHospitalWorkspace />}

      {/* Floating Design System Toggle for Review */}
      <div className="fixed bottom-3 right-3 z-50">
        <button
          type="button"
          onClick={() => setShowDesignSystem(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-bji-slate-900 text-white hover:bg-bji-slate-800 text-xs font-medium rounded-bji shadow-md border border-bji-slate-700 transition-colors"
          title="Inspect BJI MediSupport Design System"
        >
          <Palette className="w-3.5 h-3.5 text-bji-green-400" />
          <span>Stage 1: Design System</span>
        </button>
      </div>
    </div>
  );
}

export default function Root() {
  return (
    <HospitalProvider>
      <BJIHospitalApp />
    </HospitalProvider>
  );
}
