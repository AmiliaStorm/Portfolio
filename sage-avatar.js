import * as THREE from "three";


// ==========================================================
// SAGE v0.1
// Procedural holographic humanoid
// ==========================================================


const mount =
  document.getElementById("sageAvatarMount");


if (!mount) {
  throw new Error(
    "SAGE: Could not find #sageAvatarMount"
  );
}



// ==========================================================
// Renderer
// ==========================================================

const renderer =
  new THREE.WebGLRenderer({
    alpha: true,
    antialias: true,
    powerPreference: "high-performance"
  });


renderer.setPixelRatio(
  Math.min(
    window.devicePixelRatio || 1,
    2
  )
);


renderer.setClearColor(
  0x000000,
  0
);


renderer.outputColorSpace =
  THREE.SRGBColorSpace;


mount.appendChild(
  renderer.domElement
);



// ==========================================================
// Scene
// ==========================================================

const scene =
  new THREE.Scene();



// ==========================================================
// Camera
// ==========================================================

const camera =
  new THREE.PerspectiveCamera(
    31,
    1,
    0.1,
    100
  );


camera.position.set(
  0,
  0.45,
  10.5
);


camera.lookAt(
  0,
  0.25,
  0
);



// ==========================================================
// Main SAGE groups
// ==========================================================

const sage =
  new THREE.Group();


sage.position.set(
  0.2,
  0,
  0
);


scene.add(
  sage
);


const bodyGroup =
  new THREE.Group();


const hairGroup =
  new THREE.Group();


const tailGroup =
  new THREE.Group();


const particleGroup =
  new THREE.Group();


sage.add(
  bodyGroup,
  hairGroup,
  tailGroup,
  particleGroup
);



// ==========================================================
// Glow texture
// ==========================================================

function createGlowTexture() {

  const canvas =
    document.createElement("canvas");


  canvas.width =
    256;


  canvas.height =
    256;


  const ctx =
    canvas.getContext("2d");


  const gradient =
    ctx.createRadialGradient(
      128,
      128,
      0,

      128,
      128,
      128
    );


  gradient.addColorStop(
    0,
    "rgba(255,255,255,1)"
  );


  gradient.addColorStop(
    0.1,
    "rgba(218,250,255,1)"
  );


  gradient.addColorStop(
    0.25,
    "rgba(80,220,255,0.75)"
  );


  gradient.addColorStop(
    0.5,
    "rgba(73,115,255,0.28)"
  );


  gradient.addColorStop(
    0.75,
    "rgba(110,70,255,0.08)"
  );


  gradient.addColorStop(
    1,
    "rgba(0,0,0,0)"
  );


  ctx.fillStyle =
    gradient;


  ctx.fillRect(
    0,
    0,
    256,
    256
  );


  const texture =
    new THREE.CanvasTexture(
      canvas
    );


  texture.colorSpace =
    THREE.SRGBColorSpace;


  return texture;
}


const glowTexture =
  createGlowTexture();



// ==========================================================
// Holographic body shader
// ==========================================================

const hologramMaterial =
  new THREE.ShaderMaterial({

    transparent: true,

    side:
      THREE.DoubleSide,

    depthWrite:
      false,

    blending:
      THREE.AdditiveBlending,


    uniforms: {

      uTime: {
        value: 0
      },

      uOpacity: {
        value: 0.82
      },

      uCyan: {
        value:
          new THREE.Color(
            "#50e5ff"
          )
      },

      uBlue: {
        value:
          new THREE.Color(
            "#3f82ff"
          )
      },

      uPurple: {
        value:
          new THREE.Color(
            "#8b65ff"
          )
      }

    },


    vertexShader: `

      uniform float uTime;

      varying vec3 vNormalView;
      varying vec3 vViewPosition;
      varying vec3 vObjectPosition;


      void main() {

        vec3 transformed =
          position;


        float shimmer =
          sin(
            position.y * 8.0 +
            position.x * 5.0 +
            uTime * 1.4
          )
          * 0.007;


        transformed +=
          normal * shimmer;


        vec4 mvPosition =
          modelViewMatrix *
          vec4(
            transformed,
            1.0
          );


        vNormalView =
          normalize(
            normalMatrix *
            normal
          );


        vViewPosition =
          -mvPosition.xyz;


        vObjectPosition =
          position;


        gl_Position =
          projectionMatrix *
          mvPosition;

      }

    `,


    fragmentShader: `

      precision highp float;


      uniform float uTime;
      uniform float uOpacity;


      uniform vec3 uCyan;
      uniform vec3 uBlue;
      uniform vec3 uPurple;


      varying vec3 vNormalView;
      varying vec3 vViewPosition;
      varying vec3 vObjectPosition;


      void main() {

        vec3 viewDirection =
          normalize(
            vViewPosition
          );


        float fresnel =
          pow(
            1.0 -
            abs(
              dot(
                normalize(
                  vNormalView
                ),
                viewDirection
              )
            ),
            2.15
          );


        float energyStream =
          0.5 +
          0.5 *
          sin(
            vObjectPosition.y * 12.0 -
            uTime * 2.0 +
            vObjectPosition.x * 5.5
          );


        float microEnergy =
          0.5 +
          0.5 *
          sin(
            vObjectPosition.x * 29.0 +
            vObjectPosition.y * 22.0 +
            uTime * 1.6
          );


        float vertical =
          clamp(
            vObjectPosition.y *
            0.15 +
            0.5,
            0.0,
            1.0
          );


        vec3 colour =
          mix(
            uPurple,
            uBlue,
            vertical
          );


        colour =
          mix(
            colour,
            uCyan,
            fresnel * 0.72
          );


        float brightness =
          0.52 +
          fresnel * 2.45 +
          energyStream * 0.18 +
          microEnergy * 0.08;


        float alpha =
          (
            0.045 +
            fresnel * 0.64 +
            energyStream * 0.05
          )
          *
          uOpacity;


        gl_FragColor =
          vec4(
            colour *
            brightness,

            alpha
          );

      }

    `
  });



