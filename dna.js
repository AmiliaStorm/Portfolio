import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js";

console.log("new dna.js loaded");

const container = document.getElementById("dna-canvas");

if (!container) {
  console.warn("DNA canvas container was not found.");
} else {
  /* ==================================================
     Scene / Camera / Renderer
     ================================================== */

  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(
    34,
    container.clientWidth / container.clientHeight,
    0.1,
    100
  );

  camera.position.set(0, 0, 14);

  const renderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: true,
  });

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;

  container.innerHTML = "";
  container.appendChild(renderer.domElement);

  /* ==================================================
     Master group
     ================================================== */

  const visualGroup = new THREE.Group();
  visualGroup.position.x = -0.5;
  scene.add(visualGroup);

  const dnaGroup = new THREE.Group();
  visualGroup.add(dnaGroup);

  const mrnaGroup = new THREE.Group();
  visualGroup.add(mrnaGroup);

  /* ==================================================
     Materials
     ================================================== */

  const strandBlue = new THREE.MeshStandardMaterial({
    color: 0x2f83ff,
    emissive: 0x1d67ff,
    emissiveIntensity: 1.25,
    roughness: 0.34,
    metalness: 0.14,
  });

  const strandCyan = new THREE.MeshStandardMaterial({
    color: 0x4be0e8,
    emissive: 0x1bbfd1,
    emissiveIntensity: 1.15,
    roughness: 0.3,
    metalness: 0.12,
  });

  const rungMaterial = new THREE.MeshStandardMaterial({
    color: 0x8fd4ff,
    emissive: 0x2d82df,
    emissiveIntensity: 1.0,
    roughness: 0.38,
    metalness: 0.08,
  });

  const nodeBlueMaterial = new THREE.MeshStandardMaterial({
    color: 0x72adff,
    emissive: 0x2f83ff,
    emissiveIntensity: 1.2,
    roughness: 0.26,
    metalness: 0.08,
  });

  const nodeCyanMaterial = new THREE.MeshStandardMaterial({
    color: 0x7df5ff,
    emissive: 0x2de0e8,
    emissiveIntensity: 1.1,
    roughness: 0.22,
    metalness: 0.08,
  });

  const mrnaMaterial = new THREE.MeshStandardMaterial({
    color: 0x4be0e8,
    emissive: 0x26d7dd,
    emissiveIntensity: 1.4,
    roughness: 0.2,
    metalness: 0.08,
  });

  /* ==================================================
     Glow texture helper
     ================================================== */

  function createGlowTexture() {
    const size = 128;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;

    const ctx = canvas.getContext("2d");

    const gradient = ctx.createRadialGradient(
      size / 2,
      size / 2,
      0,
      size / 2,
      size / 2,
      size / 2
    );

    gradient.addColorStop(0, "rgba(255,255,255,1)");
    gradient.addColorStop(0.2, "rgba(120,235,255,0.9)");
    gradient.addColorStop(0.45, "rgba(75,224,232,0.45)");
    gradient.addColorStop(1, "rgba(75,224,232,0)");

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;

    return texture;
  }

  const glowTexture = createGlowTexture();

  function createGlowSprite(color, scale = 1) {
    const material = new THREE.SpriteMaterial({
      map: glowTexture,
      color,
      transparent: true,
      opacity: 0.95,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    const sprite = new THREE.Sprite(material);
    sprite.scale.setScalar(scale);
    return sprite;
  }

  /* ==================================================
     DNA shape
     ================================================== */

  const turns = 4.5;
  const pointCount = 180;
  const helixRadius = 1.65;
  const helixHeight = 10.8;

  function helixPoint(t, phase = 0) {
    const angle = t * Math.PI * 2 * turns + phase;
    const y = t * helixHeight - helixHeight / 2;

    return new THREE.Vector3(
      Math.cos(angle) * helixRadius,
      y,
      Math.sin(angle) * helixRadius * 0.95
    );
  }

  const strandOnePoints = [];
  const strandTwoPoints = [];

  for (let i = 0; i < pointCount; i += 1) {
    const t = i / (pointCount - 1);
    strandOnePoints.push(helixPoint(t, 0));
    strandTwoPoints.push(helixPoint(t, Math.PI));
  }

  const strandOneCurve = new THREE.CatmullRomCurve3(strandOnePoints);
  const strandTwoCurve = new THREE.CatmullRomCurve3(strandTwoPoints);

  const strandOneGeometry = new THREE.TubeGeometry(
    strandOneCurve,
    300,
    0.105,
    16,
    false
  );

  const strandTwoGeometry = new THREE.TubeGeometry(
    strandTwoCurve,
    300,
    0.105,
    16,
    false
  );

  const strandOne = new THREE.Mesh(strandOneGeometry, strandBlue);
  const strandTwo = new THREE.Mesh(strandTwoGeometry, strandCyan);

  dnaGroup.add(strandOne, strandTwo);

  /* ==================================================
     DNA strand nodes for more detail
     ================================================== */

  const nodeGeometry = new THREE.SphereGeometry(0.06, 14, 14);

  for (let i = 0; i < strandOnePoints.length; i += 4) {
    const blueNode = new THREE.Mesh(nodeGeometry, nodeBlueMaterial);
    blueNode.position.copy(strandOnePoints[i]);
    dnaGroup.add(blueNode);

    const cyanNode = new THREE.Mesh(nodeGeometry, nodeCyanMaterial);
    cyanNode.position.copy(strandTwoPoints[i]);
    dnaGroup.add(cyanNode);
  }

  /* ==================================================
     DNA rungs / base pairs
     ================================================== */

  function createCylinder(start, end, radius = 0.038) {
    const direction = new THREE.Vector3().subVectors(end, start);
    const length = direction.length();

    const geometry = new THREE.CylinderGeometry(
      radius,
      radius,
      length,
      10
    );

    const cylinder = new THREE.Mesh(geometry, rungMaterial);

    cylinder.position.copy(
      start.clone().add(end).multiplyScalar(0.5)
    );

    cylinder.quaternion.setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      direction.normalize()
    );

    return cylinder;
  }

  const rungCount = 42;

  for (let i = 0; i < rungCount; i += 1) {
    const t = i / (rungCount - 1);

    const left = helixPoint(t, 0);
    const right = helixPoint(t, Math.PI);

    const rung = createCylinder(left, right, 0.036);

    rung.material = rungMaterial;
    dnaGroup.add(rung);
  }

  /* ==================================================
     Transcription hotspot
     ================================================== */

  const transcriptionT = 0.54;
  const leftHot = helixPoint(transcriptionT, 0);
  const rightHot = helixPoint(transcriptionT, Math.PI);
  const hotspotPosition = leftHot
    .clone()
    .add(rightHot)
    .multiplyScalar(0.5);

  const hotspotGroup = new THREE.Group();
  hotspotGroup.position.copy(hotspotPosition);
  visualGroup.add(hotspotGroup);

  const hotspotCore = new THREE.Mesh(
    new THREE.SphereGeometry(0.12, 18, 18),
    new THREE.MeshBasicMaterial({
      color: 0x89f8ff,
      transparent: true,
      opacity: 0.95,
    })
  );

  const hotspotGlow = createGlowSprite(0x4be0e8, 2.3);
  const hotspotGlowOuter = createGlowSprite(0x2f83ff, 3.8);

  hotspotGroup.add(hotspotGlowOuter, hotspotGlow, hotspotCore);

  /* ==================================================
     mRNA strand
     ================================================== */

  const mrnaSequence = "AUGCUUACGAAUGCC";

  const mrnaPoints = [
    hotspotPosition.clone(),
    hotspotPosition.clone().add(new THREE.Vector3(0.45, 0.15, 0.15)),
    hotspotPosition.clone().add(new THREE.Vector3(1.0, 0.4, 0.0)),
    hotspotPosition.clone().add(new THREE.Vector3(1.8, 0.1, -0.2)),
    hotspotPosition.clone().add(new THREE.Vector3(2.7, 0.45, 0.08)),
    hotspotPosition.clone().add(new THREE.Vector3(3.5, 0.15, 0.18)),
    hotspotPosition.clone().add(new THREE.Vector3(4.2, 0.3, 0.05)),
    hotspotPosition.clone().add(new THREE.Vector3(4.8, 0.55, 0.0)),
  ];

  const mrnaCurve = new THREE.CatmullRomCurve3(mrnaPoints);

  const mrnaGeometry = new THREE.TubeGeometry(
    mrnaCurve,
    180,
    0.055,
    12,
    false
  );

  const mrnaTube = new THREE.Mesh(mrnaGeometry, mrnaMaterial);
  mrnaGroup.add(mrnaTube);

  const mrnaGlow = createGlowSprite(0x4be0e8, 1.2);
  mrnaGlow.position.copy(hotspotPosition.clone().add(new THREE.Vector3(0.2, 0.05, 0)));
  mrnaGroup.add(mrnaGlow);

  /* ==================================================
     mRNA nucleotide beads
     ================================================== */

  function nucleotideColor(letter) {
    if (letter === "A") return 0x65f0a8;
    if (letter === "U") return 0xb47cff;
    if (letter === "G") return 0xffc43d;
    if (letter === "C") return 0x4db8ff;
    return 0xffffff;
  }

  const nucleotideGeometry = new THREE.SphereGeometry(0.043, 12, 12);

  for (let i = 0; i < mrnaSequence.length; i += 1) {
    const t = i / (mrnaSequence.length - 1);
    const point = mrnaCurve.getPointAt(t);

    const bead = new THREE.Mesh(
      nucleotideGeometry,
      new THREE.MeshStandardMaterial({
        color: nucleotideColor(mrnaSequence[i]),
        emissive: nucleotideColor(mrnaSequence[i]),
        emissiveIntensity: 0.9,
        roughness: 0.24,
        metalness: 0.06,
      })
    );

    bead.position.copy(point);

    const normalOffset = Math.sin(i * 0.8) * 0.09;
    bead.position.y += normalOffset;
    bead.position.z += Math.cos(i * 0.55) * 0.06;

    mrnaGroup.add(bead);
  }

  /* ==================================================
     Background particles
     ================================================== */

  const particleCount = 350;
  const particleGeometry = new THREE.BufferGeometry();
  const particlePositions = new Float32Array(particleCount * 3);

  for (let i = 0; i < particleCount; i += 1) {
    particlePositions[i * 3] = (Math.random() - 0.5) * 14;
    particlePositions[i * 3 + 1] = (Math.random() - 0.5) * 16;
    particlePositions[i * 3 + 2] = (Math.random() - 0.5) * 8;
  }

  particleGeometry.setAttribute(
    "position",
    new THREE.BufferAttribute(particlePositions, 3)
  );

  const particles = new THREE.Points(
    particleGeometry,
    new THREE.PointsMaterial({
      color: 0x66bbff,
      size: 0.035,
      transparent: true,
      opacity: 0.5,
      depthWrite: false,
    })
  );

  scene.add(particles);

  /* ==================================================
     Tiny data-glow clusters
     ================================================== */

  const dataDots = new THREE.Group();
  visualGroup.add(dataDots);

  function addDotCluster(x, y, z, cols, rows, spacing, color) {
    const material = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.8,
    });

    const geometry = new THREE.PlaneGeometry(0.045, 0.045);

    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < cols; col += 1) {
        if (Math.random() > 0.55) continue;

        const dot = new THREE.Mesh(geometry, material);
        dot.position.set(
          x + col * spacing,
          y - row * spacing,
          z
        );

        dataDots.add(dot);
      }
    }
  }

  addDotCluster(1.8, 1.9, -1.8, 8, 4, 0.12, 0x2f83ff);
  addDotCluster(1.5, -1.1, -1.6, 7, 4, 0.11, 0x4be0e8);
  addDotCluster(-2.2, -0.2, -1.4, 6, 4, 0.1, 0x2f83ff);
  addDotCluster(2.2, -2.2, -1.5, 8, 3, 0.1, 0x4be0e8);

  /* ==================================================
     Lighting
     ================================================== */

  const ambientLight = new THREE.AmbientLight(0x9ecbff, 1.15);
  scene.add(ambientLight);

  const blueLight = new THREE.PointLight(0x2f83ff, 28, 40);
  blueLight.position.set(4.8, 2.8, 5.5);
  scene.add(blueLight);

  const cyanLight = new THREE.PointLight(0x4be0e8, 22, 38);
  cyanLight.position.set(-4.4, -2.4, 5.2);
  scene.add(cyanLight);

  const fillLight = new THREE.DirectionalLight(0xd7ecff, 1.1);
  fillLight.position.set(0, 2, 6);
  scene.add(fillLight);

  /* ==================================================
     Mouse interaction
     ================================================== */

  let targetRotationX = 0;
  let targetRotationY = 0;

  container.addEventListener("mousemove", (event) => {
    const bounds = container.getBoundingClientRect();

    const mouseX =
      (event.clientX - bounds.left) / bounds.width - 0.5;

    const mouseY =
      (event.clientY - bounds.top) / bounds.height - 0.5;

    targetRotationY = mouseX * 0.18;
    targetRotationX = mouseY * 0.1;
  });

  container.addEventListener("mouseleave", () => {
    targetRotationX = 0;
    targetRotationY = 0;
  });

  /* ==================================================
     Resize
     ================================================== */

  function resizeRenderer() {
    const width = container.clientWidth;
    const height = container.clientHeight;

    if (!width || !height) return;

    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }

  window.addEventListener("resize", resizeRenderer);
  resizeRenderer();

  /* ==================================================
     Animation
     ================================================== */

  function animate(time) {
    const seconds = time * 0.001;

    dnaGroup.rotation.y += 0.0026;

    visualGroup.rotation.x +=
      (targetRotationX - visualGroup.rotation.x) * 0.03;

    visualGroup.rotation.z +=
      (targetRotationY - visualGroup.rotation.z) * 0.03;

    visualGroup.position.y = Math.sin(seconds * 0.65) * 0.08;

    hotspotGlow.scale.setScalar(2.15 + Math.sin(seconds * 2.8) * 0.18);
    hotspotGlowOuter.scale.setScalar(3.5 + Math.sin(seconds * 2.8) * 0.25);
    hotspotCore.scale.setScalar(1 + Math.sin(seconds * 3.1) * 0.06);

    mrnaGroup.position.y = Math.sin(seconds * 1.25) * 0.03;

    particles.rotation.y = seconds * 0.018;
    particles.rotation.x = Math.sin(seconds * 0.14) * 0.05;

    dataDots.children.forEach((dot, index) => {
      dot.material.opacity =
        0.28 + (Math.sin(seconds * 2.2 + index * 0.45) + 1) * 0.25;
    });

    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }

  requestAnimationFrame(animate);
}
