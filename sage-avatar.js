import * as THREE from "three";

// ==========================================================
// SAGE v0.4 — FACE, POSE & ENERGY FLOW
// ==========================================================

const mount = document.getElementById("sageAvatarMount");

if (!mount) {
  throw new Error("SAGE: #sageAvatarMount not found");
}


// ==========================================================
// Renderer
// ==========================================================

const renderer = new THREE.WebGLRenderer({
  alpha: true,
  antialias: true,
  powerPreference: "high-performance"
});

renderer.setPixelRatio(
  Math.min(window.devicePixelRatio || 1, 2)
);

renderer.setClearColor(0x000000, 0);
renderer.outputColorSpace = THREE.SRGBColorSpace;

mount.appendChild(renderer.domElement);


// ==========================================================
// Scene / Camera
// ==========================================================

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
  30,
  1,
  0.1,
  100
);

camera.position.set(
  0,
  0.05,
  12.4
);

camera.lookAt(
  0,
  0.05,
  0
);


// ==========================================================
// SAGE rigs
// ==========================================================

const sage = new THREE.Group();

sage.position.set(
  0.08,
  0.08,
  0
);

scene.add(sage);


const bodyRig = new THREE.Group();

const headRig = new THREE.Group();

const leftArmRig = new THREE.Group();

const rightArmRig = new THREE.Group();

const energyRig = new THREE.Group();

const particleRig = new THREE.Group();

const tailRig = new THREE.Group();

const hairRig = new THREE.Group();


headRig.position.set(
  0.02,
  2.63,
  0.03
);

headRig.rotation.z = -0.018;

headRig.add(hairRig);


sage.add(
  bodyRig,
  headRig,
  leftArmRig,
  rightArmRig,
  energyRig,
  particleRig,
  tailRig
);


// ==========================================================
// Glow texture
// ==========================================================

function createGlowTexture() {

  const canvas =
    document.createElement("canvas");

  canvas.width = 256;
  canvas.height = 256;

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
    0.07,
    "rgba(235,253,255,1)"
  );

  gradient.addColorStop(
    0.22,
    "rgba(97,229,255,.88)"
  );

  gradient.addColorStop(
    0.47,
    "rgba(69,126,255,.34)"
  );

  gradient.addColorStop(
    0.72,
    "rgba(138,83,255,.09)"
  );

  gradient.addColorStop(
    1,
    "rgba(0,0,0,0)"
  );

  ctx.fillStyle = gradient;

  ctx.fillRect(
    0,
    0,
    256,
    256
  );

  const texture =
    new THREE.CanvasTexture(canvas);

  texture.colorSpace =
    THREE.SRGBColorSpace;

  return texture;
}


const glowTexture =
  createGlowTexture();


// ==========================================================
// Hologram shader
// ==========================================================

function makeHologramMaterial({
  opacity = 0.68,
  dissolve = false
} = {}) {

  return new THREE.ShaderMaterial({

    transparent: true,

    side: THREE.DoubleSide,

    depthWrite: false,

    blending:
      THREE.AdditiveBlending,


    uniforms: {

      uTime: {
        value: 0
      },

      uOpacity: {
        value: opacity
      },

      uCyan: {
        value:
          new THREE.Color("#5be8ff")
      },

      uBlue: {
        value:
          new THREE.Color("#3e7fff")
      },

      uPurple: {
        value:
          new THREE.Color("#8d68ff")
      },

      uDissolve: {
        value:
          dissolve ? 1 : 0
      }

    },


    vertexShader: `

      uniform float uTime;

      varying vec3 vNormal;
      varying vec3 vView;
      varying vec3 vPosition;


      void main() {

        vec3 p =
          position;


        float shimmer =
          sin(
            position.y * 9.0 +
            position.x * 5.5 +
            uTime * 1.35
          )
          *
          0.004;


        p +=
          normal *
          shimmer;


        vec4 mv =
          modelViewMatrix *
          vec4(
            p,
            1.0
          );


        vNormal =
          normalize(
            normalMatrix *
            normal
          );


        vView =
          -mv.xyz;


        vPosition =
          position;


        gl_Position =
          projectionMatrix *
          mv;

      }

    `,


    fragmentShader: `

      precision highp float;


      uniform float uTime;

      uniform float uOpacity;

      uniform vec3 uCyan;

      uniform vec3 uBlue;

      uniform vec3 uPurple;

      uniform int uDissolve;


      varying vec3 vNormal;

      varying vec3 vView;

      varying vec3 vPosition;


      void main() {

        vec3 viewDir =
          normalize(
            vView
          );


        float fresnel =
          pow(

            1.0 -

            abs(
              dot(
                normalize(
                  vNormal
                ),
                viewDir
              )
            ),

            2.35

          );


        float flow =
          0.5 +
          0.5 *
          sin(
            vPosition.y * 12.5 -
            uTime * 2.0 +
            vPosition.x * 5.8
          );


        float detail =
          0.5 +
          0.5 *
          sin(
            vPosition.x * 31.0 +
            vPosition.y * 23.0 +
            vPosition.z * 17.0 +
            uTime * 1.45
          );


        float vertical =
          clamp(
            vPosition.y * 0.14 +
            0.5,
            0.0,
            1.0
          );


        vec3 color =
          mix(
            uPurple,
            uBlue,
            vertical
          );


        color =
          mix(
            color,
            uCyan,
            fresnel * 0.80
          );


        float alpha =
          (
            0.020 +
            fresnel * 0.55 +
            flow * 0.03
          )
          *
          uOpacity;


        if (
          uDissolve ==
          1
        ) {

          alpha *=
            smoothstep(
              -0.76,
              -0.28,
              vPosition.y
            );

        }


        float brightness =
          0.34 +
          fresnel * 2.95 +
          flow * 0.13 +
          detail * 0.05;


        gl_FragColor =
          vec4(
            color *
            brightness,

            alpha
          );

      }

    `
  });
}