// ==========================================================
// Anatomy helpers
// ==========================================================

function createSphere(
  radius,
  position,
  scale
) {

  const geometry =
    new THREE.SphereGeometry(
      radius,
      48,
      48
    );


  const mesh =
    new THREE.Mesh(
      geometry,
      hologramMaterial
    );


  mesh.position.copy(
    position
  );


  mesh.scale.copy(
    scale
  );


  bodyGroup.add(
    mesh
  );


  return mesh;
}



// ----------------------------------------------------------
// Cylinder between two points
// ----------------------------------------------------------

function createLimb(
  start,
  end,
  topRadius,
  bottomRadius
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
      topRadius,
      bottomRadius,
      length,
      30,
      1,
      false
    );


  const mesh =
    new THREE.Mesh(
      geometry,
      hologramMaterial
    );


  mesh.position.copy(
    start
      .clone()
      .add(end)
      .multiplyScalar(
        0.5
      )
  );


  mesh.quaternion
    .setFromUnitVectors(

      new THREE.Vector3(
        0,
        1,
        0
      ),

      direction
        .clone()
        .normalize()

    );


  bodyGroup.add(
    mesh
  );


  return mesh;
}



// ==========================================================
// HEAD
// ==========================================================

const head =
  createSphere(

    0.57,

    new THREE.Vector3(
      0,
      2.72,
      0
    ),

    new THREE.Vector3(
      0.79,
      1.04,
      0.83
    )

  );



// ==========================================================
// NECK
// ==========================================================

createLimb(

  new THREE.Vector3(
    0,
    2.25,
    0
  ),

  new THREE.Vector3(
    0,
    1.9,
    0
  ),

  0.18,
  0.23

);



// ==========================================================
// CHEST
// ==========================================================

const chest =
  createSphere(

    1,

    new THREE.Vector3(
      0,
      1.28,
      0
    ),

    new THREE.Vector3(
      0.9,
      0.82,
      0.44
    )

  );



// ==========================================================
// WAIST
// ==========================================================

const waist =
  createSphere(

    1,

    new THREE.Vector3(
      0,
      0.52,
      0
    ),

    new THREE.Vector3(
      0.58,
      0.8,
      0.34
    )

  );



// ==========================================================
// HIPS
// ==========================================================

const hips =
  createSphere(

    1,

    new THREE.Vector3(
      0,
      -0.22,
      0
    ),

    new THREE.Vector3(
      0.76,
      0.58,
      0.4
    )

  );



// ==========================================================
// ARMS
// ==========================================================

const leftShoulder =
  new THREE.Vector3(
    -0.77,
    1.53,
    0
  );


const leftElbow =
  new THREE.Vector3(
    -1.16,
    0.72,
    0.02
  );


const leftWrist =
  new THREE.Vector3(
    -1.48,
    -0.08,
    0.11
  );


const rightShoulder =
  new THREE.Vector3(
    0.77,
    1.53,
    0
  );


const rightElbow =
  new THREE.Vector3(
    1.15,
    0.69,
    -0.01
  );


const rightWrist =
  new THREE.Vector3(
    1.49,
    -0.05,
    0.11
  );



// Upper arms

createLimb(
  leftShoulder,
  leftElbow,
  0.2,
  0.155
);


createLimb(
  rightShoulder,
  rightElbow,
  0.2,
  0.155
);



// Forearms

