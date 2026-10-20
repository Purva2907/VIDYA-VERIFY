import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { useTheme } from '../../context/ThemeContext';

export type DemoState = 'idle' | 'verifying' | 'verified' | 'duplicate_alert' | 'intake_warning';

interface Props {
  className?: string;
  fullScreen?: boolean;
  externalState?: DemoState;
  onStateChange?: (state: DemoState) => void;
  compact?: boolean;
  interactiveControls?: boolean;
}

export const AcademicIdentityCard3D: React.FC<Props> = ({
  className = '',
  fullScreen = false,
  externalState,
  onStateChange,
  compact = false,
  interactiveControls = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { theme } = useTheme();

  const [internalState, setInternalState] = useState<DemoState>('idle');
  const currentState = externalState !== undefined ? externalState : internalState;

  const handleStateChange = (nextState: DemoState) => {
    setInternalState(nextState);
    if (onStateChange) onStateChange(nextState);
  };

  const stateRef = useRef<DemoState>(currentState);
  useEffect(() => {
    stateRef.current = currentState;
  }, [currentState]);

  const themeRef = useRef<string>(theme);
  useEffect(() => {
    themeRef.current = theme;
  }, [theme]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Check prefers-reduced-motion
    const prefersReducedMotion =
      window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let renderer: THREE.WebGLRenderer | null = null;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas: canvasRef.current || undefined,
        alpha: true,
        antialias: true,
        powerPreference: 'high-performance',
      });
      renderer.setClearColor(0x000000, 0); // Full transparency to blend with page
    } catch {
      return;
    }

    const getDimensions = () => {
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || (fullScreen ? window.innerHeight : 560);
      return { w, h };
    };

    const { w: initialW, h: initialH } = getDimensions();
    renderer.setSize(initialW, initialH);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, initialW / initialH, 0.1, 1000);

    // Initial camera position
    camera.position.set(0, 0, fullScreen ? (initialW < 768 ? 9.8 : 7.8) : compact ? 8.5 : 7.8);

    // Dynamic Fog matching current theme (Pure Black in Dark Mode)
    const isDarkInitial = themeRef.current === 'dark';
    const fogColor = isDarkInitial ? 0x000000 : 0xF5F5F5;
    scene.fog = new THREE.FogExp2(fogColor, fullScreen ? 0.03 : 0.038);

    // Lighting Rig
    const ambientLight = new THREE.AmbientLight(
      isDarkInitial ? 0x181818 : 0xEAF0F8,
      isDarkInitial ? 2.5 : 2.8
    );
    scene.add(ambientLight);

    const mainBlueLight = new THREE.DirectionalLight(
      isDarkInitial ? 0x2391FF : 0x1A75D2,
      isDarkInitial ? 3.4 : 3.0
    );
    mainBlueLight.position.set(5, 6, 6);
    scene.add(mainBlueLight);

    const rimCyanLight = new THREE.PointLight(
      isDarkInitial ? 0x2391FF : 0x1A75D2,
      isDarkInitial ? 2.5 : 2.0,
      25
    );
    rimCyanLight.position.set(-6, 3, 4);
    scene.add(rimCyanLight);

    const alertPinkLight = new THREE.PointLight(0xF70063, 2.5, 18);
    alertPinkLight.position.set(5, -3, 3);
    scene.add(alertPinkLight);

    const warningYellowLight = new THREE.PointLight(0xFFF83F, 1.8, 16);
    warningYellowLight.position.set(-4, -4, 2.5);
    scene.add(warningYellowLight);

    // Master Rig
    const mainRig = new THREE.Group();
    scene.add(mainRig);

    // -------------------------------------------------------------
    // Canvas Card Texture Generator (Theme Aware: Dark & Light)
    // -------------------------------------------------------------
    function createCardTexture(statusOverride?: { title: string; color: string; sub: string }) {
      const isDark = themeRef.current === 'dark';
      const canvas = document.createElement('canvas');
      canvas.width = 1024;
      canvas.height = 640;
      const ctx = canvas.getContext('2d');
      if (!ctx) return new THREE.CanvasTexture(canvas);

      // Card Base Glass Gradient - Pure black tones
      const grad = ctx.createLinearGradient(0, 0, 1024, 640);
      if (isDark) {
        grad.addColorStop(0, 'rgba(12, 12, 12, 0.98)');
        grad.addColorStop(0.5, 'rgba(16, 16, 16, 0.94)');
        grad.addColorStop(1, 'rgba(5, 5, 5, 0.99)');
      } else {
        grad.addColorStop(0, 'rgba(255, 255, 255, 0.96)');
        grad.addColorStop(0.5, 'rgba(240, 246, 255, 0.92)');
        grad.addColorStop(1, 'rgba(228, 238, 252, 0.96)');
      }
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 1024, 640);

      // Microgrid
      ctx.strokeStyle = isDark ? 'rgba(35, 145, 255, 0.12)' : 'rgba(35, 145, 255, 0.08)';
      ctx.lineWidth = 1;
      for (let x = 0; x < 1024; x += 32) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, 640);
        ctx.stroke();
      }
      for (let y = 0; y < 640; y += 32) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(1024, y);
        ctx.stroke();
      }

      // Outer Border
      ctx.strokeStyle = statusOverride?.color || (isDark ? 'rgba(35, 145, 255, 0.75)' : 'rgba(35, 145, 255, 0.65)');
      ctx.lineWidth = 3.5;
      ctx.strokeRect(24, 24, 976, 592);

      // Header Strip
      ctx.fillStyle = isDark ? 'rgba(35, 145, 255, 0.16)' : 'rgba(35, 145, 255, 0.10)';
      ctx.fillRect(24, 24, 976, 90);

      ctx.font = 'bold 24px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = isDark ? '#2391FF' : '#1D4ED8';
      ctx.fillText('AICTE · VIDYA-VERIFY NATIONAL LEDGER', 60, 68);

      ctx.font = 'bold 15px "JetBrains Mono", monospace';
      ctx.fillStyle = isDark ? '#FFF83F' : '#0369A1';
      ctx.fillText('SOVEREIGN APAAR ID: 9024-8172-5501-IN', 60, 96);

      // Status Pill Badge
      ctx.fillStyle = isDark ? 'rgba(35, 145, 255, 0.25)' : 'rgba(35, 145, 255, 0.12)';
      ctx.strokeStyle = statusOverride?.color || (isDark ? '#2391FF' : '#1D4ED8');
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(730, 48, 230, 40, 20);
      ctx.fill();
      ctx.stroke();

      ctx.font = 'bold 13px "JetBrains Mono", monospace';
      ctx.fillStyle = isDark ? '#FFFFFF' : '#1E40AF';
      ctx.fillText(statusOverride?.title || '● VERIFIED LEDGER', 750, 73);

      // Gold Security Chip
      ctx.fillStyle = '#FFCD54';
      ctx.fillRect(60, 135, 76, 52);
      ctx.strokeStyle = '#B38B22';
      ctx.lineWidth = 2;
      ctx.strokeRect(60, 135, 76, 52);
      ctx.beginPath();
      ctx.moveTo(60, 161);
      ctx.lineTo(136, 161);
      ctx.stroke();

      // Student Silhouette Frame
      ctx.fillStyle = isDark ? 'rgba(10, 22, 50, 0.9)' : 'rgba(235, 242, 255, 0.95)';
      ctx.strokeStyle = isDark ? 'rgba(35, 145, 255, 0.7)' : 'rgba(35, 145, 255, 0.5)';
      ctx.lineWidth = 2;
      ctx.strokeRect(60, 205, 185, 215);
      ctx.fillRect(60, 205, 185, 215);

      // Silhouette Drawing
      ctx.fillStyle = isDark ? 'rgba(35, 145, 255, 0.7)' : 'rgba(35, 145, 255, 0.6)';
      ctx.beginPath();
      ctx.arc(152, 280, 40, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(152, 380, 70, 50, 0, Math.PI, 0);
      ctx.fill();

      // Avatar scanlines
      ctx.fillStyle = isDark ? 'rgba(0, 229, 255, 0.18)' : 'rgba(35, 145, 255, 0.12)';
      for (let y = 205; y < 420; y += 8) {
        ctx.fillRect(60, y, 185, 2);
      }

      // Metadata Labels & Values
      const textSecondary = isDark ? 'rgba(166, 180, 204, 0.85)' : '#64748B';
      const textPrimary = isDark ? '#F8FAFC' : '#0F172A';
      const textBlue = isDark ? '#A5C8FF' : '#1D4ED8';

      ctx.font = '13px "JetBrains Mono", monospace';
      ctx.fillStyle = textSecondary;
      ctx.fillText('STUDENT CANDIDATE IDENTITY', 275, 165);

      ctx.font = 'bold 23px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = textPrimary;
      ctx.fillText('AARAV V. SURYAVANSHI (SAMPLE DATA)', 275, 195);

      ctx.font = '13px "JetBrains Mono", monospace';
      ctx.fillStyle = textSecondary;
      ctx.fillText('AFFILIATED INSTITUTION & CAMPUS CODE', 275, 240);

      ctx.font = 'bold 18px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = textBlue;
      ctx.fillText('DELHI INSTITUTE OF TECHNOLOGY [IND-AICTE-1042]', 275, 268);

      ctx.font = '13px "JetBrains Mono", monospace';
      ctx.fillStyle = textSecondary;
      ctx.fillText('PROGRAMME & SPECIALIZATION', 275, 315);

      ctx.font = 'bold 17px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = textPrimary;
      ctx.fillText('B.TECH IN COMPUTER SCIENCE & ARTIFICIAL INTELLIGENCE', 275, 340);

      ctx.font = '13px "JetBrains Mono", monospace';
      ctx.fillStyle = textSecondary;
      ctx.fillText('APPROVED SEAT QUOTA STATUS', 275, 385);

      ctx.font = 'bold 15px "JetBrains Mono", monospace';
      ctx.fillStyle = statusOverride?.color || '#FFCD54';
      ctx.fillText(
        statusOverride?.sub || 'REGULATORY CAP: 120/120 [SANCTIONED QUOTA VERIFIED]',
        275,
        410
      );

      // QR Matrix Box
      const qrX = 810;
      const qrY = 145;
      const qrSize = 145;
      ctx.fillStyle = isDark ? 'rgba(8, 20, 45, 0.9)' : 'rgba(240, 246, 255, 0.95)';
      ctx.fillRect(qrX, qrY, qrSize, qrSize);
      ctx.strokeStyle = '#2391FF';
      ctx.lineWidth = 2;
      ctx.strokeRect(qrX, qrY, qrSize, qrSize);

      ctx.fillStyle = statusOverride?.color || (isDark ? '#2391FF' : '#1D4ED8');
      const qrGrid = 9;
      const dot = qrSize / qrGrid;
      for (let r = 0; r < qrGrid; r++) {
        for (let c = 0; c < qrGrid; c++) {
          if ((r < 3 && c < 3) || (r < 3 && c > 5) || (r > 5 && c < 3) || (r + c) % 2 === 0) {
            ctx.fillRect(qrX + c * dot + 2, qrY + r * dot + 2, dot - 4, dot - 4);
          }
        }
      }

      // Footer Hash Ledger Bar
      ctx.fillStyle = isDark ? 'rgba(0, 0, 0, 0.45)' : 'rgba(235, 242, 255, 0.7)';
      ctx.fillRect(24, 520, 976, 96);

      ctx.font = '12px "JetBrains Mono", monospace';
      ctx.fillStyle = isDark ? 'rgba(35, 145, 255, 0.9)' : '#1D4ED8';
      ctx.fillText('VERIFICATION RECEIPT: 0x8F72B4...C09A11 · MERKLE ROOT: 0x99238E10...B28830', 60, 560);
      ctx.fillStyle = isDark ? 'rgba(166, 180, 204, 0.85)' : '#475569';
      ctx.fillText('INTEGRITY STATUS: 0 MULTI-ENROLMENT COLLISIONS · SANDBOX MATCH VERIFIED', 60, 586);

      const tex = new THREE.CanvasTexture(canvas);
      tex.needsUpdate = true;
      tex.minFilter = THREE.LinearFilter;
      return tex;
    }

    // 1. Build Physical Holographic Glass Academic Identity Card
    const cardGroup = new THREE.Group();
    mainRig.add(cardGroup);

    const cardWidth = 4.2;
    const cardHeight = 2.65;
    const cardDepth = 0.08;

    const cardGeo = new THREE.BoxGeometry(cardWidth, cardHeight, cardDepth);
    const frontMat = new THREE.MeshPhongMaterial({
      map: createCardTexture(),
      transparent: true,
      opacity: isDarkInitial ? 0.94 : 0.96,
      shininess: isDarkInitial ? 90 : 60,
      specular: 0x2391FF,
      reflectivity: 0.85,
    });
    const cardMesh = new THREE.Mesh(cardGeo, frontMat);
    cardGroup.add(cardMesh);

    // Beveled Glow Edge
    const edgeGeo = new THREE.EdgesGeometry(cardGeo);
    const edgeMat = new THREE.LineBasicMaterial({
      color: 0x2391FF,
      linewidth: 2,
      transparent: true,
      opacity: isDarkInitial ? 0.85 : 0.7,
    });
    const edgeLines = new THREE.LineSegments(edgeGeo, edgeMat);
    cardGroup.add(edgeLines);

    // Backplate Refraction Glass Slab
    const backSlabGeo = new THREE.BoxGeometry(cardWidth + 0.04, cardHeight + 0.04, cardDepth * 0.4);
    const backSlabMat = new THREE.MeshPhongMaterial({
      color: isDarkInitial ? 0x050D1E : 0xDEE9F8,
      emissive: isDarkInitial ? 0x0A1838 : 0xC7D8F0,
      transparent: true,
      opacity: isDarkInitial ? 0.5 : 0.4,
    });
    const backSlab = new THREE.Mesh(backSlabGeo, backSlabMat);
    backSlab.position.z = -0.06;
    cardGroup.add(backSlab);

    // 2. Physical 3D Verification Seal
    const sealGroup = new THREE.Group();
    sealGroup.position.set(1.4, -0.65, 0.07);
    cardGroup.add(sealGroup);

    const sealCylinder = new THREE.Mesh(
      new THREE.CylinderGeometry(0.38, 0.38, 0.05, 32),
      new THREE.MeshStandardMaterial({
        color: isDarkInitial ? 0x0E2650 : 0x1E40AF,
        emissive: 0x2391FF,
        emissiveIntensity: 0.45,
        roughness: 0.2,
        metalness: 0.8,
      })
    );
    sealCylinder.rotation.x = Math.PI / 2;
    sealGroup.add(sealCylinder);

    const sealRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.42, 0.02, 16, 48),
      new THREE.MeshBasicMaterial({ color: 0x2391FF })
    );
    sealGroup.add(sealRing);

    const sealCore = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.2, 0),
      new THREE.MeshBasicMaterial({ color: 0xFFF83F, wireframe: true })
    );
    sealCore.position.z = 0.03;
    sealGroup.add(sealCore);

    // 3. Dynamic Luminous Verification Scan Laser Plane
    const scanLaserGroup = new THREE.Group();
    cardGroup.add(scanLaserGroup);

    const laserGeo = new THREE.PlaneGeometry(cardWidth + 0.2, 0.04);
    const laserMat = new THREE.MeshBasicMaterial({
      color: 0x00E5FF,
      transparent: true,
      opacity: 0.85,
      side: THREE.DoubleSide,
    });
    const laserLine = new THREE.Mesh(laserGeo, laserMat);
    laserLine.position.z = 0.08;
    scanLaserGroup.add(laserLine);

    const beamGeo = new THREE.PlaneGeometry(cardWidth + 0.2, 0.35);
    const beamMat = new THREE.MeshBasicMaterial({
      color: 0x2391FF,
      transparent: true,
      opacity: isDarkInitial ? 0.22 : 0.15,
      side: THREE.DoubleSide,
    });
    const beamMesh = new THREE.Mesh(beamGeo, beamMat);
    beamMesh.position.y = -0.18;
    beamMesh.position.z = 0.07;
    scanLaserGroup.add(beamMesh);

    // 4. Surrounding Translucent Student Record Satellite Tiles
    const tiles: Array<{
      group: THREE.Group;
      initial: { x: number; y: number; z: number; color: number; title: string; status: string };
      data: { color: number };
    }> = [];

    const tileData = [
      {
        title: 'APAAR #9024 · B.TECH CSE',
        status: 'DUPLICATE CHECK: CLEAN',
        color: 0x2391FF,
        x: -3.4,
        y: 1.4,
        z: 0.5,
      },
      {
        title: 'AICTE PERMANENT ID',
        status: 'CAMPUS VERIFIED: IND-1042',
        color: 0x2391FF,
        x: 3.5,
        y: 1.6,
        z: -0.4,
      },
      {
        title: 'CONCURRENT COLLISION CHECK',
        status: 'ZERO DUAL-ENROLMENT FOUND',
        color: 0xF70063, // Vibrant Pink brand color
        x: 3.7,
        y: -0.8,
        z: 0.7,
      },
      {
        title: 'SANCTIONED INTAKE: 120/120',
        status: 'AICTE QUOTA COMPLIANT',
        color: 0xFFCD54, // Amber Gold brand color
        x: -3.2,
        y: -1.5,
        z: 0.3,
      },
    ];

    function createTileTexture(text1: string, text2: string, accentColorHex: string) {
      const isDark = themeRef.current === 'dark';
      const c = document.createElement('canvas');
      c.width = 384;
      c.height = 160;
      const cx = c.getContext('2d');
      if (!cx) return new THREE.CanvasTexture(c);

      cx.fillStyle = isDark ? 'rgba(7, 16, 38, 0.92)' : 'rgba(255, 255, 255, 0.94)';
      cx.fillRect(0, 0, 384, 160);

      cx.strokeStyle = accentColorHex;
      cx.lineWidth = 2.5;
      cx.strokeRect(4, 4, 376, 152);

      cx.fillStyle = accentColorHex;
      cx.fillRect(4, 4, 8, 152);

      cx.font = 'bold 17px "Plus Jakarta Sans", sans-serif';
      cx.fillStyle = isDark ? '#FFFFFF' : '#0F172A';
      cx.fillText(text1, 26, 48);

      cx.font = 'bold 13px "JetBrains Mono", monospace';
      cx.fillStyle = accentColorHex;
      cx.fillText(text2, 26, 85);

      cx.font = '11px "JetBrains Mono", monospace';
      cx.fillStyle = isDark ? 'rgba(166, 180, 204, 0.8)' : '#64748B';
      cx.fillText('TELEMETRY · VERIFIED PROOF', 26, 120);

      const tex = new THREE.CanvasTexture(c);
      tex.needsUpdate = true;
      return tex;
    }

    const lineMatPink = new THREE.LineBasicMaterial({
      color: 0xF70063,
      transparent: true,
      opacity: 0.6,
    });
    const lineMatBlue = new THREE.LineBasicMaterial({
      color: 0x2391FF,
      transparent: true,
      opacity: 0.4,
    });
    const lineMatAmber = new THREE.LineBasicMaterial({
      color: 0xFFCD54,
      transparent: true,
      opacity: 0.5,
    });

    tileData.forEach((d) => {
      const tg = new THREE.Group();
      tg.position.set(d.x, d.y, d.z);

      const hexString = '#' + d.color.toString(16).padStart(6, '0');
      const tMesh = new THREE.Mesh(
        new THREE.BoxGeometry(1.65, 0.75, 0.04),
        new THREE.MeshStandardMaterial({
          map: createTileTexture(d.title, d.status, hexString),
          transparent: true,
          opacity: isDarkInitial ? 0.88 : 0.95,
          roughness: 0.3,
          metalness: 0.2,
        })
      );
      tg.add(tMesh);

      const tEdge = new THREE.LineSegments(
        new THREE.EdgesGeometry(new THREE.BoxGeometry(1.65, 0.75, 0.04)),
        new THREE.LineBasicMaterial({ color: d.color, transparent: true, opacity: 0.7 })
      );
      tg.add(tEdge);

      mainRig.add(tg);
      tiles.push({ group: tg, initial: { ...d }, data: d });
    });

    // Connecting data relationship lines from card to satellite tiles
    const connectionLines: Array<{ line: THREE.Line; tileIndex: number }> = [];
    tiles.forEach((t, idx) => {
      const lineGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(t.initial.x, t.initial.y, t.initial.z),
      ]);
      const mat =
        t.data.color === 0xF70063
          ? lineMatPink
          : t.data.color === 0xFFCD54
          ? lineMatAmber
          : lineMatBlue;
      const dataLine = new THREE.Line(lineGeo, mat);
      mainRig.add(dataLine);
      connectionLines.push({ line: dataLine, tileIndex: idx });
    });

    // 5. Floating Dust Particles with continuous drift velocities
    const particleCount = fullScreen ? 140 : 90;
    const pGeo = new THREE.BufferGeometry();
    const pPos = new Float32Array(particleCount * 3);
    const pVel = new Float32Array(particleCount);
    for (let i = 0; i < particleCount; i++) {
      pPos[i * 3] = (Math.random() - 0.5) * 16;
      pPos[i * 3 + 1] = (Math.random() - 0.5) * 10;
      pPos[i * 3 + 2] = (Math.random() - 0.5) * 7;
      pVel[i] = 0.2 + Math.random() * 0.35; // gentle upward drift
    }
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
    const pMat = new THREE.PointsMaterial({
      color: 0x2391FF,
      size: 0.038,
      transparent: true,
      opacity: isDarkInitial ? 0.65 : 0.4,
    });
    const particles = new THREE.Points(pGeo, pMat);
    mainRig.add(particles);

    // Dynamic base coordinate references for smooth viewport adaptation
    let baseCardPosX = 0;
    let baseCardPosY = 0;
    let baseCamY = 0;

    // Viewport layout positioning
    const updateLayout = () => {
      const { w, h } = getDimensions();
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer?.setSize(w, h);

      if (fullScreen) {
        if (w >= 1024) {
          // Desktop: Card floating right of center in open space
          baseCardPosX = 2.0;
          baseCardPosY = 0.0;
          cardGroup.scale.set(1.05, 1.05, 1.05);
          camera.position.set(0, 0, 7.8);
          baseCamY = 0;
        } else if (w >= 768) {
          // Tablet: Card centered-right
          baseCardPosX = 0.9;
          baseCardPosY = -0.3;
          cardGroup.scale.set(0.95, 0.95, 0.95);
          camera.position.set(0, 0, 8.6);
          baseCamY = 0;
        } else {
          // Mobile: Positioned lower, scaled to not crowd mobile hero text
          baseCardPosX = 0;
          baseCardPosY = -1.2;
          cardGroup.scale.set(0.8, 0.8, 0.8);
          camera.position.set(0, 0, 9.8);
          baseCamY = 0;
        }
      } else {
        baseCardPosX = 0;
        baseCardPosY = 0;
        cardGroup.scale.set(1, 1, 1);
        camera.position.set(0, 0, compact ? 8.5 : 7.8);
        baseCamY = 0;
      }
      cardGroup.position.set(baseCardPosX, baseCardPosY, 0);
    };

    updateLayout();
    window.addEventListener('resize', updateLayout);

    // Mouse Parallax
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      if (prefersReducedMotion) return;
      const w = window.innerWidth;
      const h = window.innerHeight;
      mouseX = (e.clientX / w - 0.5) * 1.5;
      mouseY = (e.clientY / h - 0.5) * 1.5;
    };

    window.addEventListener('mousemove', handleMouseMove);

    // Smooth scroll response
    let scrollY = 0;
    let targetScrollY = 0;
    const handleScroll = () => {
      if (prefersReducedMotion) return;
      targetScrollY = window.scrollY || 0;
    };
    window.addEventListener('scroll', handleScroll, { passive: true });

    // Animation Loop
    let animationFrameId: number;
    const clock = new THREE.Clock();
    let currentTextureMode = 'idle';
    let lastTheme = themeRef.current;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const delta = Math.min(clock.getDelta(), 0.08);
      const time = clock.getElapsedTime();

      // Check if theme changed dynamically
      const currentTheme = themeRef.current;
      if (currentTheme !== lastTheme) {
        lastTheme = currentTheme;
        const isDark = currentTheme === 'dark';

        // Update fog & lights
        if (scene.fog) {
          (scene.fog as THREE.FogExp2).color.setHex(isDark ? 0x000000 : 0xF5F5F5);
        }
        ambientLight.color.setHex(isDark ? 0x181818 : 0xEAF0F8);
        mainBlueLight.color.setHex(isDark ? 0x2391FF : 0x1A75D2);
        rimCyanLight.color.setHex(isDark ? 0x2391FF : 0x1A75D2);
        backSlabMat.color.setHex(isDark ? 0x0A0A0A : 0xDEE9F8);
        backSlabMat.emissive.setHex(isDark ? 0x050505 : 0xC7D8F0);
        sealCylinder.material.color.setHex(isDark ? 0x0E2650 : 0x1E40AF);
        pMat.opacity = isDark ? 0.65 : 0.4;

        currentTextureMode = '';
      }

      // Smooth mouse and scroll interpolation
      if (!prefersReducedMotion) {
        targetX += (mouseX - targetX) * 0.05;
        targetY += (mouseY - targetY) * 0.05;
        scrollY += (targetScrollY - scrollY) * 0.06;
        camera.position.y = baseCamY - scrollY * 0.001;
      }

      // Base card tilt angles
      const baseTiltY = fullScreen ? -0.32 : -0.15;
      const baseTiltX = fullScreen ? 0.12 : 0.08;
      const baseTiltZ = fullScreen ? -0.04 : 0;

      // 1. Primary Card Continuous Gentle Floating Movement
      if (!prefersReducedMotion) {
        cardGroup.rotation.y = baseTiltY + Math.sin(time * 0.6) * 0.08 + targetX * 0.35;
        cardGroup.rotation.x = baseTiltX + Math.cos(time * 0.5) * 0.06 - targetY * 0.25 - (scrollY * 0.0003);
        cardGroup.rotation.z = baseTiltZ + Math.sin(time * 0.45) * 0.035;

        cardGroup.position.y = baseCardPosY + Math.sin(time * 0.85) * 0.22;
        cardGroup.position.x = baseCardPosX + Math.cos(time * 0.65) * 0.08;
      } else {
        cardGroup.rotation.set(baseTiltX, baseTiltY, baseTiltZ);
        cardGroup.position.set(baseCardPosX, baseCardPosY, 0);
      }

      const st = stateRef.current;

      // Verification Scan Laser
      if (st === 'verifying') {
        const scanCycle = (time * 1.5) % 2.5;
        scanLaserGroup.visible = true;
        scanLaserGroup.position.y = 1.25 - (scanCycle / 2.5) * 2.5;
        laserMat.opacity = 0.85 + Math.sin(time * 20) * 0.15;

        if (currentTextureMode !== 'verifying') {
          currentTextureMode = 'verifying';
          frontMat.map = createCardTexture({
            title: 'VERIFYING CREDENTIALS...',
            color: '#2391FF',
            sub: 'SCANNING REGULATORY LEDGER HASHES...',
          });
          frontMat.needsUpdate = true;
        }
      } else if (st === 'duplicate_alert') {
        scanLaserGroup.visible = false;
        edgeMat.color.setHex(0xF70063);
        edgeMat.opacity = 0.7 + Math.sin(time * 8) * 0.3;

        if (currentTextureMode !== 'duplicate_alert') {
          currentTextureMode = 'duplicate_alert';
          frontMat.map = createCardTexture({
            title: 'ALERT: COLLISION DETECTED',
            color: '#F70063',
            sub: 'DUPLICATE ENROLMENT FLAGGED: MULTI-CAMPUS CONFLICT',
          });
          frontMat.needsUpdate = true;
        }
      } else if (st === 'intake_warning') {
        scanLaserGroup.visible = false;
        edgeMat.color.setHex(0xFFCD54);
        edgeMat.opacity = 0.8;

        if (currentTextureMode !== 'intake_warning') {
          currentTextureMode = 'intake_warning';
          frontMat.map = createCardTexture({
            title: 'WARNING: INTAKE EXCEEDED',
            color: '#FFCD54',
            sub: 'REGULATORY CAP EXCEEDED: 122/120 SEATS',
          });
          frontMat.needsUpdate = true;
        }
      } else if (st === 'verified') {
        scanLaserGroup.visible = false;
        edgeMat.color.setHex(0xFFF83F);
        edgeMat.opacity = 0.9;

        if (currentTextureMode !== 'verified') {
          currentTextureMode = 'verified';
          frontMat.map = createCardTexture({
            title: 'CRYPTOGRAPHICALLY VALID',
            color: '#FFF83F',
            sub: 'AICTE VERIFIED · ZERO DUPLICATE RECORD FOUND',
          });
          frontMat.needsUpdate = true;
        }
      } else {
        // Idle
        edgeMat.color.setHex(0x2391FF);
        edgeMat.opacity = themeRef.current === 'dark' ? 0.85 : 0.65;

        const scanCycle = (time * 1.1) % 4.0;
        if (scanCycle < 2.0) {
          scanLaserGroup.visible = true;
          scanLaserGroup.position.y = 1.25 - (scanCycle / 2.0) * 2.5;
          laserMat.opacity = 0.8 + Math.sin(time * 20) * 0.15;
        } else {
          scanLaserGroup.visible = false;
        }

        if (currentTextureMode !== 'idle') {
          currentTextureMode = 'idle';
          frontMat.map = createCardTexture();
          frontMat.needsUpdate = true;
        }
      }

      // 2. Verification Seal Slow Orbit and Spin
      if (!prefersReducedMotion) {
        sealRing.rotation.z = time * 0.45;
        sealCore.rotation.x = time * 0.7;
        sealCore.rotation.y = time * 0.9;
        const sealPulse = 0.4 + Math.sin(time * 2.8) * 0.25;
        sealCylinder.material.emissiveIntensity = 0.35 + sealPulse * 0.4;
      }

      // 3. Satellite Record Tiles Independent Rotation & 3D Depth Movement
      tiles.forEach((t, i) => {
        if (!prefersReducedMotion) {
          t.group.position.x = t.initial.x + Math.sin(time * 0.7 + i * 1.3) * 0.16;
          t.group.position.y = t.initial.y + Math.cos(time * 0.85 + i * 1.1) * 0.18;
          t.group.position.z = t.initial.z + Math.sin(time * 0.6 + i * 2.1) * 0.28;

          t.group.rotation.y = targetX * 0.25 + Math.sin(time * 0.55 + i) * 0.1;
          t.group.rotation.x = -targetY * 0.22 + Math.cos(time * 0.5 + i) * 0.08;
          t.group.rotation.z = Math.sin(time * 0.4 + i) * 0.05;
        }

        // 4. Update dynamic connection lines tethered to card
        const conn = connectionLines[i];
        if (conn) {
          const positions = conn.line.geometry.attributes.position;
          if (positions) {
            positions.setXYZ(0, cardGroup.position.x * 0.4, cardGroup.position.y * 0.4, 0);
            positions.setXYZ(1, t.group.position.x, t.group.position.y, t.group.position.z);
            positions.needsUpdate = true;
          }
        }
      });

      // 5. Small restrained particles continuous vertical drift
      if (!prefersReducedMotion) {
        const positions = pGeo.attributes.position.array as Float32Array;
        for (let i = 0; i < particleCount; i++) {
          positions[i * 3 + 1] += pVel[i] * delta * 0.9;
          if (positions[i * 3 + 1] > 5.0) {
            positions[i * 3 + 1] = -5.0;
          }
        }
        pGeo.attributes.position.needsUpdate = true;
        particles.rotation.y = time * 0.03;
      }

      renderer?.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', updateLayout);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('scroll', handleScroll);

      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh || obj instanceof THREE.LineSegments || obj instanceof THREE.Points || obj instanceof THREE.Line) {
          obj.geometry.dispose();
          if (Array.isArray(obj.material)) {
            obj.material.forEach((m) => m.dispose());
          } else if (obj.material) {
            obj.material.dispose();
          }
        }
      });

      renderer?.dispose();
    };
  }, [compact, fullScreen]);

  return (
    <div
      ref={containerRef}
      className={
        fullScreen
          ? `w-full h-full overflow-hidden ${className}`
          : `relative flex flex-col items-center justify-center ${className}`
      }
    >
      <canvas
        ref={canvasRef}
        className={
          fullScreen
            ? 'w-full h-full block pointer-events-none'
            : `w-full ${
                compact ? 'h-[360px] md:h-[420px]' : 'h-[460px] md:h-[540px]'
              } block`
        }
      />

      {/* Interactive Controls (only when explicitly requested and not in fullScreen hero) */}
      {!fullScreen && interactiveControls && (
        <div className="w-full max-w-xl mx-auto px-2 mt-2 z-10">
          <div className="app-card p-2 flex flex-wrap items-center justify-between gap-2 shadow-lg">
            <div className="text-[11px] font-mono-code text-[var(--color-text-secondary)] px-2 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-brand-blue)]" />
              <span>3D Engine State:</span>
            </div>

            <div className="flex flex-wrap items-center gap-1">
              <button
                type="button"
                onClick={() => handleStateChange('idle')}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono-code transition-all ${
                  currentState === 'idle'
                    ? 'bg-[var(--color-brand-blue)] text-white'
                    : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)]'
                }`}
              >
                Idle
              </button>
              <button
                type="button"
                onClick={() => handleStateChange('verifying')}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono-code transition-all ${
                  currentState === 'verifying'
                    ? 'bg-[#2391FF]/25 text-[#2391FF] border border-[#2391FF]/50'
                    : 'text-[var(--color-text-secondary)] hover:text-[#2391FF]'
                }`}
              >
                Laser Scan
              </button>
              <button
                type="button"
                onClick={() => handleStateChange('duplicate_alert')}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono-code transition-all ${
                  currentState === 'duplicate_alert'
                    ? 'bg-[#F70063]/25 text-[#F70063] border border-[#F70063]/50'
                    : 'text-[var(--color-text-secondary)] hover:text-[#F70063]'
                }`}
              >
                Collision
              </button>
              <button
                type="button"
                onClick={() => handleStateChange('verified')}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono-code transition-all ${
                  currentState === 'verified'
                    ? 'bg-[#FFF83F]/25 text-[#D97706] dark:text-[#FFF83F] border border-[#FFF83F]/50'
                    : 'text-[var(--color-text-secondary)] hover:text-[#D97706]'
                }`}
              >
                Verified
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
