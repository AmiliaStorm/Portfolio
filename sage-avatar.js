import * as THREE from "three";

const mount = document.getElementById("sageAvatarMount");
if (!mount) throw new Error("SAGE: #sageAvatarMount not found");

const renderer = new THREE.WebGLRenderer({
  alpha: true,
  antialias: true,
  powerPreference: "high-performance"
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.setClearColor(0x000000, 0);
renderer.outputColorSpace = THREE.SRGBColorSpace;
mount.appendChild(renderer.domElement);

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
camera.position.set(0, 0.05, 12.8);
camera.lookAt(0, -0.05, 0);

const sage = new THREE.Group();
sage.position.set(0.15, 0.08, 0);
scene.add(sage);

const torsoRig = new THREE.Group();
const armRig = new THREE.Group();
const particleRig = new THREE.Group();
const tailRig = new THREE.Group();
const headRig = new THREE.Group();
const hairRig = new THREE.Group();

headRig.position.set(0, 2.66, 0.02);
headRig.add(hairRig);

sage.add(torsoRig, armRig, particleRig, tailRig, headRig);

function makeGlowTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const ctx = c.getContext("2d");
  const g = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.08, "rgba(230,252,255,1)");
  g.addColorStop(0.24, "rgba(90,225,255,.82)");
  g.addColorStop(0.5, "rgba(70,120,255,.30)");
  g.addColorStop(0.74, "rgba(130,80,255,.08)");
  g.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 256);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

const glowTexture = makeGlowTexture();

function makeHologramMaterial({ opacity = 0.75, dissolve = false } = {}) {
  return new THREE.ShaderMaterial({
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uTime: { value: 0 },
      uOpacity: { value: opacity },
      uCyan: { value: new THREE.Color("#55e5ff") },
      uBlue: { value: new THREE.Color("#397fff") },
      uPurple: { value: new THREE.Color("#8a68ff") },
      uDissolve: { value: dissolve ? 1 : 0 }
    },
    vertexShader: `
      uniform float uTime;
      varying vec3 vN;
      varying vec3 vV;
      varying vec3 vP;

      void main() {
        vec3 p = position;
        p += normal * sin(position.y * 9.0 + position.x * 5.0 + uTime * 1.4) * 0.005;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        vN = normalize(normalMatrix * normal);
        vV = -mv.xyz;
        vP = position;
        gl_Position = projectionMatrix * mv;
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
        vec3 viewDir = normalize(vV);
        float fresnel = pow(1.0 - abs(dot(normalize(vN), viewDir)), 2.2);

        float flow = 0.5 + 0.5 * sin(vP.y * 12.0 - uTime * 2.0 + vP.x * 5.0);
        float micro = 0.5 + 0.5 * sin(vP.x * 30.0 + vP.y * 22.0 + uTime * 1.6);

        float vertical = clamp(vP.y * 0.15 + 0.5, 0.0, 1.0);
        vec3 color = mix(uPurple, uBlue, vertical);
        color = mix(color, uCyan, fresnel * 0.78);

        float alpha = (0.03 + fresnel * 0.60 + flow * 0.04) * uOpacity;

        if (uDissolve == 1) {
          alpha *= smoothstep(-0.68, -0.30, vP.y);
        }

        float brightness = 0.42 + fresnel * 2.65 + flow * 0.15 + micro * 0.07;
        gl_FragColor = vec4(color * brightness, alpha);
      }
    `
  });
}

const torsoMaterial = makeHologramMaterial({ opacity: 0.76, dissolve: true });
const limbMaterial = makeHologramMaterial({ opacity: 0.72 });
const headMaterial = makeHologramMaterial({ opacity: 0.67 });

const hologramMaterials = [torsoMaterial, limbMaterial, headMaterial];