createLimb(
  leftElbow,
  leftWrist,
  0.155,
  0.1
);


createLimb(
  rightElbow,
  rightWrist,
  0.155,
  0.1
);



// ==========================================================
// HANDS
// ==========================================================

createSphere(

  0.18,

  leftWrist
    .clone()
    .add(
      new THREE.Vector3(
        -0.02,
        -0.13,
        0
      )
    ),

  new THREE.Vector3(
    0.55,
    1.15,
    0.4
  )

);


createSphere(

  0.18,

  rightWrist
    .clone()
    .add(
      new THREE.Vector3(
        0.02,
        -0.13,
        0
      )
    ),

  new THREE.Vector3(
    0.55,
    1.15,
    0.4
  )

);



// ==========================================================
// EYES
// ==========================================================

const eyeMaterial =
  new THREE.MeshBasicMaterial({

    color:
      "#d9f9ff",

    transparent:
      true,

    opacity:
      0.92,

    blending:
      THREE.AdditiveBlending,

    depthWrite:
      false
  });


function createEye(x) {

  const eye =
    new THREE.Mesh(

      new THREE.SphereGeometry(
        0.052,
        16,
        16
      ),

      eyeMaterial

    );


  eye.position.set(
    x,
    2.77,
    0.445
  );


  bodyGroup.add(
    eye
  );


  return eye;
}


const leftEye =
  createEye(
    -0.165
  );


const rightEye =
  createEye(
    0.165
  );



// ==========================================================
// CHEST CORE
// ==========================================================

const coreGroup =
  new THREE.Group();


coreGroup.position.set(
  0,
  1.26,
  0.48
);


sage.add(
  coreGroup
);



// ----------------------------------------------------------
// Physical core
// ----------------------------------------------------------

const coreSphere =
  new THREE.Mesh(

    new THREE.SphereGeometry(
      0.13,
      32,
      32
    ),

    new THREE.MeshBasicMaterial({

      color:
        "#ffffff",

      transparent:
        true,

      opacity:
        1,

      blending:
        THREE.AdditiveBlending,

      depthWrite:
        false

    })

  );


coreGroup.add(
  coreSphere
);



// ----------------------------------------------------------
// Glow sprites
// ----------------------------------------------------------

function createGlowSprite(
  size,
  opacity,
  colour = "#62dfff"
) {

  const material =
    new THREE.SpriteMaterial({

      map:
        glowTexture,

      color:
        colour,

      transparent:
        true,

      opacity,

      blending:
        THREE.AdditiveBlending,

      depthWrite:
        false

    });


  const sprite =
    new THREE.Sprite(
      material
    );


  sprite.scale.set(
    size,
    size,
    1
  );


  coreGroup.add(
    sprite
  );


  return sprite;
}


const coreGlowInner =
  createGlowSprite(
    0.8,
    0.92,
    "#8beaff"
  );


const coreGlowMiddle =
  createGlowSprite(
    1.45,
    0.58,
    "#4cbaff"
  );


const coreGlowOuter =
  createGlowSprite(
    2.35,
    0.25,
    "#5466ff"
  );



// ==========================================================
// BODY AURA
// ==========================================================

const auraMaterial =
  new THREE.SpriteMaterial({

    map:
      glowTexture,

    color:
      "#407dff",

    transparent:
      true,

    opacity:
      0.15,

    blending:
      THREE.AdditiveBlending,

    depthWrite:
      false

  });


const aura =
  new THREE.Sprite(
    auraMaterial
  );


aura.position.set(
  0,
  0.9,
  -0.8
);


aura.scale.set(
  5.6,
  7.2,
  1
);


sage.add(
  aura
);



// ==========================================================
// RANDOM POINT INSIDE SPHERE
// ==========================================================

function randomInsideSphere() {

  let x;
  let y;
  let z;


  do {

    x =
      Math.random() * 2 - 1;

    y =
      Math.random() * 2 - 1;

    z =
      Math.random() * 2 - 1;

  }
  while (
    x * x +
    y * y +
    z * z >
    1
  );


  return new THREE.Vector3(
    x,
    y,
    z
  );
}



// ==========================================================
// INTERNAL BODY PARTICLES
// ==========================================================

const bodyParticlePositions = [];

const bodyParticleBase = [];

const bodyParticleColours = [];


const cyan =
  new THREE.Color(
    "#61e6ff"
  );


const blue =
  new THREE.Color(
    "#4c87ff"
  );


const purple =
  new THREE.Color(
    "#956fff"
  );



// ----------------------------------------------------------
// Add particle to ellipsoid
// ----------------------------------------------------------

