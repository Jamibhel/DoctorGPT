"use client";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { Patient } from "@/types/clinical";
import { 
  Box, 
  Rotate3d, 
  ZoomIn, 
  ZoomOut, 
  Layers, 
  MapPin, 
  AlertCircle, 
  CheckCircle2, 
  Heart, 
  Activity,
  Maximize2
} from "lucide-react";

interface AnatomicalRegion {
  id: string;
  name: string;
  category: 'Neurological' | 'Pulmonary' | 'Cardiovascular' | 'Distal Extremity';
  coordinates: [number, number, number];
  color: number;
  conditionKey: string;
  description: string;
  clinicalFinding: string;
  ordersRecommended: string[];
}

const ANATOMICAL_REGIONS: AnatomicalRegion[] = [
  {
    id: "region-cranial",
    name: "Cranial & Neuro-Vascular",
    category: "Neurological",
    coordinates: [0, 2.3, 0],
    color: 0x8b5cf6, // Violet
    conditionKey: "neuropathy",
    description: "Cerebral circulation, trigeminal pathways, and sensory cranial nerves.",
    clinicalFinding: "Intermittent nocturnal dysesthesias; responsive to Gabapentin 300mg TID. Migraine headache triggers evaluated.",
    ordersRecommended: ["Headache & Neuropathy Symptom Diary", "Annual Dilated Retinal Screening"]
  },
  {
    id: "region-pulmonary",
    name: "Thoracic & Pulmonary Fields",
    category: "Pulmonary",
    coordinates: [0, 1.3, 0.1],
    color: 0x06b6d4, // Cyan
    conditionKey: "copd",
    description: "Bilateral lung fields, bronchial airways, and diaphragmatic excursion.",
    clinicalFinding: "Faint scattered expiratory wheezes bilaterally. SpO2 94% on room air. Distant breath sounds upon forced expiration.",
    ordersRecommended: ["Diagnostic Spirometry (Pre/Post Bronchodilator)", "Low-Dose Chest CT (Annual Screening)"]
  },
  {
    id: "region-cardiovascular",
    name: "Precordium & Cardiovascular Core",
    category: "Cardiovascular",
    coordinates: [-0.2, 1.2, 0.25],
    color: 0xef4444, // Red
    conditionKey: "hypertension",
    description: "Left ventricular myocardium, LAD coronary stent bed, and systemic blood pressure hemodynamics.",
    clinicalFinding: "BP elevated at 148/92 mmHg in clinic. Regular rhythm, S1/S2 present, no S3 gallop. Lisinopril 20mg daily ongoing.",
    ordersRecommended: ["Comprehensive Metabolic Panel (CMP)", "Urine Albumin-to-Creatinine Ratio (UACR)"]
  },
  {
    id: "region-plantar",
    name: "Right 1st Metatarsal (Plantar Foot)",
    category: "Distal Extremity",
    coordinates: [0.35, -2.6, 0.2],
    color: 0xf59e0b, // Amber
    conditionKey: "diabet",
    description: "Distal plantar weight-bearing surface and diabetic microvascular capillary bed.",
    clinicalFinding: "High-risk focal hyperkeratosis with mild localized erythema over 1st metatarsal head. Monofilament sensation diminished. Intact skin.",
    ordersRecommended: ["Urgent Podiatry Referral for Sharp Debridement", "Diabetic Offloading Footwear Fitting"]
  }
];

interface AnatomicalViewerProps {
  patient: Patient;
}

