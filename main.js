import * as THREE from "three";
import gsap from "gsap";
import { RGBELoader } from "three/examples/jsm/Addons.js";

// loaders and constants
const canvas = document.querySelector("#canvas"); // where the 3d scene will be rendered
const rgbeLoader = new RGBELoader(); // loader for environment map
const textureLoader = new THREE.TextureLoader(); // loader for textures
const windowWidth = window.innerWidth;
const windowHeight = window.innerHeight;

// Set up scene, camera, and renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  25,
  windowWidth / windowHeight,
  0.1,
  100
);
const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
});
camera.position.z = 8;
renderer.setSize(windowWidth, windowHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// load environment map (hdri)
rgbeLoader.load(
  "https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/moonlit_golf_1k.hdr",
  (envMap) => {
    envMap.mapping = THREE.EquirectangularReflectionMapping;
    scene.environment = envMap;
  }
);

// Create a big sphere with stars texture (bg stars)
textureLoader.load("./stars.jpg", (starsTexture) => {
  const bigSphereGeometry = new THREE.SphereGeometry(20, 50, 50);
  starsTexture.colorSpace = THREE.SRGBColorSpace;
  const bigSphereMaterial = new THREE.MeshPhysicalMaterial({
    map: starsTexture,
    side: THREE.BackSide,
  });
  const bigSphere = new THREE.Mesh(bigSphereGeometry, bigSphereMaterial);
  scene.add(bigSphere);
});

// Creating the planets
const spheres = new THREE.Group();
const radius = 1.3;
const segments = 40;
const orbitRadius = 4.2;
const textures = [
  "./csilla/color.png",
  "./earth/map.jpg",
  "./venus/map.jpg",
  "./volcanic/color.png",
];

for (let i = 0; i < 4; i++) {
  const texture = textureLoader.load(textures[i]);
  texture.colorSpace = THREE.SRGBColorSpace;
  const geometry = new THREE.SphereGeometry(radius, segments, segments);
  const material = new THREE.MeshStandardMaterial({
    map: texture,
  });
  const sphere = new THREE.Mesh(geometry, material);
  const angle = (i / 4) * (Math.PI * 2);
  sphere.position.x = orbitRadius * Math.cos(angle);
  sphere.position.z = orbitRadius * Math.sin(angle);
  spheres.add(sphere);
}
spheres.rotation.x = 0.09;
spheres.position.y = -0.9;
scene.add(spheres);

let clock = new THREE.Clock();
// Animation loop
function animate() {
  requestAnimationFrame(animate);
  spheres.children.forEach((child) => {
    child.rotation.y = clock.getElapsedTime() * 0.03;
  });
  renderer.render(scene, camera);
}
animate();

// attaching listners
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Throttled wheel event handler
let scrollCount = 0;
let touchStartY = 0;
let touchEndY = 0;
// Touch event handling for mobile devices

const handleTouchStart = (e) => {
  touchStartY = e.touches[0].clientY;
};

const handleTouchEnd = (e) => {
  touchEndY = e.changedTouches[0].clientY;
  const deltaY = touchEndY - touchStartY;

  // Simulate wheel event
  const simulatedWheelEvent = {
    deltaY: deltaY < 0 ? 1 : -1, // Invert delta to match scroll direction
  };

  throttledWheelHandler(simulatedWheelEvent);
};

const throttledWheelHandler = throttle((e) => {
  const delta =
    e.deltaY !== undefined
      ? e.deltaY > 0
        ? "down"
        : "up"
      : e.deltaY < 0
      ? "down"
      : "up";
  const headings = document.querySelectorAll(".heading");

  if (delta === "down") {
    scrollCount = (scrollCount + 1) % 4;
  } else {
    scrollCount = (scrollCount - 1 + 4) % 4;
  }

  // Changing headings based on scroll/swipe direction
  gsap.to(headings, {
    y: `${-scrollCount * 100}%`,
    duration: 1.2,
    ease: "expo.inOut",
  });

  // Rotating the spheres based on scroll/swipe direction
  gsap.to(spheres.rotation, {
    y: `+=${delta === "down" ? Math.PI / 2 : -Math.PI / 2}`,
    duration: 1.2,
    ease: "expo.inOut",
  });
}, 2000);

window.addEventListener("touchstart", handleTouchStart, false);
window.addEventListener("touchend", handleTouchEnd, false);

window.addEventListener("wheel", throttledWheelHandler);

// Throttle function
function throttle(func, limit) {
  let inThrottle;
  return function () {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}
