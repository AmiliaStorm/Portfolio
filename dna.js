import * as THREE from "three";

const container = document.getElementById("dna-canvas");

if (!container) {
  console.warn("DNA canvas container was not found.");
} else {
  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(
    35,
    container.clientWidth / container.clientHeight,
    0.1,
    100
  );

  camera.position.z = 14;

  const renderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: true
  });

  renderer.setPixelRatio(
    Math.min(window.devicePixelRatio, 2)
  );

  renderer.setClearColor(0x000000, 0);

  renderer.setSize(
    container.clientWidth,
    container.clientHeight
  );

  container.appendChild(renderer.domElement);

  const dnaGroup = new THREE.Group();
  scene.add(dnaGroup);
  const strandBlue = new THREE.MeshStandardMaterial({
    color: 0x2f83ff,
    emissive: 0x0b4da8,
    emissiveIntensity: 1.7,
    roughness: 0.25,
    metalness: 0.15
  });

  const strandCyan = new THREE.MeshStandardMaterial({
    color: 0x4be0e8,
    emissive: 0x086b78,
    emissiveIntensity: 1.5,
    roughness: 0.25,
    metalness: 0.12
  });

  const turns = 4.2;
  const pointCount = 140;
  const helixRadius = 1.6;
  const helixHeight = 10.5;

  const strandOnePoints = [];
  const strandTwoPoints = [];

  for (let i = 0; i < pointCount; i += 1) {
    const progress = i / (pointCount - 1);
    const angle = progress * Math.PI * 2 * turns;
    const y = progress * helixHeight - helixHeight / 2;

    strandOnePoints.push(
      new THREE.Vector3(
        Math.cos(angle) * helixRadius,
        y,
        Math.sin(angle) * helixRadius
      )
    );

    strandTwoPoints.push(
      new THREE.Vector3(
        Math.cos(angle + Math.PI) * helixRadius,
        y,
        Math.sin(angle + Math.PI) * helixRadius
      )
    );
  }

  const strandOneCurve = new THREE.CatmullRomCurve3(
    strandOnePoints
  );

  const strandTwoCurve = new THREE.CatmullRomCurve3(
    strandTwoPoints
  );

  const strandOneGeometry = new THREE.TubeGeometry(
    strandOneCurve,
    280,
    0.13,
    12,
    false
  );

  const strandTwoGeometry = new THREE.TubeGeometry(
    strandTwoCurve,
    280,
    0.13,
    12,
    false
  );

  const strandOne = new THREE.Mesh(
    strandOneGeometry,
    strandBlue
  );

  const strandTwo = new THREE.Mesh(
    strandTwoGeometry,
    strandCyan
  );

  dnaGroup.add(strandOne, strandTwo);
    const baseMaterial = new THREE.MeshStandardMaterial({
    color: 0x82d8ff,
    emissive: 0x1d5ea5,
    emissiveIntensity: 1.3,
    roughness: 0.3,
    metalness: 0.1
  });

  function createCylinder(start, end) {

    const direction = new THREE.Vector3()
      .subVectors(end, start);

    const length = direction.length();

    const geometry = new THREE.CylinderGeometry(
      0.05,
      0.05,
      length,
      10
    );

    const cylinder = new THREE.Mesh(
      geometry,
      baseMaterial
    );

    cylinder.position.copy(
      start.clone()
        .add(end)
        .multiplyScalar(0.5)
    );

    cylinder.quaternion.setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      direction.normalize()
    );

    return cylinder;
  }

  const rungCount = 36;

  for (let i = 0; i < rungCount; i++) {

    const t = i / (rungCount - 1);

    const angle =
      t * Math.PI * 2 * turns;

    const y =
      t * helixHeight - helixHeight / 2;

    const left = new THREE.Vector3(
      Math.cos(angle) * helixRadius,
      y,
      Math.sin(angle) * helixRadius
    );

    const right = new THREE.Vector3(
      Math.cos(angle + Math.PI) * helixRadius,
      y,
      Math.sin(angle + Math.PI) * helixRadius
    );

    dnaGroup.add(
      createCylinder(left, right)
    );
  }
    /*
   * Lighting
   */

  const ambientLight = new THREE.AmbientLight(
    0x9dc9ff,
    1.4
  );

  scene.add(ambientLight);

  const blueLight = new THREE.PointLight(
    0x2f83ff,
    25,
    35
  );

  blueLight.position.set(5, 2, 6);

  scene.add(blueLight);

  const cyanLight = new THREE.PointLight(
    0x4be0e8,
    18,
    35
  );

  cyanLight.position.set(-5, -2, 6);

  scene.add(cyanLight);

  /*
   * Floating particles
   */

  const particleCount = 250;

  const particleGeometry =
    new THREE.BufferGeometry();

  const particlePositions =
    new Float32Array(
      particleCount * 3
    );

  for (let i = 0; i < particleCount; i++) {

    particlePositions[i * 3] =
      (Math.random() - 0.5) * 12;

    particlePositions[i * 3 + 1] =
      (Math.random() - 0.5) * 14;

    particlePositions[i * 3 + 2] =
      (Math.random() - 0.5) * 8;
  }

  particleGeometry.setAttribute(
    "position",
    new THREE.BufferAttribute(
      particlePositions,
      3
    )
  );

  const particleMaterial =
    new THREE.PointsMaterial({

      color: 0x66bbff,

      size: 0.03,

      transparent: true,

      opacity: 0.55,

      depthWrite: false
    });

  const particles =
    new THREE.Points(
      particleGeometry,
      particleMaterial
    );

  scene.add(particles);
    let targetRotationX = 0;
  let targetRotationY = 0;

  container.addEventListener("mousemove", (event) => {
    const bounds = container.getBoundingClientRect();

    const mouseX =
      (event.clientX - bounds.left) / bounds.width - 0.5;

    const mouseY =
      (event.clientY - bounds.top) / bounds.height - 0.5;

    targetRotationY = mouseX * 0.45;
    targetRotationX = mouseY * 0.25;
  });

  container.addEventListener("mouseleave", () => {
    targetRotationX = 0;
    targetRotationY = 0;
  });

  function resizeRenderer() {
    const width = container.clientWidth;
    const height = container.clientHeight;

    if (width === 0 || height === 0) {
      return;
    }

    renderer.setSize(
      width,
      height,
      false
    );

    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }

  window.addEventListener(
    "resize",
    resizeRenderer
  );

  resizeRenderer();

  function animate(time) {
    const seconds = time * 0.001;

    dnaGroup.rotation.y += 0.004;

    dnaGroup.rotation.x +=
      (targetRotationX - dnaGroup.rotation.x) * 0.04;

    dnaGroup.rotation.z +=
      (targetRotationY - dnaGroup.rotation.z) * 0.04;

    dnaGroup.position.y =
      Math.sin(seconds * 0.8) * 0.12;

    particles.rotation.y =
      seconds * 0.025;

    particles.rotation.x =
      Math.sin(seconds * 0.15) * 0.08;

    renderer.render(
      scene,
      camera
    );

    requestAnimationFrame(animate);
  }

  requestAnimationFrame(animate);
}