const bodyMaterial =
  makeHologramMaterial({
    opacity: 0.70,
    dissolve: true
  });


const limbMaterial =
  makeHologramMaterial({
    opacity: 0.64
  });


const headMaterial =
  makeHologramMaterial({
    opacity: 0.58
  });


const hologramMaterials = [
  bodyMaterial,
  limbMaterial,
  headMaterial
];


// ==========================================================
// Glow sprite helper
// ==========================================================

function makeGlowSprite(
  parent,
  size,
  opacity,
  color
) {

  const sprite =
    new THREE.Sprite(

      new THREE.SpriteMaterial({

        map:
          glowTexture,

        color,

        transparent:
          true,

        opacity,

        blending:
          THREE.AdditiveBlending,

        depthWrite:
          false

      })

    );


  sprite.scale.set(
    size,
    size,
    1
  );


  parent.add(
    sprite
  );


  return sprite;
}


// ==========================================================
// Energy tube helper
// ==========================================================

function createTube(
  points,
  radius,
  color,
  opacity = 0.28,
  segments = 44
) {

  const curve =
    new THREE.CatmullRomCurve3(
      points,
      false,
      "catmullrom",
      0.42
    );


  const mesh =
    new THREE.Mesh(

      new THREE.TubeGeometry(
        curve,
        segments,
        radius,
        4,
        false
      ),

      new THREE.MeshBasicMaterial({

        color,

        transparent:
          true,

        opacity,

        blending:
          THREE.AdditiveBlending,

        depthWrite:
          false

      })

    );


  return {
    curve,
    mesh
  };
}


// ==========================================================
// Body profile
// ==========================================================

const bodyProfile = [

  {
    y: 2.02,
    w: 0.25,
    d: 0.19
  },

  {
    y: 1.93,
    w: 0.40,
    d: 0.22
  },

  {
    y: 1.84,
    w: 0.66,
    d: 0.27
  },

  {
    y: 1.74,
    w: 0.82,
    d: 0.32
  },

  {
    y: 1.60,
    w: 0.86,
    d: 0.38
  },

  {
    y: 1.42,
    w: 0.82,
    d: 0.42
  },

  {
    y: 1.20,
    w: 0.73,
    d: 0.39
  },

  {
    y: 0.96,
    w: 0.62,
    d: 0.35
  },

  {
    y: 0.72,
    w: 0.53,
    d: 0.31
  },

  {
    y: 0.50,
    w: 0.47,
    d: 0.29
  },

  {
    y: 0.30,
    w: 0.52,
    d: 0.31
  },

  {
    y: 0.10,
    w: 0.62,
    d: 0.35
  },

  {
    y: -0.10,
    w: 0.72,
    d: 0.39
  },

  {
    y: -0.28,
    w: 0.76,
    d: 0.40
  },

  {
    y: -0.46,
    w: 0.66,
    d: 0.35
  },

  {
    y: -0.64,
    w: 0.48,
    d: 0.27
  }

];


// ==========================================================
// Torso geometry
// ==========================================================

function makeProfileGeometry(
  profile,
  radialSegments = 80
) {

  const positions = [];

  const indices = [];


  for (
    let ring = 0;
    ring < profile.length;
    ring++
  ) {

    const section =
      profile[ring];


    for (
      let i = 0;
      i < radialSegments;
      i++
    ) {

      const angle =
        (
          i /
          radialSegments
        )
        *
        Math.PI *
        2;


      const cosine =
        Math.cos(
          angle
        );


      const sine =
        Math.sin(
          angle
        );


      let width =
        section.w;


      let depth =
        section.d;


      if (
        section.y >
        1.08 &&
        section.y <
        1.62 &&
        sine >
        0
      ) {

        depth *=
          1.04 +
          sine *
          0.035;

      }


      positions.push(

        cosine *
        width,

        section.y,

        sine *
        depth

      );

    }

  }


  for (
    let ring = 0;
    ring <
    profile.length -
    1;
    ring++
  ) {

    for (
      let i = 0;
      i <
      radialSegments;
      i++
    ) {

      const next =
        (
          i +
          1
        )
        %
        radialSegments;


      const a =
        ring *
        radialSegments +
        i;


      const b =
        ring *
        radialSegments +
        next;


      const c =
        (
          ring +
          1
        )
        *
        radialSegments +
        next;


      const d =
        (
          ring +
          1
        )
        *
        radialSegments +
        i;


      indices.push(
        a,
        d,
        b,

        b,
        d,
        c
      );

    }

  }


  const geometry =
    new THREE.BufferGeometry();


  geometry.setAttribute(

    "position",

    new THREE.Float32BufferAttribute(
      positions,
      3
    )

  );


  geometry.setIndex(
    indices
  );


  geometry.computeVertexNormals();


  return geometry;
}


const torso =
  new THREE.Mesh(

    makeProfileGeometry(
      bodyProfile
    ),

    bodyMaterial

  );


bodyRig.add(
  torso
);


// ==========================================================
// Neck
// ==========================================================

const neck =
  new THREE.Mesh(

    new THREE.CylinderGeometry(
      0.16,
      0.205,
      0.26,
      36,
      1,
      false
    ),

    limbMaterial

  );


neck.position.set(
  0.01,
  2.14,
  0.005
);


bodyRig.add(
  neck
);


// ==========================================================
// Head
// ==========================================================

