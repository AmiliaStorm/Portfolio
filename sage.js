import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";

const mount = document.getElementById("sageAvatarMount");

if (!mount) {
  throw new Error("SAGE: #sageAvatarMount not found");
}

/* =========================================================
   SAGE · BUTTERFLY REALISM V2
========================================================= */

const renderer = new THREE.WebGLRenderer({
  alpha: true,
  antialias: true,
  powerPreference: "high-performance"
});

renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.setClearColor(0x000000, 0);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.02;

mount.appendChild(renderer.domElement);

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
camera.position.set(0, 0.08, 8.55);
camera.lookAt(0.18, 0.08, 0);

/* =========================================================
   BLOOM 
========================================================= */

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));

const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(1, 1),
  0.7,   // strength — much less than the last attempt, which blew the whole frame into haze
  0.4,   // radius — tighter falloff so glow stays local to bright edges instead of flooding outward
  0.24   // threshold — high enough that only genuinely bright pixels (lines, core) bloom, not the general wing glow
);

composer.addPass(bloomPass);
composer.addPass(new OutputPass());

/* =========================================================
   LIGHTS
========================================================= */

scene.add(new THREE.AmbientLight(0x8fbaff, 0.66));

const cyanLight = new THREE.PointLight(0x72eaff, 8.0, 14);
cyanLight.position.set(1.5, 1.6, 4.8);
scene.add(cyanLight);

const violetLight = new THREE.PointLight(0x8b65ff, 4.5, 12);
violetLight.position.set(-2.7, -0.8, 3.1);
scene.add(violetLight);

/* =========================================================
   HELPERS
========================================================= */

function makeGlowTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;

  const ctx = canvas.getContext("2d");
  const gradient = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);

  gradient.addColorStop(0.00, "rgba(255,255,255,1)");
  gradient.addColorStop(0.08, "rgba(230,252,255,0.98)");
  gradient.addColorStop(0.24, "rgba(94,225,255,0.78)");
  gradient.addColorStop(0.52, "rgba(72,122,255,0.27)");
  gradient.addColorStop(0.76, "rgba(145,92,255,0.08)");
  gradient.addColorStop(1.00, "rgba(0,0,0,0)");

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 256, 256);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;

  return texture;
}

const glowTexture = makeGlowTexture();

/* =========================================================
   WING PATTERN TEXTURE 
========================================================= */

function makeWingPatternTexture(upper, side, outlinePoints) {
  const size = 512;

  // The wing is a long, asymmetric blob, not a square or circle — a
  // fixed ellipse/circle drawn at texture-center (the previous
  // approach) lands wherever the middle of the bounding box happens
  // to fall once mapped onto that shape, which is why the border and
  // eyespot showed up as a stray ring floating mid-wing instead of
  // hugging the actual margin. Fix: map every mark using the wing's
  // own bounding box, the same way THREE.ShapeGeometry computes its
  // UVs (U = (x-minX)/(maxX-minX), V = (y-minY)/(maxY-minY)), and
  // draw the border by stroking the real outline path instead of a
  // generic ellipse.
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;

  outlinePoints.forEach(p => {
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
  });

  const spanX = maxX - minX;
  const spanY = maxY - minY;

  // CanvasTexture defaults to flipY = true, which combined with
  // ShapeGeometry's V convention means canvas row 0 (top) corresponds
  // to V = 1 (maxY) — hence the (1 - v) flip here.
  function toCanvas(x, y) {
    const u = (x - minX) / spanX;
    const v = (y - minY) / spanY;
    return { px: u * size, py: (1 - v) * size };
  }

  const marginPoints = outlinePoints.map(p => toCanvas(p.x, p.y));

  // Root point: the wing shape always starts (moveTo) at the point
  // closest to the body, so index 0 is the vein origin.
  const root = marginPoints[0];

  let centroidX = 0, centroidY = 0;
  marginPoints.forEach(p => { centroidX += p.px; centroidY += p.py; });
  centroidX /= marginPoints.length;
  centroidY /= marginPoints.length;

  const colorCanvas = document.createElement("canvas");
  colorCanvas.width = size;
  colorCanvas.height = size;
  const cctx = colorCanvas.getContext("2d");

  const glowCanvas = document.createElement("canvas");
  glowCanvas.width = size;
  glowCanvas.height = size;
  const gctx = glowCanvas.getContext("2d");
  gctx.fillStyle = "#000000";
  gctx.fillRect(0, 0, size, size);

  // Base membrane tint.
  const baseGrad = cctx.createLinearGradient(0, 0, size, size);
  baseGrad.addColorStop(0, "#4d7ce0");
  baseGrad.addColorStop(1, "#345ab0");
  cctx.fillStyle = baseGrad;
  cctx.fillRect(0, 0, size, size);

  // Primary veins: fan out from the true root to evenly spaced points
  // sampled along the actual margin, so every vein genuinely reaches
  // the wing's edge instead of shooting off at a guessed angle.
  const veinCount = upper ? 9 : 6;
  const usableSpan = Math.floor(marginPoints.length * 0.82);

  for (let i = 0; i < veinCount; i++) {
    const t = (i + 1) / (veinCount + 1);
    const idx = Math.floor(t * usableSpan);
    const tip = marginPoints[idx];

    cctx.strokeStyle = "rgba(6,12,30,0.5)";
    cctx.lineWidth = 4;
    cctx.beginPath();
    cctx.moveTo(root.px, root.py);
    cctx.quadraticCurveTo(
      (root.px + tip.px) / 2,
      (root.py + tip.py) / 2 - 12,
      tip.px,
      tip.py
    );
    cctx.stroke();

    gctx.strokeStyle = "rgba(150,220,255,0.8)";
    gctx.lineWidth = 2.2;
    gctx.beginPath();
    gctx.moveTo(root.px, root.py);
    gctx.quadraticCurveTo(
      (root.px + tip.px) / 2,
      (root.py + tip.py) / 2 - 12,
      tip.px,
      tip.py
    );
    gctx.stroke();
  }

  // Fine cross-vein texture, scattered near the interior (kept subtle,
  // color map only — exact position doesn't need to track anatomy).
  cctx.strokeStyle = "rgba(6,12,30,0.20)";
  cctx.lineWidth = 1.4;
  for (let i = 0; i < 60; i++) {
    const x = centroidX + rand(-0.35, 0.35) * size;
    const y = centroidY + rand(-0.35, 0.35) * size;
    const len = 14 + Math.random() * 22;
    const a = Math.random() * Math.PI;
    cctx.beginPath();
    cctx.moveTo(x, y);
    cctx.lineTo(x + Math.cos(a) * len, y + Math.sin(a) * len);
    cctx.stroke();
  }

  // Dark border band — now stroked along the real outline path, so it
  // actually hugs the margin instead of floating as a stray circle.
  function strokeOutline(ctx, width, style) {
    ctx.strokeStyle = style;
    ctx.lineWidth = width;
    ctx.lineJoin = "round";
    ctx.beginPath();
    marginPoints.forEach((p, i) => {
      if (i === 0) ctx.moveTo(p.px, p.py); else ctx.lineTo(p.px, p.py);
    });
    ctx.closePath();
    ctx.stroke();
  }

  strokeOutline(cctx, 20, "rgba(4,8,20,0.6)");
  strokeOutline(gctx, 3.5, "rgba(140,215,255,0.65)");

  // Eyespot on the forewing only (owl-butterfly / morpho style
  // marking) — placed partway between the wing's centroid and a point
  // on the outer margin, so it lands inside the actual silhouette
  // regardless of that silhouette's shape.
  if (upper) {
    const marginRef = marginPoints[Math.floor(marginPoints.length * 0.32)];
    const spotX = THREE.MathUtils.lerp(centroidX, marginRef.px, 0.5);
    const spotY = THREE.MathUtils.lerp(centroidY, marginRef.py, 0.5);
    const spotR = spanX > spanY ? size * 0.09 : size * 0.07;

    const colorGrad = cctx.createRadialGradient(spotX, spotY, 3, spotX, spotY, spotR);
    colorGrad.addColorStop(0.00, "#fff3d6");
    colorGrad.addColorStop(0.22, "#241a10");
    colorGrad.addColorStop(0.55, "#3d7ea8");
    colorGrad.addColorStop(1.00, "rgba(52,90,176,0)");
    cctx.fillStyle = colorGrad;
    cctx.beginPath();
    cctx.arc(spotX, spotY, spotR, 0, Math.PI * 2);
    cctx.fill();

    const glowGrad = gctx.createRadialGradient(spotX, spotY, 2, spotX, spotY, spotR * 0.85);
    glowGrad.addColorStop(0.00, "#ffffff");
    glowGrad.addColorStop(0.35, "#a6ecff");
    glowGrad.addColorStop(0.70, "rgba(120,190,255,0.4)");
    glowGrad.addColorStop(1.00, "rgba(120,190,255,0)");
    gctx.fillStyle = glowGrad;
    gctx.beginPath();
    gctx.arc(spotX, spotY, spotR * 0.85, 0, Math.PI * 2);
    gctx.fill();
  }

  // Scattered scale noise so the surface doesn't read as flat glass.
  for (let i = 0; i < 2200; i++) {
    const shade = Math.random() > 0.5 ? 255 : 10;
    cctx.fillStyle = `rgba(${shade},${shade},${shade},${Math.random() * 0.05})`;
    cctx.fillRect(Math.random() * size, Math.random() * size, 2, 2);
  }

  const colorTexture = new THREE.CanvasTexture(colorCanvas);
  colorTexture.colorSpace = THREE.SRGBColorSpace;
  colorTexture.wrapS = colorTexture.wrapT = THREE.ClampToEdgeWrapping;

  const glowTexture2 = new THREE.CanvasTexture(glowCanvas);
  glowTexture2.colorSpace = THREE.SRGBColorSpace;
  glowTexture2.wrapS = glowTexture2.wrapT = THREE.ClampToEdgeWrapping;

  return { colorTexture, glowTexture: glowTexture2 };
}