const bodyProfile = [
  { y: 2.04, w: 0.27, d: 0.21 },
  { y: 1.92, w: 0.46, d: 0.25 },
  { y: 1.79, w: 0.84, d: 0.32 },
  { y: 1.56, w: 0.86, d: 0.40 },
  { y: 1.30, w: 0.81, d: 0.43 },
  { y: 1.05, w: 0.70, d: 0.38 },
  { y: 0.76, w: 0.59, d: 0.34 },
  { y: 0.49, w: 0.49, d: 0.31 },
  { y: 0.25, w: 0.55, d: 0.33 },
  { y: 0.03, w: 0.67, d: 0.38 },
  { y: -0.18, w: 0.76, d: 0.42 },
  { y: -0.38, w: 0.71, d: 0.39 },
  { y: -0.58, w: 0.52, d: 0.31 }
];

function makeProfileGeometry(profile, radial = 64) {
  const positions = [];
  const indices = [];

  for (let r = 0; r < profile.length; r++) {
    const p = profile[r];

    for (let i = 0; i < radial; i++) {
      const a = (i / radial) * Math.PI * 2;
      const c = Math.cos(a);
      const s = Math.sin(a);
      const frontBias = Math.max(s, 0) * p.d * 0.08;

      positions.push(c * p.w, p.y, s * p.d + frontBias);
    }
  }

  for (let r = 0; r < profile.length - 1; r++) {
    for (let i = 0; i < radial; i++) {
      const n = (i + 1) % radial;
      const a = r * radial + i;
      const b = r * radial + n;
      const c = (r + 1) * radial + n;
      const d = (r + 1) * radial + i;
      indices.push(a, d, b, b, d, c);
    }
  }

  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  g.setIndex(indices);
  g.computeVertexNormals();
  return g;
}

const torso = new THREE.Mesh(
  makeProfileGeometry(bodyProfile),
  torsoMaterial
);
torsoRig.add(torso);

function taperedCylinder(start, end, r0, r1, material) {
  const dir = new THREE.Vector3().subVectors(end, start);
  const mesh = new THREE.Mesh(
    new THREE.CylinderGeometry(r1, r0, dir.length(), 28, 1, false),
    material
  );

  mesh.position.copy(start.clone().add(end).multiplyScalar(0.5));
  mesh.quaternion.setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    dir.clone().normalize()
  );

  return mesh;
}

torsoRig.add(
  taperedCylinder(
    new THREE.Vector3(0, 2.04, 0),
    new THREE.Vector3(0, 2.26, 0.01),
    0.22,
    0.18,
    limbMaterial
  )
);

function makeHeadGeometry() {
  const g = new THREE.SphereGeometry(1, 64, 64);
  const pos = g.getAttribute("position");
  const v = new THREE.Vector3();

  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const oy = v.y;

    let sx = 0.43;
    let sz = 0.39;

    if (oy > 0.58) {
      sx *= THREE.MathUtils.lerp(1, 0.86, (oy - 0.58) / 0.42);
    }

    if (oy < 0.28 && oy > -0.28) {
      sx *= 1.06;
    }

    if (oy < -0.18) {
      const t = THREE.MathUtils.clamp((-oy - 0.18) / 0.82, 0, 1);
      sx *= THREE.MathUtils.lerp(1, 0.66, t);
      sz *= THREE.MathUtils.lerp(1, 0.83, t);
    }

    v.x *= sx;
    v.y *= 0.57;
    v.z *= sz;

    if (v.z > 0) {
      const faceBand = 1 - Math.min(Math.abs(v.y) / 0.55, 1);
      v.z += 0.025 * faceBand;
    }

    pos.setXYZ(i, v.x, v.y, v.z);
  }

  pos.needsUpdate = true;
  g.computeVertexNormals();
  return g;
}

const head = new THREE.Mesh(makeHeadGeometry(), headMaterial);
headRig.add(head);

const eyeMaterial = new THREE.MeshBasicMaterial({
  color: "#dcfbff",
  transparent: true,
  opacity: 0.85,
  blending: THREE.AdditiveBlending,
  depthWrite: false
});

