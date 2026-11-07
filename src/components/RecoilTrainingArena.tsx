import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { CrosshairConfig, SupportedGame } from '../types';
import { GAME_CONFIGS } from '../lib/sensCalculator';
import { sound } from '../lib/soundFx';
import { MousePointer, RotateCcw, Crosshair, Eye, ShieldCheck, AlertCircle } from 'lucide-react';

interface BulletHit {
  x: number; // Offset on target board
  y: number;
  zone: 'head' | 'chest' | 'body' | 'miss';
  shotIndex: number;
}

interface SprayStats {
  totalShots: number;
  headHits: number;
  chestHits: number;
  bodyHits: number;
  misses: number;
  accuracy: number;
  groupingRadiusCm: number;
  feedback: string;
  feedbackType: 'good' | 'too-high' | 'too-low';
}

interface Props {
  game: SupportedGame;
  sensitivity: number;
  dpi: number;
  weapon: 'ak47' | 'm4a1';
  crosshair: CrosshairConfig;
}

// Authentic spray offset patterns (Pitch vertical kick, Yaw horizontal kick) per bullet (1 to 30)
const AK47_PATTERN = [
  { pitch: 0.0, yaw: 0.0 },
  { pitch: 0.018, yaw: 0.001 },
  { pitch: 0.038, yaw: -0.002 },
  { pitch: 0.060, yaw: 0.001 },
  { pitch: 0.082, yaw: 0.004 },
  { pitch: 0.104, yaw: 0.008 },
  { pitch: 0.125, yaw: 0.015 },
  { pitch: 0.142, yaw: 0.024 },
  { pitch: 0.155, yaw: 0.034 },
  { pitch: 0.162, yaw: 0.042 }, // Starts pulling right
  { pitch: 0.165, yaw: 0.048 },
  { pitch: 0.166, yaw: 0.045 },
  { pitch: 0.164, yaw: 0.036 },
  { pitch: 0.162, yaw: 0.022 },
  { pitch: 0.160, yaw: 0.006 }, // Swings back to center
  { pitch: 0.162, yaw: -0.012 },
  { pitch: 0.165, yaw: -0.028 }, // Pulls left
  { pitch: 0.166, yaw: -0.038 },
  { pitch: 0.165, yaw: -0.044 },
  { pitch: 0.163, yaw: -0.042 },
  { pitch: 0.160, yaw: -0.032 },
  { pitch: 0.162, yaw: -0.018 },
  { pitch: 0.165, yaw: -0.002 }, // Back to right
  { pitch: 0.166, yaw: 0.016 },
  { pitch: 0.165, yaw: 0.028 },
  { pitch: 0.162, yaw: 0.034 },
  { pitch: 0.160, yaw: 0.026 },
  { pitch: 0.162, yaw: 0.012 },
  { pitch: 0.164, yaw: -0.008 },
  { pitch: 0.165, yaw: -0.020 }
];

const M4A1_PATTERN = AK47_PATTERN.map((pt) => ({
  pitch: pt.pitch * 0.72,
  yaw: pt.yaw * 0.65
}));