function glowSprite(size, color, opacity = 0.5) {
  const sprite = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: glowTexture,
      color,
      transparent: true,
      opacity,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    })
  );

  sprite.scale.set(size, size, 1);
  return sprite;
}

function lineFromPoints(points, color, opacity = 0.55) {
  return new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(points),
    new THREE.LineBasicMaterial({
      color,
      transparent: true,
      opacity,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    })
  );
}

function tube(points, radius, color, opacity = 0.7, tubular = 48) {
  const curve = new THREE.CatmullRomCurve3(points, false, "catmullrom", 0.45);

  return new THREE.Mesh(
    new THREE.TubeGeometry(curve, tubular, radius, 7, false),
    new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    })
  );
}

function rand(min, max) {
  return min + Math.random() * (max - min);
}

/* =========================================================
   ROOT
========================================================= */

const sage = new THREE.Group();
const flightRig = new THREE.Group();
const butterfly = new THREE.Group();

scene.add(sage);
sage.add(flightRig);
flightRig.add(butterfly);

/*
 * SAGE renders inside a full-screen WebGL canvas on the portfolio.
 * Keep the canvas full viewport so she can fly anywhere on screen,
 * but scale the actual butterfly down to portfolio size.
 */
sage.position.set(0.18, 0.03, 0);
sage.scale.setScalar(0.10);

butterfly.rotation.x = -0.035;
butterfly.rotation.y = -0.10;
butterfly.rotation.z = -0.035;

/* =========================================================
   WING MATERIALS
========================================================= */

function makeWingMaterial(color, opacity, patternMaps) {
  // A map gets multiplied by material.color, and albedo in general gets
  // multiplied by scene lighting — with two strong point lights that
  // crushed the pattern flat. Routing the marks through emissiveMap
  // instead means they glow through regardless of lighting.
  return new THREE.MeshPhysicalMaterial({
    color: patternMaps ? "#ffffff" : color,
    map: patternMaps ? patternMaps.colorTexture : null,
    transparent: true,
    opacity,
    side: THREE.DoubleSide,
    depthWrite: false,

    // Less "wet glass", more waxy scaled membrane.
    roughness: 0.34,
    metalness: 0.0,

    transmission: 0.06,
    thickness: 0.05,

    clearcoat: 0.22,
    clearcoatRoughness: 0.28,

    iridescence: 0.85,
    iridescenceIOR: 1.28,
    iridescenceThicknessRange: [90, 330],

    emissive: patternMaps ? new THREE.Color("#bfe8ff") : new THREE.Color("#173878"),
    emissiveMap: patternMaps ? patternMaps.glowTexture : null,
    emissiveIntensity: patternMaps ? 0.6 : 0.12
  });
}

const wingGlowMaterial = new THREE.MeshBasicMaterial({
  color: "#7d64ff",
  transparent: true,
  opacity: 0.030,
  side: THREE.DoubleSide,
  blending: THREE.AdditiveBlending,
  depthWrite: false
});

/* =========================================================
   WING SHAPE + CURVATURE
========================================================= */

function wingShape(side, upper = true) {
  const s = side;
  const shape = new THREE.Shape();

  if (upper) {
    shape.moveTo(0.035 * s, 0.10);

    shape.bezierCurveTo(
      0.36 * s, 0.34,
      0.73 * s, 1.42,
      1.50 * s, 1.98
    );

    shape.bezierCurveTo(
      2.08 * s, 2.39,
      2.64 * s, 2.10,
      2.54 * s, 1.48
    );

    shape.bezierCurveTo(
      2.47 * s, 1.02,
      2.11 * s, 0.61,
      1.60 * s, 0.39
    );

    shape.bezierCurveTo(
      1.04 * s, 0.16,
      0.48 * s, 0.10,
      0.035 * s, 0.10
    );
  } else {
    shape.moveTo(0.045 * s, -0.01);

    shape.bezierCurveTo(
      0.54 * s, -0.10,
      1.20 * s, -0.36,
      1.67 * s, -0.91
    );

    shape.bezierCurveTo(
      1.99 * s, -1.30,
      1.86 * s, -1.69,
      1.45 * s, -1.87
    );

    shape.bezierCurveTo(
      1.12 * s, -2.02,
      0.72 * s, -1.77,
      0.43 * s, -1.36
    );

    shape.bezierCurveTo(
      0.19 * s, -0.95,
      0.09 * s, -0.43,
      0.045 * s, -0.01
    );
  }

  return shape;
}

