"use client";

import React, { useState, useEffect } from "react";
import { HospitalProvider } from "@/lib/state/hospital-store";
import { DesktopHospitalWorkspace } from "@/components/desktop/DesktopHospitalWorkspace";
import { MobileHospitalApp } from "@/components/mobile/MobileHospitalApp";
import { runClinicalUnitTests } from "@/lib/services/__tests__/clinical-services.test";

function HospitalOSApp() {
  const [isMobileScreen, setIsMobileScreen] = useState(false);

  useEffect(() => {
    const testResults = runClinicalUnitTests();
    console.log("HospitalOS Clinical Engine Validation:", testResults);
  }, []);

  useEffect(() => {
    const checkWidth = () => {
      setIsMobileScreen(window.innerWidth < 768);
    };
    checkWidth();
    window.addEventListener("resize", checkWidth);
    return () => window.removeEventListener("resize", checkWidth);
  }, []);

  const shouldRenderMobile = isMobileScreen;

  return (
    <div className="min-h-screen bg-[#F4F6F8]">
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