export const RecoilTrainingArena: React.FC<Props> = ({
  game,
  sensitivity,
  weapon,
  crosshair
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [ammo, setAmmo] = useState(30);
  const [showGhostPath, setShowGhostPath] = useState(true);
  const [hits, setHits] = useState<BulletHit[]>([]);
  const [stats, setStats] = useState<SprayStats | null>(null);

  // Three.js refs
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const reqIdRef = useRef<number | null>(null);

  // Camera angles
  const yawRef = useRef(0);
  const pitchRef = useRef(0);

  // Recoil offset state
  const recoilPitchRef = useRef(0);
  const recoilYawRef = useRef(0);

  // Spraying state
  const isFiringRef = useRef(false);
  const currentShotIndexRef = useRef(0);
  const lastShotTimeRef = useRef(0);

  // Bullet decals group in scene
  const decalsGroupRef = useRef<THREE.Group | null>(null);
  const targetBoardMeshRef = useRef<THREE.Mesh | null>(null);

  // Ghost crosshair offset indicator on screen
  const [ghostOffset, setGhostOffset] = useState({ x: 0, y: 0 });

  const activePattern = weapon === 'ak47' ? AK47_PATTERN : M4A1_PATTERN;

  const handleLock = () => {
    if (containerRef.current) {
      containerRef.current.requestPointerLock();
    }
  };

  // Clear target board and reset spray session
  const clearTarget = useCallback(() => {
    setHits([]);
    setAmmo(30);
    setStats(null);
    currentShotIndexRef.current = 0;
    recoilPitchRef.current = 0;
    recoilYawRef.current = 0;
    if (decalsGroupRef.current) {
      while (decalsGroupRef.current.children.length > 0) {
        decalsGroupRef.current.remove(decalsGroupRef.current.children[0]);
      }
    }
  }, []);

  // Compute final spray statistics after firing
  const finishSpraySession = useCallback((sessionHits: BulletHit[]) => {
    if (sessionHits.length === 0) return;

    const total = sessionHits.length;
    let head = 0;
    let chest = 0;
    let body = 0;
    let miss = 0;
    let sumX = 0;
    let sumY = 0;

    sessionHits.forEach((h) => {
      if (h.zone === 'head') head++;
      else if (h.zone === 'chest') chest++;
      else if (h.zone === 'body') body++;
      else miss++;
      sumX += h.x;
      sumY += h.y;
    });

    const avgX = sumX / total;
    const avgY = sumY / total;

    // Radius of spread in cm
    let maxDist = 0;
    sessionHits.forEach((h) => {
      const d = Math.sqrt(Math.pow(h.x - avgX, 2) + Math.pow(h.y - avgY, 2));
      if (d > maxDist) maxDist = d;
    });
    const spreadCm = Number((maxDist * 100).toFixed(1));

    const onTargetCount = head + chest + body;
    const accuracy = Math.round((onTargetCount / total) * 100);

    // Analyze recoil feedback for sens
    let feedback = '';
    let feedbackType: 'good' | 'too-high' | 'too-low' = 'good';

    if (avgY > 0.45 || miss > total * 0.35) {
      feedback = 'Đạn bị vọt lên cao: Bạn ghìm chuột chưa đủ sâu hoặc Sens hiện tại hơi thấp khiến tay kéo xuống không kịp theo nhịp giật.';
      feedbackType = 'too-low';
    } else if (avgY < -0.3) {
      feedback = 'Đạn bị găm quá thấp xuống chân: Bạn đang kéo chuột quá mạnh hoặc Sens quá cao khiến chỉ nhích nhẹ chuột đã kéo tụt tâm.';
      feedbackType = 'too-high';
    } else if (Math.abs(avgX) > 0.35) {
      feedback = 'Đạn bị dạt sang hai bên: Sens hơi cao khiến cổ tay bị rung lắc khi bù lực giật ngang.';
      feedbackType = 'too-high';
    } else {
      feedback = 'Ghìm tâm rất chuẩn! Chùm đạn gom chặt vào vùng đầu và ngực. Mức Sens này rất vừa tay với quán tính kéo chuột của bạn.';
      feedbackType = 'good';
    }

    setStats({
      totalShots: total,
      headHits: head,
      chestHits: chest,
      bodyHits: body,
      misses: miss,
      accuracy,
      groupingRadiusCm: spreadCm,
      feedback,
      feedbackType
    });
  }, []);

  // Three.js Scene Setup
  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x0a0c10);
    scene.fog = new THREE.FogExp2(0x0a0c10, 0.02);

    const camera = new THREE.PerspectiveCamera(103, width / height, 0.1, 1000);
    cameraRef.current = camera;
    camera.position.set(0, 1.7, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    rendererRef.current = renderer;
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // Floor
    const gridHelper = new THREE.GridHelper(50, 50, 0x222a3d, 0x131724);
    gridHelper.position.y = 0;
    scene.add(gridHelper);

    // Lights
    const amb = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(amb);
    const sun = new THREE.DirectionalLight(0xffffff, 1.2);
    sun.position.set(5, 15, 5);
    scene.add(sun);

    // Target Stand / Board at 14 meters distance
    const boardGeo = new THREE.PlaneGeometry(3.5, 4.5);
    const boardMat = new THREE.MeshStandardMaterial({
      color: 0x1a2130,
      roughness: 0.8,
      metalness: 0.1
    });
    const targetBoard = new THREE.Mesh(boardGeo, boardMat);
    targetBoard.position.set(0, 1.7, -12);
    scene.add(targetBoard);
    targetBoardMeshRef.current = targetBoard;

    // Target Silhouette: Body outline rings
    // Head circle (Center: x=0, y=2.8, r=0.22)
    const headGeo = new THREE.CircleGeometry(0.22, 32);
    const headMat = new THREE.MeshBasicMaterial({ color: 0xff3355 });
    const headMesh = new THREE.Mesh(headGeo, headMat);
    headMesh.position.set(0, 2.75, -11.98);
    scene.add(headMesh);

    // Upper Chest (Center: x=0, y=2.05, w=0.75, h=0.85)
    const chestGeo = new THREE.PlaneGeometry(0.75, 0.85);
    const chestMat = new THREE.MeshBasicMaterial({ color: 0x00e599, transparent: true, opacity: 0.65 });
    const chestMesh = new THREE.Mesh(chestGeo, chestMat);
    chestMesh.position.set(0, 2.05, -11.98);
    scene.add(chestMesh);

    // Lower Stomach
    const stomachGeo = new THREE.PlaneGeometry(0.65, 0.7);
    const stomachMat = new THREE.MeshBasicMaterial({ color: 0x3b82f6, transparent: true, opacity: 0.45 });
    const stomachMesh = new THREE.Mesh(stomachGeo, stomachMat);
    stomachMesh.position.set(0, 1.28, -11.98);
    scene.add(stomachMesh);

    // Decals Group (Bullet holes)
    const decalsGroup = new THREE.Group();
    scene.add(decalsGroup);
    decalsGroupRef.current = decalsGroup;

    // Handle Resize
    const handleResize = () => {
      if (!containerRef.current || !rendererRef.current || !cameraRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (reqIdRef.current) cancelAnimationFrame(reqIdRef.current);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Pointer Lock & Mouse Listeners
  useEffect(() => {
    const onPointerLockChange = () => {
      const locked = document.pointerLockElement === containerRef.current;
      setIsLocked(locked);
      if (!locked) {
        isFiringRef.current = false;
      }
    };

    const config = GAME_CONFIGS[game];
    const yawMultiplier = config.yaw;

    const onMouseMove = (e: MouseEvent) => {
      if (document.pointerLockElement !== containerRef.current) return;

      const movementX = e.movementX || 0;
      const movementY = e.movementY || 0;

      // Player compensates by pulling mouse
      const deltaYawDeg = movementX * yawMultiplier * sensitivity;
      const deltaPitchDeg = movementY * yawMultiplier * sensitivity;

      yawRef.current -= (deltaYawDeg * Math.PI) / 180;
      pitchRef.current -= (deltaPitchDeg * Math.PI) / 180;

      const maxPitch = (80 * Math.PI) / 180;
      pitchRef.current = Math.max(-maxPitch, Math.min(maxPitch, pitchRef.current));
    };

    const onMouseDown = (e: MouseEvent) => {
      if (document.pointerLockElement !== containerRef.current) return;
      if (e.button === 0) {
        isFiringRef.current = true;
      }
    };

    const onMouseUp = (e: MouseEvent) => {
      if (e.button === 0) {
        isFiringRef.current = false;
        // Natural recoil reset decay
      }
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'r' || e.key === 'R') {
        clearTarget();
      }
    };

    document.addEventListener('pointerlockchange', onPointerLockChange);
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('mouseup', onMouseUp);
    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.removeEventListener('pointerlockchange', onPointerLockChange);
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('mouseup', onMouseUp);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [game, sensitivity, clearTarget]);

  // Main Firing & Animation Loop
  useEffect(() => {
    let lastTime = performance.now();
    const rateOfFireMs = 100; // 600 RPM = 100ms per shot

    const animate = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      // Handle continuous full-auto spray
      if (isFiringRef.current && isLocked && ammo > 0) {
        if (now - lastShotTimeRef.current >= rateOfFireMs) {
          lastShotTimeRef.current = now;
          const shotIdx = currentShotIndexRef.current;

          if (shotIdx < activePattern.length) {
            // Apply recoil kick from weapon pattern
            const patternStep = activePattern[shotIdx];
            recoilPitchRef.current = patternStep.pitch;
            recoilYawRef.current = patternStep.yaw;

            sound.playGunshot();

            // Calculate impact point on target board (-12m z-plane)
            // Effective aim direction = camera orientation + recoil kick
            const totalPitch = pitchRef.current + recoilPitchRef.current;
            const totalYaw = yawRef.current - recoilYawRef.current;

            // Project onto board at z = -12
            const distance = 12;
            const impactX = -Math.tan(totalYaw) * distance;
            const impactY = 1.7 + Math.tan(totalPitch) * distance;

            // Hit zone detection
            let zone: 'head' | 'chest' | 'body' | 'miss' = 'miss';
            const headDist = Math.sqrt(Math.pow(impactX, 2) + Math.pow(impactY - 2.75, 2));

            if (headDist <= 0.22) {
              zone = 'head';
              sound.playHeadshot();
            } else if (Math.abs(impactX) <= 0.38 && impactY >= 1.62 && impactY <= 2.48) {
              zone = 'chest';
              sound.playHit();
            } else if (Math.abs(impactX) <= 0.33 && impactY >= 0.93 && impactY <= 1.62) {
              zone = 'body';
              sound.playHit();
            } else if (Math.abs(impactX) <= 1.75 && impactY >= -0.5 && impactY <= 3.9) {
              zone = 'miss';
            }

            // Create 3D Bullet Decal on board
            if (decalsGroupRef.current) {
              const decalGeo = new THREE.CircleGeometry(0.035, 16);
              const decalColor = zone === 'head' ? 0xffea00 : zone === 'chest' ? 0x00ffaa : 0xff3355;
              const decalMat = new THREE.MeshBasicMaterial({ color: decalColor });
              const decalMesh = new THREE.Mesh(decalGeo, decalMat);
              decalMesh.position.set(impactX, impactY, -11.96);
              decalsGroupRef.current.add(decalMesh);
            }

            const newHit: BulletHit = {
              x: impactX,
              y: impactY,
              zone,
              shotIndex: shotIdx + 1
            };

            setHits((prev) => {
              const updated = [...prev, newHit];
              if (shotIdx + 1 >= 30) {
                finishSpraySession(updated);
              }
              return updated;
            });

            currentShotIndexRef.current += 1;
            setAmmo((prev) => Math.max(0, prev - 1));

            // Update ghost guide offset
            if (shotIdx + 1 < activePattern.length) {
              const nextStep = activePattern[shotIdx + 1];
              setGhostOffset({
                x: -nextStep.yaw * 650,
                y: nextStep.pitch * 650
              });
            }
          } else {
            // Reached 30 bullets, stop firing
            isFiringRef.current = false;
          }
        }
      } else {
        // Not firing: recover recoil gradually back to 0
        recoilPitchRef.current = THREE.MathUtils.lerp(recoilPitchRef.current, 0, dt * 10);
        recoilYawRef.current = THREE.MathUtils.lerp(recoilYawRef.current, 0, dt * 10);
        setGhostOffset({ x: 0, y: 0 });
      }

      // Update camera orientation
      if (cameraRef.current) {
        const totalPitch = pitchRef.current + recoilPitchRef.current;
        const totalYaw = yawRef.current - recoilYawRef.current;
        const euler = new THREE.Euler(totalPitch, totalYaw, 0, 'YXZ');
        cameraRef.current.quaternion.setFromEuler(euler);
      }

      // Render scene
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }

      reqIdRef.current = requestAnimationFrame(animate);
    };

    reqIdRef.current = requestAnimationFrame(animate);
    return () => {
      if (reqIdRef.current) cancelAnimationFrame(reqIdRef.current);
    };
  }, [isLocked, ammo, activePattern, finishSpraySession]);

  return (
    <div className="space-y-4">
      {/* 3D Viewport Arena */}
      <div className="relative w-full h-[520px] bg-[#090c12] rounded-2xl overflow-hidden steam-border shadow-hero-card select-none">
        <div
          ref={containerRef}
          onClick={handleLock}
          className="w-full h-full cursor-crosshair"
        />

        {/* Center Crosshair */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {crosshair.dot && (
            <div
              style={{
                width: `${crosshair.thickness + 1}px`,
                height: `${crosshair.thickness + 1}px`,
                backgroundColor: crosshair.color,
                boxShadow: crosshair.outline ? '0 0 1px 1px #000' : 'none'
              }}
              className="absolute rounded-full"
            />
          )}
          {/* Crosshair arms */}
          <div
            style={{
              width: `${crosshair.thickness}px`,
              height: `${crosshair.size}px`,
              backgroundColor: crosshair.color,
              bottom: `calc(50% + ${crosshair.gap}px)`
            }}
            className="absolute"
          />
          <div
            style={{
              width: `${crosshair.thickness}px`,
              height: `${crosshair.size}px`,
              backgroundColor: crosshair.color,
              top: `calc(50% + ${crosshair.gap}px)`
            }}
            className="absolute"
          />
          <div
            style={{
              height: `${crosshair.thickness}px`,
              width: `${crosshair.size}px`,
              backgroundColor: crosshair.color,
              right: `calc(50% + ${crosshair.gap}px)`
            }}
            className="absolute"
          />
          <div
            style={{
              height: `${crosshair.thickness}px`,
              width: `${crosshair.size}px`,
              backgroundColor: crosshair.color,
              left: `calc(50% + ${crosshair.gap}px)`
            }}
            className="absolute"
          />

          {/* Ghost Guide Indicator: Shows inverted compensation vector */}
          {showGhostPath && isFiringRef.current && (
            <div
              style={{
                transform: `translate(${ghostOffset.x}px, ${ghostOffset.y}px)`
              }}
              className="absolute w-3 h-3 rounded-full border-2 border-volt-500 bg-volt-500/30 transition-transform duration-75 pointer-events-none animate-pulse"
              title="Kéo chuột theo chấm này để ghìm tâm chuẩn"
            />
          )}
        </div>

        {/* Top HUD Bar */}
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none">
          <div className="flex items-center gap-3 bg-[#111520]/90 backdrop-blur-md px-4 py-2 rounded-xl steam-border">
            <span className="text-xs font-bold text-white uppercase font-mono">
              {weapon === 'ak47' ? 'AK-47 / Vandal' : 'M4A1-S / Phantom'}
            </span>
            <span className="w-1 h-1 rounded-full bg-slate-500"></span>
            <span className="text-xs font-mono font-bold text-volt-500">
              Sens {sensitivity}
            </span>
            <span className="w-1 h-1 rounded-full bg-slate-500"></span>
            <span className="text-xs text-slate-300 font-medium">
              Cự ly bia: 14m
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Ammo Counter */}
            <div className="bg-[#111520]/90 backdrop-blur-md px-4 py-2 rounded-xl steam-border text-xs font-mono font-bold">
              Đạn: <span className={ammo <= 5 ? 'text-rose-400 font-black' : 'text-volt-500 font-black'}>{ammo}</span> / 30
            </div>

            <button
              onClick={clearTarget}
              className="pointer-events-auto px-3 py-2 rounded-xl bg-[#181d2a] hover:bg-[#22293a] text-slate-200 hover:text-white transition-colors steam-border flex items-center gap-1.5 text-xs font-semibold"
              title="Nạp đạn & Xóa bia (Phím R)"
            >
              <RotateCcw className="w-3.5 h-3.5 text-volt-500" />
              <span>Nạp đạn</span>
            </button>
          </div>
        </div>

        {/* Lock Overlay */}
        {!isLocked && (
          <div
            onClick={handleLock}
            className="absolute inset-0 bg-[#07090f]/80 backdrop-blur-sm flex flex-col items-center justify-center cursor-pointer transition-all hover:bg-[#07090f]/75"
          >
            <div className="w-14 h-14 rounded-2xl bg-volt-500/20 border border-volt-500 flex items-center justify-center mb-4 text-volt-500 shadow-volt-glow">
              <MousePointer className="w-6 h-6 animate-pulse" />
            </div>
            <h3 className="text-xl font-extrabold text-white mb-2">
              Nhấp chuột để bắt đầu thử ghìm tâm
            </h3>
            <p className="text-sm text-slate-200 max-w-md text-center mb-5 leading-relaxed">
              <strong className="text-volt-500">Giữ chuột trái</strong> để sấy cả băng đạn 30 viên liên tục. Vừa sấy vừa kéo chuột xuống để ghìm đạn chụm vào đầu/ngực bia ngắm.
            </p>
            <div className="px-6 py-2.5 bg-volt-500 hover:bg-volt-600 text-black font-extrabold rounded-xl shadow-volt-glow transition-all active:scale-95 text-xs uppercase tracking-wider">
              Bắt đầu sấy súng
            </div>
          </div>
        )}

        {/* Bottom Helper Controls */}
        <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-xs text-slate-300 pointer-events-none">
          <div className="flex items-center gap-4 pointer-events-auto">
            <label className="flex items-center gap-2 cursor-pointer bg-[#111520]/80 px-3 py-1.5 rounded-lg steam-border">
              <input
                type="checkbox"
                checked={showGhostPath}
                onChange={(e) => setShowGhostPath(e.target.checked)}
                className="accent-volt-500 rounded"
              />
              <span className="text-xs font-medium text-slate-200 flex items-center gap-1">
                <Eye className="w-3.5 h-3.5 text-volt-500" /> Vệt hỗ trợ ghìm tâm
              </span>
            </label>
          </div>
          <div className="font-mono text-slate-400">
            Giữ chuột trái để sấy • Phím R để nạp đạn • ESC để nhả chuột
          </div>
        </div>
      </div>

      {/* Real-time Spray Diagnostics Card */}
      {stats && (
        <div className="steam-panel rounded-2xl p-5 shadow-hero-card">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#232938] pb-4 mb-4">
            <div>
              <h4 className="text-base font-extrabold text-white flex items-center gap-2">
                <Crosshair className="w-5 h-5 text-volt-500" />
                Kết Quả Phân Tích Chùm Đạn
              </h4>
              <p className="text-xs text-slate-300 mt-0.5">
                Đánh giá mức độ phù hợp của Sens {sensitivity} với thói quen ghìm tay của bạn
              </p>
            </div>

            {/* Overall Rating Pill */}
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-xs text-slate-400">Độ chuẩn xác</div>
                <div className="text-xl font-extrabold font-mono text-volt-500">{stats.accuracy}%</div>
              </div>
              <div className="text-right border-l border-[#232938] pl-3">
                <div className="text-xs text-slate-400">Bán kính gom đạn</div>
                <div className="text-xl font-extrabold font-mono text-white">{stats.groupingRadiusCm} cm</div>
              </div>
            </div>
          </div>

          {/* Hit Breakdown Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4 text-xs font-mono">
            <div className="bg-[#181d2a] p-3 rounded-xl steam-border flex justify-between items-center">
              <span className="text-rose-400 font-bold">Vào Đầu:</span>
              <span className="text-white font-extrabold text-base">{stats.headHits} viên</span>
            </div>
            <div className="bg-[#181d2a] p-3 rounded-xl steam-border flex justify-between items-center">
              <span className="text-volt-500 font-bold">Vào Ngực:</span>
              <span className="text-white font-extrabold text-base">{stats.chestHits} viên</span>
            </div>
            <div className="bg-[#181d2a] p-3 rounded-xl steam-border flex justify-between items-center">
              <span className="text-blue-400 font-bold">Vào Bụng:</span>
              <span className="text-white font-extrabold text-base">{stats.bodyHits} viên</span>
            </div>
            <div className="bg-[#181d2a] p-3 rounded-xl steam-border flex justify-between items-center">
              <span className="text-slate-400 font-bold">Bắn Trượt:</span>
              <span className="text-white font-extrabold text-base">{stats.misses} viên</span>
            </div>
          </div>

          {/* Expert Coach Feedback */}
          <div className={`p-4 rounded-xl border flex items-start gap-3 ${
            stats.feedbackType === 'good'
              ? 'bg-emerald-950/30 border-emerald-500/50 text-emerald-300'
              : 'bg-amber-950/30 border-amber-500/50 text-amber-200'
          }`}>
            {stats.feedbackType === 'good' ? (
              <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            )}
            <div className="text-xs leading-relaxed font-medium">
              <strong className="block text-sm mb-1 text-white">Chẩn đoán cảm giác tay:</strong>
              {stats.feedback}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