function curveWingGeometry(geometry, upper) {
  const position = geometry.getAttribute("position");

  for (let i = 0; i < position.count; i++) {
    const x = position.getX(i);
    const y = position.getY(i);

    const span = upper ? 2.6 : 2.0;
    const normalizedX = THREE.MathUtils.clamp(Math.abs(x) / span, 0, 1);

    const bow =
      Math.sin(normalizedX * Math.PI) *
      (upper ? 0.078 : 0.058);

    const edgeCurl =
      Math.pow(normalizedX, 2.5) *
      (upper ? 0.080 : 0.055);

    const membraneRipple =
      Math.sin(y * 2.2 + x * 0.8) *
      0.010;

    position.setZ(
      i,
      bow + edgeCurl + membraneRipple
    );
  }

  position.needsUpdate = true;
  geometry.computeVertexNormals();
}

/* =========================================================
   VEINS
========================================================= */

function makePrimaryVein(side, upper, index, count) {
  const s = side;
  const rootY = upper ? 0.10 : -0.01;
  const t = (index + 1) / (count + 1);

  if (upper) {
    const end = new THREE.Vector3(
      s * THREE.MathUtils.lerp(0.70, 2.24, t),
      THREE.MathUtils.lerp(0.46, 1.82, 1 - Math.abs(t - 0.55) * 0.72),
      0.11
    );

    const mid = new THREE.Vector3(
      end.x * 0.51,
      rootY + (end.y - rootY) * 0.59 + 0.10,
      0.12
    );

    return new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(0.045 * s, rootY, 0.11),
      mid,
      end
    );
  }

  const end = new THREE.Vector3(
    s * THREE.MathUtils.lerp(0.50, 1.60, t),
    -THREE.MathUtils.lerp(0.34, 1.58, t),
    0.095
  );

  const mid = new THREE.Vector3(
    end.x * 0.54,
    end.y * 0.47 - 0.04,
    0.105
  );

  return new THREE.QuadraticBezierCurve3(
    new THREE.Vector3(0.045 * s, rootY, 0.095),
    mid,
    end
  );
}

function addCrossVeins(rig, side, upper) {
  const count = upper ? 7 : 5;

  for (let i = 0; i < count; i++) {
    const t = (i + 1) / (count + 1);

    const start = upper
      ? new THREE.Vector3(
          side * THREE.MathUtils.lerp(0.30, 0.86, t),
          THREE.MathUtils.lerp(0.34, 1.46, t),
          0.125
        )
      : new THREE.Vector3(
          side * THREE.MathUtils.lerp(0.22, 0.62, t),
          -THREE.MathUtils.lerp(0.22, 0.88, t),
          0.105
        );

    const control = upper
      ? new THREE.Vector3(
          side * THREE.MathUtils.lerp(0.80, 1.36, t),
          THREE.MathUtils.lerp(0.50, 1.58, t),
          0.13
        )
      : new THREE.Vector3(
          side * THREE.MathUtils.lerp(0.66, 1.04, t),
          -THREE.MathUtils.lerp(0.42, 1.10, t),
          0.11
        );

    const end = upper
      ? new THREE.Vector3(
          side * THREE.MathUtils.lerp(1.22, 2.02, t),
          THREE.MathUtils.lerp(0.50, 1.56, t),
          0.115
        )
      : new THREE.Vector3(
          side * THREE.MathUtils.lerp(1.00, 1.52, t),
          -THREE.MathUtils.lerp(0.60, 1.40, t),
          0.095
        );

    const curve = new THREE.QuadraticBezierCurve3(
      start,
      control,
      end
    );

    rig.add(
      lineFromPoints(
        curve.getPoints(24),
        i % 2 === 0 ? "#6f9dff" : "#83dcff",
        0.15
      )
    );
  }
}

/* =========================================================
   WING MICRO-SCALES
========================================================= */

function makeWingScales(side, upper, count) {
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);

  const palette = [
    new THREE.Color("#70e9ff"),
    new THREE.Color("#648fff"),
    new THREE.Color("#9b78ff"),
    new THREE.Color("#d8faff")
  ];

  for (let i = 0; i < count; i++) {
    const k = i * 3;

    // Biased toward the outer edge (sqrt of a uniform sample skews
    // toward 1) rather than uniform across the whole wing — the
    // reference has dust concentrated along the margin, sparser
    // toward the root.
    const edgeBias = Math.sqrt(Math.random());

    const x = side * (
      upper
        ? THREE.MathUtils.lerp(0.18, 2.10, edgeBias)
        : THREE.MathUtils.lerp(0.18, 1.50, edgeBias)
    );

    const y = upper
      ? THREE.MathUtils.lerp(0.18, 1.78, Math.sqrt(Math.random()))
      : -THREE.MathUtils.lerp(0.16, 1.48, Math.sqrt(Math.random()));

    positions[k] = x;
    positions[k + 1] = y;
    positions[k + 2] = rand(0.105, 0.145);

    const c = palette[Math.floor(Math.random() * palette.length)];

    colors[k] = c.r;
    colors[k + 1] = c.g;
    colors[k + 2] = c.b;
  }

  const geometry = new THREE.BufferGeometry();

  geometry.setAttribute(
    "position",
    new THREE.BufferAttribute(positions, 3)
  );

  geometry.setAttribute(
    "color",
    new THREE.BufferAttribute(colors, 3)
  );

  const points = new THREE.Points(
    geometry,
    new THREE.PointsMaterial({
      size: upper ? 0.022 : 0.020,
      map: glowTexture,
      transparent: true,
      opacity: 0.36,
      alphaTest: 0.02,
      depthWrite: false,
      vertexColors: true,
      blending: THREE.AdditiveBlending
    })
  );

  points.userData.basePositions = positions.slice();
  points.userData.phase = Math.random() * Math.PI * 2;

  return points;
}

/* =========================================================
   WING CREATION
========================================================= */