export const AnatomicalViewer: React.FC<AnatomicalViewerProps> = ({ patient }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [selectedRegion, setSelectedRegion] = useState<AnatomicalRegion>(ANATOMICAL_REGIONS[3]); // Default to plantar foot
  const [isRotating, setIsRotating] = useState(true);

  useEffect(() => {
    const currentMount = mountRef.current;
    if (!currentMount) return;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0f1d);

    const camera = new THREE.PerspectiveCamera(
      45,
      currentMount.clientWidth / currentMount.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 0, 7.5);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    currentMount.appendChild(renderer.domElement);

    // 2. Anatomical Stylized Wireframe Human Form
    const bodyGroup = new THREE.Group();

    // Head
    const headGeo = new THREE.SphereGeometry(0.55, 24, 24);
    const wireMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      wireframe: true,
      transparent: true,
      opacity: 0.25,
      roughness: 0.2,
      metalness: 0.8
    });
    const head = new THREE.Mesh(headGeo, wireMat);
    head.position.y = 2.3;
    bodyGroup.add(head);

    // Torso / Chest
    const torsoGeo = new THREE.CylinderGeometry(0.65, 0.45, 1.8, 20);
    const torso = new THREE.Mesh(torsoGeo, wireMat);
    torso.position.y = 1.0;
    bodyGroup.add(torso);

    // Pelvis
    const pelvisGeo = new THREE.CylinderGeometry(0.45, 0.5, 0.6, 16);
    const pelvis = new THREE.Mesh(pelvisGeo, wireMat);
    pelvis.position.y = -0.15;
    bodyGroup.add(pelvis);

    // Left & Right Legs
    const legGeo = new THREE.CylinderGeometry(0.2, 0.14, 2.2, 14);
    const leftLeg = new THREE.Mesh(legGeo, wireMat);
    leftLeg.position.set(-0.35, -1.5, 0);
    const rightLeg = new THREE.Mesh(legGeo, wireMat);
    rightLeg.position.set(0.35, -1.5, 0);
    bodyGroup.add(leftLeg, rightLeg);

    // Left & Right Arms
    const armGeo = new THREE.CylinderGeometry(0.14, 0.1, 1.8, 12);
    const leftArm = new THREE.Mesh(armGeo, wireMat);
    leftArm.position.set(-0.95, 0.8, 0);
    leftArm.rotation.z = 0.15;
    const rightArm = new THREE.Mesh(armGeo, wireMat);
    rightArm.position.set(0.95, 0.8, 0);
    rightArm.rotation.z = -0.15;
    bodyGroup.add(leftArm, rightArm);

    // 3. Interactive Regional Sensor Spheres
    const markerSpheres: THREE.Mesh[] = [];
    ANATOMICAL_REGIONS.forEach((region) => {
      const markerGeo = new THREE.SphereGeometry(0.16, 16, 16);
      const markerMat = new THREE.MeshStandardMaterial({
        color: region.color,
        emissive: region.color,
        emissiveIntensity: 0.6,
        roughness: 0.1,
      });
      const marker = new THREE.Mesh(markerGeo, markerMat);
      marker.position.set(...region.coordinates);
      marker.userData = { region };
      bodyGroup.add(marker);
      markerSpheres.push(marker);

      // Pulse ring around active areas
      const ringGeo = new THREE.RingGeometry(0.2, 0.26, 24);
      const ringMat = new THREE.MeshBasicMaterial({
        color: region.color,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.7
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.set(...region.coordinates);
      bodyGroup.add(ring);
    });

    scene.add(bodyGroup);

    // 4. Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0x38bdf8, 1.8);
    dirLight.position.set(5, 8, 5);
    scene.add(dirLight);

    const pointLight = new THREE.PointLight(0x06b6d4, 2, 20);
    pointLight.position.set(-3, -2, 4);
    scene.add(pointLight);

    // 5. Raycasting for Click / Hover
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handlePointerDown = (event: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(markerSpheres);

      if (intersects.length > 0) {
        const hitRegion = intersects[0].object.userData.region as AnatomicalRegion;
        setSelectedRegion(hitRegion);
      }
    };

    renderer.domElement.addEventListener("click", handlePointerDown);

    // 6. Animation Loop
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      if (isRotating) {
        bodyGroup.rotation.y += 0.006;
      }

      // Subtle pulse on markers
      const time = Date.now() * 0.003;
      markerSpheres.forEach((m, idx) => {
        const scale = 1 + Math.sin(time + idx * 1.5) * 0.15;
        m.scale.set(scale, scale, scale);
      });

      renderer.render(scene, camera);
    };
    animate();

    // 7. Resize Handler
    const handleResize = () => {
      if (!currentMount) return;
      camera.aspect = currentMount.clientWidth / currentMount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      renderer.domElement.removeEventListener("click", handlePointerDown);
      cancelAnimationFrame(animationFrameId);
      if (currentMount.contains(renderer.domElement)) {
        currentMount.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [isRotating]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-8rem)]">
      {/* 3D WebGL Canvas Panel */}
      <div className="lg:col-span-7 bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-4 flex flex-col relative overflow-hidden shadow-2xl">
        {/* Canvas Header / Controls */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 z-10 px-2">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-xl bg-cyan-950/70 border border-cyan-800/60 text-cyan-400">
              <Rotate3d className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <span>3D Anatomical Body Map</span>
                <span className="text-[10px] bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 px-2 py-0.5 rounded-full font-mono">
                  WebGL Interactive
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">Rotate and select anatomical focus zones to review regional findings.</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsRotating(!isRotating)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
                isRotating
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
            >
              {isRotating ? "Pause Orbit" : "Auto-Rotate"}
            </button>
          </div>
        </div>

        {/* 3D Three.js Container */}
        <div ref={mountRef} className="flex-1 w-full h-full cursor-grab active:cursor-grabbing rounded-2xl overflow-hidden" />

        {/* Quick Region Selector Pills */}
        <div className="absolute bottom-6 left-6 right-6 z-10 flex flex-wrap items-center justify-center gap-2">
          {ANATOMICAL_REGIONS.map((r) => {
            const isSelected = selectedRegion.id === r.id;
            return (
              <button
                key={r.id}
                onClick={() => setSelectedRegion(r)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold backdrop-blur-md border transition flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-lg shadow-cyan-500/30'
                    : 'bg-slate-900/80 text-slate-300 border-slate-700 hover:border-slate-500'
                }`}
              >
                <span 
                  className="w-2 h-2 rounded-full" 
                  style={{ backgroundColor: `#${r.color.toString(16).padStart(6, '0')}` }}
                />
                <span>{r.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Right Column: Anatomical Findings & Clinical Synthesis */}
      <div className="lg:col-span-5 flex flex-col gap-4">
        {/* Active Selected Anatomical Zone Card */}
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 shadow-xl flex-1 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-400 font-bold">
                {selectedRegion.category} Anatomy Focus
              </span>
              <span className="text-xs text-slate-500 font-mono">
                Patient: {patient.lastName}, {patient.firstName}
              </span>
            </div>

            <div className="mt-4">
              <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                <MapPin className="w-5 h-5 text-cyan-400" />
                <span>{selectedRegion.name}</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                {selectedRegion.description}
              </p>
            </div>

            {/* Clinical Findings Callout */}
            <div className="mt-5 p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
              <div className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-cyan-400" />
                <span>Physical Exam & Encounter Findings</span>
              </div>
              <p className="text-xs text-slate-200 leading-relaxed font-normal">
                {selectedRegion.clinicalFinding}
              </p>
            </div>

            {/* Recommended Downstream Orders */}
            <div className="mt-5 space-y-2">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Recommended Actions & Investigation Scope:
              </div>
              <div className="space-y-1.5">
                {selectedRegion.ordersRecommended.map((order, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-xl bg-blue-950/30 border border-blue-800/40 text-blue-200 text-xs flex items-center gap-2.5"
                  >
                    <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span className="font-medium">{order}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Longitudinal Chart Correlate */}
          <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>Primary Attending: <strong>Dr. Alexander Thorne, MD</strong></span>
            <span className="text-emerald-400 font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              Chart Correlated
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
