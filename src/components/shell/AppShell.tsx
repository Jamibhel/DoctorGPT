"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "@/lib/auth/session-context";
import { usePWA } from "@/lib/pwa/pwa-context";
import { useHospital } from "@/lib/state/hospital-store";
import { 
  Button, 
  Badge, 
  NavRailItem, 
  Drawer,
  LoadingSpinner 
} from "@/components/ui";
import { UnifiedAuthModal } from "@/components/auth";
import { 
  Activity, 
  AlertTriangle, 
  Bell, 
  Building2, 
  Calendar, 
  ChevronDown, 
  ClipboardList, 
  Download, 
  FileText, 
  Heart, 
  LayoutDashboard, 
  Lock, 
  LogOut, 
  Menu, 
  Mic, 
  Monitor, 
  Moon, 
  PanelLeftClose, 
  PanelLeftOpen, 
  Pill, 
  Search, 
  ShieldAlert, 
  Smartphone, 
  Sparkles, 
  Stethoscope, 
  Tablet, 
  UserCheck, 
  Users, 
  Wifi, 
  WifiOff, 
  X 
} from "lucide-react";

export type DeviceMode = "AUTO" | "DESKTOP" | "TABLET" | "PHONE";

export interface AppShellProps {
  children: React.ReactNode;
  activeView: string;
  onSelectView: (view: string) => void;
  onOpenDesignSystem?: () => void;
}