function makeWing(side, upper) {
  const rig = new THREE.Group();
  const shape = wingShape(side, upper);
  const geometry = new THREE.ShapeGeometry(shape, 52);

  curveWingGeometry(geometry, upper);

  // Computed once and shared: the pattern texture needs the real
  // silhouette to place the border/veins correctly (see the function
  // for why), and the outline Line reuses the same points.
  const rawOutline = shape.getPoints(150);

  // Painted pattern texture is no longer used for the lace look (the
  // detail now comes from line-art instead), so skip generating it —
  // it was pure wasted canvas work once fill/inner stopped consuming it.

  const glow = new THREE.Mesh(
    geometry.clone(),
    wingGlowMaterial.clone()
  );

  glow.scale.set(1.025, 1.025, 1);
  glow.position.z = -0.020;

  // Lace/light aesthetic: the membrane is now just a faint hint of
  // surface, not a painted, textured wing — the detail comes from
  // line-art (veins, concentric rings) and particles instead.
  const fill = new THREE.Mesh(
    geometry,
    makeWingMaterial("#eaf6ff", 0.11, null)
  );

  // This is the layer that should actually occlude things behind it
  // (like the ambient flight-trail rings). Every material in this
  // scene defaults to depthWrite: false, which means transparent
  // objects blend purely by draw order rather than true depth — that
  // was letting the trail rings bleed straight through the wing at
  // full strength, showing up as stray bands across the membrane.
  // Writing depth here (combined with the trail's renderOrder below)
  // makes the wing properly hide what's behind it.
  fill.material.depthWrite = true;

  const inner = new THREE.Mesh(
    geometry.clone(),
    makeWingMaterial("#f6fbff", 0.04, null)
  );

  inner.scale.set(0.978, 0.978, 1);
  inner.position.z = 0.024;

  rig.add(glow, fill, inner);

  const outlinePoints = rawOutline
    .map(p => new THREE.Vector3(p.x, p.y, 0.12));

  rig.add(
    lineFromPoints(
      outlinePoints,
      "#c9f3ff",
      0.85
    )
  );

  const veinCount = upper ? 8 : 6;

  for (let i = 0; i < veinCount; i++) {
    const curve = makePrimaryVein(
      side,
      upper,
      i,
      veinCount
    );

    rig.add(
      lineFromPoints(
        curve.getPoints(38),
        i % 2 ? "#8fc4ff" : "#a6ecff",
        0.30
      )
    );
  }

  addCrossVeins(
    rig,
    side,
    upper
  );

  /* -------------------------------------------------------
     Concentric lace rings (NEW)
     Nested copies of the wing's own silhouette, scaled down
     toward the root point — the same trick used to place the
     border band earlier, just repeated at several scales. This
     is the defining feature of the reference look and reads as
     radiating "constellation" rings converging near the body.
  ------------------------------------------------------- */

  const root2D = rawOutline[0];
  const ringScales = upper
    ? [0.30, 0.50, 0.68, 0.85]
    : [0.35, 0.58, 0.80];

  ringScales.forEach((scale, ringIndex) => {
    const ringPoints = rawOutline.map(p => {
      const x = root2D.x + (p.x - root2D.x) * scale;
      const y = root2D.y + (p.y - root2D.y) * scale;
      return new THREE.Vector3(x, y, 0.13 + ringIndex * 0.002);
    });

    rig.add(
      lineFromPoints(
        ringPoints,
        ringIndex % 2 === 0 ? "#9fe4ff" : "#c8b8ff",
        0.16
      )
    );
  });

  const scales = makeWingScales(
    side,
    upper,
    upper ? 260 : 170
  );

  rig.add(scales);

  const nodes = [];
  const nodeCount = upper ? 14 : 10;

  for (let i = 0; i < nodeCount; i++) {
    const node = glowSprite(
      rand(0.035, 0.06),
      i % 4 === 0 ? "#c9b8ff" : "#bfeeff",
      rand(0.18, 0.32)
    );

    node.position.set(
      side * (
        upper
          ? rand(0.38, 2.02)
          : rand(0.32, 1.46)
      ),
      upper
        ? rand(0.28, 1.68)
        : -rand(0.24, 1.42),
      0.16
    );

    node.userData.baseScale = node.scale.x;
    node.userData.phase = Math.random() * Math.PI * 2;

    nodes.push(node);
    rig.add(node);
  }

  rig.userData.side = side;
  rig.userData.upper = upper;
  rig.userData.nodes = nodes;
  rig.userData.scales = scales;
  rig.userData.fill = fill;
  rig.userData.inner = inner;

  return rig;
}

const leftUpperWing = makeWing(-1, true);
const rightUpperWing = makeWing(1, true);
const leftLowerWing = makeWing(-1, false);
const rightLowerWing = makeWing(1, false);

butterfly.add(
  leftUpperWing,
  rightUpperWing,
  leftLowerWing,
  rightLowerWing
);

/* =========================================================
   BODY
========================================================= */

const bodyMaterial = new THREE.MeshPhysicalMaterial({
  // Reversed back toward "made of light" — that matte-exoskeleton
  // push was for an insect-realistic direction we're now moving away
  // from. A light-being's body reads as a bright, glowing, almost
  // liquid bead, not a textured shell.
  color: "#d8f4ff",
  emissive: new THREE.Color("#7fd4ff"),
  emissiveIntensity: 0.65,

  transparent: true,
  opacity: 0.72,

  roughness: 0.15,
  metalness: 0.0,

  transmission: 0.20,
  thickness: 0.12,

  clearcoat: 0.55,
  clearcoatRoughness: 0.15,

  depthWrite: false
});

const bodyGlowMaterial = new THREE.MeshBasicMaterial({
  color: "#5b7cff",
  transparent: true,
  opacity: 0.10,
  blending: THREE.AdditiveBlending,
  depthWrite: false
});

const head = new THREE.Mesh(
  new THREE.SphereGeometry(0.115, 28, 22),
  bodyMaterial
);

head.scale.set(0.92, 1.0, 0.88);
head.position.set(0, 0.48, 0.14);

const thorax = new THREE.Mesh(
  new THREE.SphereGeometry(0.20, 30, 24),
  bodyMaterial
);

thorax.scale.set(0.82, 1.22, 0.88);
thorax.position.set(0, 0.12, 0.15);

const thoraxGlow = thorax.clone();
thoraxGlow.material = bodyGlowMaterial;
thoraxGlow.scale.multiplyScalar(1.15);
thoraxGlow.position.z = 0.05;

const abdomen = new THREE.Mesh(
  new THREE.CapsuleGeometry(0.075, 0.92, 8, 20),
  bodyMaterial
);

abdomen.position.set(0, -0.56, 0.10);
abdomen.scale.set(0.86, 1.02, 0.80);

const abdomenGlow = abdomen.clone();
abdomenGlow.material = bodyGlowMaterial;
abdomenGlow.scale.multiplyScalar(1.13);
abdomenGlow.position.z = 0.03;

butterfly.add(
  thoraxGlow,
  thorax,
  abdomenGlow,
  abdomen,
  head
);

/* =========================================================
   THORAX FUZZ (NEW)
   Real butterflies are covered in fine hair-like scales,
   most densely on the thorax. A sprite scatter reads much
   closer to that than a bare glossy sphere.
========================================================= */

const fuzzGroup = new THREE.Group();
const fuzzCount = 90;

for (let i = 0; i < fuzzCount; i++) {
  const fuzz = glowSprite(rand(0.02, 0.035), "#bfe9ff", rand(0.10, 0.22));
  const theta = rand(0, Math.PI * 2);
  const phi = rand(0.15, Math.PI - 0.15);
  const r = 0.135;

  fuzz.position.set(
    Math.sin(phi) * Math.cos(theta) * r * 0.82,
    0.12 + Math.cos(phi) * r * 1.2,
    0.15 + Math.sin(phi) * Math.sin(theta) * r * 0.88
  );

  fuzzGroup.add(fuzz);
}

butterfly.add(fuzzGroup);

/* =========================================================
   COMPOUND EYES (bigger, faceted, with a real catchlight)
   Butterfly eyes are huge relative to the head — they wrap most
   of it — and their surface is a hexagonal facet array, not a
   smooth dome. A tiny procedural hex texture on roughness/bump
   plus a bright catchlight sprite sells "eye" instead of "bead".
========================================================= */