function makeEye(x) {
  const e = new THREE.Mesh(
    new THREE.SphereGeometry(0.06, 18, 10),
    eyeMaterial
  );

  e.scale.set(1.15, 0.32, 0.42);
  e.position.set(x, 0.065, 0.385);
  headRig.add(e);
  return e;
}

makeEye(-0.155);
makeEye(0.155);

function makeVariableTube(points, radiusAt, material, tubular = 40, radial = 14) {
  const curve = new THREE.CatmullRomCurve3(points, false, "catmullrom", 0.4);
  const frames = curve.computeFrenetFrames(tubular, false);

  const positions = [];
  const indices = [];

  for (let i = 0; i <= tubular; i++) {
    const t = i / tubular;
    const center = curve.getPointAt(t);
    const normal = frames.normals[i];
    const binormal = frames.binormals[i];
    const radius = radiusAt(t);

    for (let j = 0; j < radial; j++) {
      const a = (j / radial) * Math.PI * 2;

      const offset = normal.clone()
        .multiplyScalar(Math.cos(a) * radius)
        .add(
          binormal.clone()
            .multiplyScalar(Math.sin(a) * radius)
        );

      const p = center.clone().add(offset);
      positions.push(p.x, p.y, p.z);
    }
  }

  for (let i = 0; i < tubular; i++) {
    for (let j = 0; j < radial; j++) {
      const n = (j + 1) % radial;
      const a = i * radial + j;
      const b = i * radial + n;
      const c = (i + 1) * radial + n;
      const d = (i + 1) * radial + j;
      indices.push(a, d, b, b, d, c);
    }
  }

  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  g.setIndex(indices);
  g.computeVertexNormals();

  return {
    curve,
    mesh: new THREE.Mesh(g, material)
  };
}

const leftArmPoints = [
  new THREE.Vector3(-0.77, 1.70, 0.00),
  new THREE.Vector3(-0.97, 1.42, 0.03),
  new THREE.Vector3(-1.20, 0.82, 0.07),
  new THREE.Vector3(-1.40, 0.29, 0.12),
  new THREE.Vector3(-1.55, -0.10, 0.17)
];

const rightArmPoints = [
  new THREE.Vector3(0.77, 1.70, 0.00),
  new THREE.Vector3(0.98, 1.42, 0.03),
  new THREE.Vector3(1.19, 0.80, 0.07),
  new THREE.Vector3(1.42, 0.27, 0.13),
  new THREE.Vector3(1.57, -0.07, 0.18)
];

function armRadius(t) {
  if (t < 0.42) {
    return THREE.MathUtils.lerp(0.18, 0.13, t / 0.42);
  }

  return THREE.MathUtils.lerp(0.13, 0.07, (t - 0.42) / 0.58);
}

const leftArm = makeVariableTube(leftArmPoints, armRadius, limbMaterial);
const rightArm = makeVariableTube(rightArmPoints, armRadius, limbMaterial);

armRig.add(leftArm.mesh, rightArm.mesh);

function ellipsoid(scale, position, material) {
  const m = new THREE.Mesh(
    new THREE.SphereGeometry(1, 32, 24),
    material
  );
  m.scale.copy(scale);
  m.position.copy(position);
  return m;
}

armRig.add(
  ellipsoid(
    new THREE.Vector3(0.25, 0.20, 0.26),
    new THREE.Vector3(-0.76, 1.69, 0),
    limbMaterial
  ),
  ellipsoid(
    new THREE.Vector3(0.25, 0.20, 0.26),
    new THREE.Vector3(0.76, 1.69, 0),
    limbMaterial
  )
);