function addParticleInEllipsoid(
  centre,
  scale
) {

  const point =
    randomInsideSphere();


  point.multiply(
    scale
  );


  point.add(
    centre
  );


  bodyParticlePositions.push(
    point.x,
    point.y,
    point.z
  );


  bodyParticleBase.push(
    point.x,
    point.y,
    point.z
  );


  const random =
    Math.random();


  let colour;


  if (
    random < 0.4
  ) {

    colour =
      cyan;

  }

  else if (
    random < 0.77
  ) {

    colour =
      blue;

  }

  else {

    colour =
      purple;

  }


  bodyParticleColours.push(
    colour.r,
    colour.g,
    colour.b
  );

}



// ----------------------------------------------------------
// Chest / torso particles
// ----------------------------------------------------------

for (
  let i = 0;
  i < 800;
  i++
) {

  addParticleInEllipsoid(

    new THREE.Vector3(
      0,
      0.9,
      0
    ),

    new THREE.Vector3(
      0.72,
      1.4,
      0.34
    )

  );

}



// ----------------------------------------------------------
// Head particles
// ----------------------------------------------------------

for (
  let i = 0;
  i < 260;
  i++
) {

  addParticleInEllipsoid(

    new THREE.Vector3(
      0,
      2.7,
      0
    ),

    new THREE.Vector3(
      0.42,
      0.53,
      0.38
    )

  );

}



// ==========================================================
// ARM PARTICLES
// ==========================================================

function addArmParticles(
  start,
  end,
  count
) {

  for (
    let i = 0;
    i < count;
    i++
  ) {

    const t =
      Math.random();


    const point =
      start
        .clone()
        .lerp(
          end,
          t
        );


    const radius =
      0.12 *
      (
        0.45 +
        Math.random() *
        0.7
      );


    point.x +=
      (
        Math.random() *
        2 -
        1
      ) *
      radius;


    point.y +=
      (
        Math.random() *
        2 -
        1
      ) *
      radius;


    point.z +=
      (
        Math.random() *
        2 -
        1
      ) *
      radius;


    bodyParticlePositions.push(
      point.x,
      point.y,
      point.z
    );


    bodyParticleBase.push(
      point.x,
      point.y,
      point.z
    );


    const colour =
      Math.random() <
      0.55
        ? cyan
        : blue;


    bodyParticleColours.push(
      colour.r,
      colour.g,
      colour.b
    );

  }

}


addArmParticles(
  leftShoulder,
  leftWrist,
  190
);


addArmParticles(
  rightShoulder,
  rightWrist,
  190
);



// ==========================================================
// PARTICLE GEOMETRY
// ==========================================================

const bodyParticleGeometry =
  new THREE.BufferGeometry();


bodyParticleGeometry.setAttribute(

  "position",

  new THREE.Float32BufferAttribute(
    bodyParticlePositions,
    3
  )

);


bodyParticleGeometry.setAttribute(

  "color",

  new THREE.Float32BufferAttribute(
    bodyParticleColours,
    3
  )

);



const bodyParticleMaterial =
  new THREE.PointsMaterial({

    size:
      0.044,

    map:
      glowTexture,

    transparent:
      true,

    opacity:
      0.74,

    alphaTest:
      0.02,

    depthWrite:
      false,

    vertexColors:
      true,

    blending:
      THREE.AdditiveBlending,

    sizeAttenuation:
      true

  });


const bodyParticles =
  new THREE.Points(

    bodyParticleGeometry,

    bodyParticleMaterial

  );


particleGroup.add(
  bodyParticles
);



// ==========================================================
// INTERNAL NETWORK
// ==========================================================

const particleVectors =
  [];


for (
  let i = 0;
  i < bodyParticleBase.length;
  i += 3
) {

  particleVectors.push(

    new THREE.Vector3(

      bodyParticleBase[i],

      bodyParticleBase[i + 1],

      bodyParticleBase[i + 2]

    )

  );

}


const networkPositions =
  [];


let connections =
  0;


let attempts =
  0;


while (
  connections < 380 &&
  attempts < 18000
) {

  attempts++;


  const a =
    particleVectors[
      Math.floor(
        Math.random() *
        particleVectors.length
      )
    ];


  const b =
    particleVectors[
      Math.floor(
        Math.random() *
        particleVectors.length
      )
    ];


  if (
    !a ||
    !b
  ) {
    continue;
  }


  const distance =
    a.distanceTo(
      b
    );


  if (
    distance > 0.08 &&
    distance < 0.31
  ) {

    networkPositions.push(

      a.x,
      a.y,
      a.z,

      b.x,
      b.y,
      b.z

    );


    connections++;

  }

}



const networkGeometry =
  new THREE.BufferGeometry();


networkGeometry.setAttribute(

  "position",

  new THREE.Float32BufferAttribute(
    networkPositions,
    3
  )

);


