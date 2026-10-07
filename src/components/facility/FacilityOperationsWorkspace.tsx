"use client";

import React, { useState } from "react";
import { useHospital } from "@/lib/state/hospital-store";
import { useSession } from "@/lib/auth/session-context";
import { 
  Building2, 
  Settings, 
  Layers, 
  BedDouble, 
  Clock, 
  ShieldCheck, 
  Plus, 
  CheckCircle2, 
  AlertCircle, 
  Activity,
  FileText,
  MapPin,
  Phone,
  Mail,
  UserCheck
} from "lucide-react";
import { 
  Button, 
  Input, 
  Select, 
  Badge, 
  Alert, 
  Tabs, 
  TabList, 
  TabTrigger, 
  TabContent,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Dialog
} from "@/components/ui";
import { PermissionGate } from "@/components/auth/PermissionGate";

export const FacilityOperationsWorkspace: React.FC = () => {
  const { 
    facilities, 
    activeFacilityId, 
    activeFacility, 
    switchFacility,
    departments, 
    beds, 
    staff,
    auditLogs,
    updateFacilityConfig,
    createDepartment,
    createBed
  } = useHospital();

  const { hasPermission } = useSession();

  const [activeTab, setActiveTab] = useState<string>("overview");

  // Facility Edit State
  const [isEditingFacility, setIsEditingFacility] = useState(false);
  const [facName, setFacName] = useState(activeFacility.name);
  const [facPhone, setFacPhone] = useState(activeFacility.phone);
  const [facEmail, setFacEmail] = useState(activeFacility.email);
  const [facHours, setFacHours] = useState(activeFacility.operatingHours || "24/7 Operations");
  const [saveSuccess, setSaveSuccess] = useState(false);

  // New Department Modal
  const [isNewDeptModalOpen, setIsNewDeptModalOpen] = useState(false);
  const [deptName, setDeptName] = useState("");
  const [deptType, setDeptType] = useState<any>("MED_SURG");
  const [deptFloor, setDeptFloor] = useState(1);
  const [deptBuilding, setDeptBuilding] = useState("Main Clinical Tower");
  const [deptTotalBeds, setDeptTotalBeds] = useState(10);

  // New Bed Modal
  const [isNewBedModalOpen, setIsNewBedModalOpen] = useState(false);
  const [bedWardId, setBedWardId] = useState(departments[0]?.id || "");
  const [bedRoomNum, setBedRoomNum] = useState("");
  const [bedNum, setBedNum] = useState("");
  const [bedIsIcu, setBedIsIcu] = useState(false);
  const [bedTelemetry, setBedTelemetry] = useState(false);

  // Handle Facility Configuration Update
  const handleSaveFacility = (e: React.FormEvent) => {
    e.preventDefault();
    updateFacilityConfig({
      name: facName,
      phone: facPhone,
      email: facEmail,
      operatingHours: facHours
    });
    setIsEditingFacility(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  // Handle New Department
  const handleCreateDepartment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!deptName.trim()) return;

    createDepartment({
      id: `DEPT-${activeFacility.code}-${Date.now().toString().slice(-4)}`,
      name: deptName.trim(),
      type: deptType,
      floor: Number(deptFloor),
      building: deptBuilding.trim(),
      totalBeds: Number(deptTotalBeds),
      occupiedBeds: 0,
      leadPhysicianId: staff[0]?.id || "Practitioner/admin",
      nurseManagerId: staff[1]?.id || "Practitioner/nurse"
    });

    setIsNewDeptModalOpen(false);
    setDeptName("");
  };

  // Handle New Bed
  const handleCreateBed = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bedRoomNum.trim() || !bedNum.trim() || !bedWardId) return;

    createBed({
      id: `Bed/${bedRoomNum.trim()}-${bedNum.trim()}`,
      wardId: bedWardId,
      roomNumber: bedRoomNum.trim(),
      bedNumber: bedNum.trim(),
      status: "AVAILABLE",
      isIcuEquipped: bedIsIcu,
      telemetryEnabled: bedTelemetry
    });

    setIsNewBedModalOpen(false);
    setBedRoomNum("");
    setBedNum("");
  };

  const occupiedBedsCount = beds.filter(b => b.status === "OCCUPIED").length;
  const occupancyRate = beds.length > 0 ? Math.round((occupiedBedsCount / beds.length) * 100) : 0;

  return (
    <div className="p-4 sm:p-6 space-y-5 max-w-7xl mx-auto w-full">
      {/* 1. Header with Facility Switcher & Metadata */}
      <div className="bg-white p-4 rounded-bji border border-bji-slate-300 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-bji-sm bg-bji-green-50 text-bji-green-800 border border-bji-green-200">
              <Building2 className="w-5 h-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-bji-slate-900 leading-tight">
                  {activeFacility.name}
                </h1>
                <Badge tone="success" size="xs">
                  {activeFacility.status}
                </Badge>
                <Badge tone="neutral" size="xs">
                  {activeFacility.type.replace('_', ' ')}
                </Badge>
              </div>
              <p className="text-meta text-bji-slate-500 flex items-center gap-2 mt-0.5">
                <span>Code: <strong className="font-mono text-bji-slate-700">{activeFacility.code}</strong></span>
                <span>• MRN Prefix: <strong className="font-mono text-bji-slate-700">{activeFacility.mrnPrefix}</strong></span>
                <span>• Timezone: <strong className="font-mono text-bji-slate-700">{activeFacility.timezone}</strong></span>
              </p>
            </div>
          </div>
        </div>

        {/* Tenant Switcher & Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1.5 bg-bji-slate-50 p-1 rounded-bji border border-bji-slate-200">
            <span className="text-meta text-bji-slate-500 font-semibold px-1">Tenant:</span>
            <select
              value={activeFacilityId}
              onChange={(e) => switchFacility(e.target.value)}
              className="text-xs font-semibold text-bji-slate-800 bg-white border border-bji-slate-300 rounded-bji-xs px-2 py-1 outline-none cursor-pointer"
            >
              {facilities.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name} ({f.code})
                </option>
              ))}
            </select>
          </div>

          <PermissionGate permission="facility:update_settings">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => {
                setFacName(activeFacility.name);
                setFacPhone(activeFacility.phone);
                setFacEmail(activeFacility.email);
                setFacHours(activeFacility.operatingHours || "24/7 Operations");
                setIsEditingFacility(true);
              }}
              leftIcon={<Settings className="w-3.5 h-3.5" />}
            >
              Edit Facility Settings
            </Button>
          </PermissionGate>
        </div>
      </div>

      {saveSuccess && (
        <Alert tone="success" title="Facility Settings Updated">
          The facility operational parameters have been updated and logged to the clinical audit trail.
        </Alert>
      )}

      {/* 2. Facility Operational Statistics Ribbon */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-bji border border-bji-slate-200 shadow-2xs">
          <div className="text-[10px] uppercase font-bold tracking-wider text-bji-slate-400">Total Wards / Units</div>
          <div className="text-xl font-bold font-mono text-bji-slate-900 mt-1">{departments.length}</div>
          <div className="text-meta text-bji-slate-500 mt-0.5">Active clinical clinical spaces</div>
        </div>

        <div className="bg-white p-3.5 rounded-bji border border-bji-slate-200 shadow-2xs">
          <div className="text-[10px] uppercase font-bold tracking-wider text-bji-slate-400">Licensed Bed Inventory</div>
          <div className="text-xl font-bold font-mono text-bji-slate-900 mt-1">{beds.length}</div>
          <div className="text-meta text-bji-slate-500 mt-0.5">Capacity: {activeFacility.totalBedCapacity} configured</div>
        </div>

        <div className="bg-white p-3.5 rounded-bji border border-bji-slate-200 shadow-2xs">
          <div className="text-[10px] uppercase font-bold tracking-wider text-bji-slate-400">Current Occupancy</div>
          <div className="text-xl font-bold font-mono text-bji-slate-900 mt-1">
            {occupancyRate}% <span className="text-xs font-normal text-bji-slate-500">({occupiedBedsCount}/{beds.length})</span>
          </div>
          <div className="text-meta text-bji-slate-500 mt-0.5">Census: {activeFacility.activeCensus} active encounters</div>
        </div>

        <div className="bg-white p-3.5 rounded-bji border border-bji-slate-200 shadow-2xs">
          <div className="text-[10px] uppercase font-bold tracking-wider text-bji-slate-400">Staff Credentials</div>
          <div className="text-xl font-bold font-mono text-bji-slate-900 mt-1">{staff.length}</div>
          <div className="text-meta text-bji-slate-500 mt-0.5">Physicians, Nurses & Specialists</div>
        </div>
      </div>

      {/* 3. Navigation Tabs */}
      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
        <TabList className="bg-white p-1 rounded-bji border border-bji-slate-200">
          <TabTrigger value="overview">Facility Profile & Services</TabTrigger>
          <TabTrigger value="wards">Wards & Clinics ({departments.length})</TabTrigger>
          <TabTrigger value="beds">Bed Inventory ({beds.length})</TabTrigger>
          <TabTrigger value="audit">Immutable Audit Trail ({auditLogs.length})</TabTrigger>
        </TabList>

        {/* --- TAB 1: OVERVIEW & SERVICES CATALOG --- */}
        <TabContent value="overview" className="mt-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Left: General Location & Operational Hours */}
            <div className="bg-white p-4 rounded-bji border border-bji-slate-200 shadow-2xs space-y-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-bji-slate-900 flex items-center gap-1.5 border-b border-bji-slate-100 pb-2">
                <MapPin className="w-4 h-4 text-bji-green-700" />
                Physical Facility Information
              </h2>

              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-bji-slate-400 block text-meta font-medium">Physical Address</span>
                  <span className="text-bji-slate-800 font-medium">{activeFacility.address}</span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div>
                    <span className="text-bji-slate-400 block text-meta font-medium">Contact Phone</span>
                    <span className="text-bji-slate-800 font-mono flex items-center gap-1">
                      <Phone className="w-3 h-3 text-bji-slate-400" />
                      {activeFacility.phone}
                    </span>
                  </div>
                  <div>
                    <span className="text-bji-slate-400 block text-meta font-medium">Contact Email</span>
                    <span className="text-bji-slate-800 flex items-center gap-1">
                      <Mail className="w-3 h-3 text-bji-slate-400" />
                      {activeFacility.email}
                    </span>
                  </div>
                </div>

                <div className="pt-1">
                  <span className="text-bji-slate-400 block text-meta font-medium">Operating Hours</span>
                  <span className="text-bji-slate-800 font-medium flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-bji-green-700" />
                    {activeFacility.operatingHours || "24/7 Operations"}
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Service Catalog */}
            <div className="bg-white p-4 rounded-bji border border-bji-slate-200 shadow-2xs space-y-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-bji-slate-900 flex items-center gap-1.5 border-b border-bji-slate-100 pb-2">
                <ShieldCheck className="w-4 h-4 text-bji-green-700" />
                Authorized Clinical Service Catalog
              </h2>

              <div className="space-y-2 text-xs">
                {activeFacility.servicesCatalog && activeFacility.servicesCatalog.length > 0 ? (
                  <div className="grid grid-cols-1 gap-1.5">
                    {activeFacility.servicesCatalog.map((service, idx) => (
                      <div 
                        key={idx}
                        className="flex items-center gap-2 p-2 bg-bji-slate-50 border border-bji-slate-200 rounded-bji-sm text-bji-slate-800 font-medium"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-bji-green-600 shrink-0" />
                        <span>{service}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-meta text-bji-slate-500">No services explicitly listed in tenant catalog.</p>
                )}
              </div>
            </div>
          </div>
        </TabContent>

        {/* --- TAB 2: WARDS & CLINICS --- */}
        <TabContent value="wards" className="mt-4 space-y-4">
          <div className="bg-white rounded-bji border border-bji-slate-200 shadow-2xs overflow-hidden">
            <div className="p-3 border-b border-bji-slate-200 flex items-center justify-between bg-bji-slate-50">
              <h2 className="text-xs font-bold uppercase tracking-wider text-bji-slate-900 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-bji-green-700" />
                Department &amp; Ward Matrix
              </h2>
              <PermissionGate permission="facility:manage_wards">
                <Button 
                  variant="primary" 
                  size="xs" 
                  onClick={() => setIsNewDeptModalOpen(true)}
                  leftIcon={<Plus className="w-3 h-3" />}
                >
                  Add Department
                </Button>
              </PermissionGate>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ward / Department</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Total Beds</TableHead>
                  <TableHead>Occupancy</TableHead>
                  <TableHead>Staff Leads</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {departments.map((dept) => {
                  const deptBeds = beds.filter(b => b.wardId === dept.id);
                  const deptOccupied = deptBeds.filter(b => b.status === "OCCUPIED").length;
                  return (
                    <TableRow key={dept.id}>
                      <TableCell className="font-semibold text-bji-slate-900">
                        {dept.name}
                        <span className="block text-[10px] font-mono text-bji-slate-400 font-normal">{dept.id}</span>
                      </TableCell>
                      <TableCell>
                        <Badge tone="neutral" size="xs">
                          {dept.type.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-meta">
                        {dept.building} • Floor {dept.floor}
                      </TableCell>
                      <TableCell className="font-mono font-bold">
                        {deptBeds.length > 0 ? deptBeds.length : dept.totalBeds}
                      </TableCell>
                      <TableCell>
                        <span className="text-meta font-mono font-semibold text-bji-slate-700">
                          {deptOccupied} / {deptBeds.length || dept.totalBeds}
                        </span>
                      </TableCell>
                      <TableCell className="text-meta text-bji-slate-600">
                        <span>Lead: {dept.leadPhysicianId.split('/').pop()}</span>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </TabContent>

        {/* --- TAB 3: BED INVENTORY --- */}
        <TabContent value="beds" className="mt-4 space-y-4">
          <div className="bg-white rounded-bji border border-bji-slate-200 shadow-2xs overflow-hidden">
            <div className="p-3 border-b border-bji-slate-200 flex items-center justify-between bg-bji-slate-50">
              <h2 className="text-xs font-bold uppercase tracking-wider text-bji-slate-900 flex items-center gap-1.5">
                <BedDouble className="w-4 h-4 text-bji-green-700" />
                Physical Bed Inventory
              </h2>
              <PermissionGate permission="facility:manage_wards">
                <Button 
                  variant="primary" 
                  size="xs" 
                  onClick={() => setIsNewBedModalOpen(true)}
                  leftIcon={<Plus className="w-3 h-3" />}
                >
                  Add Bed
                </Button>
              </PermissionGate>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Bed ID</TableHead>
                  <TableHead>Ward / Unit</TableHead>
                  <TableHead>Room / Bed</TableHead>
                  <TableHead>Equipment</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {beds.map((b) => {
                  const ward = departments.find(d => d.id === b.wardId);
                  return (
                    <TableRow key={b.id}>
                      <TableCell className="font-mono font-bold text-bji-slate-900">
                        {b.id}
                      </TableCell>
                      <TableCell className="text-meta">
                        {ward ? ward.name : b.wardId}
                      </TableCell>
                      <TableCell className="font-mono">
                        Room {b.roomNumber} - Bed {b.bedNumber}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-meta">
                          {b.isIcuEquipped && <Badge tone="critical" size="xs">ICU Ready</Badge>}
                          {b.telemetryEnabled && <Badge tone="info" size="xs">Telemetry</Badge>}
                          {!b.isIcuEquipped && !b.telemetryEnabled && <span className="text-bji-slate-400">Standard</span>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          tone={
                            b.status === "OCCUPIED" ? "critical" :
                            b.status === "AVAILABLE" ? "success" :
                            b.status === "CLEANING" ? "warning" : "neutral"
                          } 
                          size="xs"
                        >
                          {b.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </TabContent>

        {/* --- TAB 4: AUDIT TRAIL --- */}
        <TabContent value="audit" className="mt-4 space-y-4">
          <div className="bg-white rounded-bji border border-bji-slate-200 shadow-2xs overflow-hidden">
            <div className="p-3 border-b border-bji-slate-200 bg-bji-slate-50 flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-bji-slate-900 flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-bji-green-700" />
                Facility Operational Audit Logs
              </h2>
              <span className="text-meta text-bji-slate-400 font-mono">HIPAA &amp; ISO 27001 Audit Trail</span>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Actor</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Resource</TableHead>
                  <TableHead>Source / Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {auditLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-mono text-meta text-bji-slate-500 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </TableCell>
                    <TableCell className="text-meta">
                      <span className="font-semibold text-bji-slate-900">{log.actorName}</span>
                      <span className="block text-[10px] text-bji-slate-400">{log.actorRole}</span>
                    </TableCell>
                    <TableCell>
                      <Badge tone="info" size="xs">
                        {log.action}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-meta font-mono">
                      {log.resourceType}: {log.resourceId}
                    </TableCell>
                    <TableCell className="text-meta text-bji-slate-600">
                      {log.source} {log.newValue ? `• ${log.newValue.slice(0, 40)}...` : ''}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabContent>
      </Tabs>

      {/* MODAL 1: Edit Facility Settings */}
      <Dialog 
        isOpen={isEditingFacility} 
        onClose={() => setIsEditingFacility(false)}
        title="Configure Healthcare Facility"
        subtitle="Update core operational metadata and contact details"
        maxWidth="md"
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button type="button" variant="ghost" size="xs" onClick={() => setIsEditingFacility(false)}>
              Cancel
            </Button>
            <Button type="submit" form="fac-settings-form" variant="primary" size="xs">
              Commit Changes
            </Button>
          </div>
        }
      >
        <form id="fac-settings-form" onSubmit={handleSaveFacility} className="space-y-3 text-xs">
          <div>
            <label className="block font-semibold text-bji-slate-700 mb-1">Facility Legal Name</label>
            <Input
              value={facName}
              onChange={(e) => setFacName(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block font-semibold text-bji-slate-700 mb-1">Telephone Contact</label>
            <Input
              value={facPhone}
              onChange={(e) => setFacPhone(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block font-semibold text-bji-slate-700 mb-1">Administrative Email</label>
            <Input
              type="email"
              value={facEmail}
              onChange={(e) => setFacEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block font-semibold text-bji-slate-700 mb-1">Operating Hours Notice</label>
            <Input
              value={facHours}
              onChange={(e) => setFacHours(e.target.value)}
              required
            />
          </div>
        </form>
      </Dialog>

      {/* MODAL 2: Add Department */}
      <Dialog 
        isOpen={isNewDeptModalOpen} 
        onClose={() => setIsNewDeptModalOpen(false)}
        title="Add Clinical Department / Ward"
        subtitle="Register a new care unit or specialty clinic"
        maxWidth="md"
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button type="button" variant="ghost" size="xs" onClick={() => setIsNewDeptModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" form="new-dept-form" variant="primary" size="xs">
              Create Department
            </Button>
          </div>
        }
      >
        <form id="new-dept-form" onSubmit={handleCreateDepartment} className="space-y-3 text-xs">
          <div>
            <label className="block font-semibold text-bji-slate-700 mb-1">Department Name</label>
            <Input
              placeholder="e.g. 4th Floor Oncology Ward"
              value={deptName}
              onChange={(e) => setDeptName(e.target.value)}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block font-semibold text-bji-slate-700 mb-1">Clinical Type</label>
              <select
                value={deptType}
                onChange={(e) => setDeptType(e.target.value)}
                className="w-full h-8 px-2 bg-white border border-bji-slate-300 rounded-bji-xs text-xs font-semibold"
              >
                <option value="MED_SURG">Medical Surgical</option>
                <option value="INTENSIVE_CARE">Intensive Care (ICU)</option>
                <option value="EMERGENCY">Emergency (ED)</option>
                <option value="STEP_DOWN">Step Down</option>
                <option value="CARDIOLOGY">Cardiology</option>
                <option value="PHARMACY">Pharmacy</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-bji-slate-700 mb-1">Floor Level</label>
              <Input
                type="number"
                value={deptFloor}
                onChange={(e) => setDeptFloor(Number(e.target.value))}
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block font-semibold text-bji-slate-700 mb-1">Building Wing</label>
              <Input
                value={deptBuilding}
                onChange={(e) => setDeptBuilding(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block font-semibold text-bji-slate-700 mb-1">Bed Allocation</label>
              <Input
                type="number"
                value={deptTotalBeds}
                onChange={(e) => setDeptTotalBeds(Number(e.target.value))}
                required
              />
            </div>
          </div>
        </form>
      </Dialog>

      {/* MODAL 3: Add Bed */}
      <Dialog 
        isOpen={isNewBedModalOpen} 
        onClose={() => setIsNewBedModalOpen(false)}
        title="Add Bed to Facility Inventory"
        subtitle="Provision physical bed space with equipment specifications"
        maxWidth="md"
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button type="button" variant="ghost" size="xs" onClick={() => setIsNewBedModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" form="new-bed-form" variant="primary" size="xs">
              Register Bed
            </Button>
          </div>
        }
      >
        <form id="new-bed-form" onSubmit={handleCreateBed} className="space-y-3 text-xs">
          <div>
            <label className="block font-semibold text-bji-slate-700 mb-1">Target Ward / Department</label>
            <select
              value={bedWardId}
              onChange={(e) => setBedWardId(e.target.value)}
              className="w-full h-8 px-2 bg-white border border-bji-slate-300 rounded-bji-xs text-xs font-semibold"
              required
            >
              {departments.map((d) => (
                <option key={d.id} value={d.id}>{d.name} ({d.building} F{d.floor})</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block font-semibold text-bji-slate-700 mb-1">Room Number</label>
              <Input
                placeholder="e.g. 308"
                value={bedRoomNum}
                onChange={(e) => setBedRoomNum(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block font-semibold text-bji-slate-700 mb-1">Bed Identifier</label>
              <Input
                placeholder="e.g. A, B, or 1"
                value={bedNum}
                onChange={(e) => setBedNum(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="space-y-1 pt-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={bedIsIcu}
                onChange={(e) => setBedIsIcu(e.target.checked)}
                className="rounded text-bji-green-700"
              />
              <span className="font-medium text-bji-slate-800">Equipped for Intensive Care (ICU)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={bedTelemetry}
                onChange={(e) => setBedTelemetry(e.target.checked)}
                className="rounded text-bji-green-700"
              />
              <span className="font-medium text-bji-slate-800">Telemetry Monitor Enabled</span>
            </label>
          </div>
        </form>
      </Dialog>
    </div>
  );
};
