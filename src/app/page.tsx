"use client";

import React, { useState, useEffect } from "react";
import { HospitalProvider, useHospital } from "@/lib/state/hospital-store";
import { DesktopHospitalWorkspace } from "@/components/desktop/DesktopHospitalWorkspace";
import { MobileHospitalApp } from "@/components/mobile/MobileHospitalApp";
import { Smartphone, Monitor } from "lucide-react";
import { runClinicalUnitTests } from "@/lib/services/__tests__/clinical-services.test";

function HospitalOSApp() {
  const [deviceOverride, setDeviceOverride] = useState<'AUTO' | 'DESKTOP' | 'MOBILE'>('AUTO');
  const [isMobileScreen, setIsMobileScreen] = useState(false);

  // Run automated unit tests on mount to ensure clinical services (NEWS2, CDS, SBAR) are validated
  useEffect(() => {
    const testResults = runClinicalUnitTests();
    console.log("HospitalOS Clinical Engine Validation:", testResults);
  }, []);

  // Screen width detector
  useEffect(() => {
    const checkWidth = () => {
      setIsMobileScreen(window.innerWidth < 768);
    };
    checkWidth();
    window.addEventListener("resize", checkWidth);
    return () => window.removeEventListener("resize", checkWidth);
  }, []);

  const shouldRenderMobile = 
    deviceOverride === 'MOBILE' || (deviceOverride === 'AUTO' && isMobileScreen);

  return (
    <div className="relative min-h-screen">
      {/* Viewport Mode Manual Switcher Overlay Pill */}
      <div className="fixed bottom-3 right-4 z-50 flex items-center bg-slate-900/90 text-white p-1.5 rounded-full shadow-2xl border border-slate-700 text-xs font-semibold backdrop-blur-md">
        <button
          onClick={() => setDeviceOverride('DESKTOP')}
          className={`px-3 py-1 rounded-full flex items-center gap-1.5 transition ${
            !shouldRenderMobile ? 'bg-blue-600 text-white shadow-xs font-bold' : 'text-slate-400 hover:text-white'
          }`}
          title="Switch to Desktop Command Center View"
        >
          <Monitor className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Desktop Station</span>
        </button>

        <button
          onClick={() => setDeviceOverride('MOBILE')}
          className={`px-3 py-1 rounded-full flex items-center gap-1.5 transition ${
            shouldRenderMobile ? 'bg-blue-600 text-white shadow-xs font-bold' : 'text-slate-400 hover:text-white'
          }`}
          title="Switch to Mobile Bedside Rounding View"
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Mobile Rounds</span>
        </button>

        {deviceOverride !== 'AUTO' && (
          <button
            onClick={() => setDeviceOverride('AUTO')}
            className="px-2 py-0.5 text-[10px] text-slate-400 hover:text-white font-mono"
            title="Reset to Auto Screen Detection"
          >
            Auto
          </button>
        )}
      </div>

      {/* Render Distinct Experience */}
      {shouldRenderMobile ? <MobileHospitalApp /> : <DesktopHospitalWorkspace />}
    </div>
  );
}

export default function Root() {
  return (
    <HospitalProvider>
      <HospitalOSApp />
    </HospitalProvider>
  );
}