function makeHeadGeometry() {

  const geometry =
    new THREE.SphereGeometry(
      1,
      80,
      80
    );


  const position =
    geometry.getAttribute(
      "position"
    );


  const vertex =
    new THREE.Vector3();


  for (
    let i = 0;
    i <
    position.count;
    i++
  ) {

    vertex.fromBufferAttribute(
      position,
      i
    );


    const originalY =
      vertex.y;


    let scaleX =
      0.455;


    let scaleY =
      0.515;


    let scaleZ =
      0.385;


    // fuller cranium
    if (
      originalY >
      0.30
    ) {

      scaleX *=
        1.025;

    }


    // cheekbone area
    if (
      originalY <
      0.08 &&
      originalY >
      -0.28
    ) {

      scaleX *=
        1.045;

    }


    // tapered jaw
    if (
      originalY <
      -0.16
    ) {

      const amount =
        THREE.MathUtils.clamp(

          (
            -originalY -
            0.16
          )
          /
          0.84,

          0,
          1

        );


      scaleX *=
        THREE.MathUtils.lerp(
          1,
          0.70,
          amount
        );


      scaleZ *=
        THREE.MathUtils.lerp(
          1,
          0.86,
          amount
        );

    }


    vertex.x *=
      scaleX;


    vertex.y *=
      scaleY;


    vertex.z *=
      scaleZ;


    if (
      vertex.z >
      0
    ) {

      const faceBand =
        1 -
        Math.min(

          Math.abs(
            vertex.y
          )
          /
          0.50,

          1

        );


      vertex.z +=
        0.030 *
        faceBand;


      if (
        vertex.y <
        -0.20
      ) {

        vertex.z +=
          0.012;

      }

    }


    position.setXYZ(
      i,
      vertex.x,
      vertex.y,
      vertex.z
    );

  }


  position.needsUpdate =
    true;


  geometry.computeVertexNormals();


  return geometry;
}


const head =
  new THREE.Mesh(

    makeHeadGeometry(),

    headMaterial

  );


headRig.add(
  head
);


// ==========================================================
// Nose / face detail
// ==========================================================

const nose =
  createTube(

    [

      new THREE.Vector3(
        0,
        0.10,
        0.388
      ),

      new THREE.Vector3(
        0,
        0.02,
        0.420
      ),

      new THREE.Vector3(
        0,
        -0.07,
        0.405
      )

    ],

    0.006,

    "#6ddfff",

    0.22,

    20

  );


headRig.add(
  nose.mesh
);


// ==========================================================
// Eyes
// ==========================================================

const eyeMaterial =
  new THREE.MeshBasicMaterial({

    color:
      "#d9fbff",

    transparent:
      true,

    opacity:
      0.68,

    blending:
      THREE.AdditiveBlending,

    depthWrite:
      false

  });


function makeEye(
  x
) {

  const eye =
    new THREE.Mesh(

      new THREE.SphereGeometry(
        0.040,
        18,
        10
      ),

      eyeMaterial

    );


  eye.scale.set(
    1.25,
    0.20,
    0.34
  );


  eye.position.set(
    x,
    0.055,
    0.397
  );


  headRig.add(
    eye
  );


  return eye;
}


makeEye(
  -0.145
);


makeEye(
  0.145
);


// ==========================================================
// Variable radius arm geometry
// ==========================================================

function makeVariableTube(
  points,
  radiusAt,
  material,
  tubularSegments = 54,
  radialSegments = 16
) {

  const curve =
    new THREE.CatmullRomCurve3(
      points,
      false,
      "catmullrom",
      0.38
    );


  const frames =
    curve.computeFrenetFrames(
      tubularSegments,
      false
    );


  const positions = [];

  const indices = [];


  for (
    let i = 0;
    i <= tubularSegments;
    i++
  ) {

    const t =
      i /
      tubularSegments;


    const center =
      curve.getPointAt(
        t
      );


    const normal =
      frames.normals[i];


    const binormal =
      frames.binormals[i];


    const radius =
      radiusAt(
        t
      );


    for (
      let j = 0;
      j <
      radialSegments;
      j++
    ) {

      const angle =
        (
          j /
          radialSegments
        )
        *
        Math.PI *
        2;


      const offset =
        normal
          .clone()
          .multiplyScalar(
            Math.cos(angle) *
            radius
          )
          .add(

            binormal
              .clone()
              .multiplyScalar(
                Math.sin(angle) *
                radius
              )

          );


      const point =
        center
          .clone()
          .add(
            offset
          );


      positions.push(
        point.x,
        point.y,
        point.z
      );

    }

  }


  for (
    let i = 0;
    i <
    tubularSegments;
    i++
  ) {

    for (
      let j = 0;
      j <
      radialSegments;
      j++
    ) {

      const next =
        (
          j +
          1
        )
        %
        radialSegments;


      const a =
        i *
        radialSegments +
        j;


      const b =
        i *
        radialSegments +
        next;


      const c =
        (
          i +
          1
        )
        *
        radialSegments +
        next;


      const d =
        (
          i +
          1
        )
        *
        radialSegments +
        j;


      indices.push(
        a,
        d,
        b,

        b,
        d,
        c
      );

    }

  }


  const geometry =
    new THREE.BufferGeometry();


  geometry.setAttribute(

    "position",

    new THREE.Float32BufferAttribute(
      positions,
      3
    )

  );


  geometry.setIndex(
    indices
  );


  geometry.computeVertexNormals();


  return {

    curve,

    mesh:
      new THREE.Mesh(
        geometry,
        material
      )

  };
}


// ==========================================================
// Relaxed asymmetric arms
// ==========================================================

const leftArmPoints = [

  new THREE.Vector3(
    -0.77,
    1.69,
    0
  ),

  new THREE.Vector3(
    -0.96,
    1.44,
    0.03
  ),

  new THREE.Vector3(
    -1.15,
    1.02,
    0.08
  ),

  new THREE.Vector3(
    -1.34,
    0.58,
    0.15
  ),

  new THREE.Vector3(
    -1.51,
    0.22,
    0.23
  )

];


