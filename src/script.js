import GUI from "lil-gui";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import firefliesVertexShader from "./shaders/fireflies/vertex.glsl";
import firefliesFragmentShader from "./shaders/fireflies/fragment.glsl";
import portalVertexShader from "./shaders/portal/vertex.glsl";
import portalFragmentShader from "./shaders/portal/fragment.glsl";

/**
 * Base
 */
// Debug
const debugObject = {};
const gui = new GUI({
  width: 400,
});
gui.hide(); // Hides the panel

// Canvas
const canvas = document.querySelector("canvas.webgl");

// Scene
const scene = new THREE.Scene();

/**
 * Loaders
 */
// Texture loader
const textureLoader = new THREE.TextureLoader();

// Draco loader
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath("draco/");

// GLTF loader
const gltfLoader = new GLTFLoader();
gltfLoader.setDRACOLoader(dracoLoader);

const bakedTexture = textureLoader.load("baked.jpg");
bakedTexture.flipY = false;
bakedTexture.colorSpace = THREE.SRGBColorSpace;

debugObject.portalColorStart = "#f5f6ff";
debugObject.portalColorEnd = "#0217a2";

const bakedMaterial = new THREE.MeshBasicMaterial({ map: bakedTexture });
const poleLightMaterial = new THREE.MeshBasicMaterial({ color: 0xffffe5 });
const portalLightMaterial = new THREE.ShaderMaterial({
  vertexShader: portalVertexShader,
  fragmentShader: portalFragmentShader,
  uniforms: {
    uTime: { valu0: 0 },
    uColorStart: { value: new THREE.Color(debugObject.portalColorStart) },
    uColorEnd: { value: new THREE.Color(debugObject.portalColorEnd) },
  },
});

gui.addColor(debugObject, "portalColorStart").onChange(() => {
  portalLightMaterial.uniforms.uColorStart.value.set(
    debugObject.portalColorStart,
  );
});

gui.addColor(debugObject, "portalColorEnd").onChange(() => {
  portalLightMaterial.uniforms.uColorEnd.value.set(debugObject.portalColorEnd);
});

gltfLoader.load("portal.glb", (gltf) => {
  scene.add(gltf.scene);
  const bakedMesh = gltf.scene.children.find((child) => child.name === "baked");
  // Get each object
  const portalLightMesh = gltf.scene.children.find(
    (child) => child.name === "portalLight",
  );
  const poleLightAMesh = gltf.scene.children.find(
    (child) => child.name === "poleLightA",
  );
  const poleLightBMesh = gltf.scene.children.find(
    (child) => child.name === "poleLightB",
  );
  bakedMesh.material = bakedMaterial;
  poleLightAMesh.material = poleLightMaterial;
  poleLightBMesh.material = poleLightMaterial;
  portalLightMesh.material = portalLightMaterial;
});

const fireflyGeometry = new THREE.BufferGeometry();
const fireflyCount = 30;
const positionArray = new Float32Array(fireflyCount * 3);
const scaleArray = new Float32Array(fireflyCount);

for (let i = 0; i < fireflyCount; i++) {
  positionArray[i * 3] = (Math.random() - 0.5) * 4;
  positionArray[i * 3 + 1] = Math.random() * 1.5;
  positionArray[i * 3 + 2] = (Math.random() - 0.5) * 4;
  scaleArray[i] = Math.random();
}
fireflyGeometry.setAttribute(
  "aScale",
  new THREE.BufferAttribute(scaleArray, 1),
);
fireflyGeometry.setAttribute(
  "position",
  new THREE.BufferAttribute(positionArray, 3),
);
const fireflyMaterial = new THREE.ShaderMaterial({
  uniforms: {
    uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
    uSize: { value: 100 },
    uTime: { value: 0 },
  },
  transparent: true,
  vertexShader: firefliesVertexShader,
  fragmentShader: firefliesFragmentShader,
  blending: THREE.AdditiveBlending,
  depthWrite: false,
});
gui
  .add(fireflyMaterial.uniforms.uSize, "value")
  .min(0)
  .max(500)
  .step(1)
  .name("firefliesSize");
const fireflies = new THREE.Points(fireflyGeometry, fireflyMaterial);
scene.add(fireflies);
/**
 * Sizes
 */
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};

window.addEventListener("resize", () => {
  // Update sizes
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;

  // Update camera
  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();

  // Update renderer
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(
  45,
  sizes.width / sizes.height,
  0.1,
  100,
);
camera.position.x = 4;
camera.position.y = 2;
camera.position.z = 4;
scene.add(camera);

// Controls
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
  antialias: true,
});
debugObject.clearColor = "#435106";
gui.addColor(debugObject, "clearColor").onChange((color) => {
  renderer.setClearColor(color);
});
renderer.setClearColor(debugObject.clearColor);

renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

/**
 * Animate
 */
const clock = new THREE.Clock();

const tick = () => {
  const elapsedTime = clock.getElapsedTime();

  // Update controls
  controls.update();

  portalLightMaterial.uniforms.uTime.value = elapsedTime;
  fireflyMaterial.uniforms.uTime.value = elapsedTime;

  // Render
  renderer.render(scene, camera);

  // Call tick again on the next frame
  window.requestAnimationFrame(tick);
};

tick();