function makeFacetTexture() {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, size, size);

  ctx.strokeStyle = "rgba(15,25,45,0.55)";
  ctx.lineWidth = 1.1;

  const hexR = 8;
  const hexH = hexR * Math.sqrt(3);

  for (let row = 0; row * hexH * 0.75 < size + hexR; row++) {
    for (let col = 0; col * hexR * 1.5 < size + hexR; col++) {
      const x = col * hexR * 1.5;
      const y = row * hexH * 0.75 + (col % 2 ? hexH * 0.5 : 0);

      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = (Math.PI / 3) * i;
        const px = x + Math.cos(a) * hexR;
        const py = y + Math.sin(a) * hexR;
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.stroke();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(3, 3);
  return texture;
}

const facetTexture = makeFacetTexture();

const eyeMaterial = new THREE.MeshPhysicalMaterial({
  color: "#1a3a5c",
  emissive: new THREE.Color("#4f9dff"),
  emissiveIntensity: 0.20,
  roughnessMap: facetTexture,
  bumpMap: facetTexture,
  bumpScale: 0.006,
  transparent: true,
  opacity: 0.92,
  roughness: 0.42,
  metalness: 0.10,
  clearcoat: 0.55,
  clearcoatRoughness: 0.22,
  depthWrite: false
});

const leftEye = new THREE.Mesh(
  new THREE.SphereGeometry(0.062, 20, 16),
  eyeMaterial
);

leftEye.scale.set(0.55, 0.62, 0.50);
leftEye.position.set(-0.068, 0.500, 0.205);

const rightEye = leftEye.clone();
rightEye.position.x = 0.068;

// A small bright catchlight on each eye — the single detail that
// reads most strongly as "alive" on any glossy eye-like surface.
const catchlightLeft = glowSprite(0.016, "#ffffff", 0.85);
catchlightLeft.position.set(-0.078, 0.512, 0.232);

const catchlightRight = catchlightLeft.clone();
catchlightRight.position.x = 0.078;

// A light-being doesn't read a face well — those googly cartoon eyes
// clash with the faceless glowing-bead head in the reference. Dormant
// for now, not deleted, in case you want them back for an
// insect-leaning version.
// butterfly.add(
//   leftEye,
//   rightEye,
//   catchlightLeft,
//   catchlightRight
// );

/* =========================================================
   PROBOSCIS (NEW)
   The coiled feeding tube is one of the most recognizable
   butterfly features and was completely missing before — a
   spiral tube curling down from under the head.
========================================================= */

function makeProboscis() {
  const points = [];
  const turns = 1.5;
  const steps = 40;

  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const angle = t * turns * Math.PI * 2;
    const radius = THREE.MathUtils.lerp(0.040, 0.004, t);

    points.push(
      new THREE.Vector3(
        Math.cos(angle) * radius,
        0.405 - t * 0.155 - Math.sin(angle) * radius * 0.12,
        0.235 + Math.sin(angle) * radius * 0.55
      )
    );
  }

  return tube(points, 0.006, "#5fa8c9", 0.42, 40);
}

// A light-being doesn't need a feeding proboscis — dormant for now,
// not deleted, in case you want an insect-leaning version later.
// butterfly.add(makeProboscis());

/* =========================================================
   ABDOMEN SEGMENTS
========================================================= */

const bodySegments = [];

// The visible ring segments read as a jointed insect tube — the
// reference body is a smooth, tapered glow with no visible
// segmentation. Rings are still built and animated (harmless, unused)
// in case you want the insect-leaning version back; just not added
// to the scene.
for (let i = 0; i < 5; i++) {
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(
      0.070 - i * 0.004,
      0.0055,
      8,
      32
    ),
    new THREE.MeshBasicMaterial({
      color: i % 2 === 0 ? "#84edff" : "#877dff",
      transparent: true,
      opacity: 0.24,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    })
  );

  ring.rotation.x = Math.PI / 2;
  ring.position.set(
    0,
    -0.28 - i * 0.16,
    0.17
  );

  bodySegments.push(ring);
  // butterfly.add(ring);
}

/* =========================================================
   CORE
========================================================= */

const core = new THREE.Group();
core.position.set(0, 0.13, 0.30);

const coreSphere = new THREE.Mesh(
  new THREE.SphereGeometry(0.058, 24, 24),
  new THREE.MeshBasicMaterial({
    color: "#ffffff",
    transparent: true,
    opacity: 0.90,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  })
);

const coreGlow1 = glowSprite(0.36, "#bcfaff", 0.52);
const coreGlow2 = glowSprite(0.62, "#55d7ff", 0.15);
const coreGlow3 = glowSprite(0.92, "#6668ff", 0.040);

core.add(
  coreGlow3,
  coreGlow2,
  coreGlow1,
  coreSphere
);

butterfly.add(core);

/* =========================================================
   COMET DUST TRAIL (NEW)
   The reference's most distinctive motion cue: a stream of
   particles genuinely trailing her flight path, not just ambient
   drift. Added directly to the scene (not parented to her) so each
   particle stays where it was sampled — a real history of where
   she's been, fading with age.
========================================================= */

const cometTrailLength = 46;
const cometTrailPositions = new Float32Array(cometTrailLength * 3);
const cometTrailColors = new Float32Array(cometTrailLength * 3);
const cometTrailHistory = [];

const cometTrailGeometry = new THREE.BufferGeometry();
cometTrailGeometry.setAttribute(
  "position",
  new THREE.BufferAttribute(cometTrailPositions, 3)
);
cometTrailGeometry.setAttribute(
  "color",
  new THREE.BufferAttribute(cometTrailColors, 3)
);

const cometTrail = new THREE.Points(
  cometTrailGeometry,
  new THREE.PointsMaterial({
    size: 0.05,
    map: glowTexture,
    transparent: true,
    alphaTest: 0.01,
    depthWrite: false,
    vertexColors: true,
    blending: THREE.AdditiveBlending
  })
);

scene.add(cometTrail);

const cometColorNear = new THREE.Color("#e8f9ff");
const cometColorFar = new THREE.Color("#6a7dff");
const cometWorldPos = new THREE.Vector3();

/* =========================================================
   ANTENNAE
========================================================= */

const antennaLeftPivot = new THREE.Group();
antennaLeftPivot.position.set(-0.045, 0.54, 0.13);

const antennaLeft = tube(
  [
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(-0.085, 0.22, 0.01),
    new THREE.Vector3(-0.265, 0.43, -0.01),
    new THREE.Vector3(-0.485, 0.60, -0.04)
  ],
  0.009,
  "#82ecff",
  0.68
);

const antennaTipLeft = glowSprite(0.065, "#9cf7ff", 0.56);
antennaTipLeft.position.set(-0.485, 0.60, -0.03);

antennaLeftPivot.add(antennaLeft, antennaTipLeft);
antennaLeftPivot.userData.phase = Math.random() * Math.PI * 2;

const antennaRightPivot = new THREE.Group();
antennaRightPivot.position.set(0.045, 0.54, 0.13);

const antennaRight = tube(
  [
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0.085, 0.22, 0.01),
    new THREE.Vector3(0.265, 0.43, -0.01),
    new THREE.Vector3(0.485, 0.60, -0.04)
  ],
  0.009,
  "#82ecff",
  0.68
);

const antennaTipRight = glowSprite(0.065, "#9cf7ff", 0.56);
antennaTipRight.position.set(0.485, 0.60, -0.03);

antennaRightPivot.add(antennaRight, antennaTipRight);
antennaRightPivot.userData.phase = Math.random() * Math.PI * 2;

butterfly.add(
  antennaLeftPivot,
  antennaRightPivot
);

/* =========================================================
   LEGS
========================================================= */

const legGroup = new THREE.Group();

function makeLeg(side, yOffset, backward) {
  const s = side;

  const points = [
    new THREE.Vector3(0.10 * s, 0.04 + yOffset, 0.10),
    new THREE.Vector3(0.24 * s, -0.08 + yOffset, 0.02),
    new THREE.Vector3(
      (backward ? 0.43 : 0.36) * s,
      -0.30 + yOffset,
      -0.03
    )
  ];

  // A light-being doesn't need clawed insect legs — back to a single
  // delicate glowing thread, matching the antennae/vein treatment.
  return tube(points, 0.0042, "#a6ecff", 0.35, 28);
}