const rightArmPoints = [

  new THREE.Vector3(
    0.77,
    1.67,
    0.01
  ),

  new THREE.Vector3(
    0.99,
    1.40,
    0.04
  ),

  new THREE.Vector3(
    1.18,
    0.94,
    0.10
  ),

  new THREE.Vector3(
    1.37,
    0.52,
    0.18
  ),

  new THREE.Vector3(
    1.60,
    0.16,
    0.28
  )

];


function armRadiusAt(
  t
) {

  if (
    t <
    0.45
  ) {

    return THREE.MathUtils.lerp(
      0.17,
      0.12,
      t /
      0.45
    );

  }


  return THREE.MathUtils.lerp(

    0.12,

    0.065,

    (
      t -
      0.45
    )
    /
    0.55

  );
}


const leftArm =
  makeVariableTube(
    leftArmPoints,
    armRadiusAt,
    limbMaterial
  );


const rightArm =
  makeVariableTube(
    rightArmPoints,
    armRadiusAt,
    limbMaterial
  );


leftArmRig.add(
  leftArm.mesh
);


rightArmRig.add(
  rightArm.mesh
);


// ==========================================================
// Shoulder blending
// ==========================================================

function makeShoulder(
  x,
  y,
  rotationZ
) {

  const shoulder =
    new THREE.Mesh(

      new THREE.SphereGeometry(
        1,
        36,
        28
      ),

      limbMaterial

    );


  shoulder.position.set(
    x,
    y,
    0.01
  );


  shoulder.scale.set(
    0.26,
    0.16,
    0.22
  );


  shoulder.rotation.z =
    rotationZ;


  bodyRig.add(
    shoulder
  );

}


makeShoulder(
  -0.74,
  1.70,
  -0.20
);


makeShoulder(
  0.74,
  1.68,
  0.20
);


// ==========================================================
// Hands
// ==========================================================

function makeHand(
  position,
  side,
  spreadScale = 1
) {

  const rig =
    side <
    0
      ? leftArmRig
      : rightArmRig;


  const palm =
    new THREE.Mesh(

      new THREE.SphereGeometry(
        1,
        28,
        20
      ),

      limbMaterial

    );


  palm.scale.set(
    0.085,
    0.145,
    0.060
  );


  palm.position.copy(
    position
  );


  palm.rotation.z =
    side *
    -0.18;


  rig.add(
    palm
  );


  const fingerMaterial =
    new THREE.LineBasicMaterial({

      color:
        "#6fe5ff",

      transparent:
        true,

      opacity:
        0.34,

      blending:
        THREE.AdditiveBlending,

      depthWrite:
        false

    });


  for (
    let i = 0;
    i < 5;
    i++
  ) {

    const spread =
      (
        i -
        2
      )
      *
      0.025
      *
      spreadScale;


    const length =
      0.095 +
      (
        2 -
        Math.abs(
          i -
          2
        )
      )
      *
      0.018;


    const start =
      new THREE.Vector3(

        position.x +
        spread,

        position.y -
        0.055,

        position.z

      );


    const end =
      new THREE.Vector3(

        position.x +
        spread +
        side *
        (
          i -
          2
        )
        *
        0.010,

        position.y -
        0.055 -
        length,

        position.z +
        0.012

      );


    rig.add(

      new THREE.Line(

        new THREE.BufferGeometry()
          .setFromPoints([
            start,
            end
          ]),

        fingerMaterial

      )

    );

  }

}


makeHand(

  new THREE.Vector3(
    -1.52,
    0.08,
    0.24
  ),

  -1,

  0.85

);


makeHand(

  new THREE.Vector3(
    1.61,
    0.02,
    0.29
  ),

  1,

  1.15

);


// ==========================================================
// Chest core
// ==========================================================

const core =
  new THREE.Group();


core.position.set(
  0,
  1.30,
  0.455
);


sage.add(
  core
);