function makeHand(position, side) {
  const hand = ellipsoid(
    new THREE.Vector3(0.10, 0.22, 0.075),
    position,
    limbMaterial
  );

  hand.rotation.z = side * -0.16;
  armRig.add(hand);

  const mat = new THREE.LineBasicMaterial({
    color: "#69ddff",
    transparent: true,
    opacity: 0.34,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });

  for (let i = 0; i < 5; i++) {
    const spread = (i - 2) * 0.026;
    const len = 0.12 + (2 - Math.abs(i - 2)) * 0.018;

    const g = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(
        position.x + spread,
        position.y - 0.09,
        position.z
      ),
      new THREE.Vector3(
        position.x + spread + side * (i - 2) * 0.006,
        position.y - 0.09 - len,
        position.z + 0.01
      )
    ]);

    armRig.add(new THREE.Line(g, mat));
  }
}

makeHand(new THREE.Vector3(-1.58, -0.23, 0.18), -1);
makeHand(new THREE.Vector3(1.60, -0.20, 0.19), 1);

const coreGroup = new THREE.Group();
coreGroup.position.set(0, 1.31, 0.46);
sage.add(coreGroup);

const coreSphere = new THREE.Mesh(
  new THREE.SphereGeometry(0.085, 28, 28),
  new THREE.MeshBasicMaterial({
    color: "#ffffff",
    transparent: true,
    opacity: 1,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  })
);
coreGroup.add(coreSphere);

function glowSprite(size, opacity, color) {
  const s = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: glowTexture,
      color,
      transparent: true,
      opacity,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    })
  );
  s.scale.set(size, size, 1);
  coreGroup.add(s);
  return s;
}

const coreInner = glowSprite(0.62, 0.94, "#b7f5ff");
const coreMid = glowSprite(1.20, 0.48, "#55d5ff");
const coreOuter = glowSprite(2.10, 0.19, "#586fff");

const aura = new THREE.Sprite(
  new THREE.SpriteMaterial({
    map: glowTexture,
    color: "#416fff",
    transparent: true,
    opacity: 0.11,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  })
);
aura.position.set(0, 0.65, -0.8);
aura.scale.set(5.2, 7.4, 1);
sage.add(aura);

function profileAtY(y) {
  if (y >= bodyProfile[0].y) return bodyProfile[0];
  if (y <= bodyProfile.at(-1).y) return bodyProfile.at(-1);

  for (let i = 0; i < bodyProfile.length - 1; i++) {
    const a = bodyProfile[i];
    const b = bodyProfile[i + 1];

    if (y <= a.y && y >= b.y) {
      const t = (a.y - y) / (a.y - b.y);

      return {
        y,
        w: THREE.MathUtils.lerp(a.w, b.w, t),
        d: THREE.MathUtils.lerp(a.d, b.d, t)
      };
    }
  }

  return bodyProfile[0];
}

const pPos = [];
const pBase = [];
const pColors = [];

const CYAN = new THREE.Color("#62e7ff");
const BLUE = new THREE.Color("#4b87ff");
const PURPLE = new THREE.Color("#956fff");

function randomColor() {
  const r = Math.random();
  return r < 0.38 ? CYAN : r < 0.76 ? BLUE : PURPLE;
}

function pushParticle(p) {
  pPos.push(p.x, p.y, p.z);
  pBase.push(p.x, p.y, p.z);
  const c = randomColor();
  pColors.push(c.r, c.g, c.b);
}

for (let i = 0; i < 1050; i++) {
  const y = THREE.MathUtils.lerp(-0.48, 1.94, Math.random());
  const p = profileAtY(y);
  const a = Math.random() * Math.PI * 2;
  const r = Math.sqrt(Math.random());

  pushParticle(new THREE.Vector3(
    Math.cos(a) * p.w * r * 0.92,
    y,
    Math.sin(a) * p.d * r * 0.90
  ));
}