export const AppShell: React.FC<AppShellProps> = ({
  children,
  activeView,
  onSelectView,
  onOpenDesignSystem,
}) => {
  const { currentUser, secondsRemaining, lockSession, switchUser, availableUsers } = useSession();
  const { isInstallable, isStandalone, isOnline, promptInstall } = usePWA();
  const { 
    facilities,
    activeFacilityId,
    activeFacility,
    switchFacility,
    patients, 
    activePatientId, 
    activePatient, 
    activeEncounter, 
    activeBed, 
    setActivePatientId,
    activeEmergency,
    acknowledgeEmergencyCode,
    resolveEmergencyCode,
    observations,
    orders
  } = useHospital();

  // Responsive device state
  const [deviceOverride, setDeviceOverride] = useState<DeviceMode>("AUTO");
  const [windowWidth, setWindowWidth] = useState(1200);
  const [navCollapsed, setNavCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isPatientSearchOpen, setIsPatientSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Compute effective device layout
  const effectiveDevice: "DESKTOP" | "TABLET" | "PHONE" = 
    deviceOverride !== "AUTO" 
      ? (deviceOverride as "DESKTOP" | "TABLET" | "PHONE")
      : windowWidth >= 1024 
        ? "DESKTOP" 
        : windowWidth >= 768 
          ? "TABLET" 
          : "PHONE";

  // Filter patients for quick omni-search
  const filteredPatients = patients.filter((p) =>
    `${p.firstName} ${p.lastName} ${p.mrn}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Latest NEWS2 for active patient
  const patientObservations = observations.filter((o) => o.patientId === activePatientId);
  const latestObservation = patientObservations[patientObservations.length - 1];
  const news2Score = latestObservation?.news2Score ?? 0;
  const news2Risk = latestObservation?.news2RiskTier ?? "LOW";

  // Stat counts for badges
  const pendingOrdersCount = orders.filter((o) => o.status === "ORDERED" || o.priority === "STAT").length;

  // Format seconds to mm:ss
  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen bg-bji-slate-50 flex flex-col text-bji-slate-900 selection:bg-bji-green-100 selection:text-bji-green-900">
      {/* 1. TOP GLOBAL EMERGENCY BANNER (If Active) */}
      {activeEmergency && (
        <div className="bg-bji-red-600 text-white px-4 py-2 flex items-center justify-between text-xs font-semibold shadow-md animate-pulse">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-white" />
            <span>
              EMERGENCY ACTIVE: {activeEmergency.codeType.replace("_", " ")} — Location: {activeEmergency.location}
            </span>
            <span className="opacity-80 font-normal">
              • Patient: {activePatient.lastName}, {activePatient.firstName} ({activePatient.mrn})
            </span>
          </div>
          <div className="flex items-center gap-2">
            {activeEmergency.state === "ACTIVE" ? (
              <Button
                variant="outline"
                size="xs"
                className="bg-white text-bji-red-700 hover:bg-bji-red-50 border-white font-bold"
                onClick={() => acknowledgeEmergencyCode(activeEmergency.id)}
              >
                Acknowledge On-Scene
              </Button>
            ) : (
              <Button
                variant="outline"
                size="xs"
                className="bg-white text-bji-red-700 hover:bg-bji-red-50 border-white font-bold"
                onClick={() => resolveEmergencyCode(activeEmergency.id)}
              >
                Debrief & Resolve
              </Button>
            )}
          </div>
        </div>
      )}

      {/* 2. TOP CLINICAL HEADER BAR */}
      <header className="h-12 bg-white border-b border-bji-slate-200 px-3 sm:px-4 flex items-center justify-between z-30 select-none shadow-2xs">
        {/* Left: Branding & Facility Switcher */}
        <div className="flex items-center gap-2 sm:gap-3">
          {effectiveDevice !== "DESKTOP" && (
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-1.5 rounded-bji text-bji-slate-600 hover:bg-bji-slate-100"
              aria-label="Open clinical navigation"
            >
              <Menu className="w-4 h-4" />
            </button>
          )}

          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-bji-sm bg-bji-green-600 flex items-center justify-center text-white font-bold text-xs shadow-xs">
              +
            </div>
            <div className="hidden sm:block">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold tracking-tight text-bji-slate-900">
                  BJI MediSupport
                </span>
                <span className="text-[10px] text-bji-slate-400 font-mono">v1.0</span>
              </div>
              <div className="text-[10px] text-bji-slate-600 font-semibold truncate max-w-[180px]">
                {activeFacility?.name || currentUser.facilityName}
              </div>
            </div>
          </div>

          {/* Facility Tenant Selector */}
          <div className="hidden md:flex items-center gap-1.5 pl-2 border-l border-bji-slate-200">
            <Building2 className="w-3.5 h-3.5 text-bji-green-600 shrink-0" />
            <select
              value={activeFacilityId}
              onChange={(e) => switchFacility(e.target.value)}
              className="h-6 px-1.5 text-[11px] font-semibold text-bji-slate-800 bg-bji-slate-100 hover:bg-bji-slate-200/80 border border-bji-slate-300 rounded-bji-xs outline-none cursor-pointer"
              title="Switch Active Facility Tenant"
            >
              {facilities.map((fac) => (
                <option key={fac.id} value={fac.id}>
                  {fac.name} ({fac.type.replace('_', ' ')})
                </option>
              ))}
            </select>
          </div>

          {/* Online / Standalone Badge */}
          <div className="hidden lg:flex items-center gap-1.5 pl-2 border-l border-bji-slate-200">
            {isOnline ? (
              <span className="inline-flex items-center gap-1 text-[11px] text-bji-green-700 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-bji-green-500" />
                Live
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] text-bji-amber-700 font-medium">
                <WifiOff className="w-3 h-3 text-bji-amber-600" />
                Offline Shell
              </span>
            )}
            {isStandalone && (
              <Badge tone="info" size="xs" variant="subtle">PWA Standalone</Badge>
            )}
          </div>
        </div>

        {/* Center: Omni-Search & Active Patient Quick-Switch */}
        <div className="flex-1 max-w-md mx-2 sm:mx-4">
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsPatientSearchOpen(!isPatientSearchOpen)}
              className="w-full h-8 px-2.5 bg-bji-slate-100 hover:bg-bji-slate-200/70 border border-bji-slate-200 rounded-bji flex items-center justify-between text-xs text-bji-slate-700 transition-colors"
            >
              <div className="flex items-center gap-2 truncate">
                <Search className="w-3.5 h-3.5 text-bji-slate-400 shrink-0" />
                <span className="font-semibold text-bji-slate-900 truncate">
                  {activePatient.lastName}, {activePatient.firstName}
                </span>
                <span className="text-meta font-mono text-bji-slate-500">
                  ({activePatient.mrn})
                </span>
                <span className="text-meta text-bji-slate-400 hidden sm:inline">
                  • {activeBed ? `Bed ${activeBed.roomNumber}-${activeBed.bedNumber}` : "Unassigned"}
                </span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0 pl-1">
                <Badge
                  tone={news2Risk === "HIGH" ? "critical" : news2Risk === "MEDIUM" ? "warning" : "success"}
                  size="xs"
                  variant="solid"
                >
                  NEWS2: {news2Score}
                </Badge>
                <ChevronDown className="w-3 h-3 text-bji-slate-400" />
              </div>
            </button>

            {/* Patient Search Dropdown */}
            {isPatientSearchOpen && (
              <div className="absolute top-10 left-0 right-0 bg-white border border-bji-slate-300 rounded-bji shadow-lg z-50 p-2 space-y-1.5">
                <input
                  type="text"
                  placeholder="Search patient name, MRN, or bed..."
                  autoFocus
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-8 px-2.5 bg-bji-slate-50 border border-bji-slate-300 rounded-bji text-xs text-bji-slate-900 focus:outline-none focus:ring-1 focus:ring-bji-green-600"
                />
                <div className="max-h-56 overflow-y-auto divide-y divide-bji-slate-100">
                  {filteredPatients.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        setActivePatientId(p.id);
                        setIsPatientSearchOpen(false);
                        setSearchQuery("");
                      }}
                      className={`w-full text-left p-2 flex items-center justify-between text-xs hover:bg-bji-slate-50 transition-colors ${
                        p.id === activePatientId ? "bg-bji-green-50/70 font-semibold" : ""
                      }`}
                    >
                      <div>
                        <div className="text-bji-slate-900 font-medium">
                          {p.lastName}, {p.firstName}
                        </div>
                        <div className="text-[11px] font-mono text-bji-slate-500">
                          {p.mrn} • DOB: {p.dateOfBirth} ({p.sex})
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge tone={p.allergies.length > 0 ? "critical" : "neutral"} size="xs">
                          {p.allergies.length > 0 ? `${p.allergies.length} Allergies` : "NKDA"}
                        </Badge>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Device Switcher, Inactivity Timer & Clinician Session */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Responsive Device Override Switcher (for QA / Demonstration) */}
          <div className="hidden xl:flex items-center bg-bji-slate-100 p-0.5 rounded-bji border border-bji-slate-200 text-meta">
            {(["AUTO", "DESKTOP", "TABLET", "PHONE"] as DeviceMode[]).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setDeviceOverride(mode)}
                className={`px-1.5 py-0.5 rounded-bji-xs font-semibold transition-colors ${
                  deviceOverride === mode
                    ? "bg-white text-bji-green-800 shadow-2xs"
                    : "text-bji-slate-500 hover:text-bji-slate-800"
                }`}
              >
                {mode === "AUTO" ? "Auto" : mode === "DESKTOP" ? "Desk" : mode === "TABLET" ? "Tab" : "Mob"}
              </button>
            ))}
          </div>

          {/* PWA Install Button */}
          {isInstallable && (
            <Button
              variant="outline"
              size="xs"
              onClick={promptInstall}
              leftIcon={<Download className="w-3 h-3 text-bji-green-600" />}
              className="hidden md:inline-flex bg-bji-green-50 border-bji-green-300 text-bji-green-800 hover:bg-bji-green-100"
            >
              Install PWA
            </Button>
          )}

          {/* Design System Preview Button */}
          {onOpenDesignSystem && (
            <Button
              variant="ghost"
              size="xs"
              onClick={onOpenDesignSystem}
              className="text-bji-slate-600 hover:text-bji-slate-900 hidden sm:inline-flex"
            >
              Design Tokens
            </Button>
          )}

          {/* Inactivity Timer Countdown & Lock */}
          <button
            type="button"
            onClick={lockSession}
            className="flex items-center gap-1 px-2 py-1 rounded-bji text-meta font-mono font-medium text-bji-slate-600 hover:bg-bji-slate-100 hover:text-bji-slate-900 transition-colors border border-transparent hover:border-bji-slate-200"
            title="Workstation Security: Click to Lock Session"
          >
            <Lock className="w-3 h-3 text-bji-slate-400" />
            <span className={secondsRemaining < 60 ? "text-bji-red-600 font-bold animate-pulse" : ""}>
              {formatTimer(secondsRemaining)}
            </span>
          </button>

          {/* User Profile & Role Switcher */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center gap-1.5 p-1 rounded-bji hover:bg-bji-slate-100 transition-colors"
            >
              <div className="w-7 h-7 rounded-bji-sm bg-bji-slate-800 text-white font-bold text-xs flex items-center justify-center">
                {currentUser.avatarInitials}
              </div>
              <div className="hidden lg:block text-left">
                <div className="text-xs font-semibold text-bji-slate-900 leading-tight">
                  {currentUser.name.split(",")[0]}
                </div>
                <div className="text-[10px] text-bji-green-700 font-medium leading-none">
                  {currentUser.role}
                </div>
              </div>
              <ChevronDown className="w-3 h-3 text-bji-slate-400" />
            </button>

            {/* User Session Dropdown */}
            {isUserMenuOpen && (
              <div className="absolute right-0 top-10 w-64 bg-white border border-bji-slate-300 rounded-bji shadow-lg z-50 p-2.5 space-y-2">
                <div className="border-b border-bji-slate-100 pb-2">
                  <div className="text-xs font-semibold text-bji-slate-900">{currentUser.name}</div>
                  <div className="text-meta text-bji-slate-500">{currentUser.title}</div>
                  <div className="text-meta text-bji-green-700 font-medium mt-0.5">
                    {currentUser.departmentName}
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="text-[10px] uppercase tracking-wider font-semibold text-bji-slate-400 px-1">
                    Switch Clinician (Shared Device)
                  </div>
                  {availableUsers.map((u) => (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => {
                        switchUser(u.id);
                        setIsUserMenuOpen(false);
                      }}
                      className={`w-full text-left px-2 py-1.5 rounded-bji-sm text-xs flex items-center justify-between ${
                        u.id === currentUser.id ? "bg-bji-green-50 text-bji-green-900 font-semibold" : "hover:bg-bji-slate-50 text-bji-slate-700"
                      }`}
                    >
                      <div className="truncate">
                        <span>{u.name}</span>
                        <span className="text-meta text-bji-slate-400 block">{u.role}</span>
                      </div>
                      {u.id === currentUser.id && <UserCheck className="w-3.5 h-3.5 text-bji-green-700 shrink-0" />}
                    </button>
                  ))}
                </div>

                <div className="pt-2 border-t border-bji-slate-100 flex items-center justify-between gap-1">
                  <Button 
                    variant="outline" 
                    size="xs" 
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      setIsAuthModalOpen(true);
                    }}
                    className="text-[11px]"
                  >
                    Auth & Portals
                  </Button>
                  <Button variant="danger" size="xs" onClick={lockSession} leftIcon={<Lock className="w-3 h-3" />}>
                    Lock
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* 3. MAIN WORKSPACE CONTAINER */}
      <div className="flex-1 flex overflow-hidden">
        {/* DESKTOP NAVIGATION RAIL (Visible on desktop viewports) */}
        {effectiveDevice === "DESKTOP" && (
          <aside
            className={`bg-bji-slate-900 text-white flex flex-col border-r border-bji-slate-800 transition-all duration-200 select-none ${
              navCollapsed ? "w-14" : "w-56"
            }`}
          >
            {/* Nav Header / Collapse Toggle */}
            <div className="h-10 px-3 flex items-center justify-between border-b border-bji-slate-800 text-bji-slate-400 text-xs">
              {!navCollapsed && <span className="font-semibold uppercase tracking-wider text-[10px]">Clinical Rail</span>}
              <button
                type="button"
                onClick={() => setNavCollapsed(!navCollapsed)}
                className="p-1 hover:text-white hover:bg-bji-slate-800 rounded transition-colors"
                title={navCollapsed ? "Expand navigation" : "Collapse navigation"}
              >
                {navCollapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
              </button>
            </div>

            {/* Navigation Workspaces List */}
            <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
              <NavRailItem
                icon={<LayoutDashboard className="w-4 h-4" />}
                label="Command Center"
                isActive={activeView === "command"}
                onClick={() => onSelectView("command")}
                collapsed={navCollapsed}
              />
              <NavRailItem
                icon={<FileText className="w-4 h-4" />}
                label="Patient Chart"
                isActive={activeView === "chart"}
                onClick={() => onSelectView("chart")}
                collapsed={navCollapsed}
              />
              <NavRailItem
                icon={<Pill className="w-4 h-4" />}
                label="CPOE & Orders"
                badge={pendingOrdersCount > 0 ? pendingOrdersCount : undefined}
                badgeTone="warning"
                isActive={activeView === "cpoe" || activeView === "orders"}
                onClick={() => onSelectView("cpoe")}
                collapsed={navCollapsed}
              />
              <NavRailItem
                icon={<ClipboardList className="w-4 h-4" />}
                label="eMAR Meds"
                isActive={activeView === "medications"}
                onClick={() => onSelectView("medications")}
                collapsed={navCollapsed}
              />
              <NavRailItem
                icon={<Activity className="w-4 h-4" />}
                label="Pharmacy Queue"
                isActive={activeView === "pharmacy"}
                onClick={() => onSelectView("pharmacy")}
                collapsed={navCollapsed}
              />
              <NavRailItem
                icon={<Building2 className="w-4 h-4" />}
                label="Bed Matrix & ADT"
                isActive={activeView === "beds"}
                onClick={() => onSelectView("beds")}
                collapsed={navCollapsed}
              />
              <NavRailItem
                icon={<Monitor className="w-4 h-4" />}
                label="PACS Imaging"
                isActive={activeView === "imaging"}
                onClick={() => onSelectView("imaging")}
                collapsed={navCollapsed}
              />
              <NavRailItem
                icon={<Mic className="w-4 h-4" />}
                label="Ambient AI Scribe"
                isActive={activeView === "scribe"}
                onClick={() => onSelectView("scribe")}
                collapsed={navCollapsed}
              />
              <NavRailItem
                icon={<Users className="w-4 h-4" />}
                label="Staff Operations"
                isActive={activeView === "operations"}
                onClick={() => onSelectView("operations")}
                collapsed={navCollapsed}
              />
              <NavRailItem
                icon={<Building2 className="w-4 h-4" />}
                label="Facility Admin"
                isActive={activeView === "facility_admin"}
                onClick={() => onSelectView("facility_admin")}
                collapsed={navCollapsed}
              />
            </nav>

            {/* Bottom Facility Context */}
            <div className="p-2 border-t border-bji-slate-800 text-[10px] text-bji-slate-400">
              {!navCollapsed ? (
                <div className="px-1 space-y-0.5">
                  <div className="font-semibold text-white truncate">{currentUser.facilityName}</div>
                  <div className="text-bji-slate-400">{currentUser.departmentName}</div>
                  <div className="text-bji-green-400 font-mono">BJI Cloud • Encrypted</div>
                </div>
              ) : (
                <div className="text-center font-bold text-bji-green-400">BJI</div>
              )}
            </div>
          </aside>
        )}

        {/* WORKSPACE CONTENT AREA */}
        <main className="flex-1 overflow-y-auto bg-bji-slate-50 flex flex-col">
          {children}
        </main>
      </div>

      {/* 4. MOBILE / PHONE BOTTOM TOUCH DOCK (Visible on Phone viewports) */}
      {effectiveDevice === "PHONE" && (
        <nav
          aria-label="Mobile rounding dock"
          className="fixed bottom-0 left-0 right-0 h-14 bg-white border-t border-bji-slate-200 flex items-center justify-around z-40 select-none shadow-lg px-2"
        >
          <button
            type="button"
            onClick={() => onSelectView("command")}
            className={`flex flex-col items-center justify-center flex-1 h-full py-1 text-meta transition-colors ${
              activeView === "command" ? "text-bji-green-700 font-bold" : "text-bji-slate-500 hover:text-bji-slate-800"
            }`}
          >
            <LayoutDashboard className="w-4 h-4 mb-0.5" />
            <span>Census</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectView("chart")}
            className={`flex flex-col items-center justify-center flex-1 h-full py-1 text-meta transition-colors ${
              activeView === "chart" ? "text-bji-green-700 font-bold" : "text-bji-slate-500 hover:text-bji-slate-800"
            }`}
          >
            <Heart className="w-4 h-4 mb-0.5" />
            <span>Vitals</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectView("medications")}
            className={`flex flex-col items-center justify-center flex-1 h-full py-1 text-meta transition-colors ${
              activeView === "medications" ? "text-bji-green-700 font-bold" : "text-bji-slate-500 hover:text-bji-slate-800"
            }`}
          >
            <Pill className="w-4 h-4 mb-0.5" />
            <span>eMAR</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectView("scribe")}
            className={`flex flex-col items-center justify-center flex-1 h-full py-1 text-meta transition-colors ${
              activeView === "scribe" ? "text-bji-green-700 font-bold" : "text-bji-slate-500 hover:text-bji-slate-800"
            }`}
          >
            <Mic className="w-4 h-4 mb-0.5" />
            <span>Scribe</span>
          </button>

          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(true)}
            className="flex flex-col items-center justify-center flex-1 h-full py-1 text-meta text-bji-slate-500 hover:text-bji-slate-800"
          >
            <Menu className="w-4 h-4 mb-0.5" />
            <span>More</span>
          </button>
        </nav>
      )}

      {/* 5. TABLET / MOBILE SLIDE-OVER NAVIGATION DRAWER */}
      <Drawer
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        title="Clinical Workspaces"
        subtitle={`${activeFacility?.name || currentUser.facilityName} • ${currentUser.role}`}
        width="sm"
      >
        {/* Mobile / Tablet Facility Tenant Selector */}
        <div className="p-2.5 bg-bji-slate-100 rounded-bji mb-3 border border-bji-slate-200 space-y-1">
          <label className="text-[10px] font-bold text-bji-slate-600 uppercase tracking-wider block">
            Active Healthcare Facility
          </label>
          <select
            value={activeFacilityId}
            onChange={(e) => {
              switchFacility(e.target.value);
              setIsMobileMenuOpen(false);
            }}
            className="w-full h-8 px-2 text-xs font-semibold text-bji-slate-900 bg-white border border-bji-slate-300 rounded-bji outline-none cursor-pointer"
          >
            {facilities.map((fac) => (
              <option key={fac.id} value={fac.id}>
                {fac.name} ({fac.type.replace('_', ' ')})
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <NavRailItem
            icon={<LayoutDashboard className="w-4 h-4" />}
            label="Command Center & Census"
            isActive={activeView === "command"}
            onClick={() => {
              onSelectView("command");
              setIsMobileMenuOpen(false);
            }}
          />
          <NavRailItem
            icon={<FileText className="w-4 h-4" />}
            label="Patient Chart & Flowsheet"
            isActive={activeView === "chart"}
            onClick={() => {
              onSelectView("chart");
              setIsMobileMenuOpen(false);
            }}
          />
          <NavRailItem
            icon={<Pill className="w-4 h-4" />}
            label="CPOE Order Management"
            badge={pendingOrdersCount > 0 ? pendingOrdersCount : undefined}
            badgeTone="warning"
            isActive={activeView === "cpoe"}
            onClick={() => {
              onSelectView("cpoe");
              setIsMobileMenuOpen(false);
            }}
          />
          <NavRailItem
            icon={<ClipboardList className="w-4 h-4" />}
            label="Medication Administration (eMAR)"
            isActive={activeView === "medications"}
            onClick={() => {
              onSelectView("medications");
              setIsMobileMenuOpen(false);
            }}
          />
          <NavRailItem
            icon={<Activity className="w-4 h-4" />}
            label="Pharmacy Verification Queue"
            isActive={activeView === "pharmacy"}
            onClick={() => {
              onSelectView("pharmacy");
              setIsMobileMenuOpen(false);
            }}
          />
          <NavRailItem
            icon={<Building2 className="w-4 h-4" />}
            label="Bed Matrix & Ward Capacity"
            isActive={activeView === "beds"}
            onClick={() => {
              onSelectView("beds");
              setIsMobileMenuOpen(false);
            }}
          />
          <NavRailItem
            icon={<Monitor className="w-4 h-4" />}
            label="PACS Imaging Worklist"
            isActive={activeView === "imaging"}
            onClick={() => {
              onSelectView("imaging");
              setIsMobileMenuOpen(false);
            }}
          />
          <NavRailItem
            icon={<Mic className="w-4 h-4" />}
            label="Ambient AI Scribe & Notes"
            isActive={activeView === "scribe"}
            onClick={() => {
              onSelectView("scribe");
              setIsMobileMenuOpen(false);
            }}
          />
          <NavRailItem
            icon={<Users className="w-4 h-4" />}
            label="Staff Operations & Census"
            isActive={activeView === "operations"}
            onClick={() => {
              onSelectView("operations");
              setIsMobileMenuOpen(false);
            }}
          />
          <NavRailItem
            icon={<Building2 className="w-4 h-4" />}
            label="Facility Admin & Catalog"
            isActive={activeView === "facility_admin"}
            onClick={() => {
              onSelectView("facility_admin");
              setIsMobileMenuOpen(false);
            }}
          />
        </div>

        <div className="pt-4 border-t border-bji-slate-200 space-y-2">
          <Button
            variant="danger"
            size="sm"
            onClick={() => {
              setIsMobileMenuOpen(false);
              lockSession();
            }}
            leftIcon={<Lock className="w-3.5 h-3.5" />}
            className="w-full"
          >
            Lock Workstation Now
          </Button>
        </div>
      </Drawer>

      {/* Unified Authentication & Portal Modal */}
      <UnifiedAuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
      />
    </div>
  );
};