const networkMaterial =
  new THREE.LineBasicMaterial({

    color:
      "#68aaff",

    transparent:
      true,

    opacity:
      0.18,

    blending:
      THREE.AdditiveBlending,

    depthWrite:
      false

  });


const network =
  new THREE.LineSegments(

    networkGeometry,

    networkMaterial

  );


particleGroup.add(
  network
);



// ==========================================================
// ENERGY HAIR
// ==========================================================

const hairMaterials = [

  new THREE.LineBasicMaterial({

    color:
      "#62e5ff",

    transparent:
      true,

    opacity:
      0.48,

    blending:
      THREE.AdditiveBlending,

    depthWrite:
      false

  }),


  new THREE.LineBasicMaterial({

    color:
      "#5d8cff",

    transparent:
      true,

    opacity:
      0.4,

    blending:
      THREE.AdditiveBlending,

    depthWrite:
      false

  }),


  new THREE.LineBasicMaterial({

    color:
      "#9c72ff",

    transparent:
      true,

    opacity:
      0.36,

    blending:
      THREE.AdditiveBlending,

    depthWrite:
      false

  })

];


const hairLines =
  [];



for (
  let i = 0;
  i < 42;
  i++
) {

  const angle =
    (
      i /
      42
    ) *
    Math.PI *
    2;


  const root =
    new THREE.Vector3(

      Math.cos(angle) *
      (
        0.27 +
        Math.random() *
        0.18
      ),

      2.88 +
      Math.sin(angle) *
      0.28,

      -0.03 +
      Math.cos(
        angle *
        1.5
      ) *
      0.14

    );


  const side =
    Math.cos(angle) *
    (
      0.5 +
      Math.random() *
      0.55
    );


  const length =
    0.8 +
    Math.random() *
    1.4;


  const points = [

    root,


    new THREE.Vector3(

      root.x +
      side * 0.32,

      root.y -
      length * 0.28,

      root.z -
      0.04

    ),


    new THREE.Vector3(

      root.x +
      side * 0.67,

      root.y -
      length * 0.63,

      root.z +
      0.03

    ),


    new THREE.Vector3(

      root.x +
      side,

      root.y -
      length,

      root.z +
      0.08

    )

  ];


  const curve =
    new THREE.CatmullRomCurve3(
      points
    );


  const geometry =
    new THREE.BufferGeometry()
      .setFromPoints(
        curve.getPoints(
          48
        )
      );


  const line =
    new THREE.Line(

      geometry,

      hairMaterials[
        i %
        hairMaterials.length
      ]

    );


  line.userData.phase =
    Math.random() *
    Math.PI *
    2;


  line.userData.motion =
    0.01 +
    Math.random() *
    0.024;


  hairGroup.add(
    line
  );


  hairLines.push(
    line
  );

}



// ==========================================================
// LOWER BODY PARTICLE STREAM
// ==========================================================

const tailParticleCount =
  900;


const tailPositions =
  new Float32Array(
    tailParticleCount *
    3
  );


const tailBase =
  new Float32Array(
    tailParticleCount *
    3
  );


const tailColours =
  new Float32Array(
    tailParticleCount *
    3
  );



for (
  let i = 0;
  i < tailParticleCount;
  i++
) {

  const t =
    Math.random();


  const y =
    -0.35 -
    t *
    3.45;


  const width =
    0.7 *
    (
      1 -
      t *
      0.72
    ) +
    0.1;


  const swirl =
    t *
    8.6 +
    Math.random() *
    1.8;


  const x =
    Math.sin(swirl) *
    width *
    (
      0.3 +
      Math.random() *
      0.72
    )

    +

    (
      Math.random() *
      2 -
      1
    ) *
    width *
    0.38;


  const z =
    Math.cos(swirl) *
    width *
    0.21

    +

    (
      Math.random() *
      2 -
      1
    ) *
    0.11;


  const index =
    i *
    3;


  tailPositions[index] =
    x;


  tailPositions[index + 1] =
    y;


  tailPositions[index + 2] =
    z;


  tailBase[index] =
    x;


  tailBase[index + 1] =
    y;


  tailBase[index + 2] =
    z;


  let colour;


  const random =
    Math.random();


  if (
    random < 0.38
  ) {

    colour =
      cyan;

  }

  else if (
    random < 0.75
  ) {

    colour =
      blue;

  }

  else {

    colour =
      purple;

  }


  tailColours[index] =
    colour.r;


  tailColours[index + 1] =
    colour.g;


  tailColours[index + 2] =
    colour.b;

}



const tailGeometry =
  new THREE.BufferGeometry();


tailGeometry.setAttribute(

  "position",

  new THREE.BufferAttribute(
    tailPositions,
    3
  )

);


