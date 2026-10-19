import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

export type DemoState = 'idle' | 'verifying' | 'verified' | 'duplicate_alert' | 'intake_warning';

interface Props {
  className?: string;
  externalState?: DemoState;
  onStateChange?: (state: DemoState) => void;
  compact?: boolean;
  interactiveControls?: boolean;
}

export const AcademicIdentityCard3D: React.FC<Props> = ({
  className = '',
  externalState,
  onStateChange,
  compact = false,
  interactiveControls = true,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
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

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let renderer: THREE.WebGLRenderer | null = null;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas: canvasRef.current || undefined,
        alpha: true,
        antialias: true,
        powerPreference: 'high-performance',
      });
    } catch {
      return;
    }

    const width = container.clientWidth || 600;
    const height = container.clientHeight || 560;
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 0, compact ? 8.5 : 7.8);

    // Lighting Rig
    const ambientLight = new THREE.AmbientLight(0x081024, 2.4);
    scene.add(ambientLight);

    const mainBlueLight = new THREE.DirectionalLight(0x2391FF, 3.2);
    mainBlueLight.position.set(4, 5, 6);
    scene.add(mainBlueLight);

    const rimCyanLight = new THREE.PointLight(0x00E5FF, 3.5, 25);
    rimCyanLight.position.set(-5, 2, 4);
    scene.add(rimCyanLight);

    const alertPinkLight = new THREE.PointLight(0xF70063, 2.8, 18);
    alertPinkLight.position.set(4.5, -3, 2.5);
    scene.add(alertPinkLight);

    const warningYellowLight = new THREE.PointLight(0xFFF83F, 2.0, 16);
    warningYellowLight.position.set(-4, -4, 2);
    scene.add(warningYellowLight);

    // Master Group
    const mainRig = new THREE.Group();
    scene.add(mainRig);

    // -------------------------------------------------------------
    // Canvas Card Texture Generator
    // -------------------------------------------------------------
    function createCardTexture(statusOverride?: { title: string; color: string; sub: string }) {
      const canvas = document.createElement('canvas');
      canvas.width = 1024;
      canvas.height = 640;
      const ctx = canvas.getContext('2d');
      if (!ctx) return new THREE.CanvasTexture(canvas);

      // Deep glass base
      const grad = ctx.createLinearGradient(0, 0, 1024, 640);
      grad.addColorStop(0, 'rgba(8, 20, 48, 0.94)');
      grad.addColorStop(0.5, 'rgba(12, 28, 64, 0.86)');
      grad.addColorStop(1, 'rgba(5, 12, 30, 0.96)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 1024, 640);

      // Microgrid
      ctx.strokeStyle = 'rgba(35, 145, 255, 0.12)';
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
      ctx.strokeStyle = statusOverride?.color || 'rgba(35, 145, 255, 0.75)';
      ctx.lineWidth = 4;
      ctx.strokeRect(24, 24, 976, 592);

      // Header Strip
      ctx.fillStyle = 'rgba(35, 145, 255, 0.16)';
      ctx.fillRect(24, 24, 976, 90);

      ctx.font = 'bold 26px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = '#2391FF';
      ctx.fillText('AICTE · VIDYA-VERIFY NATIONAL LEDGER', 60, 68);

      ctx.font = 'bold 16px "JetBrains Mono", monospace';
      ctx.fillStyle = '#FFF83F';
      ctx.fillText('SOVEREIGN APAAR ID: 9024-8172-5501-IN', 60, 96);

      // Security Pill Badge
      ctx.fillStyle = 'rgba(35, 145, 255, 0.3)';
      ctx.strokeStyle = statusOverride?.color || '#2391FF';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(740, 48, 220, 40, 20);
      ctx.fill();
      ctx.stroke();
      ctx.font = 'bold 14px "JetBrains Mono", monospace';
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText(statusOverride?.title || '● ZK-SNARK SEALED', 760, 74);

      // Gold Security Chip
      ctx.fillStyle = '#FFCD54';
      ctx.fillRect(60, 135, 80, 55);
      ctx.strokeStyle = '#B38B22';
      ctx.lineWidth = 2;
      ctx.strokeRect(60, 135, 80, 55);
      ctx.beginPath();
      ctx.moveTo(60, 162);
      ctx.lineTo(140, 162);
      ctx.stroke();

      // Student Silhouette Frame
      ctx.fillStyle = 'rgba(10, 22, 50, 0.9)';
      ctx.strokeStyle = 'rgba(35, 145, 255, 0.8)';
      ctx.lineWidth = 2.5;
      ctx.strokeRect(60, 205, 185, 215);
      ctx.fillRect(60, 205, 185, 215);

      // Silhouette Drawing
      ctx.fillStyle = 'rgba(35, 145, 255, 0.7)';
      ctx.beginPath();
      ctx.arc(152, 280, 40, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(152, 380, 70, 50, 0, Math.PI, 0);
      ctx.fill();

      // Avatar scanlines
      ctx.fillStyle = 'rgba(0, 229, 255, 0.18)';
      for (let y = 205; y < 420; y += 8) {
        ctx.fillRect(60, y, 185, 2);
      }

      // Academic Credential Meta Fields
      ctx.font = '14px "JetBrains Mono", monospace';
      ctx.fillStyle = 'rgba(166, 180, 204, 0.85)';
      ctx.fillText('STUDENT CANDIDATE IDENTITY', 275, 165);
      ctx.font = 'bold 24px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = '#F8FAFC';
      ctx.fillText('AARAV V. SURYAVANSHI (SYNTHETIC)', 275, 195);

      ctx.font = '14px "JetBrains Mono", monospace';
      ctx.fillStyle = 'rgba(166, 180, 204, 0.85)';
      ctx.fillText('AFFILIATED INSTITUTION & CAMPUS CODE', 275, 240);
      ctx.font = 'bold 19px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = '#A5C8FF';
      ctx.fillText('INDIAN INSTITUTE OF TECHNOLOGY, DELHI [IND-AICTE-1042]', 275, 268);

      ctx.font = '14px "JetBrains Mono", monospace';
      ctx.fillStyle = 'rgba(166, 180, 204, 0.85)';
      ctx.fillText('PROGRAMME & SPECIALIZATION', 275, 315);
      ctx.font = 'bold 18px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = '#DEE2F3';
      ctx.fillText('B.TECH IN COMPUTER SCIENCE & ARTIFICIAL INTELLIGENCE', 275, 340);

      ctx.font = '14px "JetBrains Mono", monospace';
      ctx.fillStyle = 'rgba(166, 180, 204, 0.85)';
      ctx.fillText('APPROVED SEAT QUOTA STATUS', 275, 385);
      ctx.font = 'bold 16px "JetBrains Mono", monospace';
      ctx.fillStyle = statusOverride?.color || '#FFCD54';
      ctx.fillText(statusOverride?.sub || 'REGULATORY CAP: 120/120 [VERIFIED NON-EXCEEDING]', 275, 410);

      // QR Matrix Pattern
      const qrX = 810;
      const qrY = 145;
      const qrSize = 145;
      ctx.fillStyle = 'rgba(8, 20, 45, 0.9)';
      ctx.fillRect(qrX, qrY, qrSize, qrSize);
      ctx.strokeStyle = '#2391FF';
      ctx.lineWidth = 2;
      ctx.strokeRect(qrX, qrY, qrSize, qrSize);

      ctx.fillStyle = statusOverride?.color || '#2391FF';
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
      ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
      ctx.fillRect(24, 520, 976, 96);
      ctx.font = '13px "JetBrains Mono", monospace';
      ctx.fillStyle = 'rgba(35, 145, 255, 0.85)';
      ctx.fillText('ECDSA HASH: 0x8F72B4...C09A11 · MERKLE ROOT: 0x99238E10...B28830', 60, 560);
      ctx.fillStyle = 'rgba(166, 180, 204, 0.8)';
      ctx.fillText('INTEGRITY STATUS: 0 MULTI-ENROLMENT COLLISIONS · SANDBOX MATCH 100%', 60, 586);

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
      opacity: 0.94,
      shininess: 90,
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
      opacity: 0.85,
    });
    const edgeLines = new THREE.LineSegments(edgeGeo, edgeMat);
    cardGroup.add(edgeLines);

    // Backplate Refraction Glass Slab
    const backSlabGeo = new THREE.BoxGeometry(cardWidth + 0.04, cardHeight + 0.04, cardDepth * 0.4);
    const backSlabMat = new THREE.MeshPhongMaterial({
      color: 0x050D1E,
      emissive: 0x0A1838,
      transparent: true,
      opacity: 0.5,
    });
    const backSlab = new THREE.Mesh(backSlabGeo, backSlabMat);
    backSlab.position.z = -0.06;
    cardGroup.add(backSlab);

    // 2. Physical 3D Verification Seal
    const sealGroup = new THREE.Group();
    sealGroup.position.set(1.4, -0.65, 0.06);
    cardGroup.add(sealGroup);

    const sealCylinder = new THREE.Mesh(
      new THREE.CylinderGeometry(0.38, 0.38, 0.05, 32),
      new THREE.MeshStandardMaterial({
        color: 0x0E2650,
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

    const laserGeo = new THREE.PlaneGeometry(cardWidth + 0.2, 0.05);
    const laserMat = new THREE.MeshBasicMaterial({
      color: 0x00E5FF,
      transparent: true,
      opacity: 0.9,
      side: THREE.DoubleSide,
    });
    const laserLine = new THREE.Mesh(laserGeo, laserMat);
    laserLine.position.z = 0.08;
    scanLaserGroup.add(laserLine);

    const beamGeo = new THREE.PlaneGeometry(cardWidth + 0.2, 0.4);
    const beamMat = new THREE.MeshBasicMaterial({
      color: 0x2391FF,
      transparent: true,
      opacity: 0.25,
      side: THREE.DoubleSide,
    });
    const beamMesh = new THREE.Mesh(beamGeo, beamMat);
    beamMesh.position.y = -0.2;
    beamMesh.position.z = 0.07;
    scanLaserGroup.add(beamMesh);

    // 4. Surrounding Translucent Student Record Tiles
    const tiles: Array<{
      group: THREE.Group;
      initial: { x: number; y: number; z: number; color: number; title: string; status: string };
      data: { color: number };
    }> = [];

    const tileData = [
      {
        title: 'APAAR #1088 · B.TECH',
        status: 'DUPLICATE CHECK: CLEAN',
        color: 0x2391FF,
        x: -3.2,
        y: 1.5,
        z: 0.4,
      },
      {
        title: 'APAAR #3391 · CONCURRENT',
        status: 'COLLISION DETECTED (DEL/MUM)',
        color: 0xF70063, // Vibrant Pink duplicate alert
        x: 3.2,
        y: 1.4,
        z: -0.2,
      },
      {
        title: 'APAAR #3391-B · CONCURRENT',
        status: 'DUPLICATE ENROLMENT 24-25',
        color: 0xF70063, // Vibrant Pink matching tile
        x: 3.5,
        y: -0.6,
        z: 0.6,
      },
      {
        title: 'INTAKE QUOTA EXCEEDED',
        status: 'AICTE SEATS OVERALLOCATED',
        color: 0xFFCD54, // Amber Gold intake discrepancy warning
        x: -3.0,
        y: -1.6,
        z: 0.3,
      },
    ];

    function createTileTexture(text1: string, text2: string, accentColorHex: string) {
      const c = document.createElement('canvas');
      c.width = 384;
      c.height = 160;
      const cx = c.getContext('2d');
      if (!cx) return new THREE.CanvasTexture(c);

      cx.fillStyle = 'rgba(7, 16, 38, 0.9)';
      cx.fillRect(0, 0, 384, 160);

      cx.strokeStyle = accentColorHex;
      cx.lineWidth = 3;
      cx.strokeRect(4, 4, 376, 152);

      cx.fillStyle = accentColorHex;
      cx.fillRect(4, 4, 8, 152);

      cx.font = 'bold 18px "Plus Jakarta Sans", sans-serif';
      cx.fillStyle = '#FFFFFF';
      cx.fillText(text1, 26, 48);

      cx.font = 'bold 14px "JetBrains Mono", monospace';
      cx.fillStyle = accentColorHex;
      cx.fillText(text2, 26, 85);

      cx.font = '12px "JetBrains Mono", monospace';
      cx.fillStyle = 'rgba(166, 180, 204, 0.8)';
      cx.fillText('TELEMETRY · INSTANT PROOF', 26, 120);

      const tex = new THREE.CanvasTexture(c);
      tex.needsUpdate = true;
      return tex;
    }

    const lineMatPink = new THREE.LineBasicMaterial({
      color: 0xF70063,
      transparent: true,
      opacity: 0.85,
    });
    const lineMatBlue = new THREE.LineBasicMaterial({
      color: 0x2391FF,
      transparent: true,
      opacity: 0.5,
    });
    const lineMatAmber = new THREE.LineBasicMaterial({
      color: 0xFFCD54,
      transparent: true,
      opacity: 0.7,
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
          opacity: 0.88,
          roughness: 0.3,
          metalness: 0.2,
        })
      );
      tg.add(tMesh);

      const tEdge = new THREE.LineSegments(
        new THREE.EdgesGeometry(new THREE.BoxGeometry(1.65, 0.75, 0.04)),
        new THREE.LineBasicMaterial({ color: d.color })
      );
      tg.add(tEdge);

      mainRig.add(tg);
      tiles.push({ group: tg, initial: { ...d }, data: d });
    });

    // Pink Collision Vector Line between Duplicate Tile 1 & Duplicate Tile 2
    const collisionPoints = [
      new THREE.Vector3(tileData[1].x, tileData[1].y, tileData[1].z),
      new THREE.Vector3(tileData[2].x, tileData[2].y, tileData[2].z),
    ];
    const collisionLineGeo = new THREE.BufferGeometry().setFromPoints(collisionPoints);
    const collisionLine = new THREE.Line(collisionLineGeo, lineMatPink);
    mainRig.add(collisionLine);

    // Connecting data lines from primary card to tiles
    const cardAnchor = new THREE.Vector3(0, 0, 0);
    tiles.forEach((t) => {
      const lineGeo = new THREE.BufferGeometry().setFromPoints([
        cardAnchor,
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
    });

    // Floating Particle Dust
    const particleCount = 140;
    const pGeo = new THREE.BufferGeometry();
    const pPos = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      pPos[i * 3] = (Math.random() - 0.5) * 10;
      pPos[i * 3 + 1] = (Math.random() - 0.5) * 7;
      pPos[i * 3 + 2] = (Math.random() - 0.5) * 4;
    }
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
    const pMat = new THREE.PointsMaterial({
      color: 0x00E5FF,
      size: 0.035,
      transparent: true,
      opacity: 0.65,
    });
    const particles = new THREE.Points(pGeo, pMat);
    mainRig.add(particles);

    // Mouse Parallax
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouseX = ((e.clientX - rect.left) / rect.width - 0.5) * 0.9;
      mouseY = ((e.clientY - rect.top) / rect.height - 0.5) * 0.9;
    };

    const handleMouseLeave = () => {
      mouseX = 0;
      mouseY = 0;
    };

    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mouseleave', handleMouseLeave);

    const onResize = () => {
      if (!container || !renderer) return;
      const w = container.clientWidth || 600;
      const h = container.clientHeight || 560;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    // Animation Loop
    let animationFrameId: number;
    const clock = new THREE.Clock();
    let currentTextureMode = 'idle';

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const time = clock.getElapsedTime();

      // Smooth mouse interpolation
      targetX += (mouseX - targetX) * 0.06;
      targetY += (mouseY - targetY) * 0.06;

      // Primary Card subtle idle float & rotation
      cardGroup.rotation.y = Math.sin(time * 0.8) * 0.14 + targetX * 0.7;
      cardGroup.rotation.x = Math.cos(time * 0.6) * 0.09 - targetY * 0.6;
      cardGroup.rotation.z = Math.sin(time * 0.5) * 0.03;
      cardGroup.position.y = Math.sin(time * 1.2) * 0.08;

      const st = stateRef.current;

      // Verification Scan Laser cyclic pass
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
            sub: 'DUPLICATE ENROLMENT FLAGGED: DEL/MUM CAMPUS',
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
        edgeMat.opacity = 0.85;

        const scanCycle = (time * 1.1) % 3.0;
        if (scanCycle < 2.0) {
          scanLaserGroup.visible = true;
          scanLaserGroup.position.y = 1.25 - (scanCycle / 2.0) * 2.5;
          laserMat.opacity = 0.85 + Math.sin(time * 20) * 0.15;
        } else {
          scanLaserGroup.visible = false;
        }

        if (currentTextureMode !== 'idle') {
          currentTextureMode = 'idle';
          frontMat.map = createCardTexture();
          frontMat.needsUpdate = true;
        }
      }

      // Verification Seal Pulsing & Spin
      sealRing.rotation.z = time * 1.5;
      sealCore.rotation.x = time * 2;
      sealCore.rotation.y = time * 2.5;
      const sealPulse = 0.4 + Math.sin(time * 4) * 0.25;
      sealCylinder.material.emissiveIntensity = 0.35 + sealPulse * 0.5;

      // Orbiting Student-Record Tiles Floating
      tiles.forEach((t, i) => {
        t.group.position.x = t.initial.x + Math.sin(time * 0.8 + i) * 0.08;
        t.group.position.y = t.initial.y + Math.cos(time * 1.1 + i) * 0.08;
        t.group.position.z = t.initial.z + Math.sin(time * 0.7 + i * 2) * 0.05;

        t.group.rotation.y = targetX * 0.3;
        t.group.rotation.x = -targetY * 0.3;
      });

      // Duplicate collision line pink blink
      lineMatPink.opacity = 0.5 + Math.sin(time * 6) * 0.4;

      // Background dust slow drift
      particles.rotation.y = time * 0.03;

      renderer?.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', onResize);
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mouseleave', handleMouseLeave);

      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh || obj instanceof THREE.LineSegments || obj instanceof THREE.Points) {
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
  }, [compact]);

  return (
    <div className={`relative flex flex-col items-center justify-center ${className}`}>
      {/* 3D Canvas Container */}
      <div
        ref={containerRef}
        className={`w-full ${
          compact ? 'h-[360px] md:h-[420px]' : 'h-[460px] md:h-[540px] lg:h-[580px]'
        } cursor-grab active:cursor-grabbing relative flex items-center justify-center`}
      >
        <canvas ref={canvasRef} className="w-full h-full block" />

        {/* Ambient Spectral Glow */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center -z-10">
          <div className="w-[300px] h-[300px] md:w-[440px] md:h-[440px] rounded-full bg-[#2391FF]/18 blur-[100px] pointer-events-none" />
          <div className="w-[200px] h-[200px] rounded-full bg-[#F70063]/10 blur-[120px] pointer-events-none" />
          <div className="w-[160px] h-[160px] rounded-full bg-[#FFF83F]/12 blur-[80px] pointer-events-none" />
        </div>

        {/* Telemetry Status Pill */}
        <div className="absolute top-3 right-3 pointer-events-none">
          <div className="glass-panel px-3 py-1 rounded-full border border-white/15 flex items-center gap-2 shadow-lg backdrop-blur-md">
            <span
              className={`w-2 h-2 rounded-full ${
                currentState === 'duplicate_alert'
                  ? 'bg-[#F70063] animate-ping'
                  : currentState === 'intake_warning'
                  ? 'bg-[#FFCD54] animate-pulse'
                  : currentState === 'verifying'
                  ? 'bg-[#2391FF] animate-spin'
                  : currentState === 'verified'
                  ? 'bg-[#FFF83F]'
                  : 'bg-[#2391FF]'
              }`}
            />
            <span className="text-[11px] font-mono-code uppercase tracking-wider text-slate-200">
              {currentState === 'idle' && 'Idle Float · 3D Parallax Active'}
              {currentState === 'verifying' && 'Realtime Laser Scan Active'}
              {currentState === 'verified' && 'Verified · Cryptographically Sealed'}
              {currentState === 'duplicate_alert' && 'Duplicate Collision Alert'}
              {currentState === 'intake_warning' && 'Intake Quota Exceeded Alert'}
            </span>
          </div>
        </div>
      </div>

      {/* Interactive Controls Switcher (When enabled) */}
      {interactiveControls && (
        <div className="w-full max-w-xl mx-auto px-2 mt-2 z-10">
          <div className="glass-panel p-2 rounded-2xl border border-white/10 flex flex-wrap items-center justify-between gap-2 shadow-xl backdrop-blur-xl">
            <div className="text-[11px] font-mono-code text-slate-400 px-2 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#2391FF]" />
              <span>3D Engine State:</span>
            </div>

            <div className="flex flex-wrap items-center gap-1">
              <button
                type="button"
                onClick={() => handleStateChange('idle')}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono-code transition-all ${
                  currentState === 'idle'
                    ? 'bg-white/15 text-white border border-white/20'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                Idle
              </button>
              <button
                type="button"
                onClick={() => handleStateChange('verifying')}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono-code transition-all ${
                  currentState === 'verifying'
                    ? 'bg-[#2391FF]/30 text-[#60A5FA] border border-[#2391FF]/60 shadow-[0_0_12px_rgba(35,145,255,0.4)]'
                    : 'text-slate-400 hover:text-[#60A5FA] hover:bg-[#2391FF]/10'
                }`}
              >
                Laser Scan
              </button>
              <button
                type="button"
                onClick={() => handleStateChange('duplicate_alert')}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono-code transition-all ${
                  currentState === 'duplicate_alert'
                    ? 'bg-[#F70063]/30 text-[#FF4D8D] border border-[#F70063]/60 shadow-[0_0_12px_rgba(247,0,99,0.4)]'
                    : 'text-slate-400 hover:text-[#FF4D8D] hover:bg-[#F70063]/10'
                }`}
              >
                Duplicate Collision
              </button>
              <button
                type="button"
                onClick={() => handleStateChange('intake_warning')}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono-code transition-all ${
                  currentState === 'intake_warning'
                    ? 'bg-[#FFCD54]/30 text-[#FFCD54] border border-[#FFCD54]/60 shadow-[0_0_12px_rgba(255,205,84,0.4)]'
                    : 'text-slate-400 hover:text-[#FFCD54] hover:bg-[#FFCD54]/10'
                }`}
              >
                Intake Warning
              </button>
              <button
                type="button"
                onClick={() => handleStateChange('verified')}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono-code transition-all ${
                  currentState === 'verified'
                    ? 'bg-[#FFF83F]/30 text-[#FFF83F] border border-[#FFF83F]/60 shadow-[0_0_12px_rgba(255,248,63,0.4)]'
                    : 'text-slate-400 hover:text-[#FFF83F] hover:bg-[#FFF83F]/10'
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
