import * as THREE from "three";


// ==========================================================
// SAGE v0.3
// HUMAN FORM + ENERGY NETWORK
// ==========================================================

const mount =
  document.getElementById("sageAvatarMount");


if (!mount) {
  throw new Error(
    "SAGE: #sageAvatarMount not found"
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
// Scene / camera
// ==========================================================

const scene =
  new THREE.Scene();


const camera =
  new THREE.PerspectiveCamera(
    31,
    1,
    0.1,
    100
  );


camera.position.set(
  0,
  0.08,
  12.7
);


camera.lookAt(
  0,
  0,
  0
);


// ==========================================================
// SAGE root
// ==========================================================

const sage =
  new THREE.Group();


sage.position.set(
  0.1,
  0.08,
  0
);


scene.add(
  sage
);


const bodyRig =
  new THREE.Group();


const headRig =
  new THREE.Group();


const armRig =
  new THREE.Group();


const hairRig =
  new THREE.Group();


const particleRig =
  new THREE.Group();


const energyRig =
  new THREE.Group();


const tailRig =
  new THREE.Group();


headRig.position.set(
  0,
  2.67,
  0.015
);


headRig.add(
  hairRig
);


sage.add(
  bodyRig,
  headRig,
  armRig,
  particleRig,
  energyRig,
  tailRig
);


// ==========================================================
// Glow texture
// ==========================================================

function makeGlowTexture() {

  const canvas =
    document.createElement(
      "canvas"
    );


  canvas.width =
    256;


  canvas.height =
    256;


  const ctx =
    canvas.getContext(
      "2d"
    );


  const glow =
    ctx.createRadialGradient(
      128,
      128,
      0,
      128,
      128,
      128
    );


  glow.addColorStop(
    0,
    "rgba(255,255,255,1)"
  );


  glow.addColorStop(
    0.08,
    "rgba(230,252,255,1)"
  );


  glow.addColorStop(
    0.23,
    "rgba(87,226,255,.82)"
  );


  glow.addColorStop(
    0.48,
    "rgba(68,128,255,.3)"
  );


  glow.addColorStop(
    0.72,
    "rgba(128,81,255,.08)"
  );


  glow.addColorStop(
    1,
    "rgba(0,0,0,0)"
  );


  ctx.fillStyle =
    glow;


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
  makeGlowTexture();


// ==========================================================
// Hologram shader
// ==========================================================

function makeHologramMaterial({
  opacity = 0.72,
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
          new THREE.Color(
            "#58e8ff"
          )
      },

      uBlue: {
        value:
          new THREE.Color(
            "#397fff"
          )
      },

      uPurple: {
        value:
          new THREE.Color(
            "#8c68ff"
          )
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

      varying vec3 vNormal;
      varying vec3 vView;
      varying vec3 vPosition;


      void main() {

        vec3 p =
          position;


        float wave =
          sin(
            position.y * 10.0 +
            position.x * 5.5 +
            uTime * 1.35
          )
          *
          0.0045;


        p +=
          normal *
          wave;


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

        vec3 viewDirection =
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
                viewDirection
              )
            ),
            2.3
          );


        float current =
          0.5 +
          0.5 *
          sin(
            vPosition.y * 13.0 -
            uTime * 2.0 +
            vPosition.x * 6.0
          );


        float detail =
          0.5 +
          0.5 *
          sin(
            vPosition.x * 34.0 +
            vPosition.y * 22.0 +
            vPosition.z * 19.0 +
            uTime * 1.4
          );


        float vertical =
          clamp(
            vPosition.y *
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
            fresnel *
            0.78
          );


        float alpha =
          (
            0.024 +
            fresnel *
            0.57 +
            current *
            0.035
          )
          *
          uOpacity;


        if (
          uDissolve ==
          1
        ) {

          float fade =
            smoothstep(
              -0.67,
              -0.28,
              vPosition.y
            );


          alpha *=
            fade;

        }


        float brightness =
          0.38 +
          fresnel *
          2.8 +
          current *
          0.13 +
          detail *
          0.06;


        gl_FragColor =
          vec4(
            colour *
            brightness,
            alpha
          );

      }

    `
  });
}


const bodyMaterial =
  makeHologramMaterial({
    opacity: 0.72,
    dissolve: true
  });


const limbMaterial =
  makeHologramMaterial({
    opacity: 0.67
  });


const headMaterial =
  makeHologramMaterial({
    opacity: 0.63
  });


const hologramMaterials = [
  bodyMaterial,
  limbMaterial,
  headMaterial
];


// ==========================================================
// Continuous body profile
// ==========================================================

const bodyProfile = [

  {
    y: 2.03,
    width: 0.27,
    depth: 0.20
  },

  {
    y: 1.93,
    width: 0.43,
    depth: 0.24
  },

  {
    y: 1.82,
    width: 0.73,
    depth: 0.29
  },

  {
    y: 1.70,
    width: 0.88,
    depth: 0.34
  },

  {
    y: 1.52,
    width: 0.86,
    depth: 0.41
  },

  {
    y: 1.31,
    width: 0.80,
    depth: 0.43
  },

  {
    y: 1.08,
    width: 0.69,
    depth: 0.38
  },

  {
    y: 0.82,
    width: 0.57,
    depth: 0.33
  },

  {
    y: 0.56,
    width: 0.48,
    depth: 0.30
  },

  {
    y: 0.34,
    width: 0.52,
    depth: 0.31
  },

  {
    y: 0.12,
    width: 0.63,
    depth: 0.36
  },

  {
    y: -0.10,
    width: 0.74,
    depth: 0.40
  },

  {
    y: -0.30,
    width: 0.78,
    depth: 0.41
  },

  {
    y: -0.50,
    width: 0.66,
    depth: 0.36
  },

  {
    y: -0.68,
    width: 0.46,
    depth: 0.28
  }

];


// ==========================================================
// Build torso geometry
// ==========================================================

function buildBodyGeometry(
  profile,
  radialSegments = 72
) {

  const positions = [];

  const indices = [];


  for (
    let ring = 0;
    ring <
    profile.length;
    ring++
  ) {

    const section =
      profile[ring];


    for (
      let i = 0;
      i <
      radialSegments;
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


      const cos =
        Math.cos(
          angle
        );


      const sin =
        Math.sin(
          angle
        );


      let width =
        section.width;


      let depth =
        section.depth;


      // Small organic variation
      // across chest / ribs.
      if (
        section.y >
        1.05 &&
        section.y <
        1.65
      ) {

        depth *=
          1 +
          Math.max(
            sin,
            0
          )
          *
          0.07;

      }


      positions.push(

        cos *
        width,

        section.y,

        sin *
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

    buildBodyGeometry(
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

function createCylinderBetween(
  start,
  end,
  radiusStart,
  radiusEnd,
  material
) {

  const direction =
    new THREE.Vector3()
      .subVectors(
        end,
        start
      );


  const length =
    direction.length();


  const mesh =
    new THREE.Mesh(

      new THREE.CylinderGeometry(
        radiusEnd,
        radiusStart,
        length,
        32,
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


  return mesh;
}


bodyRig.add(

  createCylinderBetween(

    new THREE.Vector3(
      0,
      2.02,
      0
    ),

    new THREE.Vector3(
      0,
      2.27,
      0
    ),

    0.215,

    0.17,

    limbMaterial

  )

);


// ==========================================================
// More human head
// ==========================================================

function buildHeadGeometry() {

  const geometry =
    new THREE.SphereGeometry(
      1,
      72,
      72
    );


  const positions =
    geometry.getAttribute(
      "position"
    );


  const vertex =
    new THREE.Vector3();


  for (
    let i = 0;
    i <
    positions.count;
    i++
  ) {

    vertex.fromBufferAttribute(
      positions,
      i
    );


    const originalY =
      vertex.y;


    let width =
      0.43;


    let depth =
      0.39;


    // Cranium
    if (
      originalY >
      0.45
    ) {

      width *=
        THREE.MathUtils.lerp(
          1,
          0.91,
          (
            originalY -
            0.45
          )
          /
          0.55
        );

    }


    // Cheekbones
    if (
      originalY <
      0.22 &&
      originalY >
      -0.22
    ) {

      width *=
        1.055;

    }


    // Jaw
    if (
      originalY <
      -0.18
    ) {

      const jaw =
        THREE.MathUtils.clamp(

          (
            -originalY -
            0.18
          )
          /
          0.82,

          0,
          1

        );


      width *=
        THREE.MathUtils.lerp(
          1,
          0.66,
          jaw
        );


      depth *=
        THREE.MathUtils.lerp(
          1,
          0.82,
          jaw
        );

    }


    vertex.x *=
      width;


    vertex.y *=
      0.56;


    vertex.z *=
      depth;


    // Soft facial projection
    if (
      vertex.z >
      0
    ) {

      const centerFace =
        1 -
        Math.min(
          Math.abs(
            vertex.y
          )
          /
          0.54,
          1
        );


      vertex.z +=
        centerFace *
        0.035;

    }


    positions.setXYZ(
      i,
      vertex.x,
      vertex.y,
      vertex.z
    );

  }


  positions.needsUpdate =
    true;


  geometry.computeVertexNormals();


  return geometry;
}


const head =
  new THREE.Mesh(

    buildHeadGeometry(),

    headMaterial

  );


headRig.add(
  head
);


// ==========================================================
// Eyes
// ==========================================================

const eyeMaterial =
  new THREE.MeshBasicMaterial({

    color:
      "#c9f7ff",

    transparent:
      true,

    opacity:
      0.76,

    blending:
      THREE.AdditiveBlending,

    depthWrite:
      false

  });


function createEye(
  x
) {

  const eye =
    new THREE.Mesh(

      new THREE.SphereGeometry(
        0.047,
        20,
        12
      ),

      eyeMaterial

    );


  eye.scale.set(
    1.3,
    0.24,
    0.38
  );


  eye.position.set(
    x,
    0.055,
    0.393
  );


  headRig.add(
    eye
  );


  return eye;
}


createEye(
  -0.147
);


createEye(
  0.147
);


// ==========================================================
// Arms
// ==========================================================

function createVariableTube(
  points,
  radiusFunction,
  material
) {

  const curve =
    new THREE.CatmullRomCurve3(
      points,
      false,
      "catmullrom",
      0.35
    );


  const geometry =
    new THREE.TubeGeometry(
      curve,
      48,
      0.1,
      16,
      false
    );


  const position =
    geometry.getAttribute(
      "position"
    );


  // TubeGeometry itself cannot vary
  // radius per segment easily,
  // so scale gently in shader-like
  // post process.
  const temp =
    new THREE.Vector3();


  for (
    let i = 0;
    i <
    position.count;
    i++
  ) {

    temp.fromBufferAttribute(
      position,
      i
    );

  }


  return {

    curve,

    mesh:
      new THREE.Mesh(
        geometry,
        material
      )

  };
}


// Relaxed floating pose

const leftArmPoints = [

  new THREE.Vector3(
    -0.79,
    1.68,
    0
  ),

  new THREE.Vector3(
    -0.98,
    1.43,
    0.04
  ),

  new THREE.Vector3(
    -1.18,
    0.92,
    0.08
  ),

  new THREE.Vector3(
    -1.36,
    0.42,
    0.16
  ),

  new THREE.Vector3(
    -1.55,
    0.03,
    0.24
  )

];


const rightArmPoints = [

  new THREE.Vector3(
    0.79,
    1.68,
    0
  ),

  new THREE.Vector3(
    0.99,
    1.42,
    0.04
  ),

  new THREE.Vector3(
    1.18,
    0.90,
    0.08
  ),

  new THREE.Vector3(
    1.38,
    0.40,
    0.16
  ),

  new THREE.Vector3(
    1.57,
    0.02,
    0.24
  )

];


const leftArm =
  createVariableTube(
    leftArmPoints,
    () => 0.1,
    limbMaterial
  );


const rightArm =
  createVariableTube(
    rightArmPoints,
    () => 0.1,
    limbMaterial
  );


leftArm.mesh.scale.set(
  1,
  1,
  0.9
);


rightArm.mesh.scale.set(
  1,
  1,
  0.9
);


armRig.add(
  leftArm.mesh,
  rightArm.mesh
);


// ==========================================================
// Hands
// ==========================================================

function createHand(
  position,
  side
) {

  const hand =
    new THREE.Mesh(

      new THREE.SphereGeometry(
        1,
        28,
        20
      ),

      limbMaterial

    );


  hand.scale.set(
    0.095,
    0.18,
    0.065
  );


  hand.position.copy(
    position
  );


  hand.rotation.z =
    side *
    0.12;


  armRig.add(
    hand
  );


  const fingerMaterial =
    new THREE.LineBasicMaterial({

      color:
        "#68ddff",

      transparent:
        true,

      opacity:
        0.32,

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

    const offset =
      (
        i -
        2
      )
      *
      0.025;


    const length =
      0.12 +
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
        offset,

        position.y -
        0.08,

        position.z

      );


    const end =
      new THREE.Vector3(

        position.x +
        offset +
        side *
        (
          i -
          2
        )
        *
        0.008,

        position.y -
        0.08 -
        length,

        position.z +
        0.015

      );


    const geometry =
      new THREE.BufferGeometry()
        .setFromPoints([
          start,
          end
        ]);


    armRig.add(

      new THREE.Line(
        geometry,
        fingerMaterial
      )

    );

  }

}


createHand(

  new THREE.Vector3(
    -1.57,
    -0.10,
    0.25
  ),

  -1

);


createHand(

  new THREE.Vector3(
    1.59,
    -0.09,
    0.25
  ),

  1

);


// ==========================================================
// Core
// ==========================================================

const core =
  new THREE.Group();


core.position.set(
  0,
  1.30,
  0.45
);


sage.add(
  core
);


const coreSphere =
  new THREE.Mesh(

    new THREE.SphereGeometry(
      0.07,
      26,
      26
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


function coreGlow(
  size,
  opacity,
  colour
) {

  const sprite =
    new THREE.Sprite(

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

      })

    );


  sprite.scale.set(
    size,
    size,
    1
  );


  core.add(
    sprite
  );


  return sprite;
}


const coreInner =
  coreGlow(
    0.48,
    0.94,
    "#d7fbff"
  );


const coreMiddle =
  coreGlow(
    0.95,
    0.46,
    "#55dbff"
  );


const coreOuter =
  coreGlow(
    1.75,
    0.17,
    "#5c6fff"
  );


// ==========================================================
// Energy tubes
// ==========================================================

const energyMaterial =
  new THREE.MeshBasicMaterial({

    color:
      "#67e6ff",

    transparent:
      true,

    opacity:
      0.33,

    blending:
      THREE.AdditiveBlending,

    depthWrite:
      false

  });


function energyLine(
  points,
  radius = 0.009,
  colour = "#67e6ff",
  opacity = 0.3
) {

  const curve =
    new THREE.CatmullRomCurve3(
      points
    );


  const material =
    new THREE.MeshBasicMaterial({

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


  const tube =
    new THREE.Mesh(

      new THREE.TubeGeometry(
        curve,
        40,
        radius,
        4,
        false
      ),

      material

    );


  energyRig.add(
    tube
  );


  return tube;
}


// Central spine

energyLine(
  [

    new THREE.Vector3(
      0,
      2.15,
      0.12
    ),

    new THREE.Vector3(
      0,
      1.75,
      0.20
    ),

    new THREE.Vector3(
      0,
      1.30,
      0.36
    ),

    new THREE.Vector3(
      0,
      0.80,
      0.23
    ),

    new THREE.Vector3(
      0,
      0.25,
      0.14
    ),

    new THREE.Vector3(
      0,
      -0.40,
      0.05
    )

  ],

  0.012,

  "#70ecff",

  0.48
);


// Core → left shoulder

energyLine(
  [

    new THREE.Vector3(
      0,
      1.30,
      0.40
    ),

    new THREE.Vector3(
      -0.28,
      1.48,
      0.32
    ),

    new THREE.Vector3(
      -0.72,
      1.66,
      0.16
    )

  ],

  0.009,

  "#5fe4ff",

  0.36
);


// Core → right shoulder

energyLine(
  [

    new THREE.Vector3(
      0,
      1.30,
      0.40
    ),

    new THREE.Vector3(
      0.28,
      1.48,
      0.32
    ),

    new THREE.Vector3(
      0.72,
      1.66,
      0.16
    )

  ],

  0.009,

  "#5fe4ff",

  0.36
);


// Side torso fibres

for (
  let side of [
    -1,
    1
  ]
) {

  energyLine(
    [

      new THREE.Vector3(
        side *
        0.60,
        1.52,
        0.12
      ),

      new THREE.Vector3(
        side *
        0.47,
        1.08,
        0.22
      ),

      new THREE.Vector3(
        side *
        0.30,
        0.55,
        0.20
      ),

      new THREE.Vector3(
        side *
        0.42,
        0.05,
        0.13
      ),

      new THREE.Vector3(
        side *
        0.30,
        -0.40,
        0.04
      )

    ],

    0.007,

    side <
    0
      ? "#4fcfff"
      : "#8a70ff",

    0.24

  );

}


// ==========================================================
// Hair
// ==========================================================

const hairStrands =
  [];


const hairColours = [
  "#64e8ff",
  "#4fbfff",
  "#668dff",
  "#9473ff"
];


for (
  let i = 0;
  i < 52;
  i++
) {

  const angle =
    THREE.MathUtils.lerp(
      -Math.PI *
      0.95,
      Math.PI *
      0.95,
      i /
      51
    );


  const rootX =
    Math.sin(
      angle
    )
    *
    (
      0.25 +
      Math.random() *
      0.15
    );


  const rootY =
    0.32 +
    Math.cos(
      angle
    )
    *
    0.21;


  const rootZ =
    -0.07 -
    Math.abs(
      Math.sin(
        angle
      )
    )
    *
    0.13;


  const side =
    Math.sign(
      rootX ||
      1
    );


  const length =
    0.65 +
    Math.random() *
    1.25;


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
            0.15 +
            Math.random() *
            0.17
          ),

          rootY -
          length *
          0.26,

          rootZ -
          0.06

        ),

        new THREE.Vector3(

          rootX +
          side *
          (
            0.30 +
            Math.random() *
            0.28
          ),

          rootY -
          length *
          0.58,

          rootZ +
          0.02

        ),

        new THREE.Vector3(

          rootX +
          side *
          (
            0.46 +
            Math.random() *
            0.42
          ),

          rootY -
          length,

          rootZ +
          0.08

        )

      ]
    );


  const strand =
    new THREE.Mesh(

      new THREE.TubeGeometry(
        curve,
        38,
        0.0055,
        3,
        false
      ),

      new THREE.MeshBasicMaterial({

        color:
          hairColours[
            i %
            hairColours.length
          ],

        transparent:
          true,

        opacity:
          0.18 +
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
    0.012 +
    Math.random() *
    0.020;


  hairRig.add(
    strand
  );


  hairStrands.push(
    strand
  );

}


// ==========================================================
// Body particles
// ==========================================================

const particlePositions = [];

const particleBase = [];

const particleColours = [];


const CYAN =
  new THREE.Color(
    "#62e8ff"
  );


const BLUE =
  new THREE.Color(
    "#4b86ff"
  );


const PURPLE =
  new THREE.Color(
    "#956fff"
  );


function randomColour() {

  const value =
    Math.random();


  if (
    value <
    0.4
  ) {

    return CYAN;

  }


  if (
    value <
    0.77
  ) {

    return BLUE;

  }


  return PURPLE;
}


function addParticle(
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


  const colour =
    randomColour();


  particleColours.push(
    colour.r,
    colour.g,
    colour.b
  );

}


// ==========================================================
// Interpolate body profile
// ==========================================================

function getBodyProfileAtY(
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

    const upper =
      bodyProfile[i];


    const lower =
      bodyProfile[
        i +
        1
      ];


    if (
      y <=
      upper.y &&
      y >=
      lower.y
    ) {

      const amount =
        (
          upper.y -
          y
        )
        /
        (
          upper.y -
          lower.y
        );


      return {

        y,

        width:
          THREE.MathUtils.lerp(
            upper.width,
            lower.width,
            amount
          ),

        depth:
          THREE.MathUtils.lerp(
            upper.depth,
            lower.depth,
            amount
          )

      };

    }

  }


  return bodyProfile[0];
}


// Torso particles

for (
  let i = 0;
  i < 1650;
  i++
) {

  const y =
    THREE.MathUtils.lerp(
      -0.52,
      1.92,
      Math.random()
    );


  const profile =
    getBodyProfileAtY(
      y
    );


  const angle =
    Math.random() *
    Math.PI *
    2;


  const radial =
    Math.sqrt(
      Math.random()
    );


  const x =
    Math.cos(
      angle
    )
    *
    profile.width
    *
    radial
    *
    0.93;


  const z =
    Math.sin(
      angle
    )
    *
    profile.depth
    *
    radial
    *
    0.91;


  addParticle(

    new THREE.Vector3(
      x,
      y,
      z
    )

  );

}


// Head particles

for (
  let i = 0;
  i < 390;
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


  let jaw =
    1;


  if (
    point.y <
    -0.18
  ) {

    jaw =
      THREE.MathUtils.lerp(

        1,

        0.67,

        THREE.MathUtils.clamp(

          (
            -point.y -
            0.18
          )
          /
          0.82,

          0,
          1

        )

      );

  }


  addParticle(

    new THREE.Vector3(

      point.x *
      0.40 *
      jaw,

      point.y *
      0.53 +
      2.67,

      point.z *
      0.36

    )

  );

}


// ==========================================================
// Particle renderer
// ==========================================================

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
    particleColours,
    3
  )

);


const bodyParticles =
  new THREE.Points(

    particleGeometry,

    new THREE.PointsMaterial({

      size:
        0.035,

      map:
        glowTexture,

      transparent:
        true,

      opacity:
        0.73,

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

const pointVectors = [];


for (
  let i = 0;
  i <
  particleBase.length;
  i += 3
) {

  pointVectors.push(

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


const networkPositions =
  [];


let connections =
  0;


let attempts =
  0;


while (
  connections <
  700 &&
  attempts <
  40000
) {

  attempts++;


  const a =
    pointVectors[
      Math.floor(
        Math.random() *
        pointVectors.length
      )
    ];


  const b =
    pointVectors[
      Math.floor(
        Math.random() *
        pointVectors.length
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
    0.055 &&
    distance <
    0.245
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
        "#65aaff",

      transparent:
        true,

      opacity:
        0.16,

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
// Energy tail
// ==========================================================

const tailCount =
  1500;


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


const tailColours =
  new Float32Array(
    tailCount *
    3
  );


for (
  let i = 0;
  i <
  tailCount;
  i++
) {

  const t =
    Math.random();


  const y =
    -0.48 -
    t *
    3.35;


  const width =
    0.72 *
    (
      1 -
      t *
      0.76
    )
    +
    0.07;


  const wave =
    t *
    8.2 +
    Math.random() *
    1.9;


  const x =
    Math.sin(
      wave
    )
    *
    width
    *
    (
      0.28 +
      Math.random() *
      0.74
    )
    +
    (
      Math.random() *
      2 -
      1
    )
    *
    width *
    0.40;


  const z =
    Math.cos(
      wave
    )
    *
    width *
    0.20
    +
    (
      Math.random() *
      2 -
      1
    )
    *
    0.11;


  const index =
    i *
    3;


  tailPositions[
    index
  ] =
    x;


  tailPositions[
    index +
    1
  ] =
    y;


  tailPositions[
    index +
    2
  ] =
    z;


  tailBase[
    index
  ] =
    x;


  tailBase[
    index +
    1
  ] =
    y;


  tailBase[
    index +
    2
  ] =
    z;


  const colour =
    randomColour();


  tailColours[
    index
  ] =
    colour.r;


  tailColours[
    index +
    1
  ] =
    colour.g;


  tailColours[
    index +
    2
  ] =
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


const tailParticles =
  new THREE.Points(

    tailGeometry,

    new THREE.PointsMaterial({

      size:
        0.041,

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
// Flowing tail fibres
// ==========================================================

const tailStrands =
  [];


for (
  let i = 0;
  i < 22;
  i++
) {

  const phase =
    (
      i /
      22
    )
    *
    Math.PI *
    2;


  const points =
    [];


  for (
    let j = 0;
    j <= 55;
    j++
  ) {

    const t =
      j /
      55;


    const y =
      -0.42 -
      t *
      3.42;


    const radius =
      0.66 *
      (
        1 -
        t *
        0.77
      );


    const sideDrift =
      Math.sin(
        t *
        Math.PI
      )
      *
      0.10;


    points.push(

      new THREE.Vector3(

        Math.sin(
          phase +
          t *
          7.6
        )
        *
        radius
        +
        sideDrift,

        y,

        Math.cos(
          phase +
          t *
          5.8
        )
        *
        radius *
        0.16

      )

    );

  }


  const colour =
    i %
    3 ===
    0
      ? "#61e7ff"
      : (
          i %
          3 ===
          1
            ? "#4d89ff"
            : "#916cff"
        );


  const strand =
    new THREE.Mesh(

      new THREE.TubeGeometry(

        new THREE.CatmullRomCurve3(
          points
        ),

        54,

        0.0055,

        3,

        false

      ),

      new THREE.MeshBasicMaterial({

        color:
          colour,

        transparent:
          true,

        opacity:
          0.22,

        blending:
          THREE.AdditiveBlending,

        depthWrite:
          false

      })

    );


  strand.userData.phase =
    phase;


  tailRig.add(
    strand
  );


  tailStrands.push(
    strand
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
        "#416fff",

      transparent:
        true,

      opacity:
        0.10,

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
  5.4,
  7.5,
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
    0.72,

  targetOpacity:
    0.72,

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

    idle:
      [
        1,
        0.72,
        1,
        1
      ],

    thinking:
      [
        1.28,
        0.64,
        0.72,
        0.78
      ],

    talking:
      [
        1.42,
        0.78,
        1.1,
        1.14
      ],

    moving:
      [
        1.16,
        0.57,
        1.75,
        1.55
      ],

    curious:
      [
        1.12,
        0.75,
        0.92,
        0.92
      ]

  };


  const values =
    presets[state] ||
    presets.idle;


  behaviour.targetEnergy =
    values[0];


  behaviour.targetOpacity =
    values[1];


  behaviour.targetTailSpeed =
    values[2];


  behaviour.targetHairSpeed =
    values[3];

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


  // --------------------------------------------------------
  // State transitions
  // --------------------------------------------------------

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


  // --------------------------------------------------------
  // Shader animation
  // --------------------------------------------------------

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
    0.93;


  headMaterial
    .uniforms
    .uOpacity
    .value =
    behaviour.opacity *
    0.88;


  // --------------------------------------------------------
  // Float
  // --------------------------------------------------------

  sage.position.y =
    0.08 +
    Math.sin(
      time *
      0.68
    )
    *
    0.045;


  sage.rotation.z =
    Math.sin(
      time *
      0.36
    )
    *
    0.009;


  // --------------------------------------------------------
  // Look toward cursor
  // --------------------------------------------------------

  sage.rotation.y +=
    (
      pointer.x *
      0.065 -
      sage.rotation.y
    )
    *
    0.018;


  headRig.rotation.y +=
    (
      pointer.x *
      0.115 -
      headRig.rotation.y
    )
    *
    0.026;


  headRig.rotation.x +=
    (
      pointer.y *
      0.035 -
      headRig.rotation.x
    )
    *
    0.022;


  // --------------------------------------------------------
  // Core heartbeat
  // --------------------------------------------------------

  const pulse =
    1 +
    Math.sin(
      time *
      2.0 *
      behaviour.energy
    )
    *
    0.055 *
    behaviour.energy;


  coreSphere.scale.setScalar(
    pulse
  );


  coreInner.scale.setScalar(
    0.48 *
    pulse *
    behaviour.energy
  );


  coreMiddle.scale.setScalar(

    0.95 *
    (
      0.96 +
      Math.sin(
        time *
        1.4
      )
      *
      0.05
    )
    *
    behaviour.energy

  );


  coreOuter.scale.setScalar(

    1.75 *
    (
      0.95 +
      Math.sin(
        time *
        1.05
      )
      *
      0.055
    )
    *
    behaviour.energy

  );


  // --------------------------------------------------------
  // Eyes
  // --------------------------------------------------------

  eyeMaterial.opacity =
    0.71 +
    Math.sin(
      time *
      1.5
    )
    *
    0.07;


  // --------------------------------------------------------
  // Internal body particles
  // --------------------------------------------------------

  const bodyPosition =
    particleGeometry
      .getAttribute(
        "position"
      );


  for (
    let i = 0;
    i <
    bodyPosition.count;
    i++
  ) {

    const index =
      i *
      3;


    const x =
      particleBase[
        index
      ];


    const y =
      particleBase[
        index +
        1
      ];


    const z =
      particleBase[
        index +
        2
      ];


    bodyPosition.setXYZ(

      i,

      x +
      Math.sin(
        time *
        0.78 +
        y *
        2.9 +
        i *
        0.014
      )
      *
      0.010,


      y +
      Math.sin(
        time *
        0.55 +
        x *
        3.2 +
        i *
        0.010
      )
      *
      0.011,


      z +
      Math.cos(
        time *
        0.68 +
        y *
        2.2 +
        i *
        0.012
      )
      *
      0.008

    );

  }


  bodyPosition.needsUpdate =
    true;


  // --------------------------------------------------------
  // Hair
  // --------------------------------------------------------

  hairStrands.forEach(
    (
      strand,
      index
    ) => {

      strand.rotation.z =

        Math.sin(

          time *
          0.48 *
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
          0.35 +

          index *
          0.19

        )

        *

        0.016

        *

        behaviour.hairSpeed;

    }
  );


  // --------------------------------------------------------
  // Tail particles
  // --------------------------------------------------------

  const tailPosition =
    tailGeometry
      .getAttribute(
        "position"
      );


  for (
    let i = 0;
    i <
    tailCount;
    i++
  ) {

    const index =
      i *
      3;


    const x =
      tailBase[
        index
      ];


    const y =
      tailBase[
        index +
        1
      ];


    const z =
      tailBase[
        index +
        2
      ];


    const depth =
      Math.abs(
        y
      );


    tailPosition.setXYZ(

      i,


      x +

      Math.sin(

        time *
        0.90 *
        behaviour.tailSpeed +

        depth *
        2.2 +

        i *
        0.017

      )

      *

      (
        0.035 +
        depth *
        0.008
      ),


      y +

      Math.sin(

        time *
        0.57 *
        behaviour.tailSpeed +

        i *
        0.008

      )

      *
      0.017,


      z +

      Math.cos(

        time *
        0.66 *
        behaviour.tailSpeed +

        depth *
        1.7 +

        i *
        0.014

      )

      *
      0.016

    );

  }


  tailPosition.needsUpdate =
    true;


  tailRig.rotation.z =

    Math.sin(

      time *
      0.32 *
      behaviour.tailSpeed

    )

    *
    0.025;


  tailStrands.forEach(
    (
      strand,
      index
    ) => {

      strand.rotation.y =

        Math.sin(

          time *
          0.20 *
          behaviour.tailSpeed +

          index *
          0.28

        )

        *
        0.028;

    }
  );


  // --------------------------------------------------------
  // Thinking / curious head tilt
  // --------------------------------------------------------

  let targetTilt =
    0;


  if (
    behaviour.state ===
    "thinking"
  ) {

    targetTilt =
      -0.035;

  }


  if (
    behaviour.state ===
    "curious"
  ) {

    targetTilt =
      0.045;

  }


  headRig.rotation.z +=

    (
      targetTilt -
      headRig.rotation.z
    )

    *
    0.04;


  // --------------------------------------------------------
  // Render
  // --------------------------------------------------------

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