const coreSphere =
  new THREE.Mesh(

    new THREE.SphereGeometry(
      0.055,
      24,
      24
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


core.add(
  coreSphere
);


const coreInner =
  makeGlowSprite(
    core,
    0.38,
    0.96,
    "#ddfdff"
  );


const coreMid =
  makeGlowSprite(
    core,
    0.82,
    0.42,
    "#59ddff"
  );


const coreOuter =
  makeGlowSprite(
    core,
    1.55,
    0.15,
    "#5e6fff"
  );


// ==========================================================
// Star rays
// ==========================================================

const rayPoints = [];


for (
  let i = 0;
  i < 16;
  i++
) {

  const angle =
    (
      i /
      16
    )
    *
    Math.PI *
    2;


  const inner =
    0.055;


  const outer =
    i %
    2 ===
    0
      ? 0.26
      : 0.17;


  rayPoints.push(

    new THREE.Vector3(
      Math.cos(angle) *
      inner,

      Math.sin(angle) *
      inner,

      0
    ),

    new THREE.Vector3(
      Math.cos(angle) *
      outer,

      Math.sin(angle) *
      outer,

      0
    )

  );

}


const coreRays =
  new THREE.LineSegments(

    new THREE.BufferGeometry()
      .setFromPoints(
        rayPoints
      ),

    new THREE.LineBasicMaterial({

      color:
        "#93efff",

      transparent:
        true,

      opacity:
        0.30,

      blending:
        THREE.AdditiveBlending,

      depthWrite:
        false

    })

  );


core.add(
  coreRays
);


// ==========================================================
// Long organic energy fibres
// ==========================================================

const energyFibres = [];


function addEnergy(
  points,
  radius,
  color,
  opacity
) {

  const result =
    createTube(
      points,
      radius,
      color,
      opacity,
      48
    );


  energyRig.add(
    result.mesh
  );


  energyFibres.push(
    result.mesh
  );


  return result.mesh;
}


// Central flow

addEnergy(

  [

    new THREE.Vector3(
      0,
      2.16,
      0.08
    ),

    new THREE.Vector3(
      0.02,
      1.80,
      0.14
    ),

    new THREE.Vector3(
      0,
      1.31,
      0.38
    ),

    new THREE.Vector3(
      -0.03,
      0.86,
      0.26
    ),

    new THREE.Vector3(
      0.02,
      0.42,
      0.20
    ),

    new THREE.Vector3(
      -0.02,
      -0.10,
      0.10
    ),

    new THREE.Vector3(
      0,
      -0.48,
      0.02
    )

  ],

  0.009,

  "#79ecff",

  0.42

);


// Core → shoulders

for (
  const side of [
    -1,
    1
  ]
) {

  addEnergy(

    [

      new THREE.Vector3(
        0,
        1.31,
        0.39
      ),

      new THREE.Vector3(
        side *
        0.27,
        1.46,
        0.34
      ),

      new THREE.Vector3(
        side *
        0.53,
        1.61,
        0.25
      ),

      new THREE.Vector3(
        side *
        0.75,
        1.68,
        0.12
      )

    ],

    0.007,

    side <
    0
      ? "#5ce0ff"
      : "#8976ff",

    0.28

  );

}


// Torso flow lanes

for (
  const side of [
    -1,
    1
  ]
) {

  for (
    let lane = 0;
    lane < 3;
    lane++
  ) {

    const outward =
      0.34 +
      lane *
      0.11;


    addEnergy(

      [

        new THREE.Vector3(
          side *
          0.18,
          1.42 -
          lane *
          0.05,
          0.30
        ),

        new THREE.Vector3(
          side *
          outward,
          1.08,
          0.28
        ),

        new THREE.Vector3(
          side *
          (
            0.28 +
            lane *
            0.06
          ),
          0.70,
          0.24
        ),

        new THREE.Vector3(
          side *
          (
            0.20 +
            lane *
            0.05
          ),
          0.30,
          0.18
        ),

        new THREE.Vector3(
          side *
          (
            0.31 +
            lane *
            0.04
          ),
          -0.18,
          0.10
        )

      ],

      0.0055,

      lane ===
      2
        ? "#916fff"
        : "#55cfff",

      0.17 +
      lane *
      0.02

    );

  }

}


// Arm energy

function addArmEnergy(
  curve,
  color
) {

  const points = [];


  for (
    let i = 0;
    i <= 14;
    i++
  ) {

    points.push(
      curve.getPointAt(
        i /
        14
      )
    );

  }


  const result =
    createTube(
      points,
      0.0045,
      color,
      0.20,
      36
    );


  energyRig.add(
    result.mesh
  );

}


addArmEnergy(
  leftArm.curve,
  "#59dcff"
);


addArmEnergy(
  rightArm.curve,
  "#8675ff"
);


// ==========================================================
// Face energy fibres
// ==========================================================

for (
  const side of [
    -1,
    1
  ]
) {

  const faceEnergy =
    createTube(

      [

        new THREE.Vector3(
          side *
          0.10,
          -0.33,
          0.28
        ),

        new THREE.Vector3(
          side *
          0.13,
          -0.05,
          0.34
        ),

        new THREE.Vector3(
          side *
          0.12,
          0.18,
          0.33
        ),

        new THREE.Vector3(
          side *
          0.08,
          0.34,
          0.24
        )

      ],

      0.0045,

      side <
      0
        ? "#5adfff"
        : "#8a76ff",

      0.19,

      28

    );


  headRig.add(
    faceEnergy.mesh
  );

}


// ==========================================================
// Particle system
// ==========================================================

const CYAN =
  new THREE.Color(
    "#63e8ff"
  );


const BLUE =
  new THREE.Color(
    "#4a86ff"
  );


const PURPLE =
  new THREE.Color(
    "#956fff"
  );


function randomColor() {

  const random =
    Math.random();


  if (
    random <
    0.42
  ) {

    return CYAN;

  }


  if (
    random <
    0.78
  ) {

    return BLUE;

  }


  return PURPLE;
}


function profileAtY(
  y
) {

  if (
    y >=
    bodyProfile[0].y
  ) {

    return bodyProfile[0];

  }


  const last =
    bodyProfile[
      bodyProfile.length -
      1
    ];


  if (
    y <=
    last.y
  ) {

    return last;

  }


  for (
    let i = 0;
    i <
    bodyProfile.length -
    1;
    i++
  ) {

    const a =
      bodyProfile[i];


    const b =
      bodyProfile[
        i +
        1
      ];


    if (
      y <=
      a.y &&
      y >=
      b.y
    ) {

      const amount =
        (
          a.y -
          y
        )
        /
        (
          a.y -
          b.y
        );


      return {

        y,

        w:
          THREE.MathUtils.lerp(
            a.w,
            b.w,
            amount
          ),

        d:
          THREE.MathUtils.lerp(
            a.d,
            b.d,
            amount
          )

      };

    }

  }


  return bodyProfile[0];
}


const particlePositions = [];

const particleBase = [];

const particleColors = [];


function pushParticle(
  point
) {

  particlePositions.push(
    point.x,
    point.y,
    point.z
  );


  particleBase.push(
    point.x,
    point.y,
    point.z
  );


  const color =
    randomColor();


  particleColors.push(
    color.r,
    color.g,
    color.b
  );

}


// Torso particles

for (
  let i = 0;
  i < 1900;
  i++
) {

  const y =
    THREE.MathUtils.lerp(
      -0.50,
      1.94,
      Math.random()
    );


  const profile =
    profileAtY(
      y
    );


  const angle =
    Math.random() *
    Math.PI *
    2;


  const radius =
    Math.sqrt(
      Math.random()
    );


  pushParticle(

    new THREE.Vector3(

      Math.cos(angle) *
      profile.w *
      radius *
      0.92,

      y,

      Math.sin(angle) *
      profile.d *
      radius *
      0.90

    )

  );

}


// Head particles

for (
  let i = 0;
  i < 420;
  i++
) {

  let point;


  do {

    point =
      new THREE.Vector3(

        Math.random() *
        2 -
        1,

        Math.random() *
        2 -
        1,

        Math.random() *
        2 -
        1

      );

  }
  while (
    point.lengthSq() >
    1
  );


  const jawAmount =
    point.y <
    -0.15
      ? THREE.MathUtils.clamp(
          (
            -point.y -
            0.15
          )
          /
          0.85,
          0,
          1
        )
      : 0;


  const jawScale =
    THREE.MathUtils.lerp(
      1,
      0.72,
      jawAmount
    );


  pushParticle(

    new THREE.Vector3(

      point.x *
      0.42 *
      jawScale,

      point.y *
      0.50 +
      2.63,

      point.z *
      0.35

    )

  );

}


const particleGeometry =
  new THREE.BufferGeometry();


particleGeometry.setAttribute(

  "position",

  new THREE.Float32BufferAttribute(
    particlePositions,
    3
  )

);


particleGeometry.setAttribute(

  "color",

  new THREE.Float32BufferAttribute(
    particleColors,
    3
  )

);


const bodyParticles =
  new THREE.Points(

    particleGeometry,

    new THREE.PointsMaterial({

      size:
        0.034,

      map:
        glowTexture,

      transparent:
        true,

      opacity:
        0.74,

      depthWrite:
        false,

      vertexColors:
        true,

      blending:
        THREE.AdditiveBlending

    })

  );


particleRig.add(
  bodyParticles
);


// ==========================================================
// Internal network
// ==========================================================

const samplePoints = [];


for (
  let i = 0;
  i <
  particleBase.length;
  i += 15
) {

  samplePoints.push(

    new THREE.Vector3(

      particleBase[i],

      particleBase[
        i +
        1
      ],

      particleBase[
        i +
        2
      ]

    )

  );

}


const networkPositions = [];


let networkConnections =
  0;


let networkAttempts =
  0;


while (
  networkConnections <
  520 &&
  networkAttempts <
  26000
) {

  networkAttempts++;


  const a =
    samplePoints[
      Math.floor(
        Math.random() *
        samplePoints.length
      )
    ];


  const b =
    samplePoints[
      Math.floor(
        Math.random() *
        samplePoints.length
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
    distance >
    0.10 &&
    distance <
    0.36
  ) {

    networkPositions.push(

      a.x,
      a.y,
      a.z,

      b.x,
      b.y,
      b.z

    );


    networkConnections++;

  }

}


const network =
  new THREE.LineSegments(

    new THREE.BufferGeometry()
      .setAttribute(

        "position",

        new THREE.Float32BufferAttribute(
          networkPositions,
          3
        )

      ),

    new THREE.LineBasicMaterial({

      color:
        "#63aaff",

      transparent:
        true,

      opacity:
        0.12,

      blending:
        THREE.AdditiveBlending,

      depthWrite:
        false

    })

  );


particleRig.add(
  network
);


// ==========================================================
// Hair
// ==========================================================

const hairStrands = [];


const hairColors = [
  "#65e8ff",
  "#58beff",
  "#6f8cff",
  "#9574ff"
];


for (
  let i = 0;
  i < 66;
  i++
) {

  const angle =
    THREE.MathUtils.lerp(

      -Math.PI *
      0.98,

      Math.PI *
      0.98,

      i /
      65

    );


  const rootX =
    Math.sin(angle) *
    (
      0.25 +
      Math.random() *
      0.14
    );


  const rootY =
    0.31 +
    Math.cos(angle) *
    0.20;


  const rootZ =
    -0.05 -
    Math.abs(
      Math.sin(angle)
    )
    *
    0.12;


  const side =
    Math.sign(
      rootX ||
      1
    );


  const asymmetry =
    side <
    0
      ? 1.10
      : 0.92;


  const length =
    (
      0.58 +
      Math.random() *
      1.25
    )
    *
    asymmetry;


  const curve =
    new THREE.CatmullRomCurve3(

      [

        new THREE.Vector3(
          rootX,
          rootY,
          rootZ
        ),

        new THREE.Vector3(

          rootX +
          side *
          (
            0.12 +
            Math.random() *
            0.16
          ),

          rootY -
          length *
          0.25,

          rootZ -
          0.05

        ),

        new THREE.Vector3(

          rootX +
          side *
          (
            0.28 +
            Math.random() *
            0.28
          ),

          rootY -
          length *
          0.58,

          rootZ +
          0.01

        ),

        new THREE.Vector3(

          rootX +
          side *
          (
            0.44 +
            Math.random() *
            0.40
          ),

          rootY -
          length,

          rootZ +
          0.07

        )

      ]

    );


  const strand =
    new THREE.Mesh(

      new THREE.TubeGeometry(

        curve,

        36,

        0.0045 +
        Math.random() *
        0.0025,

        3,

        false

      ),

      new THREE.MeshBasicMaterial({

        color:
          hairColors[
            i %
            hairColors.length
          ],

        transparent:
          true,

        opacity:
          0.15 +
          Math.random() *
          0.20,

        blending:
          THREE.AdditiveBlending,

        depthWrite:
          false

      })

    );


  strand.userData.phase =
    Math.random() *
    Math.PI *
    2;


  strand.userData.motion =
    0.010 +
    Math.random() *
    0.022;


  hairRig.add(
    strand
  );


  hairStrands.push(
    strand
  );

}


// ==========================================================
// Lower-body energy stream
// ==========================================================

const tailParticleCount =
  1750;


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


const tailColors =
  new Float32Array(
    tailParticleCount *
    3
  );


for (
  let i = 0;
  i <
  tailParticleCount;
  i++
) {

  const t =
    Math.random();


  const y =
    -0.46 -
    t *
    3.45;


  const width =
    0.74 *
    (
      1 -
      t *
      0.77
    )
    +
    0.08;


  const ribbon =
    Math.sin(

      t *
      7.5 +

      Math.random() *
      2

    );


  const x =

    ribbon *
    width *
    (
      0.48 +
      Math.random() *
      0.52
    )

    +

    (
      Math.random() *
      2 -
      1
    )
    *
    width *
    0.28;


  const z =

    Math.cos(

      t *
      6.2 +

      Math.random() *
      1.2

    )
    *
    width *
    0.16

    +

    (
      Math.random() *
      2 -
      1
    )
    *
    0.10;


  const index =
    i *
    3;


  tailPositions[index] =
    tailBase[index] =
    x;


  tailPositions[
    index +
    1
  ] =
    tailBase[
      index +
      1
    ] =
    y;


  tailPositions[
    index +
    2
  ] =
    tailBase[
      index +
      2
    ] =
    z;


  const color =
    randomColor();


  tailColors[index] =
    color.r;


  tailColors[
    index +
    1
  ] =
    color.g;


  tailColors[
    index +
    2
  ] =
    color.b;

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
    tailColors,
    3
  )

);


const tailParticles =
  new THREE.Points(

    tailGeometry,

    new THREE.PointsMaterial({

      size:
        0.040,

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

    })

  );


tailRig.add(
  tailParticles
);


// ==========================================================
// Tail ribbons
// ==========================================================

const tailStrands = [];


for (
  let i = 0;
  i < 28;
  i++
) {

  const phase =
    (
      i /
      28
    )
    *
    Math.PI *
    2;


  const points = [];


  for (
    let j = 0;
    j <= 58;
    j++
  ) {

    const t =
      j /
      58;


    const y =
      -0.40 -
      t *
      3.55;


    const radius =
      0.67 *
      (
        1 -
        t *
        0.79
      );


    const wave =
      phase +
      t *
      (
        7.0 +
        (
          i %
          4
        )
        *
        0.28
      );


    const sideSweep =
      Math.sin(
        t *
        Math.PI
      )
      *
      (
        i %
        2 ===
        0
          ? 0.13
          : -0.10
      );


    points.push(

      new THREE.Vector3(

        Math.sin(
          wave
        )
        *
        radius
        +
        sideSweep,

        y,

        Math.cos(
          wave *
          0.78
        )
        *
        radius *
        0.14

      )

    );

  }


  const color =

    i %
    3 ===
    0
      ? "#61e7ff"
      :

    i %
    3 ===
    1
      ? "#4f8bff"
      :

      "#936dff";


  const result =
    createTube(

      points,

      0.0045 +
      (
        i %
        4
      )
      *
      0.0005,

      color,

      0.15 +
      (
        i %
        3
      )
      *
      0.025,

      52

    );


  result.mesh.userData.phase =
    phase;


  tailRig.add(
    result.mesh
  );


  tailStrands.push(
    result.mesh
  );

}


// ==========================================================
// Aura
// ==========================================================

const aura =
  new THREE.Sprite(

    new THREE.SpriteMaterial({

      map:
        glowTexture,

      color:
        "#456dff",

      transparent:
        true,

      opacity:
        0.085,

      blending:
        THREE.AdditiveBlending,

      depthWrite:
        false

    })

  );


aura.position.set(
  0,
  0.60,
  -0.85
);


aura.scale.set(
  5.2,
  7.2,
  1
);


sage.add(
  aura
);


// ==========================================================
// Behaviour
// ==========================================================

const behaviour = {

  state:
    "idle",

  energy:
    1,

  targetEnergy:
    1,

  opacity:
    0.70,

  targetOpacity:
    0.70,

  tailSpeed:
    1,

  targetTailSpeed:
    1,

  hairSpeed:
    1,

  targetHairSpeed:
    1

};


function setState(
  state
) {

  behaviour.state =
    state;


  const presets = {

    idle: [
      1,
      0.70,
      1,
      1
    ],

    thinking: [
      1.28,
      0.61,
      0.70,
      0.78
    ],

    talking: [
      1.42,
      0.76,
      1.12,
      1.14
    ],

    moving: [
      1.16,
      0.56,
      1.82,
      1.60
    ],

    curious: [
      1.12,
      0.73,
      0.92,
      0.92
    ]

  };


  const preset =
    presets[state] ||
    presets.idle;


  behaviour.targetEnergy =
    preset[0];


  behaviour.targetOpacity =
    preset[1];


  behaviour.targetTailSpeed =
    preset[2];


  behaviour.targetHairSpeed =
    preset[3];

}


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

  event => {

    pointer.x =
      (
        event.clientX /
        window.innerWidth
      )
      *
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
    !width ||
    !height
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


new ResizeObserver(
  resize
).observe(
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


  behaviour.energy +=
    (
      behaviour.targetEnergy -
      behaviour.energy
    )
    *
    0.045;


  behaviour.opacity +=
    (
      behaviour.targetOpacity -
      behaviour.opacity
    )
    *
    0.045;


  behaviour.tailSpeed +=
    (
      behaviour.targetTailSpeed -
      behaviour.tailSpeed
    )
    *
    0.045;


  behaviour.hairSpeed +=
    (
      behaviour.targetHairSpeed -
      behaviour.hairSpeed
    )
    *
    0.045;


  // Shader time

  hologramMaterials.forEach(
    material => {

      material
        .uniforms
        .uTime
        .value =
        time;

    }
  );


  bodyMaterial
    .uniforms
    .uOpacity
    .value =
    behaviour.opacity;


  limbMaterial
    .uniforms
    .uOpacity
    .value =
    behaviour.opacity *
    0.92;


  headMaterial
    .uniforms
    .uOpacity
    .value =
    behaviour.opacity *
    0.86;


  // Floating motion

  sage.position.y =
    0.08 +
    Math.sin(
      time *
      0.66
    )
    *
    0.045;


  sage.rotation.z =
    -0.008 +
    Math.sin(
      time *
      0.34
    )
    *
    0.010;


  // Follow cursor

  sage.rotation.y +=
    (
      pointer.x *
      0.055 -
      sage.rotation.y
    )
    *
    0.016;


  headRig.rotation.y +=
    (
      pointer.x *
      0.105 -
      headRig.rotation.y
    )
    *
    0.024;


  headRig.rotation.x +=
    (
      pointer.y *
      0.030 -
      headRig.rotation.x
    )
    *
    0.020;


  // Core

  const pulse =
    1 +
    Math.sin(
      time *
      2 *
      behaviour.energy
    )
    *
    0.050 *
    behaviour.energy;


  coreSphere.scale.setScalar(
    pulse
  );


  coreInner.scale.setScalar(
    0.38 *
    pulse *
    behaviour.energy
  );


  coreMid.scale.setScalar(

    0.82 *

    (
      0.96 +
      Math.sin(
        time *
        1.35
      )
      *
      0.045
    )

    *

    behaviour.energy

  );


  coreOuter.scale.setScalar(

    1.55 *

    (
      0.95 +
      Math.sin(
        time
      )
      *
      0.05
    )

    *

    behaviour.energy

  );


  coreRays.rotation.z =
    time *
    0.12;


  coreRays.material.opacity =
    Math.min(
      0.48,
      0.24 *
      behaviour.energy
    );


  // Eyes

  eyeMaterial.opacity =
    0.64 +
    Math.sin(
      time *
      1.45
    )
    *
    0.055;


  // Body particle drift

  const particleAttribute =
    particleGeometry.getAttribute(
      "position"
    );


  for (
    let i = 0;
    i <
    particleAttribute.count;
    i++
  ) {

    const index =
      i *
      3;


    const baseX =
      particleBase[
        index
      ];


    const baseY =
      particleBase[
        index +
        1
      ];


    const baseZ =
      particleBase[
        index +
        2
      ];


    particleAttribute.setXYZ(

      i,

      baseX +
      Math.sin(
        time *
        0.76 +
        baseY *
        2.8 +
        i *
        0.014
      )
      *
      0.009,


      baseY +
      Math.sin(
        time *
        0.52 +
        baseX *
        3 +
        i *
        0.010
      )
      *
      0.010,


      baseZ +
      Math.cos(
        time *
        0.64 +
        baseY *
        2 +
        i *
        0.012
      )
      *
      0.007

    );

  }


  particleAttribute.needsUpdate =
    true;


  // Energy breathing

  energyFibres.forEach(
    (
      fibre,
      index
    ) => {

      fibre.material.opacity =

        0.16 +

        (
          index %
          4
        )
        *
        0.025

        +

        Math.sin(
          time +
          index *
          0.55
        )
        *
        0.025;

    }
  );


  // Hair movement

  hairStrands.forEach(
    (
      strand,
      index
    ) => {

      strand.rotation.z =

        Math.sin(

          time *
          0.46 *
          behaviour.hairSpeed +

          strand
            .userData
            .phase

        )

        *

        strand
          .userData
          .motion

        *

        behaviour.hairSpeed;


      strand.rotation.y =

        Math.cos(

          time *
          0.33 +

          index *
          0.17

        )

        *

        0.015

        *

        behaviour.hairSpeed;

    }
  );


  // Tail particles

  const tailAttribute =
    tailGeometry.getAttribute(
      "position"
    );


  for (
    let i = 0;
    i <
    tailParticleCount;
    i++
  ) {

    const index =
      i *
      3;


    const baseX =
      tailBase[index];


    const baseY =
      tailBase[
        index +
        1
      ];


    const baseZ =
      tailBase[
        index +
        2
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
        0.90 *
        behaviour.tailSpeed +

        depth *
        2.1 +

        i *
        0.016

      )

      *

      (
        0.035 +
        depth *
        0.007
      ),


      baseY +

      Math.sin(

        time *
        0.55 *
        behaviour.tailSpeed +

        i *
        0.008

      )

      *
      0.017,


      baseZ +

      Math.cos(

        time *
        0.63 *
        behaviour.tailSpeed +

        depth *
        1.6 +

        i *
        0.014

      )

      *
      0.015

    );

  }


  tailAttribute.needsUpdate =
    true;


  tailRig.rotation.z =

    Math.sin(

      time *
      0.30 *
      behaviour.tailSpeed

    )

    *
    0.023;


  tailStrands.forEach(
    (
      strand,
      index
    ) => {

      strand.rotation.y =

        Math.sin(

          time *
          0.18 *
          behaviour.tailSpeed +

          index *
          0.22

        )

        *
        0.026;

    }
  );


  // Slight asymmetrical arm motion

  leftArmRig.rotation.z =

    -0.012 +

    Math.sin(
      time *
      0.42
    )
    *
    0.006;


  rightArmRig.rotation.z =

    0.016 +

    Math.sin(
      time *
      0.39 +
      1.2
    )
    *
    0.007;


  // Head behaviour

  const targetTilt =

    behaviour.state ===
    "thinking"
      ? -0.040
      :

    behaviour.state ===
    "curious"
      ? 0.050
      :

      -0.018;


  headRig.rotation.z +=

    (
      targetTilt -
      headRig.rotation.z
    )

    *
    0.035;


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