for (let i = 0; i < 280; i++) {
  let p;

  do {
    p = new THREE.Vector3(
      Math.random() * 2 - 1,
      Math.random() * 2 - 1,
      Math.random() * 2 - 1
    );
  } while (p.lengthSq() > 1);

  const jaw = p.y < -0.18
    ? THREE.MathUtils.lerp(
        1,
        0.67,
        THREE.MathUtils.clamp((-p.y - 0.18) / 0.82, 0, 1)
      )
    : 1;

  pushParticle(new THREE.Vector3(
    p.x * 0.40 * jaw,
    p.y * 0.53 + 2.66,
    p.z * 0.36
  ));
}

function curveParticles(curve, count) {
  for (let i = 0; i < count; i++) {
    const t = Math.random();
    const p = curve.getPointAt(t);
    const r = armRadius(t) * 0.70;

    p.x += (Math.random() * 2 - 1) * r;
    p.y += (Math.random() * 2 - 1) * r;
    p.z += (Math.random() * 2 - 1) * r;

    pushParticle(p);
  }
}

curveParticles(leftArm.curve, 220);
curveParticles(rightArm.curve, 220);

const particleGeometry = new THREE.BufferGeometry();
particleGeometry.setAttribute("position", new THREE.Float32BufferAttribute(pPos, 3));
particleGeometry.setAttribute("color", new THREE.Float32BufferAttribute(pColors, 3));

const bodyParticles = new THREE.Points(
  particleGeometry,
  new THREE.PointsMaterial({
    size: 0.037,
    map: glowTexture,
    transparent: true,
    opacity: 0.66,
    alphaTest: 0.02,
    depthWrite: false,
    vertexColors: true,
    blending: THREE.AdditiveBlending
  })
);
particleRig.add(bodyParticles);

const hairStrands = [];
const hairColors = ["#64e7ff", "#5b92ff", "#8d70ff", "#57c8ff"];

for (let i = 0; i < 38; i++) {
  const n = i / 37;
  const angle = THREE.MathUtils.lerp(-Math.PI * 0.88, Math.PI * 0.88, n);

  const rootX = Math.sin(angle) * (0.24 + Math.random() * 0.14);
  const rootY = 0.30 + Math.cos(angle) * 0.22;
  const rootZ = -0.05 - Math.abs(Math.sin(angle)) * 0.14;

  const side = Math.sign(rootX || 1);
  const length = 0.72 + Math.random() * 1.22;

  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(rootX, rootY, rootZ),
    new THREE.Vector3(
      rootX + side * (0.18 + Math.random() * 0.16),
      rootY - length * 0.28,
      rootZ - 0.06
    ),
    new THREE.Vector3(
      rootX + side * (0.34 + Math.random() * 0.27),
      rootY - length * 0.61,
      rootZ + 0.015
    ),
    new THREE.Vector3(
      rootX + side * (0.48 + Math.random() * 0.38),
      rootY - length,
      rootZ + 0.06
    )
  ]);

  const strand = new THREE.Mesh(
    new THREE.TubeGeometry(curve, 34, 0.007, 3, false),
    new THREE.MeshBasicMaterial({
      color: hairColors[i % hairColors.length],
      transparent: true,
      opacity: 0.22 + Math.random() * 0.18,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    })
  );

  strand.userData.phase = Math.random() * Math.PI * 2;
  strand.userData.motion = 0.012 + Math.random() * 0.018;

  hairRig.add(strand);
  hairStrands.push(strand);
}

const tailCount = 1150;
const tailPositions = new Float32Array(tailCount * 3);
const tailBase = new Float32Array(tailCount * 3);
const tailColors = new Float32Array(tailCount * 3);

