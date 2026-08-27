import * as THREE from "three";

const mount = document.getElementById("sageAvatarMount");

if (!mount) {
  throw new Error("SAGE: #sageAvatarMount not found");
}

/* =========================================================
   RENDERER
========================================================= */

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


/* =========================================================
   SCENE
========================================================= */

const scene = new THREE.Scene();


/* =========================================================
   CAMERA
========================================================= */

const camera = new THREE.PerspectiveCamera(
  32,
  1,
  0.1,
  100
);

camera.position.set(
  0,
  0.05,
  12.8
);

camera.lookAt(
  0,
  -0.05,
  0
);


/* =========================================================
   SAGE ROOT
========================================================= */

const sage = new THREE.Group();

sage.position.set(
  0.15,
  0.08,
  0
);

scene.add(sage);


/* =========================================================
   BODY RIGS
========================================================= */

const torsoRig = new THREE.Group();
const armRig = new THREE.Group();
const particleRig = new THREE.Group();
const tailRig = new THREE.Group();
const headRig = new THREE.Group();
const hairRig = new THREE.Group();

headRig.position.set(
  0,
  2.66,
  0.02
);

headRig.add(hairRig);

sage.add(
  torsoRig,
  armRig,
  particleRig,
  tailRig,
  headRig
);


/* =========================================================
   GLOW TEXTURE
========================================================= */

function makeGlowTexture() {

  const canvas = document.createElement("canvas");

  canvas.width = 256;
  canvas.height = 256;

  const ctx = canvas.getContext("2d");

  const gradient = ctx.createRadialGradient(
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
    0.08,
    "rgba(230,252,255,1)"
  );

  gradient.addColorStop(
    0.24,
    "rgba(90,225,255,.82)"
  );

  gradient.addColorStop(
    0.5,
    "rgba(70,120,255,.30)"
  );

  gradient.addColorStop(
    0.74,
    "rgba(130,80,255,.08)"
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
  makeGlowTexture();


/* =========================================================
   HOLOGRAM SHADER
========================================================= */

function makeHologramMaterial({
  opacity = 0.75,
  dissolve = false
} = {}) {

  return new THREE.ShaderMaterial({

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
        value: opacity
      },

      uCyan: {
        value:
          new THREE.Color("#55e5ff")
      },

      uBlue: {
        value:
          new THREE.Color("#397fff")
      },

      uPurple: {
        value:
          new THREE.Color("#8a68ff")
      },

      uDissolve: {
        value:
          dissolve
            ? 1
            : 0
      }

    },

    vertexShader: `

      uniform float uTime;

      varying vec3 vN;
      varying vec3 vV;
      varying vec3 vP;

      void main() {

        vec3 p = position;

        p +=
          normal *
          sin(
            position.y * 9.0 +
            position.x * 5.0 +
            uTime * 1.4
          ) *
          0.005;

        vec4 mv =
          modelViewMatrix *
          vec4(
            p,
            1.0
          );

        vN =
          normalize(
            normalMatrix *
            normal
          );

        vV =
          -mv.xyz;

        vP =
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

      varying vec3 vN;
      varying vec3 vV;
      varying vec3 vP;

      void main() {

        vec3 viewDir =
          normalize(vV);

        float fresnel =
          pow(
            1.0 -
            abs(
              dot(
                normalize(vN),
                viewDir
              )
            ),
            2.2
          );

        float flow =
          0.5 +
          0.5 *
          sin(
            vP.y * 12.0 -
            uTime * 2.0 +
            vP.x * 5.0
          );

        float micro =
          0.5 +
          0.5 *
          sin(
            vP.x * 30.0 +
            vP.y * 22.0 +
            uTime * 1.6
          );

        float vertical =
          clamp(
            vP.y * 0.15 + 0.5,
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
            fresnel * 0.78
          );

        float alpha =
          (
            0.03 +
            fresnel * 0.60 +
            flow * 0.04
          ) *
          uOpacity;

        if (
          uDissolve == 1
        ) {

          alpha *=
            smoothstep(
              -0.68,
              -0.30,
              vP.y
            );

        }

        float brightness =
          0.42 +
          fresnel * 2.65 +
          flow * 0.15 +
          micro * 0.07;

        gl_FragColor =
          vec4(
            color * brightness,
            alpha
          );

      }

    `

  });

}