legGroup.add(
  makeLeg(-1, 0.11, false),
  makeLeg(1, 0.11, false),
  makeLeg(-1, -0.02, true),
  makeLeg(1, -0.02, true),
  makeLeg(-1, -0.14, true),
  makeLeg(1, -0.14, true)
);

butterfly.add(legGroup);

/* =========================================================
   AMBIENT GLITTER
========================================================= */

const sparkleCount = 220;

const sparklePositions = new Float32Array(sparkleCount * 3);
const sparkleBase = new Float32Array(sparkleCount * 3);
const sparkleColors = new Float32Array(sparkleCount * 3);

const sparklePalette = [
  new THREE.Color("#7befff"),
  new THREE.Color("#5d96ff"),
  new THREE.Color("#9a74ff"),
  new THREE.Color("#ffffff")
];

for (let i = 0; i < sparkleCount; i++) {
  const angle = Math.random() * Math.PI * 2;
  const radius = Math.pow(Math.random(), 0.74) * 3.15;

  const x = Math.cos(angle) * radius;
  const y = Math.sin(angle) * radius * 0.68 + 0.04;
  const z = rand(-0.70, 0.34);

  const k = i * 3;

  sparklePositions[k] = sparkleBase[k] = x;
  sparklePositions[k + 1] = sparkleBase[k + 1] = y;
  sparklePositions[k + 2] = sparkleBase[k + 2] = z;

  const color = sparklePalette[
    Math.floor(Math.random() * sparklePalette.length)
  ];

  sparkleColors[k] = color.r;
  sparkleColors[k + 1] = color.g;
  sparkleColors[k + 2] = color.b;
}

const sparkleGeometry = new THREE.BufferGeometry();

sparkleGeometry.setAttribute(
  "position",
  new THREE.BufferAttribute(sparklePositions, 3)
);

sparkleGeometry.setAttribute(
  "color",
  new THREE.BufferAttribute(sparkleColors, 3)
);

const sparkles = new THREE.Points(
  sparkleGeometry,
  new THREE.PointsMaterial({
    size: 0.038,
    map: glowTexture,
    transparent: true,
    opacity: 0.30,
    alphaTest: 0.02,
    depthWrite: false,
    vertexColors: true,
    blending: THREE.AdditiveBlending
  })
);

butterfly.add(sparkles);

/* =========================================================
   TRAILS
========================================================= */

const trailGroup = new THREE.Group();
flightRig.add(trailGroup);

function makeTrail(seed, color, opacity) {
  const points = [];

  for (let i = 0; i <= 120; i++) {
    const u = i / 120;
    const angle = u * Math.PI * 2.05 + seed;

    points.push(
      new THREE.Vector3(
        Math.cos(angle) *
          (2.12 + Math.sin(u * 7 + seed) * 0.15),

        Math.sin(angle * 0.86) *
          1.34 +
          Math.cos(u * 8 + seed) *
          0.08,

        -0.74 - u * 0.28
      )
    );
  }

  return lineFromPoints(points, color, opacity);
}

const trailA = makeTrail(0.3, "#4fdfff", 0.045);
const trailB = makeTrail(2.1, "#687cff", 0.030);
const trailC = makeTrail(4.2, "#a06cff", 0.018);

// Forces these to draw after the wing fill (renderOrder 0, default)
// regardless of the automatic distance sort, so they get properly
// depth-tested against the wing's now-written depth instead of
// bleeding through it as a visible band.
trailA.renderOrder = 10;
trailB.renderOrder = 10;
trailC.renderOrder = 10;

trailGroup.add(
  trailA,
  trailB,
  trailC
);

/* =========================================================
   BEHAVIOUR API
========================================================= */

const behaviour = {
  state: "idle",
  energy: 1,
  targetEnergy: 1,
  wingSpeed: 1,
  targetWingSpeed: 1,
  roam: 1,
  targetRoam: 1
};

function setState(state) {
  behaviour.state = state;

  const presets = {
    idle: {
      energy: 1.00,
      wingSpeed: 1.00,
      roam: 1.00
    },

    thinking: {
      energy: 1.08,
      wingSpeed: 0.70,
      roam: 0.42
    },

    talking: {
      energy: 1.15,
      wingSpeed: 1.12,
      roam: 0.60
    },

    moving: {
      energy: 1.12,
      wingSpeed: 1.52,
      roam: 1.40
    },

    curious: {
      energy: 1.12,
      wingSpeed: 0.90,
      roam: 0.82
    }
  };

  const preset = presets[state] || presets.idle;

  behaviour.targetEnergy = preset.energy;
  behaviour.targetWingSpeed = preset.wingSpeed;
  behaviour.targetRoam = preset.roam;
}

window.SAGEAvatar = {
  setState,
  getState: () => behaviour.state,
  getObject3D: () => sage,
  // Debug helper: force glide/perch/flutter immediately instead of
  // waiting for the randomized timer, so you can check it's actually
  // wired up. Open devtools console → SAGEAvatar.forcePhase("perch")
  forcePhase: (name) => {
    phaseBlendTarget.flutterAmp =
      name === "perch" ? 0.04 : name === "glide" ? 0.28 : 0.82;
    phaseBlendTarget.foldAmount = name === "perch" ? 1 : 0;
    flightPhase = name;
    phaseStartT = clock.getElapsedTime();
    phaseDuration = 3;
  }
};

/* =========================================================
   POINTER
========================================================= */

const pointer = {
  x: 0,
  y: 0
};

window.addEventListener("pointermove", event => {
  pointer.x =
    (event.clientX / window.innerWidth) * 2 - 1;

  pointer.y =
    -((event.clientY / window.innerHeight) * 2 - 1);
});

/* =========================================================
   RESIZE
========================================================= */