for (let i = 0; i < tailCount; i++) {
  const t = Math.random();
  const y = -0.38 - t * 3.35;
  const width = 0.62 * (1 - t * 0.72) + 0.09;
  const swirl = t * 8.5 + Math.random() * 1.8;

  const x =
    Math.sin(swirl) * width * (0.32 + Math.random() * 0.68) +
    (Math.random() * 2 - 1) * width * 0.35;

  const z =
    Math.cos(swirl) * width * 0.20 +
    (Math.random() * 2 - 1) * 0.10;

  const idx = i * 3;
  tailPositions[idx] = tailBase[idx] = x;
  tailPositions[idx + 1] = tailBase[idx + 1] = y;
  tailPositions[idx + 2] = tailBase[idx + 2] = z;

  const c = randomColor();
  tailColors[idx] = c.r;
  tailColors[idx + 1] = c.g;
  tailColors[idx + 2] = c.b;
}

const tailGeometry = new THREE.BufferGeometry();
tailGeometry.setAttribute("position", new THREE.BufferAttribute(tailPositions, 3));
tailGeometry.setAttribute("color", new THREE.BufferAttribute(tailColors, 3));

tailRig.add(
  new THREE.Points(
    tailGeometry,
    new THREE.PointsMaterial({
      size: 0.043,
      map: glowTexture,
      transparent: true,
      opacity: 0.67,
      depthWrite: false,
      vertexColors: true,
      blending: THREE.AdditiveBlending
    })
  )
);

const tailStrands = [];

for (let i = 0; i < 16; i++) {
  const phase = (i / 16) * Math.PI * 2;
  const points = [];

  for (let j = 0; j <= 46; j++) {
    const t = j / 46;
    const y = -0.32 - t * 3.45;
    const radius = 0.55 * (1 - t * 0.72);

    points.push(new THREE.Vector3(
      Math.sin(phase + t * 7.8) * radius,
      y,
      Math.cos(phase + t * 6.0) * radius * 0.17
    ));
  }

  const color =
    i % 3 === 0 ? "#61e6ff" :
    i % 3 === 1 ? "#4c89ff" :
    "#906cff";

  const strand = new THREE.Mesh(
    new THREE.TubeGeometry(
      new THREE.CatmullRomCurve3(points),
      44,
      0.006,
      3,
      false
    ),
    new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.20,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    })
  );

  tailRig.add(strand);
  tailStrands.push(strand);
}

const behaviour = {
  state: "idle",
  energy: 1,
  targetEnergy: 1,
  bodyOpacity: 0.76,
  targetBodyOpacity: 0.76,
  tailSpeed: 1,
  targetTailSpeed: 1,
  hairMotion: 1,
  targetHairMotion: 1
};

function setState(state) {
  behaviour.state = state;

  const presets = {
    idle: [1.00, 0.76, 1.00, 1.00],
    thinking: [1.28, 0.67, 0.72, 0.78],
    talking: [1.44, 0.81, 1.08, 1.12],
    moving: [1.14, 0.59, 1.72, 1.55],
    curious: [1.12, 0.78, 0.92, 0.92]
  };

  const p = presets[state] || presets.idle;

  behaviour.targetEnergy = p[0];
  behaviour.targetBodyOpacity = p[1];
  behaviour.targetTailSpeed = p[2];
  behaviour.targetHairMotion = p[3];
}

window.SAGEAvatar = {
  setState,
  getState: () => behaviour.state,
  getObject3D: () => sage
};

const pointer = { x: 0, y: 0 };

window.addEventListener("pointermove", (e) => {
  pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
  pointer.y = -((e.clientY / window.innerHeight) * 2 - 1);
});

function resize() {
  const w = mount.clientWidth;
  const h = mount.clientHeight;
  if (!w || !h) return;

  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}

new ResizeObserver(resize).observe(mount);
resize();

const clock = new THREE.Clock();