/* =========================================================
   MATERIALS
========================================================= */

const torsoMaterial =
  makeHologramMaterial({
    opacity: 0.76,
    dissolve: true
  });

const limbMaterial =
  makeHologramMaterial({
    opacity: 0.72
  });

const headMaterial =
  makeHologramMaterial({
    opacity: 0.67
  });

const hologramMaterials = [
  torsoMaterial,
  limbMaterial,
  headMaterial
];


/* =========================================================
   BODY PROFILE — SAGE V03
========================================================= */

const bodyProfile = [

  {
    y: 2.08,
    w: 0.18,
    d: 0.16
  },

  {
    y: 1.96,
    w: 0.30,
    d: 0.20
  },

  {
    y: 1.82,
    w: 0.70,
    d: 0.28
  },

  {
    y: 1.60,
    w: 0.79,
    d: 0.35
  },

  {
    y: 1.36,
    w: 0.75,
    d: 0.39
  },

  {
    y: 1.10,
    w: 0.61,
    d: 0.34
  },

  {
    y: 0.86,
    w: 0.49,
    d: 0.28
  },

  {
    y: 0.60,
    w: 0.46,
    d: 0.27
  },

  {
    y: 0.35,
    w: 0.54,
    d: 0.31
  },

  {
    y: 0.10,
    w: 0.68,
    d: 0.36
  },

  {
    y: -0.14,
    w: 0.77,
    d: 0.40
  },

  {
    y: -0.38,
    w: 0.63,
    d: 0.34
  },

  {
    y: -0.62,
    w: 0.34,
    d: 0.22
  }

];


/* =========================================================
   CUSTOM BODY GEOMETRY
========================================================= */

