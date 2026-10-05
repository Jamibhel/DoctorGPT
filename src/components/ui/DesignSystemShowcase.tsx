"use client";

import React, { useState } from "react";
import {
  Button,
  Input,
  Select,
  Badge,
  Alert,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Tabs,
  TabList,
  TabTrigger,
  TabContent,
  Dialog,
  Drawer,
  LoadingSpinner,
  Skeleton,
  TableSkeleton,
  EmptyState,
  ErrorState,
  Breadcrumb,
  NavRailItem,
} from "./index";
import { 
  Activity, 
  AlertCircle, 
  Calendar, 
  Check, 
  ChevronRight, 
  FileText, 
  Heart, 
  Layers, 
  Pill, 
  Search, 
  ShieldAlert, 
  Stethoscope, 
  Users,
  X
} from "lucide-react";

export const DesignSystemShowcase: React.FC<{ onClose?: () => void }> = ({ onClose }) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [buttonLoading, setButtonLoading] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [activeTab, setActiveTab] = useState("components");

  const breadcrumbItems = [
    { label: "BJI MediSupport", onClick: () => {} },
    { label: "Design System", onClick: () => {} },
    { label: "Clinical Primitives v1.0", isCurrent: true },
  ];

  return (
    <div className="bg-white min-h-screen text-bji-slate-900 border-b border-bji-slate-200">
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-white border-b border-bji-slate-200 px-6 py-3 flex items-center justify-between shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 bg-bji-green-600 rounded-sm" />
            <h1 className="text-md font-semibold text-bji-slate-900 tracking-tight">
              BJI MediSupport — Foundational Clinical Design System
            </h1>
            <Badge tone="success" size="xs" variant="subtle">STAGE 1 VERIFIED</Badge>
          </div>
          <Breadcrumb items={breadcrumbItems} />
        </div>

        <div className="flex items-center gap-2">
          {onClose && (
            <Button variant="outline" size="sm" onClick={onClose} leftIcon={<X className="w-3.5 h-3.5" />}>
              Close Showcase
            </Button>
          )}
        </div>
      </header>

      {/* Main Content Showcase */}
      <main className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Design System Principles Banner */}
        <section className="bg-bji-slate-50 border border-bji-slate-200 rounded-bji p-4 space-y-2">
          <h2 className="text-xs font-semibold text-bji-slate-800 uppercase tracking-wider">
            Clinical System Constraints & Standard Tokens
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs text-bji-slate-600 pt-1">
            <div className="border-l-2 border-bji-green-600 pl-2.5">
              <span className="font-semibold text-bji-slate-900 block">Primary Accent</span>
              Restrained Healthcare Green (#059669) for active/confirmed/stable states.
            </div>
            <div className="border-l-2 border-bji-blue-600 pl-2.5">
              <span className="font-semibold text-bji-slate-900 block">Informational Blue</span>
              High-contrast blue (#2563EB) for non-critical clinical telemetry & orders.
            </div>
            <div className="border-l-2 border-bji-red-600 pl-2.5">
              <span className="font-semibold text-bji-slate-900 block">Critical Alerts</span>
              High-priority clinical red (#DC2626) reserved for contraindications & codes.
            </div>
            <div className="border-l-2 border-bji-slate-400 pl-2.5">
              <span className="font-semibold text-bji-slate-900 block">Restrained Geometry</span>
              Flat 3–6px border radius, subtle borders, high density, zero card slop.
            </div>
          </div>
        </section>

        {/* Tabs for Categories */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabList variant="underline">
            <TabTrigger value="components" icon={<Layers className="w-3.5 h-3.5" />}>
              Core Controls & Inputs
            </TabTrigger>
            <TabTrigger value="data" icon={<FileText className="w-3.5 h-3.5" />}>
              Clinical Tables & Flowsheets
            </TabTrigger>
            <TabTrigger value="feedback" icon={<ShieldAlert className="w-3.5 h-3.5" />}>
              Alerts, Badges & Overlays
            </TabTrigger>
            <TabTrigger value="states" icon={<Activity className="w-3.5 h-3.5" />}>
              Empty, Loading & Error States
            </TabTrigger>
          </TabList>

          {/* TAB 1: CORE CONTROLS & INPUTS */}
          <TabContent value="components" className="space-y-6">
            {/* Buttons Section */}
            <div className="border border-bji-slate-200 rounded-bji p-4 bg-white space-y-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-bji-slate-700">
                1. Button Variants & Sizes
              </h3>
              <div className="flex flex-wrap gap-2.5 items-center">
                <Button variant="primary" size="sm">Primary Action</Button>
                <Button variant="secondary" size="sm">Secondary</Button>
                <Button variant="outline" size="sm">Outline</Button>
                <Button variant="ghost" size="sm">Ghost</Button>
                <Button variant="danger" size="sm" leftIcon={<AlertCircle className="w-3.5 h-3.5" />}>
                  Critical / Cancel
                </Button>
                <Button variant="info" size="sm" leftIcon={<Stethoscope className="w-3.5 h-3.5" />}>
                  Clinical Action
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  isLoading={buttonLoading}
                  onClick={() => {
                    setButtonLoading(true);
                    setTimeout(() => setButtonLoading(false), 1500);
                  }}
                >
                  {buttonLoading ? "Processing..." : "Click to Test Loading"}
                </Button>
              </div>

              <div className="pt-2 border-t border-bji-slate-100 flex flex-wrap gap-2 items-center text-meta text-bji-slate-500">
                <span>Sizes:</span>
                <Button size="xs" variant="outline">XS (26px)</Button>
                <Button size="sm" variant="outline">SM (30px)</Button>
                <Button size="md" variant="outline">MD (36px)</Button>
                <Button size="lg" variant="outline">LG (42px)</Button>
              </div>
            </div>

            {/* Inputs & Selects Section */}
            <div className="border border-bji-slate-200 rounded-bji p-4 bg-white space-y-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-bji-slate-700">
                2. Form Inputs & Clinical Dropdowns
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                  label="Patient MRN or Name"
                  placeholder="e.g. BJI-001001 or Eleanor"
                  leftSlot={<Search className="w-3.5 h-3.5" />}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  hint="Type to search active census"
                />

                <Input
                  label="Required Field with Validation"
                  placeholder="Mandatory clinician ID"
                  required
                  error={inputValue.length > 10 ? "Maximum 10 characters exceeded" : undefined}
                  hint="Shows error if > 10 chars"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                />

                <Select label="Care Department" required>
                  <option value="MED_SURG">Med-Surg Ward 3 (General)</option>
                  <option value="ICU">Intensive Care Unit (ICU)</option>
                  <option value="EMERGENCY">Emergency Department (ED)</option>
                  <option value="CARDIOLOGY">Cardiology Step-Down</option>
                </Select>
              </div>
            </div>

            {/* Modals & Drawers Trigger Section */}
            <div className="border border-bji-slate-200 rounded-bji p-4 bg-white space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-bji-slate-700">
                3. Overlays: Dialogs & Slide-Over Drawers
              </h3>
              <div className="flex gap-3">
                <Button variant="outline" size="sm" onClick={() => setIsDialogOpen(true)}>
                  Launch Clinical Dialog
                </Button>
                <Button variant="outline" size="sm" onClick={() => setIsDrawerOpen(true)}>
                  Launch Slide-Over Drawer
                </Button>
              </div>
            </div>
          </TabContent>

          {/* TAB 2: CLINICAL TABLES & FLOWSHEETS */}
          <TabContent value="data" className="space-y-4">
            <div className="border border-bji-slate-200 rounded-bji p-4 bg-white space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-bji-slate-700">
                    High-Density Clinical Flowsheet Table
                  </h3>
                  <p className="text-meta text-bji-slate-500">
                    Dense tabular layout with monospace numbers, status badges, and selectable rows.
                  </p>
                </div>
                <Badge tone="info" size="xs">Active Encounter: ENC-2026-001</Badge>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>Respiration</TableHead>
                    <TableHead>SpO2 (Scale)</TableHead>
                    <TableHead>O2 Supp</TableHead>
                    <TableHead>BP (mmHg)</TableHead>
                    <TableHead>HR (bpm)</TableHead>
                    <TableHead>Consciousness</TableHead>
                    <TableHead>NEWS2</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow isCritical>
                    <TableCell mono>14:30 Today</TableCell>
                    <TableCell mono className="text-bji-red-700 font-bold">24 /min</TableCell>
                    <TableCell mono className="text-bji-amber-700 font-bold">92% (Scale 1)</TableCell>
                    <TableCell><Badge tone="warning" size="xs">Supplemental (4L)</Badge></TableCell>
                    <TableCell mono>138 / 84</TableCell>
                    <TableCell mono className="text-bji-red-700 font-bold">112 bpm</TableCell>
                    <TableCell>ALERT</TableCell>
                    <TableCell>
                      <Badge tone="critical" size="xs" variant="solid" dot>Score 7 (HIGH)</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="xs">Acknowledge</Button>
                    </TableCell>
                  </TableRow>

                  <TableRow isSelected>
                    <TableCell mono>10:00 Today</TableCell>
                    <TableCell mono>18 /min</TableCell>
                    <TableCell mono>95% (Scale 1)</TableCell>
                    <TableCell><Badge tone="neutral" size="xs">Room Air</Badge></TableCell>
                    <TableCell mono>124 / 78</TableCell>
                    <TableCell mono>88 bpm</TableCell>
                    <TableCell>ALERT</TableCell>
                    <TableCell>
                      <Badge tone="info" size="xs" variant="subtle" dot>Score 2 (LOW)</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="xs">View Chart</Button>
                    </TableCell>
                  </TableRow>

                  <TableRow>
                    <TableCell mono>06:00 Today</TableCell>
                    <TableCell mono>16 /min</TableCell>
                    <TableCell mono>97% (Scale 1)</TableCell>
                    <TableCell><Badge tone="neutral" size="xs">Room Air</Badge></TableCell>
                    <TableCell mono>118 / 74</TableCell>
                    <TableCell mono>76 bpm</TableCell>
                    <TableCell>ALERT</TableCell>
                    <TableCell>
                      <Badge tone="success" size="xs" variant="subtle" dot>Score 0 (NORMAL)</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="xs">View Chart</Button>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </TabContent>

          {/* TAB 3: ALERTS & BADGES */}
          <TabContent value="feedback" className="space-y-6">
            {/* Badges Matrix */}
            <div className="border border-bji-slate-200 rounded-bji p-4 bg-white space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-bji-slate-700">
                Clinical Status Badges (Subtle, Solid, Outline)
              </h3>
              <div className="flex flex-wrap gap-2.5 items-center">
                <Badge tone="success" variant="subtle" dot>Stable / Discharged</Badge>
                <Badge tone="info" variant="subtle" dot>Routine Lab Order</Badge>
                <Badge tone="warning" variant="subtle" dot>Caution / Dose Limit</Badge>
                <Badge tone="critical" variant="subtle" dot>Critical Allergy Conflict</Badge>
                <Badge tone="neutral" variant="subtle">Draft Document</Badge>
              </div>

              <div className="pt-2 flex flex-wrap gap-2.5 items-center">
                <Badge tone="success" variant="solid">Active (Solid)</Badge>
                <Badge tone="info" variant="solid">In Triage (Solid)</Badge>
                <Badge tone="warning" variant="solid">STAT Pending (Solid)</Badge>
                <Badge tone="critical" variant="solid">CODE BLUE (Solid)</Badge>
                <Badge tone="neutral" variant="solid">Archived (Solid)</Badge>
              </div>
            </div>

            {/* Clinical Alerts Matrix */}
            <div className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-bji-slate-700">
                Deterministic CDS Clinical Alerts
              </h3>
              <Alert
                severity="critical"
                title="Critical Allergy Contraindication: Penicillin Anaphylaxis"
                description="Patient Eleanor Vance has a documented SEVERE allergy to Amoxicillin/Penicillins. Ordering Piperacillin-Tazobactam poses an acute hypersensitivity risk."
                action={
                  <div className="flex gap-2">
                    <Button variant="danger" size="xs">Cancel Order</Button>
                    <Button variant="outline" size="xs">Override with Documented Rationale</Button>
                  </div>
                }
              />

              <Alert
                severity="warning"
                title="Drug-Drug Bleeding Interaction: Warfarin + Ketorolac"
                description="Concurrent administration of oral anticoagulant and NSAID markedly elevates gastrointestinal bleeding hazard."
                action={<Button variant="outline" size="xs">Review Anticoagulation Flowsheet</Button>}
              />

              <Alert
                severity="info"
                title="Renal Function Notice: eGFR 28 mL/min/1.73m²"
                description="Calculated CrCl indicates severe renal impairment. Automatic dosing adjustment recommended for hydrophilic antimicrobials."
              />

              <Alert
                severity="success"
                title="Pharmacy Verification Completed"
                description="Medication verified by Dr. Sarah Chen, PharmD. Ready for nurse administration in Bed 304-B."
              />
            </div>
          </TabContent>

          {/* TAB 4: EMPTY, LOADING & ERROR STATES */}
          <TabContent value="states" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-bji-slate-700 uppercase tracking-wider">
                  Loading Spinner & Skeletons
                </h4>
                <div className="p-4 border border-bji-slate-200 rounded-bji bg-white space-y-3">
                  <div className="flex items-center gap-4">
                    <LoadingSpinner size="xs" label="Checking CDS rules..." />
                    <LoadingSpinner size="sm" label="Synchronizing eMAR..." />
                  </div>
                  <div className="space-y-2 pt-2">
                    <Skeleton variant="text" />
                    <Skeleton variant="text" className="w-3/4" />
                    <Skeleton variant="rectangular" height={40} />
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-bji-slate-700 uppercase tracking-wider">
                  Table Skeleton Loader
                </h4>
                <TableSkeleton rows={3} columns={3} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <EmptyState
                icon={<Calendar className="w-4 h-4" />}
                title="No Pending Laboratory Orders"
                description="All diagnostic specimens for this encounter have been collected, processed, and verified."
                action={<Button variant="outline" size="xs">Create New Lab Order</Button>}
              />

              <ErrorState
                title="Failed to Synchronize Bed Transfer"
                message="Bed 402-A is currently marked as CLEANING and cannot accept a new patient until housekeeping completes turnover."
                errorCode="ERR_BED_NOT_AVAILABLE"
                onRetry={() => alert("Retrying bed verification...")}
              />
            </div>
          </TabContent>
        </Tabs>
      </main>

      {/* SAMPLE DIALOG */}
      <Dialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        title="Administer Scheduled Medication"
        subtitle={
          <div className="flex items-center gap-2 mt-0.5">
            <span className="font-semibold text-bji-slate-800">Eleanor Vance</span>
            <span>•</span>
            <span className="font-mono">MRN SYN-849201</span>
            <span>•</span>
            <span>Bed 304-B</span>
          </div>
        }
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                alert("Medication administered successfully!");
                setIsDialogOpen(false);
              }}
              leftIcon={<Check className="w-3.5 h-3.5" />}
            >
              Confirm Administration
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <div className="bg-bji-slate-50 border border-bji-slate-200 rounded-bji p-3 space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-bji-slate-900">Metformin 500mg Oral Tablet</span>
              <Badge tone="info" size="xs">SCHEDULED: 08:00</Badge>
            </div>
            <p className="text-meta text-bji-slate-600">Oral with meals • Indication: Type 2 Diabetes</p>
          </div>

          <Input
            label="Clinician Verification PIN"
            type="password"
            placeholder="Enter 4-digit PIN"
            required
            hint="Shared workstation re-authentication requirement"
          />
        </div>
      </Dialog>

      {/* SAMPLE SLIDE-OVER DRAWER */}
      <Drawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title="Patient Clinical Audit Trail"
        subtitle="Chronological log of verified clinical events"
        footer={
          <Button variant="outline" size="sm" onClick={() => setIsDrawerOpen(false)}>
            Close Audit Trail
          </Button>
        }
      >
        <div className="space-y-2">
          <div className="border-l-2 border-bji-green-600 pl-3 py-1 space-y-0.5">
            <div className="flex items-center justify-between text-meta">
              <span className="font-semibold text-bji-slate-900">Medication Administered</span>
              <span className="font-mono text-bji-slate-500">14:02:18</span>
            </div>
            <p className="text-meta text-bji-slate-600">Nurse Marcus Thorne confirmed Metformin 500mg Oral.</p>
          </div>

          <div className="border-l-2 border-bji-blue-600 pl-3 py-1 space-y-0.5">
            <div className="flex items-center justify-between text-meta">
              <span className="font-semibold text-bji-slate-900">NEWS2 Score Calculated: 7</span>
              <span className="font-mono text-bji-slate-500">12:30:10</span>
            </div>
            <p className="text-meta text-bji-slate-600">Vital signs entered triggering HIGH risk alert.</p>
          </div>
        </div>
      </Drawer>
    </div>
  );
};