function animate() {
  const t = clock.getElapsedTime();

  behaviour.energy += (behaviour.targetEnergy - behaviour.energy) * 0.045;
  behaviour.bodyOpacity += (behaviour.targetBodyOpacity - behaviour.bodyOpacity) * 0.045;
  behaviour.tailSpeed += (behaviour.targetTailSpeed - behaviour.tailSpeed) * 0.045;
  behaviour.hairMotion += (behaviour.targetHairMotion - behaviour.hairMotion) * 0.045;

  hologramMaterials.forEach(m => m.uniforms.uTime.value = t);
  torsoMaterial.uniforms.uOpacity.value = behaviour.bodyOpacity;
  limbMaterial.uniforms.uOpacity.value = behaviour.bodyOpacity * 0.95;
  headMaterial.uniforms.uOpacity.value = behaviour.bodyOpacity * 0.90;

  sage.position.y = 0.08 + Math.sin(t * 0.70) * 0.048;
  sage.rotation.z = Math.sin(t * 0.38) * 0.011;

  sage.rotation.y += (pointer.x * 0.075 - sage.rotation.y) * 0.018;
  headRig.rotation.y += (pointer.x * 0.105 - headRig.rotation.y) * 0.028;
  headRig.rotation.x += (pointer.y * 0.035 - headRig.rotation.x) * 0.024;

  const pulse = 1 + Math.sin(t * (2.0 * behaviour.energy)) * 0.06 * behaviour.energy;

  coreSphere.scale.setScalar(pulse);
  coreInner.scale.setScalar(0.62 * pulse * behaviour.energy);
  coreMid.scale.setScalar(1.20 * (0.96 + Math.sin(t * 1.4) * 0.05) * behaviour.energy);
  coreOuter.scale.setScalar(2.10 * (0.95 + Math.sin(t * 1.08) * 0.06) * behaviour.energy);

  eyeMaterial.opacity = 0.76 + Math.sin(t * 1.55) * 0.08;

  const pAttr = particleGeometry.getAttribute("position");

  for (let i = 0; i < pAttr.count; i++) {
    const idx = i * 3;
    const bx = pBase[idx];
    const by = pBase[idx + 1];
    const bz = pBase[idx + 2];

    pAttr.setXYZ(
      i,
      bx + Math.sin(t * 0.80 + by * 2.8 + i * 0.015) * 0.010,
      by + Math.sin(t * 0.56 + bx * 3.1 + i * 0.010) * 0.012,
      bz + Math.cos(t * 0.69 + by * 2.1 + i * 0.012) * 0.008
    );
  }

  pAttr.needsUpdate = true;

  hairStrands.forEach((s, i) => {
    s.rotation.z =
      Math.sin(t * 0.50 * behaviour.hairMotion + s.userData.phase) *
      s.userData.motion *
      behaviour.hairMotion;

    s.rotation.y =
      Math.cos(t * 0.37 + i * 0.21) *
      0.015 *
      behaviour.hairMotion;
  });

  const tailAttr = tailGeometry.getAttribute("position");

  for (let i = 0; i < tailCount; i++) {
    const idx = i * 3;
    const bx = tailBase[idx];
    const by = tailBase[idx + 1];
    const bz = tailBase[idx + 2];
    const depth = Math.abs(by);

    tailAttr.setXYZ(
      i,
      bx + Math.sin(t * 0.94 * behaviour.tailSpeed + depth * 2.35 + i * 0.018) *
           (0.032 + depth * 0.007),
      by + Math.sin(t * 0.58 * behaviour.tailSpeed + i * 0.008) * 0.016,
      bz + Math.cos(t * 0.67 * behaviour.tailSpeed + depth * 1.75 + i * 0.014) * 0.016
    );
  }

  tailAttr.needsUpdate = true;
  tailRig.rotation.z = Math.sin(t * 0.34 * behaviour.tailSpeed) * 0.024;

  tailStrands.forEach((s, i) => {
    s.rotation.y = Math.sin(t * 0.21 * behaviour.tailSpeed + i * 0.27) * 0.026;
  });

  const targetTilt =
    behaviour.state === "thinking" ? -0.035 :
    behaviour.state === "curious" ? 0.045 :
    0;

  headRig.rotation.z += (targetTilt - headRig.rotation.z) * 0.04;

  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

requestAnimationFrame(animate);