function makeProfileGeometry(
  profile,
  radial = 64
) {

  const positions = [];

  const indices = [];

  for (
    let r = 0;
    r < profile.length;
    r++
  ) {

    const p =
      profile[r];

    for (
      let i = 0;
      i < radial;
      i++
    ) {

      const angle =
        (
          i /
          radial
        ) *
        Math.PI *
        2;

      const cos =
        Math.cos(angle);

      const sin =
        Math.sin(angle);

      const frontBias =
        Math.max(
          sin,
          0
        ) *
        p.d *
        0.08;

      positions.push(

        cos *
        p.w,

        p.y,

        sin *
        p.d +
        frontBias

      );

    }

  }


  for (
    let r = 0;
    r < profile.length - 1;
    r++
  ) {

    for (
      let i = 0;
      i < radial;
      i++
    ) {

      const next =
        (
          i + 1
        ) %
        radial;

      const a =
        r *
        radial +
        i;

      const b =
        r *
        radial +
        next;

      const c =
        (
          r + 1
        ) *
        radial +
        next;

      const d =
        (
          r + 1
        ) *
        radial +
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


/* =========================================================
   TORSO
========================================================= */

const torso =
  new THREE.Mesh(

    makeProfileGeometry(
      bodyProfile
    ),

    torsoMaterial

  );

torsoRig.add(
  torso
);


/* =========================================================
   NECK
========================================================= */

function taperedCylinder(
  start,
  end,
  r0,
  r1,
  material
) {

  const direction =
    new THREE.Vector3()
      .subVectors(
        end,
        start
      );


  const mesh =
    new THREE.Mesh(

      new THREE.CylinderGeometry(
        r1,
        r0,
        direction.length(),
        28,
        1,
        false
      ),

      material

    );


  mesh.position.copy(

    start
      .clone()
      .add(end)
      .multiplyScalar(
        0.5
      )

  );


  mesh.quaternion.setFromUnitVectors(

    new THREE.Vector3(
      0,
      1,
      0
    ),

    direction
      .clone()
      .normalize()

  );


  return mesh;

}


torsoRig.add(

  taperedCylinder(

    new THREE.Vector3(
      0,
      2.04,
      0
    ),

    new THREE.Vector3(
      0,
      2.26,
      0.01
    ),

    0.18,

    0.15,

    limbMaterial

  )

);


/* =========================================================
   HEAD
========================================================= */

function makeHeadGeometry() {

  const geometry =
    new THREE.SphereGeometry(
      1,
      64,
      64
    );


  const positions =
    geometry.getAttribute(
      "position"
    );


  const vector =
    new THREE.Vector3();


  for (
    let i = 0;
    i < positions.count;
    i++
  ) {

    vector.fromBufferAttribute(
      positions,
      i
    );


    const originalY =
      vector.y;


    let scaleX =
      0.39;

    let scaleZ =
      0.36;


    /*
      Slightly narrower forehead
    */

    if (
      originalY >
      0.58
    ) {

      scaleX *=
        THREE.MathUtils.lerp(

          1,

          0.86,

          (
            originalY -
            0.58
          ) /
          0.42

        );

    }


    /*
      Gentle cheek width
    */

    if (
      originalY <
      0.24 &&
      originalY >
      -0.18
    ) {

      scaleX *=
        1.03;

    }


    /*
      Feminine jaw + chin taper
    */

    if (
      originalY <
      -0.10
    ) {

      const t =
        THREE.MathUtils.clamp(

          (
            -originalY -
            0.10
          ) /
          0.90,

          0,

          1

        );


      scaleX *=
        THREE.MathUtils.lerp(
          1,
          0.58,
          t
        );


      scaleZ *=
        THREE.MathUtils.lerp(
          1,
          0.80,
          t
        );

    }


    vector.x *=
      scaleX;


    vector.y *=
      0.57;


    vector.z *=
      scaleZ;


    /*
      Tiny amount of facial projection
    */

    if (
      vector.z >
      0
    ) {

      const faceBand =
        1 -
        Math.min(

          Math.abs(
            vector.y
          ) /
          0.55,

          1

        );


      vector.z +=
        0.018 *
        faceBand;

    }


    positions.setXYZ(

      i,

      vector.x,

      vector.y,

      vector.z

    );

  }


  positions.needsUpdate =
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


/* =========================================================
   EYES
========================================================= */

const eyeMaterial =
  new THREE.MeshBasicMaterial({

    color:
      "#dcfbff",

    transparent:
      true,

    opacity:
      0.85,

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
        0.06,
        18,
        10
      ),

      eyeMaterial

    );


  eye.scale.set(
    1.15,
    0.32,
    0.42
  );


  eye.position.set(
    x,
    0.065,
    0.365
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


/* =========================================================
   VARIABLE TUBE
========================================================= */

function makeVariableTube(
  points,
  radiusAt,
  material,
  tubular = 40,
  radial = 14
) {

  const curve =
    new THREE.CatmullRomCurve3(

      points,

      false,

      "catmullrom",

      0.4

    );


  const frames =
    curve.computeFrenetFrames(
      tubular,
      false
    );


  const positions = [];

  const indices = [];


  for (
    let i = 0;
    i <= tubular;
    i++
  ) {

    const t =
      i /
      tubular;


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
      j < radial;
      j++
    ) {

      const angle =
        (
          j /
          radial
        ) *
        Math.PI *
        2;


      const offset =
        normal
          .clone()
          .multiplyScalar(

            Math.cos(
              angle
            ) *
            radius

          )
          .add(

            binormal
              .clone()
              .multiplyScalar(

                Math.sin(
                  angle
                ) *
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
    i < tubular;
    i++
  ) {

    for (
      let j = 0;
      j < radial;
      j++
    ) {

      const next =
        (
          j + 1
        ) %
        radial;


      const a =
        i *
        radial +
        j;


      const b =
        i *
        radial +
        next;


      const c =
        (
          i + 1
        ) *
        radial +
        next;


      const d =
        (
          i + 1
        ) *
        radial +
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


/* =========================================================
   ARMS
========================================================= */

const leftArmPoints = [

  new THREE.Vector3(
    -0.72,
    1.69,
    0.00
  ),

  new THREE.Vector3(
    -0.92,
    1.44,
    0.03
  ),

  new THREE.Vector3(
    -1.11,
    0.92,
    0.07
  ),

  new THREE.Vector3(
    -1.30,
    0.39,
    0.12
  ),

  new THREE.Vector3(
    -1.46,
    -0.02,
    0.17
  )

];


const rightArmPoints = [

  new THREE.Vector3(
    0.72,
    1.69,
    0.00
  ),

  new THREE.Vector3(
    0.92,
    1.44,
    0.03
  ),

  new THREE.Vector3(
    1.11,
    0.92,
    0.07
  ),

  new THREE.Vector3(
    1.30,
    0.39,
    0.12
  ),

  new THREE.Vector3(
    1.46,
    -0.02,
    0.17
  )

];


function armRadius(
  t
) {

  if (
    t <
    0.36
  ) {

    return THREE.MathUtils.lerp(

      0.15,

      0.11,

      t /
      0.36

    );

  }


  return THREE.MathUtils.lerp(

    0.11,

    0.058,

    (
      t -
      0.36
    ) /
    0.64

  );

}


const leftArm =
  makeVariableTube(
    leftArmPoints,
    armRadius,
    limbMaterial
  );


const rightArm =
  makeVariableTube(
    rightArmPoints,
    armRadius,
    limbMaterial
  );


armRig.add(
  leftArm.mesh,
  rightArm.mesh
);


/* =========================================================
   ELLIPSOIDS
========================================================= */

function ellipsoid(
  scale,
  position,
  material
) {

  const mesh =
    new THREE.Mesh(

      new THREE.SphereGeometry(
        1,
        32,
        24
      ),

      material

    );


  mesh.scale.copy(
    scale
  );


  mesh.position.copy(
    position
  );


  return mesh;

}


/* =========================================================
   SHOULDERS
========================================================= */

armRig.add(

  ellipsoid(

    new THREE.Vector3(
      0.22,
      0.17,
      0.20
    ),

    new THREE.Vector3(
      -0.70,
      1.68,
      0.01
    ),

    limbMaterial

  ),


  ellipsoid(

    new THREE.Vector3(
      0.22,
      0.17,
      0.20
    ),

    new THREE.Vector3(
      0.70,
      1.68,
      0.01
    ),

    limbMaterial

  )

);


/* =========================================================
   HANDS
========================================================= */

function makeHand(
  position,
  side
) {

  const hand =
    ellipsoid(

      new THREE.Vector3(
        0.085,
        0.18,
        0.065
      ),

      position,

      limbMaterial

    );


  hand.rotation.z =
    side *
    -0.12;


  hand.rotation.x =
    0.10;


  armRig.add(
    hand
  );


  const fingerMaterial =
    new THREE.LineBasicMaterial({

      color:
        "#69ddff",

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
        i - 2
      ) *
      0.026;


    const length =
      0.12 +
      (
        2 -
        Math.abs(
          i - 2
        )
      ) *
      0.018;


    const geometry =
      new THREE.BufferGeometry()
        .setFromPoints([

          new THREE.Vector3(

            position.x +
            spread,

            position.y -
            0.09,

            position.z

          ),

          new THREE.Vector3(

            position.x +
            spread +
            side *
            (
              i - 2
            ) *
            0.006,

            position.y -
            0.09 -
            length,

            position.z +
            0.01

          )

        ]);


    armRig.add(

      new THREE.Line(
        geometry,
        fingerMaterial
      )

    );

  }

}


makeHand(

  new THREE.Vector3(
    -1.48,
    -0.16,
    0.17
  ),

  -1

);


makeHand(

  new THREE.Vector3(
    1.48,
    -0.16,
    0.17
  ),

  1

);


/* =========================================================
   CORE
========================================================= */

const coreGroup =
  new THREE.Group();


coreGroup.position.set(
  0,
  1.34,
  0.42
);


sage.add(
  coreGroup
);


const coreSphere =
  new THREE.Mesh(

    new THREE.SphereGeometry(
      0.085,
      28,
      28
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


/* =========================================================
   CORE GLOW
========================================================= */

function glowSprite(
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


  coreGroup.add(
    sprite
  );


  return sprite;

}


const coreInner =
  glowSprite(
    0.62,
    0.94,
    "#b7f5ff"
  );


const coreMid =
  glowSprite(
    1.20,
    0.48,
    "#55d5ff"
  );


const coreOuter =
  glowSprite(
    2.10,
    0.19,
    "#586fff"
  );


/* =========================================================
   BODY AURA
========================================================= */

const aura =
  new THREE.Sprite(

    new THREE.SpriteMaterial({

      map:
        glowTexture,

      color:
        "#416fff",

      transparent:
        true,

      opacity:
        0.11,

      blending:
        THREE.AdditiveBlending,

      depthWrite:
        false

    })

  );


aura.position.set(
  0,
  0.65,
  -0.8
);


aura.scale.set(
  4.8,
  6.8,
  1
);


sage.add(
  aura
);


/* =========================================================
   PROFILE INTERPOLATION
========================================================= */

function profileAtY(
  y
) {

  if (
    y >=
    bodyProfile[0].y
  ) {

    return bodyProfile[0];

  }


  if (
    y <=
    bodyProfile[
      bodyProfile.length - 1
    ].y
  ) {

    return bodyProfile[
      bodyProfile.length - 1
    ];

  }


  for (
    let i = 0;
    i <
    bodyProfile.length - 1;
    i++
  ) {

    const a =
      bodyProfile[i];

    const b =
      bodyProfile[
        i + 1
      ];


    if (
      y <= a.y &&
      y >= b.y
    ) {

      const t =
        (
          a.y -
          y
        ) /
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
            t
          ),

        d:
          THREE.MathUtils.lerp(
            a.d,
            b.d,
            t
          )

      };

    }

  }


  return bodyProfile[0];

}


/* =========================================================
   BODY PARTICLES
========================================================= */

const pPos = [];
const pBase = [];
const pColors = [];


const CYAN =
  new THREE.Color(
    "#62e7ff"
  );


const BLUE =
  new THREE.Color(
    "#4b87ff"
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
    0.38
  ) {

    return CYAN;

  }


  if (
    random <
    0.76
  ) {

    return BLUE;

  }


  return PURPLE;

}


function pushParticle(
  point
) {

  pPos.push(
    point.x,
    point.y,
    point.z
  );


  pBase.push(
    point.x,
    point.y,
    point.z
  );


  const color =
    randomColor();


  pColors.push(
    color.r,
    color.g,
    color.b
  );

}


/*
  Torso particle field
*/

for (
  let i = 0;
  i < 1350;
  i++
) {

  const y =
    THREE.MathUtils.lerp(

      -0.48,

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


/*
  Head particles
*/

for (
  let i = 0;
  i < 360;
  i++
) {

  let point;


  do {

    point =
      new THREE.Vector3(

        Math.random() * 2 - 1,

        Math.random() * 2 - 1,

        Math.random() * 2 - 1

      );

  }
  while (
    point.lengthSq() >
    1
  );


  const jaw =
    point.y <
    -0.18

      ? THREE.MathUtils.lerp(

          1,

          0.62,

          THREE.MathUtils.clamp(

            (
              -point.y -
              0.18
            ) /
            0.82,

            0,

            1

          )

        )

      : 1;


  pushParticle(

    new THREE.Vector3(

      point.x *
      0.37 *
      jaw,

      point.y *
      0.53 +
      2.66,

      point.z *
      0.34

    )

  );

}


/* =========================================================
   ARM PARTICLES
========================================================= */

function curveParticles(
  curve,
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
      curve.getPointAt(
        t
      );


    const radius =
      armRadius(
        t
      ) *
      0.70;


    point.x +=
      (
        Math.random() * 2 - 1
      ) *
      radius;


    point.y +=
      (
        Math.random() * 2 - 1
      ) *
      radius;


    point.z +=
      (
        Math.random() * 2 - 1
      ) *
      radius;


    pushParticle(
      point
    );

  }

}


curveParticles(
  leftArm.curve,
  260
);


curveParticles(
  rightArm.curve,
  260
);


/* =========================================================
   PARTICLE OBJECT
========================================================= */

const particleGeometry =
  new THREE.BufferGeometry();


particleGeometry.setAttribute(

  "position",

  new THREE.Float32BufferAttribute(
    pPos,
    3
  )

);


particleGeometry.setAttribute(

  "color",

  new THREE.Float32BufferAttribute(
    pColors,
    3
  )

);


const bodyParticles =
  new THREE.Points(

    particleGeometry,

    new THREE.PointsMaterial({

      size:
        0.032,

      map:
        glowTexture,

      transparent:
        true,

      opacity:
        0.68,

      alphaTest:
        0.02,

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


/* =========================================================
   HAIR
========================================================= */

const hairStrands = [];


const hairColors = [

  "#64e7ff",

  "#5b92ff",

  "#8d70ff",

  "#57c8ff"

];


for (
  let i = 0;
  i < 52;
  i++
) {

  const normalized =
    i /
    51;


  const angle =
    THREE.MathUtils.lerp(

      -Math.PI *
      0.88,

      Math.PI *
      0.88,

      normalized

    );


  const rootX =
    Math.sin(angle) *
    (
      0.22 +
      Math.random() *
      0.12
    );


  const rootY =
    0.30 +
    Math.cos(angle) *
    0.21;


  const rootZ =
    -0.05 -
    Math.abs(
      Math.sin(angle)
    ) *
    0.12;


  const side =
    Math.sign(
      rootX || 1
    );


  const length =
    0.95 +
    Math.random() *
    1.20;


  const curve =
    new THREE.CatmullRomCurve3([

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
          0.13
        ),

        rootY -
        length *
        0.28,

        rootZ -
        0.06

      ),


      new THREE.Vector3(

        rootX +
        side *
        (
          0.24 +
          Math.random() *
          0.20
        ),

        rootY -
        length *
        0.61,

        rootZ +
        0.015

      ),


      new THREE.Vector3(

        rootX +
        side *
        (
          0.36 +
          Math.random() *
          0.28
        ),

        rootY -
        length,

        rootZ +
        0.06

      )

    ]);


  const strand =
    new THREE.Mesh(

      new THREE.TubeGeometry(

        curve,

        34,

        0.006,

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
          0.20 +
          Math.random() *
          0.18,

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
    0.016;


  hairRig.add(
    strand
  );


  hairStrands.push(
    strand
  );

}


/* =========================================================
   PARTICLE TAIL
========================================================= */

const tailCount =
  1450;


const tailPositions =
  new Float32Array(
    tailCount *
    3
  );


const tailBase =
  new Float32Array(
    tailCount *
    3
  );


const tailColors =
  new Float32Array(
    tailCount *
    3
  );


for (
  let i = 0;
  i < tailCount;
  i++
) {

  const t =
    Math.random();


  const y =
    -0.46 -
    t *
    3.40;


  /*
    Wider at the hip,
    then gradually dissolves.
  */

  const width =
    0.52 *
    (
      1 -
      t *
      0.76
    ) +
    0.07;


  const swirl =
    t *
    8.5 +
    Math.random() *
    1.8;


  const x =

    Math.sin(
      swirl
    ) *

    width *

    (
      0.32 +
      Math.random() *
      0.68
    )

    +

    (
      Math.random() * 2 - 1
    ) *

    width *
    0.35;


  const z =

    Math.cos(
      swirl
    ) *

    width *
    0.20

    +

    (
      Math.random() * 2 - 1
    ) *
    0.10;


  const index =
    i *
    3;


  tailPositions[index] =
    tailBase[index] =
      x;


  tailPositions[
    index + 1
  ] =
    tailBase[
      index + 1
    ] =
      y;


  tailPositions[
    index + 2
  ] =
    tailBase[
      index + 2
    ] =
      z;


  const color =
    randomColor();


  tailColors[index] =
    color.r;


  tailColors[
    index + 1
  ] =
    color.g;


  tailColors[
    index + 2
  ] =
    color.b;

}


/* =========================================================
   TAIL GEOMETRY
========================================================= */

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


tailRig.add(

  new THREE.Points(

    tailGeometry,

    new THREE.PointsMaterial({

      size:
        0.037,

      map:
        glowTexture,

      transparent:
        true,

      opacity:
        0.68,

      depthWrite:
        false,

      vertexColors:
        true,

      blending:
        THREE.AdditiveBlending

    })

  )

);


/* =========================================================
   ENERGY STRANDS IN TAIL
========================================================= */

const tailStrands = [];


for (
  let i = 0;
  i < 20;
  i++
) {

  const phase =
    (
      i /
      20
    ) *
    Math.PI *
    2;


  const points = [];


  for (
    let j = 0;
    j <= 46;
    j++
  ) {

    const t =
      j /
      46;


    const y =
      -0.42 -
      t *
      3.45;


    const radius =
      0.49 *
      (
        1 -
        t *
        0.74
      );


    points.push(

      new THREE.Vector3(

        Math.sin(

          phase +
          t *
          7.8

        ) *
        radius,


        y,


        Math.cos(

          phase +
          t *
          6.0

        ) *
        radius *
        0.17

      )

    );

  }


  const color =

    i % 3 === 0

      ? "#61e6ff"

      : i % 3 === 1

        ? "#4c89ff"

        : "#906cff";


  const strand =
    new THREE.Mesh(

      new THREE.TubeGeometry(

        new THREE.CatmullRomCurve3(
          points
        ),

        44,

        0.005,

        3,

        false

      ),

      new THREE.MeshBasicMaterial({

        color,

        transparent:
          true,

        opacity:
          0.20,

        blending:
          THREE.AdditiveBlending,

        depthWrite:
          false

      })

    );


  tailRig.add(
    strand
  );


  tailStrands.push(
    strand
  );

}


/* =========================================================
   BEHAVIOUR
========================================================= */

const behaviour = {

  state:
    "idle",

  energy:
    1,

  targetEnergy:
    1,

  bodyOpacity:
    0.76,

  targetBodyOpacity:
    0.76,

  tailSpeed:
    1,

  targetTailSpeed:
    1,

  hairMotion:
    1,

  targetHairMotion:
    1

};


/* =========================================================
   STATES
========================================================= */

function setState(
  state
) {

  behaviour.state =
    state;


  const presets = {

    idle: [
      1.00,
      0.76,
      1.00,
      1.00
    ],

    thinking: [
      1.28,
      0.67,
      0.72,
      0.78
    ],

    talking: [
      1.44,
      0.81,
      1.08,
      1.12
    ],

    moving: [
      1.14,
      0.59,
      1.72,
      1.55
    ],

    curious: [
      1.12,
      0.78,
      0.92,
      0.92
    ]

  };


  const preset =
    presets[state] ||
    presets.idle;


  behaviour.targetEnergy =
    preset[0];


  behaviour.targetBodyOpacity =
    preset[1];


  behaviour.targetTailSpeed =
    preset[2];


  behaviour.targetHairMotion =
    preset[3];

}


/* =========================================================
   EXPOSE SAGE API
========================================================= */

window.SAGEAvatar = {

  setState,

  getState:
    () =>
      behaviour.state,

  getObject3D:
    () =>
      sage

};


/* =========================================================
   POINTER FOLLOW
========================================================= */

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
      ) *
      2 -
      1;


    pointer.y =

      -(

        (
          event.clientY /
          window.innerHeight
        ) *
        2 -
        1

      );

  }

);


/* =========================================================
   RESIZE
========================================================= */

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


/* =========================================================
   ANIMATION
========================================================= */

const clock =
  new THREE.Clock();


function animate() {

  const t =
    clock.getElapsedTime();


  /*
    Smooth state interpolation
  */

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


  behaviour.hairMotion +=

    (
      behaviour.targetHairMotion -
      behaviour.hairMotion
    ) *
    0.045;


  /*
    Shader time
  */

  hologramMaterials.forEach(

    material => {

      material.uniforms.uTime.value =
        t;

    }

  );


  torsoMaterial
    .uniforms
    .uOpacity
    .value =

      behaviour.bodyOpacity;


  limbMaterial
    .uniforms
    .uOpacity
    .value =

      behaviour.bodyOpacity *
      0.95;


  headMaterial
    .uniforms
    .uOpacity
    .value =

      behaviour.bodyOpacity *
      0.90;


  /*
    Floating movement
  */

  sage.position.y =

    0.08 +

    Math.sin(
      t *
      0.70
    ) *

    0.048;


  sage.rotation.z =

    Math.sin(
      t *
      0.38
    ) *

    0.011;


  /*
    Look toward cursor
  */

  sage.rotation.y +=

    (
      pointer.x *
      0.075 -
      sage.rotation.y
    ) *

    0.018;


  headRig.rotation.y +=

    (
      pointer.x *
      0.105 -
      headRig.rotation.y
    ) *

    0.028;


  headRig.rotation.x +=

    (
      pointer.y *
      0.035 -
      headRig.rotation.x
    ) *

    0.024;


  /*
    Core pulse
  */

  const pulse =

    1 +

    Math.sin(

      t *
      (
        2.0 *
        behaviour.energy
      )

    ) *

    0.06 *

    behaviour.energy;


  coreSphere.scale.setScalar(
    pulse
  );


  coreInner.scale.setScalar(

    0.62 *
    pulse *
    behaviour.energy

  );


  coreMid.scale.setScalar(

    1.20 *

    (
      0.96 +

      Math.sin(
        t *
        1.4
      ) *

      0.05

    ) *

    behaviour.energy

  );


  coreOuter.scale.setScalar(

    2.10 *

    (
      0.95 +

      Math.sin(
        t *
        1.08
      ) *

      0.06

    ) *

    behaviour.energy

  );


  /*
    Eyes
  */

  eyeMaterial.opacity =

    0.76 +

    Math.sin(
      t *
      1.55
    ) *

    0.08;


  /*
    Body particles
  */

  const particlePosition =
    particleGeometry.getAttribute(
      "position"
    );


  for (
    let i = 0;
    i < particlePosition.count;
    i++
  ) {

    const index =
      i *
      3;


    const baseX =
      pBase[
        index
      ];


    const baseY =
      pBase[
        index + 1
      ];


    const baseZ =
      pBase[
        index + 2
      ];


    particlePosition.setXYZ(

      i,


      baseX +

      Math.sin(

        t *
        0.80 +

        baseY *
        2.8 +

        i *
        0.015

      ) *

      0.010,


      baseY +

      Math.sin(

        t *
        0.56 +

        baseX *
        3.1 +

        i *
        0.010

      ) *

      0.012,


      baseZ +

      Math.cos(

        t *
        0.69 +

        baseY *
        2.1 +

        i *
        0.012

      ) *

      0.008

    );

  }


  particlePosition.needsUpdate =
    true;


  /*
    Hair movement
  */

  hairStrands.forEach(

    (
      strand,
      index
    ) => {

      strand.rotation.z =

        Math.sin(

          t *
          0.50 *
          behaviour.hairMotion +

          strand.userData.phase

        ) *

        strand.userData.motion *

        behaviour.hairMotion;


      strand.rotation.y =

        Math.cos(

          t *
          0.37 +

          index *
          0.21

        ) *

        0.015 *

        behaviour.hairMotion;

    }

  );


  /*
    Tail particle movement
  */

  const tailPosition =
    tailGeometry.getAttribute(
      "position"
    );


  for (
    let i = 0;
    i < tailCount;
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


    tailPosition.setXYZ(

      i,


      baseX +

      Math.sin(

        t *
        0.94 *
        behaviour.tailSpeed +

        depth *
        2.35 +

        i *
        0.018

      ) *

      (
        0.032 +

        depth *
        0.007
      ),


      baseY +

      Math.sin(

        t *
        0.58 *
        behaviour.tailSpeed +

        i *
        0.008

      ) *

      0.016,


      baseZ +

      Math.cos(

        t *
        0.67 *
        behaviour.tailSpeed +

        depth *
        1.75 +

        i *
        0.014

      ) *

      0.016

    );

  }


  tailPosition.needsUpdate =
    true;


  tailRig.rotation.z =

    Math.sin(

      t *
      0.34 *
      behaviour.tailSpeed

    ) *

    0.024;


  /*
    Tail energy strands
  */

  tailStrands.forEach(

    (
      strand,
      index
    ) => {

      strand.rotation.y =

        Math.sin(

          t *
          0.21 *
          behaviour.tailSpeed +

          index *
          0.27

        ) *

        0.026;

    }

  );


  /*
    Thinking / curious head tilt
  */

  const targetTilt =

    behaviour.state ===
    "thinking"

      ? -0.035

      : behaviour.state ===
        "curious"

        ? 0.045

        : 0;


  headRig.rotation.z +=

    (
      targetTilt -
      headRig.rotation.z
    ) *

    0.04;


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
