import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { CrosshairConfig, DrillResult, SupportedGame, DrillMode, DrillDifficulty, DrillAngle, DIFFICULTY_CONFIGS } from '../types';
import { GAME_CONFIGS } from '../lib/sensCalculator';
import { sound } from '../lib/soundFx';
import { MousePointer, Play, Maximize2, Minimize2, ZoomIn, ZoomOut, Crosshair, Shield } from 'lucide-react';

export { type DrillMode, type DrillDifficulty, type DrillAngle, DIFFICULTY_CONFIGS };

function createAimLabPistol() {
  const gunGroup = new THREE.Group();

  // Premium Materials
  const darkMetalMat = new THREE.MeshStandardMaterial({
    color: 0x181e29,
    metalness: 0.82,
    roughness: 0.28,
  });
  const slideTopMat = new THREE.MeshStandardMaterial({
    color: 0x222a38,
    metalness: 0.9,
    roughness: 0.2,
  });
  const gripMat = new THREE.MeshStandardMaterial({
    color: 0x0c0f14,
    metalness: 0.2,
    roughness: 0.8,
  });
  const voltGlowMat = new THREE.MeshBasicMaterial({
    color: 0x00e599,
  });
  const cyanGlowMat = new THREE.MeshBasicMaterial({
    color: 0x00e5ff,
  });

  // 1. Slide / Upper Receiver
  const slideGeo = new THREE.BoxGeometry(0.046, 0.05, 0.24);
  const slideMesh = new THREE.Mesh(slideGeo, slideTopMat);
  slideMesh.position.set(0, 0.02, -0.06);
  gunGroup.add(slideMesh);

  // Slide Chamfer / Top Rib
  const ribGeo = new THREE.BoxGeometry(0.024, 0.012, 0.23);
  const ribMesh = new THREE.Mesh(ribGeo, darkMetalMat);
  ribMesh.position.set(0, 0.048, -0.06);
  gunGroup.add(ribMesh);

  // 2. Barrel Tip / Muzzle Brake
  const barrelGeo = new THREE.CylinderGeometry(0.013, 0.013, 0.05, 16);
  barrelGeo.rotateX(Math.PI / 2);
  const barrelMesh = new THREE.Mesh(barrelGeo, darkMetalMat);
  barrelMesh.position.set(0, 0.02, -0.19);
  gunGroup.add(barrelMesh);

  // Barrel Hole (Black cavity)
  const holeGeo = new THREE.CylinderGeometry(0.007, 0.007, 0.015, 12);
  holeGeo.rotateX(Math.PI / 2);
  const holeMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
  const holeMesh = new THREE.Mesh(holeGeo, holeMat);
  holeMesh.position.set(0, 0.02, -0.216);
  gunGroup.add(holeMesh);

  // 3. Neon Cyber Accent Stripe (Aim Lab Volt Style)
  const stripGeo = new THREE.BoxGeometry(0.048, 0.005, 0.18);
  const stripMesh = new THREE.Mesh(stripGeo, voltGlowMat);
  stripMesh.position.set(0, 0.046, -0.05);
  gunGroup.add(stripMesh);

  // 4. Lower Receiver Frame
  const frameGeo = new THREE.BoxGeometry(0.042, 0.038, 0.19);
  const frameMesh = new THREE.Mesh(frameGeo, darkMetalMat);
  frameMesh.position.set(0, -0.018, -0.04);
  gunGroup.add(frameMesh);

  // 5. Pistol Grip (Angled ergonomic grip)
  const gripGeo = new THREE.BoxGeometry(0.04, 0.135, 0.068);
  const gripMesh = new THREE.Mesh(gripGeo, gripMat);
  gripMesh.position.set(0, -0.08, 0.012);
  gripMesh.rotation.x = 0.28; // ~16 deg ergonomic tilt
  gunGroup.add(gripMesh);

  // Grip Neon Inset Plate
  const gripPlateGeo = new THREE.BoxGeometry(0.042, 0.09, 0.012);
  const gripPlate = new THREE.Mesh(gripPlateGeo, voltGlowMat);
  gripPlate.position.set(0, -0.08, 0.045);
  gripPlate.rotation.x = 0.28;
  gunGroup.add(gripPlate);

  // 6. Trigger Guard & Trigger
  const guardGeo = new THREE.BoxGeometry(0.015, 0.038, 0.06);
  const guardMesh = new THREE.Mesh(guardGeo, darkMetalMat);
  guardMesh.position.set(0, -0.048, -0.035);
  gunGroup.add(guardMesh);

  const triggerGeo = new THREE.BoxGeometry(0.008, 0.022, 0.012);
  const triggerMesh = new THREE.Mesh(triggerGeo, voltGlowMat);
  triggerMesh.position.set(0, -0.042, -0.025);
  triggerMesh.rotation.x = -0.2;
  gunGroup.add(triggerMesh);

  // 7. Tactical Iron Sights
  // Front Sight (Cyan dot)
  const frontSightGeo = new THREE.BoxGeometry(0.006, 0.014, 0.008);
  const frontSight = new THREE.Mesh(frontSightGeo, cyanGlowMat);
  frontSight.position.set(0, 0.056, -0.17);
  gunGroup.add(frontSight);

  // Rear Sights (Dual Volt Green dots)
  const rearSightLeftGeo = new THREE.BoxGeometry(0.005, 0.012, 0.006);
  const rearSightLeft = new THREE.Mesh(rearSightLeftGeo, voltGlowMat);
  rearSightLeft.position.set(-0.015, 0.055, 0.045);
  gunGroup.add(rearSightLeft);

  const rearSightRight = new THREE.Mesh(rearSightLeftGeo, voltGlowMat);
  rearSightRight.position.set(0.015, 0.055, 0.045);
  gunGroup.add(rearSightRight);

  // 8. Muzzle Flash Flare (Stylized Star/Diamond)
  const flashGeo = new THREE.OctahedronGeometry(0.045, 0);
  const flashMat = new THREE.MeshBasicMaterial({
    color: 0xfff066,
    transparent: true,
    opacity: 0,
    depthWrite: false
  });
  const muzzleFlash = new THREE.Mesh(flashGeo, flashMat);
  muzzleFlash.position.set(0, 0.02, -0.25);
  muzzleFlash.scale.set(1, 1, 1.8);
  gunGroup.add(muzzleFlash);

  return { gunGroup, muzzleFlash };
}

