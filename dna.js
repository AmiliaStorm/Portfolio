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
