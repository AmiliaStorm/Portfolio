import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js";

console.log("dna.js loaded successfully");

const container = document.getElementById("dna-canvas");

if (!container) {
  console.warn("DNA canvas container was not found.");
} else {
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

  renderer.setPixelRatio(
    Math.min(window.devicePixelRatio, 2)
  );

  renderer.setSize(
    container.clientWidth,
    container.clientHeight
  );

  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.88;

  container.innerHTML = "";
  container.appendChild(renderer.domElement);

  const visualGroup = new THREE.Group();
  visualGroup.position.x = -0.5;
  scene.add(visualGroup);

  const dnaGroup = new THREE.Group();
  visualGroup.add(dnaGroup);

  const mrnaGroup = new THREE.Group();
  visualGroup.add(mrnaGroup);

  const strandBlue = new THREE.MeshStandardMaterial({
    color: 0x2f83ff,
    emissive: 0x0b4fa8,
    emissiveIntensity: 1.1,
    roughness: 0.34,
    metalness: 0.14,
  });

  const strandCyan = new THREE.MeshStandardMaterial({
    color: 0x32cadd,
    emissive: 0x087f98,
    emissiveIntensity: 0.95,
    roughness: 0.32,
    metalness: 0.1,
  });

  const rungMaterial = new THREE.MeshStandardMaterial({
    color: 0x69aeea,
    emissive: 0x123f72,
    emissiveIntensity: 0.75,
    roughness: 0.4,
    metalness: 0.06,
  });

  const nodeBlueMaterial = new THREE.MeshStandardMaterial({
    color: 0x68a7ff,
    emissive: 0x1756b8,
    emissiveIntensity: 0.85,
    roughness: 0.3,
    metalness: 0.06,
  });

  const nodeCyanMaterial = new THREE.MeshStandardMaterial({
    color: 0x52dbe5,
    emissive: 0x087f98,
    emissiveIntensity: 0.8,
    roughness: 0.28,
    metalness: 0.06,
  });

  const mrnaMaterial = new THREE.MeshStandardMaterial({
    color: 0x26cfe0,
    emissive: 0x087f98,
    emissiveIntensity: 1.0,
    roughness: 0.32,
    metalness: 0.05,
  });

  function createGlowTexture() {
    const size = 128;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;

    const context = canvas.getContext("2d");

    const gradient = context.createRadialGradient(
      size / 2,
      size / 2,
      0,
      size / 2,
      size / 2,
      size / 2
    );

    gradient.addColorStop(0, "rgba(255,255,255,1)");
    gradient.addColorStop(0.2, "rgba(120,235,255,0.8)");
    gradient.addColorStop(0.45, "rgba(75,224,232,0.35)");
    gradient.addColorStop(1, "rgba(75,224,232,0)");

    context.fillStyle = gradient;
    context.fillRect(0, 0, size, size);

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
      opacity: 0.75,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    const sprite = new THREE.Sprite(material);
    sprite.scale.setScalar(scale);

    return sprite;
  }

  const turns = 4.5;
  const pointCount = 180;
  const helixRadius = 1.65;
  const helixHeight = 10.8;

  function helixPoint(t, phase = 0) {
    const angle =
      t * Math.PI * 2 * turns + phase;

    const y =
      t * helixHeight - helixHeight / 2;

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

    strandOnePoints.push(
      helixPoint(t, 0)
    );

    strandTwoPoints.push(
      helixPoint(t, Math.PI)
    );
  }

  const strandOneCurve =
    new THREE.CatmullRomCurve3(
      strandOnePoints
    );

  const strandTwoCurve =
    new THREE.CatmullRomCurve3(
      strandTwoPoints
    );

  const strandOneGeometry =
    new THREE.TubeGeometry(
      strandOneCurve,
      300,
      0.105,
      16,
      false
    );

  const strandTwoGeometry =
    new THREE.TubeGeometry(
      strandTwoCurve,
      300,
      0.105,
      16,
      false
    );

  const strandOne =
    new THREE.Mesh(
      strandOneGeometry,
      strandBlue
    );

  const strandTwo =
    new THREE.Mesh(
      strandTwoGeometry,
      strandCyan
    );

  dnaGroup.add(
    strandOne,
    strandTwo
  );

  const nodeGeometry =
    new THREE.SphereGeometry(
      0.055,
      12,
      12
    );

  for (
    let i = 0;
    i < strandOnePoints.length;
    i += 4
  ) {
    const blueNode =
      new THREE.Mesh(
        nodeGeometry,
        nodeBlueMaterial
      );

    blueNode.position.copy(
      strandOnePoints[i]
    );

    dnaGroup.add(blueNode);

    const cyanNode =
      new THREE.Mesh(
        nodeGeometry,
        nodeCyanMaterial
      );

    cyanNode.position.copy(
      strandTwoPoints[i]
    );

    dnaGroup.add(cyanNode);
  }

  function createCylinder(
    start,
    end,
    radius = 0.038
  ) {
    const direction =
      new THREE.Vector3()
        .subVectors(end, start);

    const length =
      direction.length();

    const geometry =
      new THREE.CylinderGeometry(
        radius,
        radius,
        length,
        10
      );

    const cylinder =
      new THREE.Mesh(
        geometry,
        rungMaterial
      );

    cylinder.position.copy(
      start
        .clone()
        .add(end)
        .multiplyScalar(0.5)
    );

    cylinder.quaternion
      .setFromUnitVectors(
        new THREE.Vector3(0, 1, 0),
        direction.normalize()
      );

    return cylinder;
  }

  const rungCount = 42;

  for (
    let i = 0;
    i < rungCount;
    i += 1
  ) {
    const t =
      i / (rungCount - 1);

    const left =
      helixPoint(t, 0);

    const right =
      helixPoint(
        t,
        Math.PI
      );

    const rung =
      createCylinder(
        left,
        right,
        0.036
      );

    dnaGroup.add(rung);
  }

  const transcriptionT = 0.54;

  const leftHot =
    helixPoint(
      transcriptionT,
      0
    );

  const rightHot =
    helixPoint(
      transcriptionT,
      Math.PI
    );

  const hotspotPosition =
    leftHot
      .clone()
      .add(rightHot)
      .multiplyScalar(0.5);

  const hotspotGroup =
    new THREE.Group();

  hotspotGroup.position.copy(
    hotspotPosition
  );

  visualGroup.add(
    hotspotGroup
  );

  const hotspotCore =
    new THREE.Mesh(
      new THREE.SphereGeometry(
        0.08,
        18,
        18
      ),
      new THREE.MeshBasicMaterial({
        color: 0x89f8ff,
        transparent: true,
        opacity: 0.75,
      })
    );

  const hotspotGlow =
    createGlowSprite(
      0x4be0e8,
      1.5
    );

  const hotspotGlowOuter =
    createGlowSprite(
      0x2f83ff,
      2.4
    );

  hotspotGroup.add(
    hotspotGlowOuter,
    hotspotGlow,
    hotspotCore
  );

  const mrnaSequence =
    "AUGCUUACGAAUGCC";

  const mrnaPoints = [
    hotspotPosition.clone(),

    hotspotPosition
      .clone()
      .add(
        new THREE.Vector3(
          0.45,
          0.12,
          0.12
        )
      ),

    hotspotPosition
      .clone()
      .add(
        new THREE.Vector3(
          0.95,
          0.32,
          0.02
        )
      ),

    hotspotPosition
      .clone()
      .add(
        new THREE.Vector3(
          1.55,
          0.12,
          -0.12
        )
      ),

    hotspotPosition
      .clone()
      .add(
        new THREE.Vector3(
          2.15,
          -0.08,
          -0.16
        )
      ),

    hotspotPosition
      .clone()
      .add(
        new THREE.Vector3(
          2.75,
          0.20,
          -0.05
        )
      ),

    hotspotPosition
      .clone()
      .add(
        new THREE.Vector3(
          3.35,
          0.35,
          0.08
        )
      ),

    hotspotPosition
      .clone()
      .add(
        new THREE.Vector3(
          3.95,
          0.10,
          0.12
        )
      ),

    hotspotPosition
      .clone()
      .add(
        new THREE.Vector3(
          5.15,
          0.20,
          0.02
        )
      ),
  ];

  const mrnaCurve =
    new THREE.CatmullRomCurve3(
      mrnaPoints
    );

  const mrnaGeometry =
    new THREE.TubeGeometry(
      mrnaCurve,
      180,
      0.032,
      12,
      false
    );

  const mrnaTube =
    new THREE.Mesh(
      mrnaGeometry,
      mrnaMaterial
    );

  mrnaGroup.add(
    mrnaTube
  );

  /* ==================================================
   mRNA READ HEAD
   ================================================== */

const readHead = new THREE.Mesh(
  new THREE.SphereGeometry(
    0.075,
    18,
    18
  ),
  new THREE.MeshBasicMaterial({
    color: 0xb8fbff,
  })
);

const readHeadGlow =
  createGlowSprite(
    0x4be0e8,
    0.75
  );

mrnaGroup.add(
  readHead,
  readHeadGlow
);

  function nucleotideColor(letter) {
    switch (letter) {
      case "A":
        return 0x65f0a8;

      case "U":
        return 0xb47cff;

      case "G":
        return 0xffc43d;

      case "C":
        return 0x4db8ff;

      default:
        return 0xffffff;
    }
  }

  const nucleotideGeometry =
    new THREE.SphereGeometry(
      0.04,
      12,
      12
    );

  for (
    let i = 0;
    i < mrnaSequence.length;
    i += 1
  ) {
    const t =
      i /
      (mrnaSequence.length - 1);

    const point =
      mrnaCurve.getPointAt(t);

    const baseColor =
      nucleotideColor(
        mrnaSequence[i]
      );

    const beadMaterial =
      new THREE.MeshStandardMaterial({
        color: baseColor,
        emissive: baseColor,
        emissiveIntensity: 0.55,
        roughness: 0.3,
        metalness: 0.04,
      });

    const bead =
      new THREE.Mesh(
        nucleotideGeometry,
        beadMaterial
      );

    bead.position.copy(point);

    bead.position.y +=
      Math.sin(i * 0.8) *
      0.075;

    bead.position.z +=
      Math.cos(i * 0.55) *
      0.045;

    mrnaGroup.add(bead);
  }

  const particleCount = 320;
  const particleGeometry =
    new THREE.BufferGeometry();

  const particlePositions =
    new Float32Array(
      particleCount * 3
    );

  for (
    let i = 0;
    i < particleCount;
    i += 1
  ) {
    particlePositions[
      i * 3
    ] =
      (Math.random() - 0.5) *
      14;

    particlePositions[
      i * 3 + 1
    ] =
      (Math.random() - 0.5) *
      16;

    particlePositions[
      i * 3 + 2
    ] =
      (Math.random() - 0.5) *
      8;
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
      color: 0x4f9be8,
      size: 0.03,
      transparent: true,
      opacity: 0.4,
      depthWrite: false,
    });

  const particles =
    new THREE.Points(
      particleGeometry,
      particleMaterial
    );

  scene.add(particles);

  const dataDots =
    new THREE.Group();

  visualGroup.add(dataDots);

  function addDotCluster(
    x,
    y,
    z,
    columns,
    rows,
    spacing,
    color
  ) {
    const material =
      new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.55,
      });

    const geometry =
      new THREE.PlaneGeometry(
        0.04,
        0.04
      );

    for (
      let row = 0;
      row < rows;
      row += 1
    ) {
      for (
        let column = 0;
        column < columns;
        column += 1
      ) {
        if (
          Math.random() >
          0.55
        ) {
          continue;
        }

        const dot =
          new THREE.Mesh(
            geometry,
            material.clone()
          );

        dot.position.set(
          x +
            column *
              spacing,
          y -
            row *
              spacing,
          z
        );

        dataDots.add(dot);
      }
    }
  }

  addDotCluster(
    1.8,
    1.9,
    -1.8,
    8,
    4,
    0.12,
    0x2f83ff
  );

  addDotCluster(
    1.5,
    -1.1,
    -1.6,
    7,
    4,
    0.11,
    0x4be0e8
  );

  addDotCluster(
    -2.2,
    -0.2,
    -1.4,
    6,
    4,
    0.1,
    0x2f83ff
  );

  addDotCluster(
    2.2,
    -2.2,
    -1.5,
    8,
    3,
    0.1,
    0x4be0e8
  );

  const ambientLight =
    new THREE.AmbientLight(
      0x6fa7e0,
      0.72
    );

  scene.add(
    ambientLight
  );

  const blueLight =
    new THREE.PointLight(
      0x2f83ff,
      15,
      40
    );

  blueLight.position.set(
    4.8,
    2.8,
    5.5
  );

  scene.add(
    blueLight
  );

  const cyanLight =
    new THREE.PointLight(
      0x4be0e8,
      11,
      38
    );

  cyanLight.position.set(
    -4.4,
    -2.4,
    5.2
  );

  scene.add(
    cyanLight
  );

  const fillLight =
    new THREE.DirectionalLight(
      0x7faee0,
      0.45
    );

  fillLight.position.set(
    0,
    2,
    6
  );

  scene.add(
    fillLight
  );

  let targetRotationX = 0;
  let targetRotationY = 0;

  container.addEventListener(
    "mousemove",
    (event) => {
      const bounds =
        container.getBoundingClientRect();

      const mouseX =
        (
          event.clientX -
          bounds.left
        ) /
        bounds.width -
        0.5;

      const mouseY =
        (
          event.clientY -
          bounds.top
        ) /
        bounds.height -
        0.5;

      targetRotationY =
        mouseX * 0.18;

      targetRotationX =
        mouseY * 0.1;
    }
  );

  container.addEventListener(
    "mouseleave",
    () => {
      targetRotationX = 0;
      targetRotationY = 0;
    }
  );

  function resizeRenderer() {
    const width =
      container.clientWidth;

    const height =
      container.clientHeight;

    if (
      width === 0 ||
      height === 0
    ) {
      return;
    }

    renderer.setSize(
      width,
      height,
      false
    );

    camera.aspect =
      width / height;

    camera.updateProjectionMatrix();
  }

  window.addEventListener(
    "resize",
    resizeRenderer
  );

  resizeRenderer();

  function animate(time) {
    const seconds =
      time * 0.001;

    dnaGroup.rotation.y +=
      0.0025;

    visualGroup.rotation.x +=
      (
        targetRotationX -
        visualGroup.rotation.x
      ) *
      0.03;

    visualGroup.rotation.z +=
      (
        targetRotationY -
        visualGroup.rotation.z
      ) *
      0.03;

    visualGroup.position.y =
      Math.sin(
        seconds * 0.65
      ) *
      0.07;

    hotspotGlow.scale.setScalar(
      1.45 +
      Math.sin(
        seconds * 2.8
      ) *
      0.10
    );

    hotspotGlowOuter.scale.setScalar(
      2.25 +
      Math.sin(
        seconds * 2.8
      ) *
      0.14
    );

    hotspotCore.scale.setScalar(
      1 +
      Math.sin(
        seconds * 3.1
      ) *
      0.05
    );

    mrnaGroup.position.y =
      Math.sin(
        seconds * 1.25
      ) *
      0.025;

    particles.rotation.y =
      seconds * 0.018;

    particles.rotation.x =
      Math.sin(
        seconds * 0.14
      ) *
      0.05;

    dataDots.children.forEach(
      (dot, index) => {
        dot.material.opacity =
          0.2 +
          (
            Math.sin(
              seconds * 2.2 +
              index * 0.45
            ) +
            1
          ) *
          0.17;
      }
    );

    renderer.render(
      scene,
      camera
    );

    requestAnimationFrame(
      animate
    );
  }

  requestAnimationFrame(
    animate
  );
}