interface Props {
  game: SupportedGame;
  sensitivity: number;
  fov?: number;
  mode: DrillMode;
  difficulty?: DrillDifficulty;
  angle?: DrillAngle;
  isZoomed?: boolean;
  onToggleZoom?: () => void;
  durationSeconds?: number;
  crosshair: CrosshairConfig;
  targetColor?: string;
  isActive: boolean;
  onComplete?: (result: DrillResult) => void;
  onCancel?: () => void;
}

export const FpsRange3D: React.FC<Props> = ({
  game,
  sensitivity,
  fov = 103,
  mode,
  difficulty = 'medium',
  angle = '90',
  isZoomed: externalZoom,
  onToggleZoom,
  durationSeconds = 15,
  crosshair,
  targetColor = '#ffea00',
  isActive,
  onComplete,
  onCancel
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [internalZoom, setInternalZoom] = useState(false);
  const [timeLeft, setTimeLeft] = useState(durationSeconds);
  const [isRunning, setIsRunning] = useState(false);
  const [hitmarker, setHitmarker] = useState(false);
  const [liveStats, setLiveStats] = useState({ hits: 0, shots: 0, accuracy: 0 });

  const [showGun, setShowGun] = useState(true);
  const showGunRef = useRef(true);
  const gunGroupRef = useRef<THREE.Group | null>(null);
  const muzzleFlashRef = useRef<THREE.Mesh | null>(null);
  const recoilOffsetRef = useRef({ y: 0, z: 0 });
  const recoilRotRef = useRef({ x: 0 });

  useEffect(() => {
    showGunRef.current = showGun;
    if (gunGroupRef.current) {
      gunGroupRef.current.visible = showGun;
    }
  }, [showGun]);

  const isZoomed = externalZoom !== undefined ? externalZoom : internalZoom;
  const toggleZoom = onToggleZoom || (() => setInternalZoom((z) => !z));

  // Refs for animation & state
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const reqIdRef = useRef<number | null>(null);

  // FPS camera orientation
  const yawRef = useRef(0);
  const pitchRef = useRef(0);

  // Targets in scene
  const targetMeshRef = useRef<THREE.Mesh | null>(null);
  const targetVelocityRef = useRef(new THREE.Vector3(3.0, 1.2, 0));
  const targetSpawnTimeRef = useRef(performance.now());

  // Metrics collection
  const metricsRef = useRef({
    hits: 0,
    shots: 0,
    trackingFramesOnTarget: 0,
    trackingFramesTotal: 0,
    reactionTimes: [] as number[],
    overshoots: 0,
    undershoots: 0,
    angularDeltas: [] as number[],
    lastMouseDirX: 0,
    lastTargetDist: 0
  });

  const resetStats = useCallback(() => {
    metricsRef.current = {
      hits: 0,
      shots: 0,
      trackingFramesOnTarget: 0,
      trackingFramesTotal: 0,
      reactionTimes: [],
      overshoots: 0,
      undershoots: 0,
      angularDeltas: [],
      lastMouseDirX: 0,
      lastTargetDist: 0
    };
    setTimeLeft(durationSeconds);
    setLiveStats({ hits: 0, shots: 0, accuracy: 0 });
  }, [durationSeconds]);

  const handleLock = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (!isRunning) {
      setIsRunning(true);
      resetStats();
    }
    setIsLocked(true);

    if (containerRef.current) {
      try {
        const promise = containerRef.current.requestPointerLock();
        // @ts-ignore
        if (promise && typeof promise.catch === 'function') {
          // @ts-ignore
          promise.catch((err: any) => {
            console.warn('Pointer lock request status:', err);
          });
        }
      } catch (err) {
        console.warn('Pointer lock exception:', err);
      }
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  // Listen to fullscreen changes
  useEffect(() => {
    const onFullscreenChange = () => {
      const fs = document.fullscreenElement === containerRef.current;
      setIsFullscreen(fs);
      setTimeout(() => {
        if (!containerRef.current || !rendererRef.current || !cameraRef.current) return;
        const w = containerRef.current.clientWidth;
        const h = containerRef.current.clientHeight;
        cameraRef.current.aspect = w / h;
        cameraRef.current.updateProjectionMatrix();
        rendererRef.current.setSize(w, h);
      }, 100);
    };

    document.addEventListener('fullscreenchange', onFullscreenChange);

    const onKeyDown = (e: KeyboardEvent) => {
      // Toggle fullscreen with F key when in range or locked
      if ((e.key === 'f' || e.key === 'F') && !e.ctrlKey && !e.altKey && !e.metaKey) {
        if (document.pointerLockElement === containerRef.current || document.fullscreenElement === containerRef.current) {
          toggleFullscreen();
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.removeEventListener('fullscreenchange', onFullscreenChange);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  // Three.js scene setup
  useEffect(() => {
    if (!canvasContainerRef.current) return;
    const canvasContainer = canvasContainerRef.current;
    const width = canvasContainer.clientWidth || 800;
    const height = canvasContainer.clientHeight || 540;

    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x0a0c10);
    scene.fog = new THREE.FogExp2(0x0a0c10, 0.025);

    const camera = new THREE.PerspectiveCamera(fov, width / height, 0.1, 1000);
    cameraRef.current = camera;
    camera.position.set(0, 1.7, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    rendererRef.current = renderer;
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    
    // Safely clear only canvasContainer (which contains NO React JSX children)
    canvasContainer.innerHTML = '';
    canvasContainer.appendChild(renderer.domElement);

    // 1. Arena Floor & Ceiling (Full Studio Enclosure)
    const floorGeo = new THREE.PlaneGeometry(80, 80);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x090c12,
      roughness: 0.8,
      metalness: 0.15
    });
    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.position.y = 0;
    scene.add(floorMesh);

    // Floor Grid Helper (Neon Volt + Slate)
    const gridHelper = new THREE.GridHelper(80, 40, 0x00e599, 0x162238);
    gridHelper.position.y = 0.02;
    scene.add(gridHelper);

    // Ceiling
    const ceilingGeo = new THREE.PlaneGeometry(80, 80);
    const ceilingMat = new THREE.MeshStandardMaterial({
      color: 0x07090e,
      roughness: 0.9,
      metalness: 0.1
    });
    const ceilingMesh = new THREE.Mesh(ceilingGeo, ceilingMat);
    ceilingMesh.rotation.x = Math.PI / 2;
    ceilingMesh.position.y = 16;
    scene.add(ceilingMesh);

    // 2. Arena Walls (Seamlessly Enclosed Studio)
    const wallMat = new THREE.MeshStandardMaterial({
      color: 0x101522,
      roughness: 0.7,
      metalness: 0.2
    });

    // Back Target Wall (Wide enough to fill 100% of forward FOV)
    const backWallGeo = new THREE.PlaneGeometry(80, 20);
    const backWall = new THREE.Mesh(backWallGeo, wallMat);
    backWall.position.set(0, 8, -14);
    scene.add(backWall);

    // Left and Right Boundary Walls
    const sideWallGeo = new THREE.PlaneGeometry(80, 20);
    const leftWall = new THREE.Mesh(sideWallGeo, wallMat);
    leftWall.position.set(-24, 8, 0);
    leftWall.rotation.y = Math.PI / 2;
    scene.add(leftWall);

    const rightWall = new THREE.Mesh(sideWallGeo, wallMat);
    rightWall.position.set(24, 8, 0);
    rightWall.rotation.y = -Math.PI / 2;
    scene.add(rightWall);

    // Rear Wall Behind Player
    const rearWall = new THREE.Mesh(backWallGeo, wallMat);
    rearWall.position.set(0, 8, 24);
    rearWall.rotation.y = Math.PI;
    scene.add(rearWall);

    // Neon Baseboard Strips
    const baseboardMat = new THREE.MeshBasicMaterial({ color: 0x00e599 });
    const backTrimGeo = new THREE.BoxGeometry(80, 0.08, 0.08);
    const backTrim = new THREE.Mesh(backTrimGeo, baseboardMat);
    backTrim.position.set(0, 0.04, -13.9);
    scene.add(backTrim);

    // Eye-Level Elevation Guide Rail on Back Wall (Aim Lab Style)
    const eyeLineGeo = new THREE.BoxGeometry(48, 0.06, 0.04);
    const eyeLineMat = new THREE.MeshBasicMaterial({ color: 0x00e5ff });
    const eyeLine = new THREE.Mesh(eyeLineGeo, eyeLineMat);
    eyeLine.position.set(0, 1.7, -13.9);
    scene.add(eyeLine);

    // Eye-level crosshair distance ticks every 2m
    const tickMat = new THREE.MeshBasicMaterial({ color: 0x1f2e48 });
    for (let x = -10; x <= 10; x += 2) {
      if (x === 0) continue;
      const tickGeo = new THREE.BoxGeometry(0.04, 0.4, 0.02);
      const tick = new THREE.Mesh(tickGeo, tickMat);
      tick.position.set(x, 1.7, -13.89);
      scene.add(tick);
    }

    // Upper and Lower Elevation Reference Lines
    const refLineGeo = new THREE.BoxGeometry(48, 0.04, 0.02);
    const refLineMat = new THREE.MeshBasicMaterial({ color: 0x1c2436 });
    const upperLine = new THREE.Mesh(refLineGeo, refLineMat);
    upperLine.position.set(0, 2.7, -13.9);
    scene.add(upperLine);

    const lowerLine = new THREE.Mesh(refLineGeo, refLineMat);
    lowerLine.position.set(0, 0.7, -13.9);
    scene.add(lowerLine);

    // Center Cross Mark at Target Wall
    const centerMarkGeo = new THREE.BoxGeometry(0.06, 1.4, 0.04);
    const centerMarkMat = new THREE.MeshBasicMaterial({ color: 0x00e599 });
    const centerMark = new THREE.Mesh(centerMarkGeo, centerMarkMat);
    centerMark.position.set(0, 1.7, -13.88);
    scene.add(centerMark);

    // 3. Lighting (Esports Arena Studio)
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.1);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.9);
    keyLight.position.set(6, 14, 6);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x7590b8, 0.85);
    fillLight.position.set(-8, 10, 4);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0x00e599, 0.45);
    rimLight.position.set(0, 8, -12);
    scene.add(rimLight);

    // 4. Target Sphere with Customizable Enemy Color & Difficulty Size
    const targetRadius = (DIFFICULTY_CONFIGS[difficulty] || DIFFICULTY_CONFIGS.medium).targetRadius;
    const targetGeo = new THREE.SphereGeometry(targetRadius, 32, 32);
    const targetMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(targetColor),
      emissive: new THREE.Color(targetColor),
      emissiveIntensity: 0.85,
      roughness: 0.15,
      metalness: 0.35
    });
    const targetMesh = new THREE.Mesh(targetGeo, targetMat);
    targetMesh.position.set(0, 1.7, -9.0);
    scene.add(targetMesh);
    targetMeshRef.current = targetMesh;

    // 5. Aim Lab Tactical First-Person Pistol attached to Camera
    const { gunGroup, muzzleFlash } = createAimLabPistol();
    gunGroupRef.current = gunGroup;
    muzzleFlashRef.current = muzzleFlash;
    gunGroup.position.set(0.23, -0.19, -0.42);
    gunGroup.rotation.set(0.04, -0.05, 0.02);
    gunGroup.visible = showGunRef.current;
    camera.add(gunGroup);
    scene.add(camera);

    // Handle Resize
    const handleResize = () => {
      if (!canvasContainerRef.current || !rendererRef.current || !cameraRef.current) return;
      const w = canvasContainerRef.current.clientWidth;
      const h = canvasContainerRef.current.clientHeight;
      if (w > 0 && h > 0) {
        cameraRef.current.aspect = w / h;
        cameraRef.current.updateProjectionMatrix();
        rendererRef.current.setSize(w, h);
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (reqIdRef.current) cancelAnimationFrame(reqIdRef.current);
      if (camera && gunGroup) {
        camera.remove(gunGroup);
      }
      renderer.dispose();
      if (canvasContainer.contains(renderer.domElement)) {
        canvasContainer.removeChild(renderer.domElement);
      }
    };
  }, [fov]);

  // Dynamically update target color
  useEffect(() => {
    if (targetMeshRef.current) {
      const mat = targetMeshRef.current.material as THREE.MeshStandardMaterial;
      mat.color.set(targetColor);
      mat.emissive.set(targetColor);
    }
  }, [targetColor]);

  // Dynamically update target size when difficulty changes
  useEffect(() => {
    if (targetMeshRef.current) {
      const radius = DIFFICULTY_CONFIGS[difficulty].targetRadius;
      targetMeshRef.current.geometry.dispose();
      targetMeshRef.current.geometry = new THREE.SphereGeometry(radius, 32, 32);
    }
  }, [difficulty]);

  // Dynamically update camera FOV when Zoom toggles (makes target appear larger)
  useEffect(() => {
    if (cameraRef.current) {
      const targetFov = isZoomed ? fov * 0.72 : fov;
      cameraRef.current.fov = targetFov;
      cameraRef.current.updateProjectionMatrix();
    }
  }, [isZoomed, fov]);

  // Prevent right-click context menu in range container
  useEffect(() => {
    const onContextMenu = (e: MouseEvent) => {
      if (document.pointerLockElement === containerRef.current || containerRef.current?.contains(e.target as Node)) {
        e.preventDefault();
      }
    };
    window.addEventListener('contextmenu', onContextMenu);
    return () => window.removeEventListener('contextmenu', onContextMenu);
  }, []);

  // Pointer Lock & Mouse Movement
  const isLockedRef = useRef(false);
  const isRunningRef = useRef(false);
  const isZoomedRef = useRef(isZoomed);

  useEffect(() => {
    isLockedRef.current = isLocked;
  }, [isLocked]);

  useEffect(() => {
    isRunningRef.current = isRunning;
  }, [isRunning]);

  useEffect(() => {
    isZoomedRef.current = isZoomed;
  }, [isZoomed]);

  useEffect(() => {
    const onPointerLockChange = () => {
      const locked = document.pointerLockElement === containerRef.current;
      setIsLocked(locked);
      isLockedRef.current = locked;
      if (locked && !isRunningRef.current) {
        setIsRunning(true);
        isRunningRef.current = true;
        resetStats();
      }
    };

    const config = GAME_CONFIGS[game];
    const yawMultiplier = config.yaw;

    const onMouseMove = (e: MouseEvent) => {
      if (!isLockedRef.current && document.pointerLockElement !== containerRef.current) return;

      const movementX = e.movementX || 0;
      const movementY = e.movementY || 0;

      // Filter out pointer lock recentering spikes (hardware delta glitch causing teleport)
      if (Math.abs(movementX) > 240 || Math.abs(movementY) > 240) {
        return;
      }

      // Proportional sensitivity reduction when zoomed in (matching CS2 / Valorant ADS feel)
      const zoomFactor = isZoomedRef.current ? 0.72 : 1.0;
      const deltaYawDeg = movementX * yawMultiplier * sensitivity * zoomFactor;
      const deltaPitchDeg = movementY * yawMultiplier * sensitivity * zoomFactor;

      yawRef.current -= (deltaYawDeg * Math.PI) / 180;
      pitchRef.current -= (deltaPitchDeg * Math.PI) / 180;

      const maxPitch = (85 * Math.PI) / 180;
      pitchRef.current = Math.max(-maxPitch, Math.min(maxPitch, pitchRef.current));

      const totalAngularDelta = Math.sqrt(deltaYawDeg * deltaYawDeg + deltaPitchDeg * deltaPitchDeg);
      metricsRef.current.angularDeltas.push(totalAngularDelta);

      if (movementX !== 0 && targetMeshRef.current && cameraRef.current) {
        const dirSign = Math.sign(movementX);
        const lastDir = metricsRef.current.lastMouseDirX;
        
        if (lastDir !== 0 && dirSign !== lastDir && Math.abs(movementX) > 1.2) {
          metricsRef.current.overshoots += 1;
        }
        metricsRef.current.lastMouseDirX = dirSign;
      }
    };

    const spawnFlickTarget = () => {
      if (!targetMeshRef.current) return;
      const speedMult = DIFFICULTY_CONFIGS[difficulty]?.speedMultiplier || 1.0;
      const y = 1.3 + Math.random() * 0.85;

      if (angle === '360') {
        // Full 360 degree combat simulation around player
        const rad = (Math.random() * 2 - 1) * Math.PI;
        const dist = 7.5 + Math.random() * 2.5;
        const x = Math.sin(rad) * dist;
        const z = -Math.cos(rad) * dist;
        targetMeshRef.current.position.set(x, y, z);
      } else if (angle === '180') {
        // 180 degree semicircle (front + sides)
        const rad = (Math.random() - 0.5) * Math.PI;
        const dist = 7.5 + Math.random() * 2.5;
        const x = Math.sin(rad) * dist;
        const z = -Math.cos(rad) * dist;
        targetMeshRef.current.position.set(x, y, z);
      } else {
        // 90 degree forward arc
        const x = (Math.random() - 0.5) * (8.0 * Math.min(1.2, speedMult));
        const z = -7.5 - Math.random() * 2.5;
        targetMeshRef.current.position.set(x, y, z);
      }
      targetSpawnTimeRef.current = performance.now();
    };

    const onMouseDown = (e: MouseEvent) => {
      if (!isLockedRef.current && document.pointerLockElement !== containerRef.current) return;

      // Right-Click (e.button === 2): Toggle ADS Zoom (phóng to tầm nhìn)
      if (e.button === 2) {
        e.preventDefault();
        toggleZoom();
        return;
      }

      // Left-Click: Fire shot
      if (e.button !== 0) return;

      sound.playGunshot();
      metricsRef.current.shots += 1;

      // Realistic 3D gun recoil kick & muzzle flash flare
      recoilOffsetRef.current.z = 0.048;
      recoilOffsetRef.current.y = 0.014;
      recoilRotRef.current.x = 0.16;
      if (muzzleFlashRef.current) {
        (muzzleFlashRef.current.material as THREE.MeshBasicMaterial).opacity = 1.0;
        muzzleFlashRef.current.rotation.z = Math.random() * Math.PI * 2;
      }

      if (cameraRef.current && sceneRef.current && targetMeshRef.current) {
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(new THREE.Vector2(0, 0), cameraRef.current);
        const intersects = raycaster.intersectObject(targetMeshRef.current);

        if (intersects.length > 0) {
          metricsRef.current.hits += 1;
          const reaction = performance.now() - targetSpawnTimeRef.current;
          metricsRef.current.reactionTimes.push(reaction);

          sound.playHeadshot();
          setHitmarker(true);
          setTimeout(() => setHitmarker(false), 90);

          if (mode === 'flicking') {
            spawnFlickTarget();
          }
        } else {
          // Precise 3D vector-based overshoot vs undershoot evaluation
          const localTarget = targetMeshRef.current.position.clone().applyMatrix4(cameraRef.current.matrixWorldInverse);
          const lastDirX = metricsRef.current.lastMouseDirX;

          // If moving right (lastDirX > 0) and target is to the left in camera space, player flicked past the target
          // If moving left (lastDirX < 0) and target is to the right in camera space, player flicked past the target
          if (lastDirX > 0 && localTarget.x < 0) {
            metricsRef.current.overshoots += 1;
          } else if (lastDirX < 0 && localTarget.x > 0) {
            metricsRef.current.overshoots += 1;
          } else {
            metricsRef.current.undershoots += 1;
          }
        }

        const hits = metricsRef.current.hits;
        const shots = metricsRef.current.shots;
        setLiveStats({
          hits,
          shots,
          accuracy: shots > 0 ? Math.round((hits / shots) * 100) : 0
        });
      }
    };

    document.addEventListener('pointerlockchange', onPointerLockChange);
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mousedown', onMouseDown);

    return () => {
      document.removeEventListener('pointerlockchange', onPointerLockChange);
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mousedown', onMouseDown);
    };
  }, [game, sensitivity, mode, resetStats]);

  // Main Render Loop
  useEffect(() => {
    let lastTime = performance.now();

    const animate = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      if (cameraRef.current) {
        const euler = new THREE.Euler(pitchRef.current, yawRef.current, 0, 'YXZ');
        cameraRef.current.quaternion.setFromEuler(euler);
      }

      if (targetMeshRef.current) {
        const target = targetMeshRef.current;

        if (mode === 'tracking') {
          const speedMult = DIFFICULTY_CONFIGS[difficulty]?.speedMultiplier || 1.0;
          const currentSpeed = 3.2 * speedMult;
          const dir = Math.sign(targetVelocityRef.current.x) || 1;
          target.position.x += dir * currentSpeed * dt;
          target.position.y = 1.7 + Math.sin(now * 0.0022 * speedMult) * 0.9;
          target.position.z = -8.5 + Math.cos(now * 0.0016 * speedMult) * 1.5;

          if (target.position.x > 5.5) {
            targetVelocityRef.current.x = -1;
          } else if (target.position.x < -5.5) {
            targetVelocityRef.current.x = 1;
          }

          if (isLocked && cameraRef.current) {
            metricsRef.current.trackingFramesTotal += 1;
            const raycaster = new THREE.Raycaster();
            raycaster.setFromCamera(new THREE.Vector2(0, 0), cameraRef.current);
            const hits = raycaster.intersectObject(target);

            if (hits.length > 0) {
              metricsRef.current.trackingFramesOnTarget += 1;
              (target.material as THREE.MeshStandardMaterial).color.setHex(0x00e599);
              (target.material as THREE.MeshStandardMaterial).emissive.setHex(0x00b87a);
            } else {
              (target.material as THREE.MeshStandardMaterial).color.set(targetColor);
              (target.material as THREE.MeshStandardMaterial).emissive.set(targetColor);
            }
          }
        }
      }

      // 3D Pistol Weapon Recoil Recovery, Muzzle Flash, and Natural Idle Sway
      if (gunGroupRef.current) {
        gunGroupRef.current.visible = showGunRef.current;

        if (showGunRef.current) {
          // Lerp recoil back to zero
          recoilOffsetRef.current.z = THREE.MathUtils.lerp(recoilOffsetRef.current.z, 0, dt * 18);
          recoilOffsetRef.current.y = THREE.MathUtils.lerp(recoilOffsetRef.current.y, 0, dt * 18);
          recoilRotRef.current.x = THREE.MathUtils.lerp(recoilRotRef.current.x, 0, dt * 18);

          // Fade muzzle flash
          if (muzzleFlashRef.current) {
            const flashMat = muzzleFlashRef.current.material as THREE.MeshBasicMaterial;
            if (flashMat.opacity > 0) {
              flashMat.opacity = Math.max(0, flashMat.opacity - dt * 28);
            }
          }

          // Natural breathing idle sway
          const swayTime = now * 0.0024;
          const swayX = Math.sin(swayTime) * 0.0016;
          const swayY = Math.cos(swayTime * 2) * 0.0012;

          const restX = isZoomedRef.current ? 0.0 : 0.23;
          const restY = isZoomedRef.current ? -0.24 : -0.19;
          const restZ = -0.42;

          gunGroupRef.current.position.set(
            restX + swayX,
            restY + swayY + recoilOffsetRef.current.y,
            restZ + recoilOffsetRef.current.z
          );
          gunGroupRef.current.rotation.set(
            0.04 + recoilRotRef.current.x,
            -0.05,
            0.02
          );
        }
      }

      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }

      reqIdRef.current = requestAnimationFrame(animate);
    };

    reqIdRef.current = requestAnimationFrame(animate);
    return () => {
      if (reqIdRef.current) cancelAnimationFrame(reqIdRef.current);
    };
  }, [mode, isLocked, targetColor]);

  const finishDrill = useCallback(() => {
    setIsRunning(false);
    setIsLocked(false);
    isRunningRef.current = false;
    isLockedRef.current = false;
    if (document.exitPointerLock) {
      document.exitPointerLock();
    }
    sound.playComplete();

    const m = metricsRef.current;
    let accuracy = 0;
    if (mode === 'tracking') {
      accuracy = m.trackingFramesTotal > 0
        ? Math.round((m.trackingFramesOnTarget / m.trackingFramesTotal) * 100)
        : 0;
    } else {
      accuracy = m.shots > 0 ? Math.round((m.hits / m.shots) * 100) : 0;
    }

    let smoothness = 75;
    if (m.angularDeltas.length > 10) {
      const avg = m.angularDeltas.reduce((a, b) => a + b, 0) / m.angularDeltas.length;
      const variance = m.angularDeltas.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / m.angularDeltas.length;
      const stdDev = Math.sqrt(variance);
      smoothness = Math.max(20, Math.min(100, Math.round(100 - (stdDev * 18))));
    }

    const avgReaction = m.reactionTimes.length > 0
      ? Math.round(m.reactionTimes.reduce((a, b) => a + b, 0) / m.reactionTimes.length)
      : 280;

    // Reaction Grade Classification
    let reactionGrade = 'Khá Tốt';
    let reactionGradeColor = '#ffea00';
    if (avgReaction < 200) {
      reactionGrade = 'Esports Pro';
      reactionGradeColor = '#00e599';
    } else if (avgReaction < 250) {
      reactionGrade = 'Cực Nhanh';
      reactionGradeColor = '#00e5ff';
    } else if (avgReaction < 300) {
      reactionGrade = 'Chuẩn Xác';
      reactionGradeColor = '#ffea00';
    } else {
      reactionGrade = 'Cần Cải Thiện';
      reactionGradeColor = '#ff7700';
    }

    // Weighted Score Formula (Aim Lab / Kovaak's style)
    const diffMultipliers: Record<DrillDifficulty, number> = {
      easy: 0.8,
      medium: 1.0,
      hard: 1.35,
      pro: 1.75
    };
    const angleMultipliers: Record<DrillAngle, number> = {
      '90': 1.0,
      '180': 1.25,
      '360': 1.6
    };

    const diffMult = diffMultipliers[difficulty] || 1.0;
    const angleMult = angleMultipliers[angle] || 1.0;
    const speedBonus = Math.max(0.6, 1.0 + (350 - avgReaction) / 250);
    const accFactor = Math.max(0.2, accuracy / 100);

    let calculatedScore = 0;
    if (mode === 'flicking') {
      calculatedScore = Math.round(m.hits * 120 * accFactor * speedBonus * diffMult * angleMult);
    } else {
      calculatedScore = Math.round(accuracy * 15 * diffMult * angleMult * (smoothness / 100));
    }

    const result: DrillResult = {
      accuracy,
      targetsHit: m.hits,
      totalShots: m.shots,
      smoothness,
      avgReactionTimeMs: avgReaction,
      overshootCount: m.overshoots,
      undershootCount: Math.round(m.undershoots),
      score: calculatedScore,
      reactionGrade,
      reactionGradeColor
    };

    if (onComplete) {
      onComplete(result);
    }
  }, [mode, difficulty, angle, onComplete]);

  // Countdown Timer
  useEffect(() => {
    if (!isRunning || !isLocked) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          finishDrill();
          return 0;
        }
        if (prev <= 4) {
          sound.playBeep(false);
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isRunning, isLocked, finishDrill]);

  return (
    <div
      ref={containerRef}
      className={`relative w-full ${
        isFullscreen ? 'h-screen rounded-none' : 'h-[460px] sm:h-[480px] rounded-2xl'
      } bg-[#090c12] overflow-hidden steam-border shadow-hero-card select-none`}
    >
      {/* 3D Canvas Dedicated Mount Point */}
      <div ref={canvasContainerRef} className="absolute inset-0 pointer-events-none z-0" />

      {/* 3D Canvas Click Area */}
      <div
        onClick={handleLock}
        className="absolute inset-0 cursor-crosshair z-10"
      />

      {/* Crosshair Overlay */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
        {crosshair.dot && (
          <div
            style={{
              width: `${crosshair.thickness + 1}px`,
              height: `${crosshair.thickness + 1}px`,
              backgroundColor: hitmarker ? '#ff3355' : crosshair.color,
              boxShadow: crosshair.outline ? '0 0 1px 1px #000' : 'none'
            }}
            className="absolute rounded-full transition-colors"
          />
        )}
        <div
          style={{
            width: `${crosshair.thickness}px`,
            height: `${crosshair.size}px`,
            backgroundColor: hitmarker ? '#ff3355' : crosshair.color,
            bottom: `calc(50% + ${crosshair.gap}px)`,
            boxShadow: crosshair.outline ? '0 0 1px 1px #000' : 'none'
          }}
          className="absolute transition-colors"
        />
        <div
          style={{
            width: `${crosshair.thickness}px`,
            height: `${crosshair.size}px`,
            backgroundColor: hitmarker ? '#ff3355' : crosshair.color,
            top: `calc(50% + ${crosshair.gap}px)`,
            boxShadow: crosshair.outline ? '0 0 1px 1px #000' : 'none'
          }}
          className="absolute transition-colors"
        />
        <div
          style={{
            height: `${crosshair.thickness}px`,
            width: `${crosshair.size}px`,
            backgroundColor: hitmarker ? '#ff3355' : crosshair.color,
            right: `calc(50% + ${crosshair.gap}px)`,
            boxShadow: crosshair.outline ? '0 0 1px 1px #000' : 'none'
          }}
          className="absolute transition-colors"
        />
        <div
          style={{
            height: `${crosshair.thickness}px`,
            width: `${crosshair.size}px`,
            backgroundColor: hitmarker ? '#ff3355' : crosshair.color,
            left: `calc(50% + ${crosshair.gap}px)`,
            boxShadow: crosshair.outline ? '0 0 1px 1px #000' : 'none'
          }}
          className="absolute transition-colors"
        />

        {hitmarker && (
          <div className="absolute w-8 h-8 rounded-full border border-volt-500/80 animate-ping pointer-events-none" />
        )}
      </div>

      {/* Top HUD: Clean Esports Bar */}
      <div className="absolute top-3 left-4 right-4 flex items-center justify-between pointer-events-none z-30">
        <div className="flex items-center gap-2.5 bg-[#111520]/90 backdrop-blur-md px-3.5 py-1.5 rounded-xl steam-border pointer-events-auto">
          <span className="text-xs font-mono uppercase font-bold text-slate-300">
            {GAME_CONFIGS[game].name}
          </span>
          <span className="w-1 h-1 rounded-full bg-slate-500"></span>
          <span className="text-xs font-mono font-bold text-volt-500">
            Sens {sensitivity}
          </span>
          <span className="w-1 h-1 rounded-full bg-slate-500"></span>
          <span className="text-xs text-slate-200 font-medium">
            {mode === 'tracking' ? 'Tracking' : 'Flicking'}
          </span>
          <span className="w-1 h-1 rounded-full bg-slate-500"></span>
          <span className="px-2 py-0.5 rounded bg-volt-500/20 text-volt-400 font-mono font-extrabold text-[11px] uppercase tracking-wider">
            {DIFFICULTY_CONFIGS[difficulty]?.name || 'Vừa'}
          </span>
          <span className="w-1 h-1 rounded-full bg-slate-500"></span>
          <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-400 font-mono font-extrabold text-[11px] uppercase tracking-wider">
            {angle === '360' ? '360°' : angle === '180' ? '180°' : '90°'}
          </span>
        </div>

        {/* Right side controls: Zoom, Accuracy, Timer, Fullscreen */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* ADS Zoom Quick Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toggleZoom();
            }}
            className={`px-3 py-1.5 rounded-lg steam-border backdrop-blur-md text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              isZoomed
                ? 'bg-volt-500 text-black shadow-volt-glow'
                : 'bg-[#111520]/90 text-slate-200 hover:text-white hover:bg-[#1a2030]'
            }`}
            title="Chuột phải hoặc bấm để bật/tắt phóng to ngắm (ADS)"
          >
            {isZoomed ? (
              <>
                <ZoomOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Thu Nhỏ (74°)</span>
              </>
            ) : (
              <>
                <ZoomIn className="w-3.5 h-3.5 text-volt-500" />
                <span className="hidden sm:inline">Ngắm ADS</span>
              </>
            )}
          </button>

          {/* 3D Pistol Weapon Toggle Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowGun((prev) => !prev);
            }}
            className={`px-2.5 py-1.5 rounded-lg steam-border backdrop-blur-md text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              showGun
                ? 'bg-[#182030] text-volt-400 border-volt-500/40 hover:bg-[#202a40]'
                : 'bg-[#111520]/90 text-slate-400 hover:text-slate-200 hover:bg-[#1a2030]'
            }`}
            title="Bật/Tắt hiển thị khẩu súng lục Aim Lab 3D"
          >
            <Shield className="w-3.5 h-3.5 text-volt-500" />
            <span className="hidden sm:inline">{showGun ? 'Khẩu Lục: BẬT' : 'Khẩu Lục: TẮT'}</span>
          </button>

          {mode === 'flicking' && liveStats.shots > 0 && (
            <div className="bg-[#111520]/90 backdrop-blur-md px-3 py-1.5 rounded-lg steam-border text-xs font-mono text-slate-200">
              ACC: <span className="text-volt-500 font-bold">{liveStats.accuracy}%</span>
            </div>
          )}
          <div className={`px-3 py-1.5 rounded-lg font-mono text-xs font-bold backdrop-blur-md steam-border ${
            timeLeft <= 4
              ? 'bg-rose-950/70 text-rose-400 border-rose-800 animate-pulse'
              : 'bg-[#111520]/90 text-slate-200'
          }`}>
            {timeLeft}s
          </div>

          {/* Fullscreen Toggle Button */}
          <button
            onClick={toggleFullscreen}
            className="px-3 py-1.5 rounded-lg bg-[#111520]/90 hover:bg-[#1a2030] backdrop-blur-md steam-border text-slate-200 hover:text-white transition-colors flex items-center gap-1.5 text-xs font-medium cursor-pointer"
            title={isFullscreen ? "Thoát toàn màn hình" : "Bật toàn màn hình"}
          >
            {isFullscreen ? (
              <>
                <Minimize2 className="w-3.5 h-3.5 text-volt-500" />
                <span className="hidden sm:inline">Thu nhỏ</span>
              </>
            ) : (
              <>
                <Maximize2 className="w-3.5 h-3.5 text-volt-500" />
                <span className="hidden sm:inline">Toàn màn hình</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Center Lock Call-to-action */}
      {!isLocked && (
        <div
          onClick={handleLock}
          className="absolute inset-0 bg-[#07090f]/85 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center cursor-pointer transition-all hover:bg-[#07090f]/80 z-40"
        >
          <div className="w-14 h-14 rounded-2xl bg-volt-500/10 border border-volt-500/30 flex items-center justify-center mb-3 text-volt-500 shadow-volt-glow pointer-events-none">
            <MousePointer className="w-7 h-7 animate-pulse" />
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-white mb-2 tracking-tight pointer-events-none">
            {isRunning ? 'Tạm Dừng - Nhấp Để Tiếp Tục' : 'Phòng Luyện Phản Xạ Aim Lab'}
          </h3>
          <p className="text-xs sm:text-sm text-slate-300 max-w-lg text-center mb-6 leading-relaxed pointer-events-none">
            Khóa con trỏ và nhận tín hiệu chuột trực tiếp 1:1 không gia tốc. Nhấp chuột hoặc bấm nút bên dưới để bắt đầu.
          </p>

          <div className="flex items-center gap-3 mb-6" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={handleLock}
              className="px-8 py-3.5 bg-volt-500 hover:bg-volt-400 text-black font-black rounded-xl shadow-volt-glow transition-all active:scale-95 flex items-center gap-2.5 text-sm uppercase tracking-wider font-mono cursor-pointer"
            >
              <Play className="w-5 h-5 fill-black" /> {isRunning ? 'Tiếp tục luyện tập' : 'Bắt đầu bắn thử'}
            </button>
            <button
              type="button"
              onClick={toggleFullscreen}
              className="px-5 py-3.5 bg-[#161b28] hover:bg-[#1f2638] steam-border text-white font-bold rounded-xl transition-all active:scale-95 flex items-center gap-2 text-xs tracking-wide cursor-pointer"
            >
              {isFullscreen ? (
                <>
                  <Minimize2 className="w-4 h-4 text-volt-500" /> Thu nhỏ
                </>
              ) : (
                <>
                  <Maximize2 className="w-4 h-4 text-volt-500" /> Toàn màn hình
                </>
              )}
            </button>
          </div>

          {/* Quick Keybind Guide */}
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-slate-400 pointer-events-none font-medium">
            <span className="flex items-center gap-1.5">
              <kbd className="px-2 py-0.5 bg-[#181d2a] steam-border rounded text-[11px] text-slate-200 font-mono font-bold">Chuột trái</kbd> Bắn
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5">
              <kbd className="px-2 py-0.5 bg-[#181d2a] steam-border rounded text-[11px] text-volt-400 font-mono font-bold">Chuột phải</kbd> Phóng to ngắm (ADS)
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5">
              <kbd className="px-2 py-0.5 bg-[#181d2a] steam-border rounded text-[11px] text-slate-200 font-mono font-bold">ESC</kbd> Nhả chuột
            </span>
          </div>
        </div>
      )}

      {/* Bottom Hint */}
      <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-xs text-slate-300 pointer-events-none font-medium z-30">
        <div>
          {mode === 'tracking'
            ? 'Bám tâm theo mục tiêu để đo độ ổn định cơ tay'
            : 'Flick và bắn trúng các mục tiêu xuất hiện'}
        </div>
        <div className="flex items-center gap-3">
          <span>Chuột phải: Bật/Tắt ngắm ADS</span>
          <span>•</span>
          <span>Phím F: Toàn màn hình</span>
          <span>•</span>
          <span>ESC: Nhả chuột</span>
        </div>
      </div>
    </div>
  );
};