tailGeometry.setAttribute(

  "color",

  new THREE.BufferAttribute(
    tailColours,
    3
  )

);



const tailParticleMaterial =
  new THREE.PointsMaterial({

    size:
      0.052,

    map:
      glowTexture,

    transparent:
      true,

    opacity:
      0.72,

    depthWrite:
      false,

    vertexColors:
      true,

    blending:
      THREE.AdditiveBlending

  });



const tailParticles =
  new THREE.Points(

    tailGeometry,

    tailParticleMaterial

  );


tailGroup.add(
  tailParticles
);



// ==========================================================
// ENERGY STRANDS IN TAIL
// ==========================================================

const tailStrands =
  [];


for (
  let i = 0;
  i < 14;
  i++
) {

  const phase =
    (
      i /
      14
    ) *
    Math.PI *
    2;


  const points =
    [];


  for (
    let j = 0;
    j <= 48;
    j++
  ) {

    const t =
      j /
      48;


    const y =
      -0.25 -
      t *
      3.55;


    const radius =
      0.62 *
      (
        1 -
        t *
        0.73
      );


    points.push(

      new THREE.Vector3(

        Math.sin(
          phase +
          t *
          7.8
        )
        *
        radius,


        y,


        Math.cos(
          phase +
          t *
          6
        )
        *
        radius *
        0.17

      )

    );

  }


  const geometry =
    new THREE.BufferGeometry()
      .setFromPoints(
        points
      );


  let colour;


  if (
    i % 3 === 0
  ) {

    colour =
      "#60e6ff";

  }

  else if (
    i % 3 === 1
  ) {

    colour =
      "#568dff";

  }

  else {

    colour =
      "#916cff";

  }


  const material =
    new THREE.LineBasicMaterial({

      color:
        colour,

      transparent:
        true,

      opacity:
        0.28,

      blending:
        THREE.AdditiveBlending,

      depthWrite:
        false

    });


  const strand =
    new THREE.Line(
      geometry,
      material
    );


  strand.userData.phase =
    phase;


  tailGroup.add(
    strand
  );


  tailStrands.push(
    strand
  );

}



// ==========================================================
// Floating particles around SAGE
// ==========================================================

const ambientCount =
  180;


const ambientPositions =
  new Float32Array(
    ambientCount *
    3
  );


const ambientBase =
  new Float32Array(
    ambientCount *
    3
  );


for (
  let i = 0;
  i < ambientCount;
  i++
) {

  const angle =
    Math.random() *
    Math.PI *
    2;


  const radius =
    1.2 +
    Math.random() *
    2.3;


  const y =
    -1.5 +
    Math.random() *
    5.3;


  const index =
    i *
    3;


  ambientPositions[index] =
    Math.cos(angle) *
    radius;


  ambientPositions[index + 1] =
    y;


  ambientPositions[index + 2] =
    (
      Math.random() *
      2 -
      1
    ) *
    0.7;


  ambientBase[index] =
    ambientPositions[index];


  ambientBase[index + 1] =
    ambientPositions[index + 1];


  ambientBase[index + 2] =
    ambientPositions[index + 2];

}



const ambientGeometry =
  new THREE.BufferGeometry();


ambientGeometry.setAttribute(

  "position",

  new THREE.BufferAttribute(
    ambientPositions,
    3
  )

);



const ambientMaterial =
  new THREE.PointsMaterial({

    size:
      0.045,

    map:
      glowTexture,

    color:
      "#70c9ff",

    transparent:
      true,

    opacity:
      0.42,

    depthWrite:
      false,

    blending:
      THREE.AdditiveBlending

  });



const ambientParticles =
  new THREE.Points(

    ambientGeometry,

    ambientMaterial

  );


sage.add(
  ambientParticles
);



// ==========================================================
// Behaviour system
// ==========================================================

const behaviour = {

  state:
    "idle",

  energy:
    1,

  targetEnergy:
    1,

  bodyOpacity:
    0.82,

  targetBodyOpacity:
    0.82,

  tailSpeed:
    1,

  targetTailSpeed:
    1

};



// ==========================================================
// SAGE STATES
// ==========================================================

function setState(
  newState
) {

  behaviour.state =
    newState;


  switch (
    newState
  ) {

    // ------------------------------------------------------
    // Thinking
    // ------------------------------------------------------

    case "thinking":

      behaviour.targetEnergy =
        1.3;


      behaviour.targetBodyOpacity =
        0.69;


      behaviour.targetTailSpeed =
        0.7;


      break;



    // ------------------------------------------------------
    // Talking
    // ------------------------------------------------------

    case "talking":

      behaviour.targetEnergy =
        1.48;


      behaviour.targetBodyOpacity =
        0.87;


      behaviour.targetTailSpeed =
        1.12;


      break;



    // ------------------------------------------------------
    // Moving
    // ------------------------------------------------------

    case "moving":

      behaviour.targetEnergy =
        1.16;


      behaviour.targetBodyOpacity =
        0.62;


      behaviour.targetTailSpeed =
        1.8;


      break;



    // ------------------------------------------------------
    // Idle
    // ------------------------------------------------------

    case "idle":
    default:

      behaviour.targetEnergy =
        1;


      behaviour.targetBodyOpacity =
        0.82;


      behaviour.targetTailSpeed =
        1;


      break;

  }

}



