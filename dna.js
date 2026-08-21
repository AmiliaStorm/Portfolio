import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js";

console.log("dna.js loaded successfully");

const container = document.getElementById("dna-canvas");

if (!container) {
  console.warn("DNA canvas container was not found.");
} else {
  /* =========================================================
     SCENE
     ========================================================= */

  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(
    32,
    container.clientWidth / container.clientHeight,
    0.1,
    100
  );

  camera.position.set(0, 0, 17.2);

  const renderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: true,
    powerPreference: "high-performance",
  });

  renderer.setPixelRatio(
    Math.min(window.devicePixelRatio, 2)
  );

  renderer.setSize(
    container.clientWidth,
    container.clientHeight
  );

  renderer.setClearColor(0x000000, 0);

  renderer.outputColorSpace =
    THREE.SRGBColorSpace;

  renderer.toneMapping =
    THREE.ACESFilmicToneMapping;

  renderer.toneMappingExposure = 1.05;

  renderer.domElement.setAttribute(
    "aria-hidden",
    "true"
  );

  container.innerHTML = "";
  container.appendChild(renderer.domElement);


  /* =========================================================
     MASTER GROUP
     ========================================================= */

  const visualGroup = new THREE.Group();

  visualGroup.position.set(
    -0.42,
    0,
    0
  );

  scene.add(visualGroup);


  const molecularGroup =
    new THREE.Group();

  visualGroup.add(molecularGroup);


  const dnaGroup =
    new THREE.Group();

  molecularGroup.add(dnaGroup);


  const mrnaGroup =
    new THREE.Group();

  molecularGroup.add(mrnaGroup);


  /* =========================================================
     MATERIALS
     ========================================================= */

  const strandBlue =
    new THREE.MeshStandardMaterial({
      color: 0x126bea,
      emissive: 0x083a9e,
      emissiveIntensity: 1.65,
      roughness: 0.28,
      metalness: 0.14,
    });


  const strandCyan =
    new THREE.MeshStandardMaterial({
      color: 0x13bad4,
      emissive: 0x056e91,
      emissiveIntensity: 1.5,
      roughness: 0.26,
      metalness: 0.12,
    });


  const blueBeadMaterial =
    new THREE.MeshStandardMaterial({
      color: 0x247fff,
      emissive: 0x0b46b5,
      emissiveIntensity: 1.25,
      roughness: 0.32,
      metalness: 0.08,
    });


  const cyanBeadMaterial =
    new THREE.MeshStandardMaterial({
      color: 0x25d1df,
      emissive: 0x06798f,
      emissiveIntensity: 1.18,
      roughness: 0.3,
      metalness: 0.07,
    });


  const blueGlowMaterial =
    new THREE.MeshBasicMaterial({
      color: 0x237cff,
      transparent: true,
      opacity: 0.07,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });


  const cyanGlowMaterial =
    new THREE.MeshBasicMaterial({
      color: 0x35e8ff,
      transparent: true,
      opacity: 0.065,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });


  const mrnaMaterial =
    new THREE.MeshStandardMaterial({
      color: 0x38d9e8,
      emissive: 0x0b829a,
      emissiveIntensity: 1.7,
      roughness: 0.24,
      metalness: 0.05,
    });


  const mrnaGlowMaterial =
    new THREE.MeshBasicMaterial({
      color: 0x41ecff,
      transparent: true,
      opacity: 0.12,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });


  /* =========================================================
     DNA BASE MATERIALS
     ========================================================= */

  const baseMaterials = {
    A: new THREE.MeshStandardMaterial({
      color: 0x64efad,
      emissive: 0x16744d,
      emissiveIntensity: 0.8,
      roughness: 0.3,
    }),

    T: new THREE.MeshStandardMaterial({
      color: 0xb48cff,
      emissive: 0x53389c,
      emissiveIntensity: 0.72,
      roughness: 0.3,
    }),

    G: new THREE.MeshStandardMaterial({
      color: 0xffc65c,
      emissive: 0x93600c,
      emissiveIntensity: 0.68,
      roughness: 0.32,
    }),

    C: new THREE.MeshStandardMaterial({
      color: 0x5ebcff,
      emissive: 0x145e9a,
      emissiveIntensity: 0.84,
      roughness: 0.3,
    }),
  };


  const bondMaterial =
    new THREE.MeshStandardMaterial({
      color: 0xb5e7ff,
      emissive: 0x2b7bad,
      emissiveIntensity: 0.8,
      roughness: 0.3,
    });


  /* =========================================================
     GLOW TEXTURE
     ========================================================= */

  function createGlowTexture() {
    const size = 256;

    const canvas =
      document.createElement("canvas");

    canvas.width = size;
    canvas.height = size;

    const context =
      canvas.getContext("2d");


    const gradient =
      context.createRadialGradient(
        size / 2,
        size / 2,
        0,

        size / 2,
        size / 2,
        size / 2
      );


    gradient.addColorStop(
      0,
      "rgba(255,255,255,1)"
    );

    gradient.addColorStop(
      0.12,
      "rgba(160,250,255,0.95)"
    );

    gradient.addColorStop(
      0.28,
      "rgba(55,230,255,0.55)"
    );

    gradient.addColorStop(
      0.58,
      "rgba(25,135,255,0.16)"
    );

    gradient.addColorStop(
      1,
      "rgba(20,100,255,0)"
    );


    context.fillStyle = gradient;

    context.fillRect(
      0,
      0,
      size,
      size
    );


    const texture =
      new THREE.CanvasTexture(canvas);

    texture.needsUpdate = true;

    return texture;
  }


  const glowTexture =
    createGlowTexture();


  function createGlowSprite(
    color,
    scale = 1,
    opacity = 0.7
  ) {
    const material =
      new THREE.SpriteMaterial({
        map: glowTexture,
        color,
        transparent: true,
        opacity,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });


    const sprite =
      new THREE.Sprite(material);

    sprite.scale.setScalar(scale);

    return sprite;
  }


  /* =========================================================
     DNA GEOMETRY
     ========================================================= */

  const turns = 4.25;

  const pointCount = 280;

  const helixRadius = 1.48;

  const helixHeight = 10.4;

  const transcriptionT = 0.53;


  /*
     Creates a smooth opening in the DNA
     around the transcription site.
  */

  function transcriptionBubble(t) {
    const distance =
      (t - transcriptionT) / 0.075;

    return Math.exp(
      -(distance * distance)
    );
  }


  function helixPoint(
    t,
    phase = 0
  ) {
    const angle =
      t *
        Math.PI *
        2 *
        turns +
      phase;


    const y =
      t * helixHeight -
      helixHeight / 2;


    /*
       Strand separation around
       the transcription bubble.
    */

    const opening =
      transcriptionBubble(t) *
      0.58;


    const radius =
      helixRadius +
      opening;


    return new THREE.Vector3(
      Math.cos(angle) * radius,

      y,

      Math.sin(angle) *
        radius *
        0.92
    );
  }


  /* =========================================================
     BUILD STRAND CURVES
     ========================================================= */

  const strandOnePoints = [];
  const strandTwoPoints = [];


  for (
    let i = 0;
    i < pointCount;
    i += 1
  ) {
    const t =
      i / (pointCount - 1);


    strandOnePoints.push(
      helixPoint(t, 0)
    );


    strandTwoPoints.push(
      helixPoint(
        t,
        Math.PI
      )
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


  /* =========================================================
     INNER BACKBONE TUBES

     These provide continuity underneath the
     molecular beads.
     ========================================================= */

  function createBackboneTube(
    curve,
    material
  ) {
    const geometry =
      new THREE.TubeGeometry(
        curve,
        440,
        0.075,
        14,
        false
      );


    return new THREE.Mesh(
      geometry,
      material
    );
  }


  const strandOne =
    createBackboneTube(
      strandOneCurve,
      strandBlue
    );


  const strandTwo =
    createBackboneTube(
      strandTwoCurve,
      strandCyan
    );


  dnaGroup.add(
    strandOne,
    strandTwo
  );


  /* =========================================================
     BACKBONE GLOW
     ========================================================= */

  function createGlowTube(
    curve,
    material
  ) {
    const geometry =
      new THREE.TubeGeometry(
        curve,
        350,
        0.16,
        12,
        false
      );


    return new THREE.Mesh(
      geometry,
      material
    );
  }


  dnaGroup.add(
    createGlowTube(
      strandOneCurve,
      blueGlowMaterial
    ),

    createGlowTube(
      strandTwoCurve,
      cyanGlowMaterial
    )
  );


  /* =========================================================
     MOLECULAR BACKBONE BEADS

     This is the main change that makes the DNA
     look like a molecular structure rather than
     two smooth neon cables.
     ========================================================= */

  const largeBeadGeometry =
    new THREE.SphereGeometry(
      0.115,
      14,
      14
    );


  const smallBeadGeometry =
    new THREE.SphereGeometry(
      0.082,
      12,
      12
    );


  function createBackboneBeads(
    curve,
    material
  ) {
    const beadCount = 210;


    const largeCount =
      Math.ceil(beadCount / 2);


    const smallCount =
      Math.floor(beadCount / 2);


    const largeBeads =
      new THREE.InstancedMesh(
        largeBeadGeometry,
        material,
        largeCount
      );


    const smallBeads =
      new THREE.InstancedMesh(
        smallBeadGeometry,
        material,
        smallCount
      );


    const dummy =
      new THREE.Object3D();


    let largeIndex = 0;
    let smallIndex = 0;


    for (
      let i = 0;
      i < beadCount;
      i += 1
    ) {
      const t =
        i / (beadCount - 1);


      const position =
        curve.getPointAt(t);


      dummy.position.copy(
        position
      );


      /*
         Slight irregularity gives the surface
         a more organic / molecular look.
      */

      const randomScale =
        0.88 +
        Math.random() *
          0.24;


      dummy.scale.setScalar(
        randomScale
      );


      dummy.rotation.set(
        Math.random() * 0.4,
        Math.random() * 0.4,
        Math.random() * 0.4
      );


      dummy.updateMatrix();


      if (i % 2 === 0) {
        largeBeads.setMatrixAt(
          largeIndex,
          dummy.matrix
        );

        largeIndex += 1;
      } else {
        smallBeads.setMatrixAt(
          smallIndex,
          dummy.matrix
        );

        smallIndex += 1;
      }
    }


    largeBeads.instanceMatrix.needsUpdate =
      true;

    smallBeads.instanceMatrix.needsUpdate =
      true;


    dnaGroup.add(
      largeBeads,
      smallBeads
    );
  }


  createBackboneBeads(
    strandOneCurve,
    blueBeadMaterial
  );


  createBackboneBeads(
    strandTwoCurve,
    cyanBeadMaterial
  );


  /* =========================================================
     CYLINDER BETWEEN TWO POINTS
     ========================================================= */

  function createCylinder(
    start,
    end,
    material,
    radius = 0.04
  ) {
    const direction =
      new THREE.Vector3()
        .subVectors(
          end,
          start
        );


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
        material
      );


    cylinder.position.copy(
      start
        .clone()
        .add(end)
        .multiplyScalar(0.5)
    );


    cylinder.quaternion
      .setFromUnitVectors(
        new THREE.Vector3(
          0,
          1,
          0
        ),

        direction.normalize()
      );


    return cylinder;
  }


  /* =========================================================
     DNA BASE PAIRS
     ========================================================= */

  const pairOptions = [
    ["A", "T"],
    ["G", "C"],
    ["T", "A"],
    ["C", "G"],
  ];


  const rungCount = 48;


  for (
    let i = 0;
    i < rungCount;
    i += 1
  ) {
    const t =
      (i + 0.5) /
      rungCount;


    const left =
      helixPoint(t, 0);


    const right =
      helixPoint(
        t,
        Math.PI
      );


    const midpoint =
      left
        .clone()
        .add(right)
        .multiplyScalar(0.5);


    const bubble =
      transcriptionBubble(t);


    /*
       In the transcription bubble the base
       pairs physically separate.
    */

    const gap =
      0.035 +
      bubble * 0.36;


    const leftDirection =
      left
        .clone()
        .sub(midpoint)
        .normalize();


    const rightDirection =
      right
        .clone()
        .sub(midpoint)
        .normalize();


    const leftInner =
      midpoint
        .clone()
        .add(
          leftDirection.multiplyScalar(
            gap
          )
        );


    const rightInner =
      midpoint
        .clone()
        .add(
          rightDirection.multiplyScalar(
            gap
          )
        );


    const pair =
      pairOptions[
        i %
          pairOptions.length
      ];


    const leftBase =
      createCylinder(
        left,
        leftInner,
        baseMaterials[pair[0]],
        0.045
      );


    const rightBase =
      createCylinder(
        right,
        rightInner,
        baseMaterials[pair[1]],
        0.045
      );


    dnaGroup.add(
      leftBase,
      rightBase
    );


    /*
       Hydrogen-bond style center connector.
       It disappears in the open transcription
       region.
    */

    if (bubble < 0.22) {
      const bond =
        createCylinder(
          leftInner,
          rightInner,
          bondMaterial,
          0.018
        );


      dnaGroup.add(bond);
    }
  }


  /* =========================================================
     TRANSCRIPTION HOTSPOT
     ========================================================= */

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


  molecularGroup.add(
    hotspotGroup
  );


  const hotspotCore =
    new THREE.Mesh(
      new THREE.SphereGeometry(
        0.115,
        22,
        22
      ),

      new THREE.MeshBasicMaterial({
        color: 0xd8ffff,
      })
    );


  const hotspotGlow =
    createGlowSprite(
      0x53f5ff,
      1.9,
      0.92
    );


  const hotspotGlowMiddle =
    createGlowSprite(
      0x32dfff,
      3.1,
      0.55
    );


  const hotspotGlowOuter =
    createGlowSprite(
      0x247cff,
      5,
      0.25
    );


  hotspotGroup.add(
    hotspotGlowOuter,
    hotspotGlowMiddle,
    hotspotGlow,
    hotspotCore
  );


  /*
     Local light creates actual cyan illumination
     on nearby DNA geometry.
  */

  const hotspotLight =
    new THREE.PointLight(
      0x58edff,
      17,
      7,
      1.7
    );


  hotspotLight.position.copy(
    hotspotPosition
  );


  molecularGroup.add(
    hotspotLight
  );


  /* =========================================================
     TRANSCRIPTION PARTICLES
     ========================================================= */

  const bubbleParticleCount = 90;

  const bubbleGeometry =
    new THREE.BufferGeometry();

  const bubblePositions =
    new Float32Array(
      bubbleParticleCount * 3
    );


  for (
    let i = 0;
    i < bubbleParticleCount;
    i += 1
  ) {
    const radius =
      Math.random() * 1.2;


    const angle =
      Math.random() *
      Math.PI *
      2;


    bubblePositions[
      i * 3
    ] =
      hotspotPosition.x +
      Math.cos(angle) *
        radius;


    bubblePositions[
      i * 3 + 1
    ] =
      hotspotPosition.y +
      (
        Math.random() -
        0.5
      ) *
        1.5;


    bubblePositions[
      i * 3 + 2
    ] =
      hotspotPosition.z +
      Math.sin(angle) *
        radius;
  }


  bubbleGeometry.setAttribute(
    "position",

    new THREE.BufferAttribute(
      bubblePositions,
      3
    )
  );


  const bubbleParticles =
    new THREE.Points(
      bubbleGeometry,

      new THREE.PointsMaterial({
        color: 0x65efff,
        size: 0.055,
        transparent: true,
        opacity: 0.72,
        depthWrite: false,
        blending:
          THREE.AdditiveBlending,
      })
    );


  molecularGroup.add(
    bubbleParticles
  );


  /* =========================================================
     mRNA CURVE
     ========================================================= */

  const mrnaSequence =
    "AUGCUUACGAAUGCC";


  const mrnaPoints = [
    hotspotPosition.clone(),

    hotspotPosition
      .clone()
      .add(
        new THREE.Vector3(
          0.55,
          0.03,
          0.05
        )
      ),

    hotspotPosition
      .clone()
      .add(
        new THREE.Vector3(
          1.1,
          0.05,
          -0.05
        )
      ),

    hotspotPosition
      .clone()
      .add(
        new THREE.Vector3(
          1.75,
          -0.05,
          -0.12
        )
      ),

    hotspotPosition
      .clone()
      .add(
        new THREE.Vector3(
          2.35,
          0.03,
          -0.1
        )
      ),

    hotspotPosition
      .clone()
      .add(
        new THREE.Vector3(
          2.95,
          0.38,
          -0.06
        )
      ),

    hotspotPosition
      .clone()
      .add(
        new THREE.Vector3(
          3.55,
          0.75,
          0
        )
      ),

    hotspotPosition
      .clone()
      .add(
        new THREE.Vector3(
          4.15,
          1.12,
          0.04
        )
      ),

    hotspotPosition
      .clone()
      .add(
        new THREE.Vector3(
          4.8,
          1.24,
          0.02
        )
      ),

    hotspotPosition
      .clone()
      .add(
        new THREE.Vector3(
          5.35,
          1.37,
          0
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
      220,
      0.036,
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


  /*
     Soft halo around the RNA.
  */

  const mrnaGlowGeometry =
    new THREE.TubeGeometry(
      mrnaCurve,
      180,
      0.085,
      10,
      false
    );


  const mrnaGlow =
    new THREE.Mesh(
      mrnaGlowGeometry,
      mrnaGlowMaterial
    );


  mrnaGroup.add(
    mrnaGlow
  );


  /* =========================================================
     mRNA NUCLEOTIDES
     ========================================================= */

  function nucleotideColor(letter) {
    switch (letter) {
      case "A":
        return 0x65f0a8;

      case "U":
        return 0xb48cff;

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
      0.052,
      14,
      14
    );


  const nucleotideBeads = [];


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


    const color =
      nucleotideColor(
        mrnaSequence[i]
      );


    const material =
      new THREE.MeshStandardMaterial({
        color,
        emissive: color,
        emissiveIntensity: 0.95,
        roughness: 0.25,
        metalness: 0.03,
      });


    const bead =
      new THREE.Mesh(
        nucleotideGeometry,
        material
      );


    bead.position.copy(point);


    bead.position.y +=
      Math.sin(i * 0.85) *
      0.06;


    bead.position.z +=
      Math.cos(i * 0.7) *
      0.04;


    nucleotideBeads.push(bead);

    mrnaGroup.add(bead);
  }


  /* =========================================================
     NUCLEOTIDE LETTER SPRITES
     ========================================================= */

  function createLetterSprite(
    letter,
    color
  ) {
    const canvas =
      document.createElement(
        "canvas"
      );


    canvas.width = 128;
    canvas.height = 128;


    const ctx =
      canvas.getContext("2d");


    ctx.clearRect(
      0,
      0,
      128,
      128
    );


    ctx.font =
      "600 62px Arial";


    ctx.textAlign =
      "center";


    ctx.textBaseline =
      "middle";


    ctx.fillStyle = color;


    ctx.shadowColor = color;

    ctx.shadowBlur = 14;


    ctx.fillText(
      letter,
      64,
      64
    );


    const texture =
      new THREE.CanvasTexture(
        canvas
      );


    texture.colorSpace =
      THREE.SRGBColorSpace;


    const material =
      new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        depthWrite: false,
      });


    const sprite =
      new THREE.Sprite(
        material
      );


    sprite.scale.set(
      0.28,
      0.28,
      0.28
    );


    return sprite;
  }


  const letterColors = {
    A: "#78f5b8",
    U: "#c09aff",
    G: "#ffd274",
    C: "#76c8ff",
  };


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


    const letter =
      mrnaSequence[i];


    const sprite =
      createLetterSprite(
        letter,
        letterColors[letter]
      );


    sprite.position.copy(
      point
    );


    sprite.position.y +=
      0.19 +
      Math.sin(i * 0.7) *
        0.025;


    mrnaGroup.add(sprite);
  }


  /* =========================================================
     mRNA READ HEAD
     ========================================================= */

  const readHead =
    new THREE.Mesh(
      new THREE.SphereGeometry(
        0.075,
        18,
        18
      ),

      new THREE.MeshBasicMaterial({
        color: 0xd9ffff,
      })
    );


  const readHeadGlow =
    createGlowSprite(
      0x4be0e8,
      0.9,
      0.7
    );


  mrnaGroup.add(
    readHead,
    readHeadGlow
  );


  /* =========================================================
     BACKGROUND PARTICLES
     ========================================================= */

  const particleCount = 520;

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
      (
        Math.random() -
        0.5
      ) *
      15;


    particlePositions[
      i * 3 + 1
    ] =
      (
        Math.random() -
        0.5
      ) *
      15;


    particlePositions[
      i * 3 + 2
    ] =
      (
        Math.random() -
        0.5
      ) *
      7;
  }


  particleGeometry.setAttribute(
    "position",

    new THREE.BufferAttribute(
      particlePositions,
      3
    )
  );


  const particles =
    new THREE.Points(
      particleGeometry,

      new THREE.PointsMaterial({
        color: 0x398cff,
        size: 0.035,
        transparent: true,
        opacity: 0.42,
        depthWrite: false,
        blending:
          THREE.AdditiveBlending,
      })
    );


  scene.add(particles);


  /* =========================================================
     DATA DOT CLUSTERS
     ========================================================= */

  const dataDots =
    new THREE.Group();


  visualGroup.add(
    dataDots
  );


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
        opacity: 0.4,
        depthWrite: false,
      });


    const geometry =
      new THREE.PlaneGeometry(
        0.035,
        0.035
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
          0.58
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
    2.0,
    2.3,
    -1.7,
    9,
    5,
    0.11,
    0x2f83ff
  );


  addDotCluster(
    1.9,
    -1.3,
    -1.5,
    8,
    4,
    0.1,
    0x4be0e8
  );


  addDotCluster(
    -2.5,
    -0.2,
    -1.6,
    7,
    4,
    0.1,
    0x2f83ff
  );


  addDotCluster(
    2.3,
    -2.7,
    -1.45,
    9,
    4,
    0.1,
    0x4be0e8
  );


  /* =========================================================
     LIGHTING
     ========================================================= */

  const ambientLight =
    new THREE.AmbientLight(
      0x557ca8,
      0.42
    );


  scene.add(
    ambientLight
  );


  const keyBlue =
    new THREE.PointLight(
      0x2f83ff,
      18,
      38,
      1.65
    );


  keyBlue.position.set(
    4.3,
    3.3,
    6.8
  );


  scene.add(
    keyBlue
  );


  const rimCyan =
    new THREE.PointLight(
      0x39e4f5,
      15,
      35,
      1.7
    );


  rimCyan.position.set(
    -4.5,
    -2.2,
    5.5
  );


  scene.add(
    rimCyan
  );


  const frontLight =
    new THREE.DirectionalLight(
      0xa8d7ff,
      0.75
    );


  frontLight.position.set(
    0,
    2,
    7
  );


  scene.add(
    frontLight
  );


  const topLight =
    new THREE.PointLight(
      0x256eff,
      7,
      30
    );


  topLight.position.set(
    -1,
    6,
    2
  );


  scene.add(
    topLight
  );


  /* =========================================================
     POINTER PARALLAX
     ========================================================= */

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
        mouseX * 0.12;


      targetRotationX =
        mouseY * 0.065;
    }
  );


  container.addEventListener(
    "mouseleave",
    () => {
      targetRotationX = 0;
      targetRotationY = 0;
    }
  );


  /* =========================================================
     RESIZE
     ========================================================= */

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


  /* =========================================================
     REDUCED MOTION
     ========================================================= */

  const prefersReducedMotion =
    window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    );


  /* =========================================================
     ANIMATION
     ========================================================= */

  function animate(time) {
    const seconds =
      time * 0.001;


    /*
       Very slow molecular movement rather
       than constant spinning.
    */

    if (!prefersReducedMotion.matches) {
      molecularGroup.rotation.y =
        Math.sin(
          seconds * 0.16
        ) *
        0.065;


      molecularGroup.rotation.z =
        Math.sin(
          seconds * 0.11
        ) *
        0.018;


      visualGroup.rotation.x +=
        (
          targetRotationX -
          visualGroup.rotation.x
        ) *
        0.025;


      visualGroup.rotation.y +=
        (
          targetRotationY -
          visualGroup.rotation.y
        ) *
        0.025;


      visualGroup.position.y =
        Math.sin(
          seconds * 0.42
        ) *
        0.045;


      mrnaGroup.position.y =
        Math.sin(
          seconds * 0.85
        ) *
        0.018;


      bubbleParticles.rotation.y =
        seconds * 0.09;


      particles.rotation.y =
        seconds * 0.012;


      particles.rotation.x =
        Math.sin(
          seconds * 0.12
        ) *
        0.025;
    }


    /*
       Transcription hotspot breathing.
    */

    const hotspotPulse =
      1 +
      Math.sin(
        seconds * 2.6
      ) *
        0.07;


    hotspotCore.scale.setScalar(
      hotspotPulse
    );


    hotspotGlow.scale.setScalar(
      1.85 +
        Math.sin(
          seconds * 2.7
        ) *
          0.12
    );


    hotspotGlowMiddle.scale.setScalar(
      3 +
        Math.sin(
          seconds * 2.4
        ) *
          0.19
    );


    hotspotGlowOuter.scale.setScalar(
      4.8 +
        Math.sin(
          seconds * 2.1
        ) *
          0.28
    );


    hotspotLight.intensity =
      15.5 +
      (
        Math.sin(
          seconds * 2.5
        ) +
        1
      ) *
        2.3;


    /*
       mRNA read-head animation.
    */

    const readProgress =
      prefersReducedMotion.matches
        ? 0.55
        : (
            seconds *
            0.055
          ) %
          1;


    const readPosition =
      mrnaCurve.getPointAt(
        readProgress
      );


    readHead.position.copy(
      readPosition
    );


    readHeadGlow.position.copy(
      readPosition
    );


    readHeadGlow.scale.setScalar(
      0.82 +
        Math.sin(
          seconds * 5
        ) *
          0.09
    );


    /*
       Slight nucleotide shimmer.
    */

    nucleotideBeads.forEach(
      (bead, index) => {
        const pulse =
          1 +
          Math.sin(
            seconds * 2.2 +
            index * 0.65
          ) *
            0.08;


        bead.scale.setScalar(
          pulse
        );
      }
    );


    /*
       Background data flicker.
    */

    dataDots.children.forEach(
      (dot, index) => {
        dot.material.opacity =
          0.12 +
          (
            Math.sin(
              seconds * 1.8 +
              index * 0.4
            ) +
            1
          ) *
            0.12;
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
