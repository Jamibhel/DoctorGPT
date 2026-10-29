"use client";

import React, { useState, useMemo } from "react";
import { useHospital } from "@/lib/state/hospital-store";
import { HospitalBed, BedStatus, BedCapabilityType, IsolationPrecautionType } from "@/types/hospital";
import { EvsCleaningModal } from "./EvsCleaningModal";
import { BedTransferModal } from "./BedTransferModal";
import { BedAssignmentModal } from "./BedAssignmentModal";
import { 
  Building2, 
  BedDouble, 
  Sparkles, 
  ArrowRightLeft, 
  LogOut, 
  AlertTriangle, 
  CheckCircle2, 
  Search, 
  Filter, 
  Plus, 
  Activity, 
  ShieldAlert, 
  HeartPulse, 
  Wrench, 
  Clock, 
  Layers, 
  UserCheck,
  Zap,
  Wind
} from "lucide-react";

export const BedMatrixWorkspace: React.FC = () => {
  const {
    beds,
    departments,
    patients,
    encounters,
    observations,
    setActivePatientId,
    updateBedStatus,
    dischargePatient,
    currentStaff
  } = useHospital();

  const [activeSubTab, setActiveSubTab] = useState<'grid' | 'evs' | 'analytics'>('grid');
  const [selectedWardFilter, setSelectedWardFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [capabilityFilter, setCapabilityFilter] = useState<string>("ALL");
  const [isolationFilter, setIsolationFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Modals state
  const [selectedBedForEvs, setSelectedBedForEvs] = useState<HospitalBed | null>(null);
  const [selectedBedForTransfer, setSelectedBedForTransfer] = useState<{ bed: HospitalBed; patient: any; encounter: any } | null>(null);
  const [selectedBedForAssign, setSelectedBedForAssign] = useState<HospitalBed | null>(null);

  // High-level hospital capacity statistics
  const totalBedsCount = beds.length;
  const occupiedBedsCount = beds.filter(b => b.status === 'OCCUPIED').length;
  const availableBedsCount = beds.filter(b => b.status === 'AVAILABLE').length;
  const cleaningBedsCount = beds.filter(b => b.status === 'CLEANING').length;
  const dischargePendingCount = beds.filter(b => b.status === 'DISCHARGE_PENDING').length;
  const maintenanceCount = beds.filter(b => b.status === 'MAINTENANCE').length;
  const isolationInUseCount = beds.filter(b => b.status === 'OCCUPIED' && b.isolationPrecaution && b.isolationPrecaution !== 'NONE').length;

  const occupancyRatePct = totalBedsCount > 0 ? Math.round((occupiedBedsCount / totalBedsCount) * 100) : 0;

  // Filtered beds
  const filteredBeds = useMemo(() => {
    return beds.filter(b => {
      const occupant = patients.find(p => p.id === b.currentPatientId);
      const enc = encounters.find(e => e.id === b.currentEncounterId);

      const matchesWard = selectedWardFilter === "ALL" || b.wardId === selectedWardFilter;
      const matchesStatus = statusFilter === "ALL" || b.status === statusFilter;
      
      const matchesCapability = 
        capabilityFilter === "ALL" ||
        (capabilityFilter === "ICU" && b.isIcuEquipped) ||
        (capabilityFilter === "TELEMETRY" && b.telemetryEnabled) ||
        (capabilityFilter === "NEGATIVE_PRESSURE" && b.isNegativePressure) ||
        (capabilityFilter === "BARIATRIC" && b.isBariatric) ||
        (capabilityFilter === "STANDARD" && !b.isIcuEquipped && !b.telemetryEnabled);

      const matchesIsolation = 
        isolationFilter === "ALL" ||
        (isolationFilter === "ISOLATION_ONLY" && b.isolationPrecaution && b.isolationPrecaution !== "NONE") ||
        (isolationFilter === "NO_ISOLATION" && (!b.isolationPrecaution || b.isolationPrecaution === "NONE"));

      const q = searchQuery.toLowerCase();
      const matchesSearch = 
        !searchQuery.trim() ||
        b.bedNumber.toLowerCase().includes(q) ||
        b.roomNumber.toLowerCase().includes(q) ||
        (occupant && `${occupant.firstName} ${occupant.lastName}`.toLowerCase().includes(q)) ||
        (occupant && occupant.mrn.toLowerCase().includes(q)) ||
        (enc && enc.admittingDiagnosis.toLowerCase().includes(q));

      return matchesWard && matchesStatus && matchesCapability && matchesIsolation && matchesSearch;
    });
  }, [beds, patients, encounters, selectedWardFilter, statusFilter, capabilityFilter, isolationFilter, searchQuery]);

  // Group filtered beds by ward
  const wardsWithBeds = useMemo(() => {
    const list = departments.filter(d => d.type !== 'PHARMACY' && d.type !== 'RADIOLOGY');
    return list.map(ward => ({
      ward,
      beds: filteredBeds.filter(b => b.wardId === ward.id)
    })).filter(g => selectedWardFilter === "ALL" || g.ward.id === selectedWardFilter);
  }, [departments, filteredBeds, selectedWardFilter]);

  const handleDischargePrompt = (bed: HospitalBed, encounterId?: string) => {
    if (!encounterId) return;
    dischargePatient({
      encounterId,
      dischargeSummaryText: `Discharge authorized by ${currentStaff.name}. Patient transferred home in stable condition.`
    });
  };

  const handleTogglePendingDischarge = (bed: HospitalBed) => {
    const newStatus: BedStatus = bed.status === 'DISCHARGE_PENDING' ? 'OCCUPIED' : 'DISCHARGE_PENDING';
    updateBedStatus(bed.id, { status: newStatus });
  };

  const handleToggleMaintenance = (bed: HospitalBed) => {
    const newStatus: BedStatus = bed.status === 'MAINTENANCE' ? 'AVAILABLE' : 'MAINTENANCE';
    updateBedStatus(bed.id, { status: newStatus });
  };

  return (
    <div className="space-y-4">
      
      {/* Top Banner / Operational Command */}
      <div className="bg-white p-4 rounded-bji border border-[#D7DEE7] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center text-white font-bold text-xs">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-sm font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                Inpatient Bed Matrix &amp; Ward Capacity Engine
                <span className="text-[10px] font-normal px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                  Real-Time Census
                </span>
              </h1>
              <p className="text-[11px] text-slate-500">
                Acuity Bed Allocation • ADT Transfer Console • EVS Terminal Sanitization &amp; Negative Pressure Isolation
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setActiveSubTab('evs')}
            className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 font-bold text-xs rounded-bji shadow-xs flex items-center gap-1.5 transition"
          >
            <Sparkles className="w-4 h-4 text-amber-600" />
            <span>EVS Terminal Queue ({cleaningBedsCount})</span>
          </button>
        </div>
      </div>

      {/* KPI Capacity Telemetry Banner */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        {/* Occupancy Rate Bar */}
        <div className="bg-white p-3 rounded-bji border border-[#D7DEE7] col-span-2 md:col-span-2">
          <div className="flex items-center justify-between text-[10px] uppercase font-bold tracking-wider text-slate-500">
            <span>Inpatient Ward Occupancy</span>
            <span className={`font-mono font-bold ${
              occupancyRatePct > 90 ? 'text-red-700' : occupancyRatePct > 80 ? 'text-amber-700' : 'text-emerald-700'
            }`}>
              {occupancyRatePct}% ({occupiedBedsCount}/{totalBedsCount} Beds)
            </span>
          </div>
          <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden mt-2">
            <div 
              className={`h-full transition-all duration-300 ${
                occupancyRatePct > 90 ? 'bg-red-600' : occupancyRatePct > 80 ? 'bg-amber-500' : 'bg-emerald-600'
              }`}
              style={{ width: `${Math.min(100, occupancyRatePct)}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1.5 font-mono">
            <span>Surge Threshold: 90%</span>
            <span>{availableBedsCount} Vacant for Intake</span>
          </div>
        </div>

        {/* Immediate Available */}
        <div className="bg-white p-3 rounded-bji border border-[#D7DEE7]">
          <div className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Available Beds</div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-emerald-700">{availableBedsCount}</span>
            <span className="text-[10px] text-emerald-600 font-bold">Intake Ready</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Sanitized &amp; Inspected</div>
        </div>

        {/* Discharge Pending */}
        <div className="bg-white p-3 rounded-bji border border-[#D7DEE7]">
          <div className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Discharge Pending</div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-purple-700">{dischargePendingCount}</span>
            <span className="text-[10px] text-purple-600 font-bold">Imminent</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Awaiting Transport/Rx</div>
        </div>

        {/* EVS Cleaning */}
        <div className="bg-white p-3 rounded-bji border border-[#D7DEE7]">
          <div className="text-[10px] uppercase font-bold tracking-wider text-slate-500">EVS Turnover</div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-amber-700">{cleaningBedsCount}</span>
            <span className="text-[10px] text-amber-600 font-bold">Sanitizing</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Terminal Clean Cycle</div>
        </div>

        {/* Isolation / Negative Pressure */}
        <div className="bg-white p-3 rounded-bji border border-[#D7DEE7]">
          <div className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Active Isolation</div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-rose-700">{isolationInUseCount}</span>
            <span className="text-[10px] text-rose-600 font-bold">Precautions</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Contact / Droplet / Air</div>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex border-b border-[#D7DEE7] bg-white rounded-t-bji px-2 pt-2 gap-1 text-xs font-semibold">
        <button
          onClick={() => setActiveSubTab('grid')}
          className={`py-2 px-3.5 border-b-2 transition flex items-center gap-1.5 ${
            activeSubTab === 'grid'
              ? 'border-blue-600 text-blue-800 font-bold bg-blue-50/40 rounded-t'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <BedDouble className="w-4 h-4 text-blue-600" />
          <span>Ward Bed Matrix Grid ({filteredBeds.length} Beds)</span>
        </button>

        <button
          onClick={() => setActiveSubTab('evs')}
          className={`py-2 px-3.5 border-b-2 transition flex items-center gap-1.5 ${
            activeSubTab === 'evs'
              ? 'border-blue-600 text-blue-800 font-bold bg-blue-50/40 rounded-t'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-600" />
          <span>EVS Environmental Terminal Queue ({cleaningBedsCount})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('analytics')}
          className={`py-2 px-3.5 border-b-2 transition flex items-center gap-1.5 ${
            activeSubTab === 'analytics'
              ? 'border-blue-600 text-blue-800 font-bold bg-blue-50/40 rounded-t'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Layers className="w-4 h-4 text-slate-600" />
          <span>Ward Census &amp; Acuity Breakdown</span>
        </button>
      </div>

      {/* VIEW 1: WARD BED MATRIX GRID */}
      {activeSubTab === 'grid' && (
        <div className="space-y-4">
          
          {/* Filters Bar */}
          <div className="bg-white p-3 rounded-bji border border-[#D7DEE7] flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
            <div className="relative flex-1 w-full md:max-w-xs">
              <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search bed, room, patient, MRN..."
                className="w-full pl-8 pr-3 py-1.5 border border-slate-300 rounded bg-white text-xs"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              {/* Ward Filter */}
              <select
                value={selectedWardFilter}
                onChange={(e) => setSelectedWardFilter(e.target.value)}
                className="border border-slate-300 rounded p-1.5 bg-white font-medium text-slate-800"
              >
                <option value="ALL">All Wards / Units</option>
                {departments.filter(d => d.type !== 'PHARMACY' && d.type !== 'RADIOLOGY').map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border border-slate-300 rounded p-1.5 bg-white font-medium text-slate-800"
              >
                <option value="ALL">All Statuses</option>
                <option value="AVAILABLE">Available</option>
                <option value="OCCUPIED">Occupied</option>
                <option value="DISCHARGE_PENDING">Discharge Pending</option>
                <option value="CLEANING">Cleaning (EVS)</option>
                <option value="MAINTENANCE">Maintenance</option>
              </select>

              {/* Feature / Acuity Filter */}
              <select
                value={capabilityFilter}
                onChange={(e) => setCapabilityFilter(e.target.value)}
                className="border border-slate-300 rounded p-1.5 bg-white font-medium text-slate-800"
              >
                <option value="ALL">All Bed Types</option>
                <option value="ICU">ICU Equipped</option>
                <option value="TELEMETRY">Telemetry Monitored</option>
                <option value="NEGATIVE_PRESSURE">Negative Pressure Isolation</option>
                <option value="BARIATRIC">Bariatric Equipped</option>
                <option value="STANDARD">Standard Inpatient</option>
              </select>

              {/* Isolation Filter */}
              <select
                value={isolationFilter}
                onChange={(e) => setIsolationFilter(e.target.value)}
                className="border border-slate-300 rounded p-1.5 bg-white font-medium text-slate-800"
              >
                <option value="ALL">All Precautions</option>
                <option value="ISOLATION_ONLY">Isolation Only</option>
                <option value="NO_ISOLATION">Standard Precautions</option>
              </select>
            </div>
          </div>

          {/* Wards Bed Grid Groups */}
          {wardsWithBeds.length === 0 ? (
            <div className="p-12 bg-white rounded-bji border border-[#D7DEE7] text-center text-slate-500 text-xs">
              No beds match current filter selections.
            </div>
          ) : (
            wardsWithBeds.map(({ ward, beds: wardBeds }) => (
              <div key={ward.id} className="bg-white rounded-bji border border-[#D7DEE7] p-4 space-y-3">
                {/* Ward Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-[#E7ECF3] gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-slate-900">{ward.name}</span>
                    <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                      Floor {ward.floor} • {ward.building}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-[11px] text-slate-600 font-mono">
                    <span>Census: <strong>{wardBeds.filter(b => b.status === 'OCCUPIED').length}</strong>/{wardBeds.length} Occupied</span>
                    <span className="text-emerald-700 font-bold">
                      {wardBeds.filter(b => b.status === 'AVAILABLE').length} Available
                    </span>
                    {wardBeds.filter(b => b.status === 'CLEANING').length > 0 && (
                      <span className="text-amber-700 font-bold">
                        {wardBeds.filter(b => b.status === 'CLEANING').length} Cleaning
                      </span>
                    )}
                  </div>
                </div>

                {/* Beds Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
                  {wardBeds.map(bed => {
                    const occupant = patients.find(p => p.id === bed.currentPatientId);
                    const enc = encounters.find(e => e.id === bed.currentEncounterId);
                    const obsList = occupant ? observations.filter(o => o.patientId === occupant.id) : [];
                    const latestObs = obsList[obsList.length - 1];
                    const news2Score = latestObs?.news2Score ?? 0;
                    const news2Tier = latestObs?.news2RiskTier ?? 'LOW';

                    const isOccupied = bed.status === 'OCCUPIED';
                    const isPending = bed.status === 'DISCHARGE_PENDING';
                    const isCleaning = bed.status === 'CLEANING';
                    const isAvailable = bed.status === 'AVAILABLE';
                    const isMaintenance = bed.status === 'MAINTENANCE';

                    return (
                      <div 
                        key={bed.id}
                        className={`rounded-bji border p-3 flex flex-col justify-between text-xs transition shadow-xs ${
                          isOccupied ? 'bg-white border-[#D7DEE7] hover:border-blue-400' :
                          isPending ? 'bg-purple-50/50 border-purple-300' :
                          isCleaning ? 'bg-amber-50/50 border-amber-300' :
                          isAvailable ? 'bg-emerald-50/30 border-emerald-300 hover:border-emerald-500' :
                          'bg-slate-100 border-slate-300 opacity-70'
                        }`}
                      >
                        <div>
                          {/* Tile Top */}
                          <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 mb-2">
                            <div className="flex items-center gap-1.5 font-bold font-mono text-slate-900">
                              <BedDouble className="w-4 h-4 text-slate-600" />
                              <span>{bed.roomNumber}-{bed.bedNumber}</span>
                            </div>

                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold ${
                              isOccupied ? 'bg-slate-800 text-white' :
                              isPending ? 'bg-purple-200 text-purple-900' :
                              isCleaning ? 'bg-amber-200 text-amber-900 animate-pulse' :
                              isAvailable ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                              'bg-slate-300 text-slate-700'
                            }`}>
                              {bed.status}
                            </span>
                          </div>

                          {/* Capabilities Pills */}
                          <div className="flex flex-wrap gap-1 mb-2">
                            {bed.isIcuEquipped && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-100 text-purple-800 font-mono font-bold">
                                ICU
                              </span>
                            )}
                            {bed.telemetryEnabled && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-blue-100 text-blue-800 font-mono font-bold">
                                Telemetry
                              </span>
                            )}
                            {bed.isNegativePressure && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-rose-100 text-rose-800 font-mono font-bold flex items-center gap-0.5">
                                <Wind className="w-2.5 h-2.5" /> Neg-Press
                              </span>
                            )}
                            {bed.isBariatric && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 font-mono font-bold">
                                Bariatric
                              </span>
                            )}
                          </div>

                          {/* Occupant Information */}
                          {(isOccupied || isPending) && occupant ? (
                            <div className="space-y-1.5">
                              <div>
                                <span 
                                  onClick={() => {
                                    setActivePatientId(occupant.id);
                                  }}
                                  className="font-bold text-slate-900 hover:text-blue-600 hover:underline cursor-pointer block truncate"
                                  title="Click to view Patient Chart"
                                >
                                  {occupant.lastName}, {occupant.firstName}
                                </span>
                                <span className="text-[10px] font-mono text-slate-500">
                                  MRN: {occupant.mrn} • {occupant.sex}
                                </span>
                              </div>

                              <div className="p-1.5 bg-slate-50 rounded border border-slate-200 text-[10px]">
                                <span className="text-slate-600 font-medium block truncate">
                                  Dx: {enc?.admittingDiagnosis || 'Inpatient Admission'}
                                </span>
                              </div>

                              {/* NEWS2 & Isolation Precaution Bar */}
                              <div className="flex items-center justify-between gap-1 pt-1">
                                <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                                  news2Tier === 'HIGH' ? 'bg-red-100 text-red-800 border border-red-200' :
                                  news2Tier === 'MEDIUM' ? 'bg-amber-100 text-amber-800' :
                                  'bg-emerald-100 text-emerald-800'
                                }`}>
                                  NEWS2: {news2Score} ({news2Tier})
                                </span>

                                {bed.isolationPrecaution && bed.isolationPrecaution !== 'NONE' && (
                                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-300">
                                    {bed.isolationPrecaution}
                                  </span>
                                )}
                              </div>
                            </div>
                          ) : null}

                          {/* Cleaning Block */}
                          {isCleaning && (
                            <div className="space-y-2 py-2">
                              <div className="p-2 bg-amber-100/70 border border-amber-300 rounded text-amber-950 text-[11px]">
                                <div className="flex items-center justify-between font-bold">
                                  <span className="flex items-center gap-1">
                                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                                    Terminal Cleaning
                                  </span>
                                  <span className="font-mono text-[10px]">Turnover</span>
                                </div>
                                <p className="text-[10px] text-amber-800 mt-1">
                                  HEPA &amp; surface wipe disinfection in progress.
                                </p>
                              </div>
                              <button
                                onClick={() => setSelectedBedForEvs(bed)}
                                className="w-full py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] rounded shadow-xs flex items-center justify-center gap-1"
                              >
                                <Sparkles className="w-3.5 h-3.5" />
                                <span>Sanitize &amp; Release Bed</span>
                              </button>
                            </div>
                          )}

                          {/* Available Block */}
                          {isAvailable && (
                            <div className="space-y-2 py-2">
                              <div className="p-2 bg-emerald-50 border border-emerald-200 rounded text-[11px] text-emerald-800">
                                <span className="font-bold block">Sanitized &amp; Inspected</span>
                                <span className="text-[10px] text-emerald-700">Immediate admission intake ready</span>
                              </div>
                              <button
                                onClick={() => setSelectedBedForAssign(bed)}
                                className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] rounded shadow-xs flex items-center justify-center gap-1"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                <span>Direct Admit / Assign</span>
                              </button>
                            </div>
                          )}

                          {/* Maintenance Block */}
                          {isMaintenance && (
                            <div className="space-y-2 py-2">
                              <div className="p-2 bg-slate-200 rounded text-[11px] text-slate-700">
                                <span className="font-bold flex items-center gap-1">
                                  <Wrench className="w-3 h-3 text-slate-500" />
                                  Out of Service
                                </span>
                                <span className="text-[10px] text-slate-500">Biomedical check / repair</span>
                              </div>
                              <button
                                onClick={() => handleToggleMaintenance(bed)}
                                className="w-full py-1 bg-slate-700 hover:bg-slate-800 text-white font-bold text-[10px] rounded"
                              >
                                Return to Service
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Card Bottom Quick Actions for Occupied Beds */}
                        {(isOccupied || isPending) && occupant && (
                          <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between gap-1">
                            <button
                              onClick={() => setSelectedBedForTransfer({ bed, patient: occupant, encounter: enc })}
                              className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded text-[10px] font-bold flex items-center gap-1"
                              title="Transfer to another ward or bed"
                            >
                              <ArrowRightLeft className="w-3 h-3" />
                              <span>Transfer</span>
                            </button>

                            <button
                              onClick={() => handleTogglePendingDischarge(bed)}
                              className={`px-2 py-1 rounded text-[10px] font-bold border ${
                                isPending ? 'bg-purple-100 text-purple-800 border-purple-300' : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                              }`}
                            >
                              {isPending ? 'Pending' : 'Set Pending'}
                            </button>

                            <button
                              onClick={() => handleDischargePrompt(bed, bed.currentEncounterId)}
                              className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded text-[10px] font-bold flex items-center gap-0.5"
                              title="Discharge patient and send bed to EVS cleaning"
                            >
                              <LogOut className="w-3 h-3" />
                              <span>Discharge</span>
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* VIEW 2: EVS ENVIRONMENTAL CLEANING QUEUE */}
      {activeSubTab === 'evs' && (
        <div className="space-y-4">
          <div className="bg-white p-3.5 rounded-bji border border-[#D7DEE7] flex items-center justify-between">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-600" />
                <span>Environmental Services (EVS) Terminal Sanitization Worklist</span>
              </h2>
              <p className="text-[11px] text-slate-500">
                Infection Control Terminal Cleaning • UV-C Optical Disinfection • Negative Pressure Differential Airflow Verification
              </p>
            </div>
            <span className="text-[10px] font-mono font-bold bg-amber-50 text-amber-800 border border-amber-300 px-2 py-1 rounded">
              Active Cleaning Queue: {cleaningBedsCount} Beds
            </span>
          </div>

          <div className="bg-white rounded-bji border border-[#D7DEE7] overflow-hidden">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Location &amp; Bed</th>
                  <th className="py-2.5 px-3">Ward / Unit</th>
                  <th className="py-2.5 px-3">Preceding Precaution</th>
                  <th className="py-2.5 px-3">Sanitization Standard</th>
                  <th className="py-2.5 px-3">Status &amp; Timer</th>
                  <th className="py-2.5 px-3 text-right">EVS Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {beds.filter(b => b.status === 'CLEANING').length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500">
                      Zero beds currently pending environmental cleaning. All vacant beds sanitized and available.
                    </td>
                  </tr>
                ) : (
                  beds.filter(b => b.status === 'CLEANING').map(bed => {
                    const dept = departments.find(d => d.id === bed.wardId);
                    const isIso = bed.isNegativePressure || (bed.isolationPrecaution && bed.isolationPrecaution !== 'NONE');

                    return (
                      <tr key={bed.id} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                          Room {bed.roomNumber} - Bed {bed.bedNumber}
                        </td>
                        <td className="py-2.5 px-3 text-slate-700">
                          {dept?.name || bed.wardId}
                        </td>
                        <td className="py-2.5 px-3">
                          {bed.isolationPrecaution && bed.isolationPrecaution !== 'NONE' ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-300">
                              {bed.isolationPrecaution} ISOLATION
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-500 font-mono">Standard Clean</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                            isIso ? 'bg-purple-100 text-purple-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {isIso ? 'Pathogen Terminal (UV-C)' : 'Routine Terminal'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="text-amber-700 font-mono font-bold text-[11px] flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-amber-600 animate-spin" />
                            Turnover In Progress
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <button
                            onClick={() => setSelectedBedForEvs(bed)}
                            className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] rounded shadow-xs"
                          >
                            Run Terminal Clean
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 3: WARD CENSUS & ACUITY BREAKDOWN */}
      {activeSubTab === 'analytics' && (
        <div className="space-y-4">
          <div className="bg-white p-3.5 rounded-bji border border-[#D7DEE7] flex items-center justify-between">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                Departmental Census &amp; Nurse-to-Patient Ratio Matrix
              </h2>
              <p className="text-[11px] text-slate-500">
                Staffing capacity calculations, high-acuity allocation, and clinical bed utilization
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {departments.filter(d => d.type !== 'PHARMACY' && d.type !== 'RADIOLOGY').map(dept => {
              const deptBeds = beds.filter(b => b.wardId === dept.id);
              const occupied = deptBeds.filter(b => b.status === 'OCCUPIED').length;
              const available = deptBeds.filter(b => b.status === 'AVAILABLE').length;
              const cleaning = deptBeds.filter(b => b.status === 'CLEANING').length;
              const total = deptBeds.length;
              const pct = total > 0 ? Math.round((occupied / total) * 100) : 0;

              return (
                <div key={dept.id} className="bg-white rounded-bji border border-[#D7DEE7] p-4 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-[#E7ECF3]">
                    <div>
                      <span className="font-bold text-xs text-slate-900 block">{dept.name}</span>
                      <span className="text-[10px] text-slate-500 font-mono">Floor {dept.floor} • {dept.building}</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                      pct > 90 ? 'bg-red-100 text-red-800' : pct > 80 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {pct}% Occupied
                    </span>
                  </div>

                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${pct > 90 ? 'bg-red-600' : pct > 80 ? 'bg-amber-500' : 'bg-emerald-600'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>

                  <div className="grid grid-cols-4 gap-2 text-center text-xs">
                    <div className="p-2 bg-slate-50 rounded border">
                      <div className="text-[10px] text-slate-500">Total</div>
                      <div className="font-mono font-bold text-slate-900 mt-0.5">{total}</div>
                    </div>
                    <div className="p-2 bg-blue-50/60 rounded border border-blue-200">
                      <div className="text-[10px] text-blue-700">Occupied</div>
                      <div className="font-mono font-bold text-blue-900 mt-0.5">{occupied}</div>
                    </div>
                    <div className="p-2 bg-emerald-50/60 rounded border border-emerald-200">
                      <div className="text-[10px] text-emerald-700">Available</div>
                      <div className="font-mono font-bold text-emerald-900 mt-0.5">{available}</div>
                    </div>
                    <div className="p-2 bg-amber-50/60 rounded border border-amber-200">
                      <div className="text-[10px] text-amber-700">Cleaning</div>
                      <div className="font-mono font-bold text-amber-900 mt-0.5">{cleaning}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* MODALS */}
      {selectedBedForEvs && (
        <EvsCleaningModal
          bed={selectedBedForEvs}
          isOpen={true}
          onClose={() => setSelectedBedForEvs(null)}
        />
      )}

      {selectedBedForTransfer && (
        <BedTransferModal
          fromBed={selectedBedForTransfer.bed}
          patient={selectedBedForTransfer.patient}
          encounter={selectedBedForTransfer.encounter}
          isOpen={true}
          onClose={() => setSelectedBedForTransfer(null)}
        />
      )}

      {selectedBedForAssign && (
        <BedAssignmentModal
          bed={selectedBedForAssign}
          isOpen={true}
          onClose={() => setSelectedBedForAssign(null)}
        />
      )}

    </div>
  );
};