// ==========================================================
// Public API
// ==========================================================

window.SAGEAvatar = {

  setState,


  getState() {

    return behaviour.state;

  },


  getObject3D() {

    return sage;

  }

};



// ==========================================================
// Pointer awareness
// ==========================================================

const pointer = {

  x: 0,

  y: 0

};


window.addEventListener(
  "pointermove",
  (event) => {

    pointer.x =
      (
        event.clientX /
        window.innerWidth
      ) *
      2 -
      1;


    pointer.y =
      -(
        (
          event.clientY /
          window.innerHeight
        )
        *
        2 -
        1
      );

  }
);



// ==========================================================
// Resize
// ==========================================================

function resize() {

  const width =
    mount.clientWidth;


  const height =
    mount.clientHeight;


  if (
    width <= 0 ||
    height <= 0
  ) {

    return;

  }


  renderer.setSize(
    width,
    height,
    false
  );


  camera.aspect =
    width /
    height;


  camera.updateProjectionMatrix();

}



const resizeObserver =
  new ResizeObserver(
    resize
  );


resizeObserver.observe(
  mount
);


resize();



// ==========================================================
// Animation
// ==========================================================

const clock =
  new THREE.Clock();



function animate() {

  const time =
    clock.getElapsedTime();



  // ========================================================
  // Smooth behaviour transitions
  // ========================================================

  behaviour.energy +=
    (
      behaviour.targetEnergy -
      behaviour.energy
    ) *
    0.045;


  behaviour.bodyOpacity +=
    (
      behaviour.targetBodyOpacity -
      behaviour.bodyOpacity
    ) *
    0.045;


  behaviour.tailSpeed +=
    (
      behaviour.targetTailSpeed -
      behaviour.tailSpeed
    ) *
    0.045;



  hologramMaterial
    .uniforms
    .uTime
    .value =
      time;


  hologramMaterial
    .uniforms
    .uOpacity
    .value =
      behaviour.bodyOpacity;



  // ========================================================
  // Floating body
  // ========================================================

  sage.position.y =
    Math.sin(
      time *
      0.72
    )
    *
    0.055;


  sage.rotation.z =
    Math.sin(
      time *
      0.42
    )
    *
    0.014;



  // ========================================================
  // Gently face user
  // ========================================================

  const targetYRotation =
    pointer.x *
    0.11;


  const targetXRotation =
    pointer.y *
    0.03;


  sage.rotation.y +=
    (
      targetYRotation -
      sage.rotation.y
    )
    *
    0.025;


  sage.rotation.x +=
    (
      targetXRotation -
      sage.rotation.x
    )
    *
    0.02;



  // ========================================================
  // Chest core pulse
  // ========================================================

  const corePulse =
    1 +
    Math.sin(
      time *
      (
        2.1 *
        behaviour.energy
      )
    )
    *
    (
      0.065 *
      behaviour.energy
    );


  coreSphere.scale.setScalar(
    corePulse
  );


  coreGlowInner.scale.setScalar(
    0.8 *
    corePulse *
    behaviour.energy
  );


  coreGlowMiddle.scale.setScalar(
    1.45 *
    (
      0.96 +
      Math.sin(
        time *
        1.5
      )
      *
      0.05
    )
    *
    behaviour.energy
  );


  coreGlowOuter.scale.setScalar(
    2.35 *
    (
      0.95 +
      Math.sin(
        time *
        1.15
      )
      *
      0.055
    )
    *
    behaviour.energy
  );


  coreGlowInner.material.opacity =
    Math.min(
      1,
      0.84 *
      behaviour.energy
    );


  coreGlowMiddle.material.opacity =
    Math.min(
      0.75,
      0.48 *
      behaviour.energy
    );


  coreGlowOuter.material.opacity =
    Math.min(
      0.5,
      0.2 *
      behaviour.energy
    );



  // ========================================================
  // Eye pulse
  // ========================================================

  const eyePulse =
    0.82 +
    Math.sin(
      time *
      1.6
    )
    *
    0.11;


  eyeMaterial.opacity =
    eyePulse;



  // ========================================================
  // Internal particle movement
  // ========================================================

  const bodyPositions =
    bodyParticleGeometry
      .getAttribute(
        "position"
      );


  for (
    let i = 0;
    i < bodyPositions.count;
    i++
  ) {

    const index =
      i *
      3;


    const baseX =
      bodyParticleBase[
        index
      ];


    const baseY =
      bodyParticleBase[
        index + 1
      ];


    const baseZ =
      bodyParticleBase[
        index + 2
      ];


    bodyPositions.setXYZ(

      i,


      baseX +

      Math.sin(
        time *
        0.82 +
        baseY *
        2.7 +
        i *
        0.017
      )
      *
      0.012,


      baseY +

      Math.sin(
        time *
        0.57 +
        baseX *
        3.0 +
        i *
        0.011
      )
      *
      0.013,


      baseZ +

      Math.cos(
        time *
        0.69 +
        baseY *
        2.2 +
        i *
        0.013
      )
      *
      0.009

    );

  }


  bodyPositions.needsUpdate =
    true;



  // ========================================================
  // Hair movement
  // ========================================================

  hairLines.forEach(
    (
      line,
      index
    ) => {

      line.rotation.z =
        Math.sin(

          time *
          0.55 +

          line
            .userData
            .phase

        )
        *
        line
          .userData
          .motion;


      line.rotation.y =
        Math.cos(

          time *
          0.43 +

          index *
          0.19

        )
        *
        0.018;

    }
  );



  // ========================================================
  // Lower body particle stream
  // ========================================================

  const tailAttribute =
    tailGeometry
      .getAttribute(
        "position"
      );


  for (
    let i = 0;
    i < tailParticleCount;
    i++
  ) {

    const index =
      i *
      3;


    const baseX =
      tailBase[
        index
      ];


    const baseY =
      tailBase[
        index + 1
      ];


    const baseZ =
      tailBase[
        index + 2
      ];


    const depth =
      Math.abs(
        baseY
      );


    tailAttribute.setXYZ(

      i,


      baseX +

      Math.sin(

        time *
        0.95 *
        behaviour.tailSpeed +

        depth *
        2.4 +

        i *
        0.019

      )
      *
      (
        0.035 +
        depth *
        0.008
      ),


      baseY +

      Math.sin(

        time *
        0.62 *
        behaviour.tailSpeed +

        i *
        0.009

      )
      *
      0.018,


      baseZ +

      Math.cos(

        time *
        0.7 *

        behaviour.tailSpeed +

        depth *
        1.8 +

        i *
        0.016

      )
      *
      0.018

    );

  }


  tailAttribute.needsUpdate =
    true;



  // ========================================================
  // Tail group sway
  // ========================================================

  tailGroup.rotation.z =
    Math.sin(

      time *
      0.38 *
      behaviour.tailSpeed

    )
    *
    0.03;



  // ========================================================
  // Tail strands
  // ========================================================

  tailStrands.forEach(
    (
      strand,
      index
    ) => {

      strand.rotation.y =
        Math.sin(

          time *
          0.24 +

          index *
          0.29

        )
        *
        0.035;

    }
  );



  // ========================================================
  // Ambient particles
  // ========================================================

  const ambientAttribute =
    ambientGeometry
      .getAttribute(
        "position"
      );


  for (
    let i = 0;
    i < ambientCount;
    i++
  ) {

    const index =
      i *
      3;


    const baseX =
      ambientBase[
        index
      ];


    const baseY =
      ambientBase[
        index + 1
      ];


    const baseZ =
      ambientBase[
        index + 2
      ];


    ambientAttribute.setXYZ(

      i,


      baseX +

      Math.sin(
        time *
        0.35 +
        i *
        0.21
      )
      *
      0.06,


      baseY +

      Math.sin(
        time *
        0.25 +
        i *
        0.13
      )
      *
      0.07,


      baseZ +

      Math.cos(
        time *
        0.28 +
        i *
        0.17
      )
      *
      0.05

    );

  }


  ambientAttribute.needsUpdate =
    true;



  // ========================================================
  // State-specific animation
  // ========================================================

  if (
    behaviour.state ===
    "thinking"
  ) {

    head.rotation.y =
      Math.sin(
        time *
        0.65
      )
      *
      0.025;


    head.rotation.z =
      -0.035;

  }

  else {

    head.rotation.z +=
      (
        0 -
        head.rotation.z
      )
      *
      0.04;

  }



  if (
    behaviour.state ===
    "talking"
  ) {

    chest.scale.y =
      1 +
      Math.sin(
        time *
        3.4
      )
      *
      0.008;

  }

  else {

    chest.scale.y +=
      (
        1 -
        chest.scale.y
      )
      *
      0.05;

  }



  // ========================================================
  // Render
  // ========================================================

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