function resize() {
  const width = mount.clientWidth;
  const height = mount.clientHeight;

  if (!width || !height) {
    return;
  }

  renderer.setSize(
    width,
    height,
    false
  );

  composer.setSize(width, height);
  composer.setPixelRatio(renderer.getPixelRatio());

  camera.aspect =
    width / height;

  camera.fov =
    width / height > 1.15
      ? 33
      : 38;

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

const clock = new THREE.Clock();

const reduceMotion =
  window.matchMedia?.(
    "(prefers-reduced-motion: reduce)"
  )?.matches;

// Natural wingbeat shaping: a real wingbeat is not a pure sine —
// the downstroke is quicker and more powerful than the recovery
// upstroke. This bends the sine toward that asymmetric rhythm.
function wingBeatShape(phase) {
  const s = Math.sin(phase);
  return Math.sign(s) * Math.pow(Math.abs(s), 0.62);
}

/* =========================================================
   FLIGHT PHASES (NEW)
   A butterfly that flaps at one constant rate forever reads as
   a looping animation, not a living thing. Real flight alternates
   bursts of flapping with short glides and the occasional perch —
   wings drawn in and held still for a moment. This is a small
   state machine that picks the next phase and duration, and a
   set of blend targets the animate loop eases toward.
========================================================= */

let flightPhase = "glide";
let phaseStartT = 0;
let phaseDuration = 6;

const phaseBlend = {
  flutterAmp: 0.22,
  foldAmount: 0
};

const phaseBlendTarget = {
  flutterAmp: 0.22,
  foldAmount: 0
};

function pickNextPhase(t) {
  const r = Math.random();

  if (r < 0.45) {
    flightPhase = "flutter";
    phaseDuration = rand(3.2, 5.2);
    phaseBlendTarget.flutterAmp = 0.82;
    phaseBlendTarget.foldAmount = 0;
  } else if (r < 0.85) {
    flightPhase = "glide";
    phaseDuration = rand(2.4, 4.6);
    phaseBlendTarget.flutterAmp = 0.28;
    phaseBlendTarget.foldAmount = 0;
  } else {
    flightPhase = "perch";
    phaseDuration = rand(1.4, 2.4);
    phaseBlendTarget.flutterAmp = 0.04;
    phaseBlendTarget.foldAmount = 1;
  }

  phaseStartT = t;
}

// =========================================================
// SAGE - CALM FLIGHT
// =========================================================

const flightTarget = new THREE.Vector3(0.18, 0.03, 0);
const flightCurrent = new THREE.Vector3(0.18, 0.03, 0);

let nextFlightTargetTime = 0;

function chooseFlightTarget() {
  // Keep SAGE comfortably inside the visible screen
  flightTarget.set(
    THREE.MathUtils.randFloat(-3.0, 3.0),
    THREE.MathUtils.randFloat(-1.7, 1.7),
    0
  );
}

  function animate() {
  const t = clock.getElapsedTime();

  // ---------------------------------------------------------
  // Calm roaming flight
  // ---------------------------------------------------------

  if (t > nextFlightTargetTime) {
    chooseFlightTarget();
    nextFlightTargetTime = t + THREE.MathUtils.randFloat(4, 8);
  }

  flightCurrent.lerp(flightTarget, 0.006);

  const floatX = Math.sin(t * 0.75) * 0.05;
  const floatY = Math.sin(t * 1.15) * 0.07;

  sage.position.x = flightCurrent.x + floatX;
  sage.position.y = flightCurrent.y + floatY;
  }

  // "thinking"/"talking" states shouldn't let her drift off into a
  // long perch mid-conversation, so bias hard back toward fluttering
  // whenever energy is elevated.
  if (behaviour.targetWingSpeed > 1.05 && flightPhase !== "flutter") {
    phaseBlendTarget.flutterAmp = 0.82;
    phaseBlendTarget.foldAmount = 0;
  }

  phaseBlend.flutterAmp +=
    (phaseBlendTarget.flutterAmp - phaseBlend.flutterAmp) * 0.04;

  phaseBlend.foldAmount +=
    (phaseBlendTarget.foldAmount - phaseBlend.foldAmount) * 0.05;

  behaviour.energy +=
    (behaviour.targetEnergy - behaviour.energy) *
    0.035;

  behaviour.wingSpeed +=
    (behaviour.targetWingSpeed - behaviour.wingSpeed) *
    0.035;

  behaviour.roam +=
    (behaviour.targetRoam - behaviour.roam) *
    0.035;

  const motionScale =
    reduceMotion
      ? 0.18
      : 1;

  /* -------------------------------------------------------
     Flight
  ------------------------------------------------------- */

  // Two products of incommensurate-frequency sines read as gentle
  // aperiodic wander rather than an obvious repeating loop, layered
  // on top of the original path.
  const wanderX =
    Math.sin(t * 0.163) * Math.sin(t * 0.0471 + 0.7) * 0.30;

  const wanderY =
    Math.sin(t * 0.137 + 1.3) * Math.sin(t * 0.0533) * 0.20;

  const targetX =
    (
      Math.sin(t * 0.22) * 0.40 +
      Math.sin(t * 0.071 + 1.2) * 0.18 +
      wanderX
    ) *
    behaviour.roam *
    motionScale;

  const targetY =
    (
      Math.cos(t * 0.18 + 0.6) * 0.26 +
      Math.sin(t * 0.41) * 0.08 +
      wanderY
    ) *
    behaviour.roam *
    motionScale;

  flightRig.position.x +=
    (
      targetX +
      pointer.x * 0.11 -
      flightRig.position.x
    ) *
    0.018;

  flightRig.position.y +=
    (
      targetY +
      pointer.y * 0.06 -
      flightRig.position.y
    ) *
    0.018;

  flightRig.rotation.z =
    -0.025 +
    Math.sin(t * 0.31) *
    0.040 *
    motionScale;

  flightRig.rotation.y +=
    (
      pointer.x * 0.075 -
      flightRig.rotation.y
    ) *
    0.018;

  // Hover/bob and body sway ease down during a perch instead of
  // cutting instantly, so settling in reads as a deliberate landing.
  const restCalm = THREE.MathUtils.lerp(1, 0.30, phaseBlend.foldAmount);

  butterfly.position.y =
    Math.sin(t * 0.72) *
    0.038 *
    motionScale *
    restCalm;

  butterfly.rotation.x =
    -0.035 +
    Math.cos(t * 0.39) *
    0.020 *
    motionScale *
    restCalm;

  butterfly.rotation.z =
    -0.035 +
    Math.sin(t * 0.22) *
    0.012 *
    motionScale *
    restCalm;

  /* -------------------------------------------------------
     Natural wing motion
  ------------------------------------------------------- */

  // A slow multiplier on the beat rate itself keeps the rhythm from
  // feeling perfectly metronomic, the way a real wingbeat drifts.
  const beatRateJitter = 1 + Math.sin(t * 0.37) * 0.05;

  const wingPhase =
    t *
    2.08 *
    behaviour.wingSpeed *
    beatRateJitter;

  // Second harmonic breaks the overly-perfect sine wave, and the
  // shaped base wave gives the downstroke a natural snap.
  const organicWave =
    wingBeatShape(wingPhase) +
    Math.sin(wingPhase * 2.0 + 0.55) * 0.13;

  const flap =
    organicWave *
    0.22 *
    motionScale *
    phaseBlend.flutterAmp;

  const lowerFlap =
    (
      wingBeatShape(wingPhase - 0.30) +
      Math.sin(wingPhase * 2.0 + 0.18) * 0.10
    ) *
    0.145 *
    motionScale *
    phaseBlend.flutterAmp;

  // The base (non-flapping) wing angle widens toward a folded,
  // wings-drawn-together pose as foldAmount rises during a perch.
  const baseUpperAngle =
    THREE.MathUtils.lerp(0.105, 1.10, phaseBlend.foldAmount);

  const baseLowerAngle =
    THREE.MathUtils.lerp(0.055, 0.82, phaseBlend.foldAmount);

  // Slightly different asymmetry multiplier per frame keeps left and
  // right from ever being perfect mirror images of each other.
  const sideAsymmetry = 0.985 + Math.sin(t * 0.53) * 0.012;

  leftUpperWing.rotation.y =
    -baseUpperAngle - flap;

  rightUpperWing.rotation.y =
    baseUpperAngle + flap * sideAsymmetry;

  leftLowerWing.rotation.y =
    -baseLowerAngle - lowerFlap;

  rightLowerWing.rotation.y =
    baseLowerAngle + lowerFlap * sideAsymmetry;

  const twist =
    Math.cos(wingPhase) *
    0.014 *
    motionScale;

  leftUpperWing.rotation.x =
    twist;

  rightUpperWing.rotation.x =
    twist * 0.96;

  leftLowerWing.rotation.x =
    -twist * 0.50;

  rightLowerWing.rotation.x =
    -twist * 0.48;

  leftUpperWing.rotation.z =
    -0.009 +
    Math.sin(t * 0.83) *
    0.009;

  rightUpperWing.rotation.z =
    0.009 -
    Math.sin(t * 0.83) *
    0.009;

  leftLowerWing.rotation.z =
    -0.005 +
    Math.cos(t * 0.67) *
    0.007;

  rightLowerWing.rotation.z =
    0.005 -
    Math.cos(t * 0.67) *
    0.007;

  /* -------------------------------------------------------
     Iridescent wing shimmer
  ------------------------------------------------------- */

  const shimmer =
    0.5 +
    0.5 *
    Math.sin(
      t * 0.72 +
      butterfly.rotation.y * 2.0
    );

  [
    leftUpperWing,
    rightUpperWing,
    leftLowerWing,
    rightLowerWing
  ].forEach((wing, wingIndex) => {
    // Base level kept high enough that the emissive vein/border/eyespot
    // pattern stays legible — this used to reset to ~0.11 every frame,
    // which quietly erased the pattern regardless of material setup.
    wing.userData.fill.material.emissiveIntensity =
      0.55 +
      shimmer * 0.05 +
      wingIndex * 0.003;

    wing.userData.inner.material.opacity =
      0.08 +
      shimmer * 0.020;

    const attr =
      wing.userData.scales.geometry.getAttribute(
        "position"
      );

    const base =
      wing.userData.scales.userData.basePositions;

    for (let i = 0; i < attr.count; i++) {
      const k = i * 3;

      attr.setXYZ(
        i,
        base[k],
        base[k + 1],
        base[k + 2] +
          Math.sin(
            t * 0.46 +
            i * 0.031 +
            wingIndex
          ) *
          0.004
      );
    }

    attr.needsUpdate = true;

    wing.userData.scales.material.opacity =
      0.30 +
      shimmer * 0.10;
  });

  /* -------------------------------------------------------
     Core pulse
  ------------------------------------------------------- */

  const corePulse =
    1 +
    Math.sin(
      t *
      1.55 *
      behaviour.energy
    ) *
    0.038;

  coreSphere.scale.setScalar(
    corePulse
  );

  coreGlow1.scale.set(
    0.36 * corePulse,
    0.36 * corePulse,
    1
  );

  coreGlow2.scale.set(
    0.62 *
      (
        0.985 +
        Math.sin(t * 1.02) *
        0.020
      ),

    0.62 *
      (
        0.985 +
        Math.sin(t * 1.02) *
        0.020
      ),

    1
  );

  coreGlow3.scale.set(
    0.92 *
      (
        0.985 +
        Math.cos(t * 0.76) *
        0.016
      ),

    0.92 *
      (
        0.985 +
        Math.cos(t * 0.76) *
        0.016
      ),

    1
  );

  /* -------------------------------------------------------
     Wing nodes
  ------------------------------------------------------- */

  [
    leftUpperWing,
    rightUpperWing,
    leftLowerWing,
    rightLowerWing
  ].forEach(wing => {
    wing.userData.nodes.forEach(
      (node, index) => {
        const scale =
          node.userData.baseScale *
          (
            1 +
            Math.sin(
              t * 1.02 +
              node.userData.phase +
              index * 0.13
            ) *
            0.08
          );

        node.scale.set(
          scale,
          scale,
          1
        );
      }
    );
  });

  /* -------------------------------------------------------
     Body segments
  ------------------------------------------------------- */

  bodySegments.forEach(
    (segment, index) => {
      segment.material.opacity =
        0.20 +
        Math.sin(
          t * 0.66 +
          index * 0.36
        ) *
        0.026;
    }
  );

  /* -------------------------------------------------------
     Antennae idle twitch
     Static antennae read as a rigid prop. A slow wander plus an
     occasional sharper flick — more pronounced when curious/thinking
     — sells them as something she's actually sensing with.
  ------------------------------------------------------- */

  const antennaAlert =
    THREE.MathUtils.lerp(1, 1.8, THREE.MathUtils.clamp(behaviour.energy - 1, 0, 1));

  antennaLeftPivot.rotation.z =
    Math.sin(t * 0.9 + antennaLeftPivot.userData.phase) *
    0.05 *
    antennaAlert *
    motionScale;

  antennaLeftPivot.rotation.x =
    Math.sin(t * 1.4 + antennaLeftPivot.userData.phase * 1.7) *
    0.03 *
    antennaAlert *
    motionScale;

  antennaRightPivot.rotation.z =
    -Math.sin(t * 0.87 + antennaRightPivot.userData.phase) *
    0.05 *
    antennaAlert *
    motionScale;

  antennaRightPivot.rotation.x =
    Math.sin(t * 1.35 + antennaRightPivot.userData.phase * 1.7) *
    0.03 *
    antennaAlert *
    motionScale;

  /* -------------------------------------------------------
     Ambient sparkle drift
  ------------------------------------------------------- */

  const positions =
    sparkleGeometry.getAttribute(
      "position"
    );

  for (
    let i = 0;
    i < sparkleCount;
    i++
  ) {
    const k = i * 3;

    const bx =
      sparkleBase[k];

    const by =
      sparkleBase[k + 1];

    const bz =
      sparkleBase[k + 2];

    positions.setXYZ(
      i,

      bx +
        Math.sin(
          t * 0.40 +
          by * 1.2 +
          i * 0.06
        ) *
        0.012,

      by +
        Math.cos(
          t * 0.34 +
          bx * 1.1 +
          i * 0.05
        ) *
        0.012,

      bz +
        Math.sin(
          t * 0.26 +
          i * 0.04
        ) *
        0.010
    );
  }

  positions.needsUpdate = true;

  sparkles.material.opacity =
    0.30 +
    Math.sin(t * 1.08) *
    0.020;

  /* -------------------------------------------------------
     Trails
  ------------------------------------------------------- */

  trailGroup.rotation.z =
    t *
    0.016 *
    motionScale;

  trailGroup.rotation.y =
    Math.sin(t * 0.12) *
    0.050 *
    motionScale;

  /* -------------------------------------------------------
     Comet dust trail
  ------------------------------------------------------- */

  core.getWorldPosition(cometWorldPos);

  cometTrailHistory.unshift({
    x: cometWorldPos.x,
    y: cometWorldPos.y,
    z: cometWorldPos.z
  });

  if (cometTrailHistory.length > cometTrailLength) {
    cometTrailHistory.length = cometTrailLength;
  }

  for (let i = 0; i < cometTrailLength; i++) {
    const k = i * 3;
    const sample = cometTrailHistory[i] || cometTrailHistory[cometTrailHistory.length - 1];

    cometTrailPositions[k] = sample.x;
    cometTrailPositions[k + 1] = sample.y;
    cometTrailPositions[k + 2] = sample.z;

    // Fades both in color and (via a darker, additive-blended color)
    // effective opacity as it ages toward the tail end.
    const age = i / cometTrailLength;
    const fade = Math.pow(1 - age, 1.6) * phaseBlend.flutterAmp;

    const c = cometColorFar.clone().lerp(cometColorNear, 1 - age).multiplyScalar(fade);

    cometTrailColors[k] = c.r;
    cometTrailColors[k + 1] = c.g;
    cometTrailColors[k + 2] = c.b;
  }

  cometTrailGeometry.attributes.position.needsUpdate = true;
  cometTrailGeometry.attributes.color.needsUpdate = true;

  /* -------------------------------------------------------
     Light movement
  ------------------------------------------------------- */

  cyanLight.position.x =
    1.5 +
    Math.sin(t * 0.17) *
    0.28;

  violetLight.position.y =
    -0.8 +
    Math.cos(t * 0.15) *
    0.22;

 renderer.render(scene, camera);

  requestAnimationFrame(
    animate
  );
}

requestAnimationFrame(
  animate
);
