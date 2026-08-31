import * as THREE from "three";
import { GLTFLoader, FBXLoader, DecalGeometry } from "three-stdlib";
import { createTextTexture } from "../three/TextureCanvas";
import { getColorValue } from "../components/TShirt2D";

// Cache for parsed 3D scenes so we only load each GLTF/FBX file once
const modelCache = new Map();

/**
 * Load and cache a 3D model (GLTF/GLB or FBX)
 */
export const load3DModel = (modelPath) => {
  const resolvedPath = modelPath || "/images/models/male normal t-shirt1.glb";
  if (modelCache.has(resolvedPath)) {
    return Promise.resolve(modelCache.get(resolvedPath));
  }

  return new Promise((resolve, reject) => {
    const isFbx = resolvedPath.toLowerCase().endsWith(".fbx");
    if (isFbx) {
      const loader = new FBXLoader();
      loader.load(
        resolvedPath,
        (fbx) => {
          modelCache.set(resolvedPath, fbx);
          resolve(fbx);
        },
        undefined,
        (err) => {
          console.warn("FBX load error:", err);
          // Fallback to default GLB
          const gltfLoader = new GLTFLoader();
          gltfLoader.load("/images/models/male normal t-shirt1.glb", (gltf) => {
            modelCache.set(resolvedPath, gltf.scene);
            resolve(gltf.scene);
          }, undefined, reject);
        }
      );
    } else {
      const loader = new GLTFLoader();
      loader.load(
        resolvedPath,
        (gltf) => {
          const scene = gltf.scene;
          modelCache.set(resolvedPath, scene);
          resolve(scene);
        },
        undefined,
        (err) => {
          console.warn("GLTF load error:", err);
          // Fallback to default GLB
          loader.load("/images/models/male normal t-shirt1.glb", (fallbackGltf) => {
            modelCache.set(resolvedPath, fallbackGltf.scene);
            resolve(fallbackGltf.scene);
          }, undefined, reject);
        }
      );
    }
  });
};

/**
 * Load a texture safely with crossOrigin
 */
const loadTextureSafe = (url) => {
  return new Promise((resolve) => {
    if (!url || url === "/images/dumyImage.png") {
      resolve(null);
      return;
    }
    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin("anonymous");
    loader.load(
      url,
      (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.needsUpdate = true;
        resolve(tex);
      },
      undefined,
      () => {
        // Fallback without crossOrigin
        const fallbackLoader = new THREE.TextureLoader();
        fallbackLoader.load(url, (tex2) => {
          tex2.colorSpace = THREE.SRGBColorSpace;
          tex2.needsUpdate = true;
          resolve(tex2);
        }, undefined, () => resolve(null));
      }
    );
  });
};

/**
 * Render the exact real 3D design using Three.js WebGL Offscreen Renderer
 * Returns an ultra high-definition PNG Data URL
 */
export const render3DDesignToDataUrl = async ({
  modelPath = "/images/models/male normal t-shirt1.glb",
  fabricColor = "#ffffff",
  layers = [],
  viewAngle = "front",
  width = 1400,
  height = 1400,
  transparentBg = false
}) => {
  try {
    const rawScene = await load3DModel(modelPath);
    if (!rawScene) return null;

    const sceneClone = rawScene.clone(true);
    const shirtColorHex = getColorValue(fabricColor) || "#ffffff";

    // 1. Reset transforms
    sceneClone.position.set(0, 0, 0);
    sceneClone.scale.set(1, 1, 1);
    sceneClone.rotation.set(0, 0, 0);
    sceneClone.updateMatrixWorld(true);

    // 2. Compute bounding box of meshes to center and scale
    const box = new THREE.Box3();
    let hasMesh = false;
    sceneClone.traverse((child) => {
      if (child.isMesh && child.name !== "decal" && child.name !== "decal-helper") {
        child.updateMatrixWorld(true);
        const childBox = new THREE.Box3().setFromObject(child);
        if (!hasMesh) {
          box.copy(childBox);
          hasMesh = true;
        } else {
          box.union(childBox);
        }
      }
    });

    if (!hasMesh) {
      box.setFromObject(sceneClone);
    }

    const size = new THREE.Vector3();
    box.getSize(size);
    const center = new THREE.Vector3();
    box.getCenter(center);

    const maxDim = Math.max(size.x, size.y, size.z);
    const targetScale = maxDim > 0 ? 2.2 / maxDim : 1.8;

    sceneClone.scale.set(targetScale, targetScale, targetScale);
    sceneClone.position.set(
      -center.x * targetScale,
      -center.y * targetScale - 0.2,
      -center.z * targetScale
    );

    // 3. Find body mesh and apply fabric color
    let bodyMesh = null;
    let maxScore = -1;

    sceneClone.traverse((child) => {
      if (child.isMesh) {
        if (child.material) {
          // Clone material so we don't mutate shared template
          const mat = child.material.clone();
          mat.color.set(shirtColorHex);
          mat.needsUpdate = true;
          child.material = mat;
          child.castShadow = true;
          child.receiveShadow = true;
        }

        const mBox = new THREE.Box3().setFromObject(child);
        const mSize = new THREE.Vector3();
        mBox.getSize(mSize);
        const volume = mSize.x * mSize.y * mSize.z;
        let score = volume;
        const nameLower = child.name.toLowerCase();

        if (nameLower.includes("inside") || nameLower.includes("inner") || nameLower.includes("collar_in")) {
          score *= 0.05;
        }
        if (nameLower.includes("body") || nameLower.includes("front") || nameLower.includes("outside") || nameLower.includes("t-shirt") || nameLower.includes("shirt")) {
          score *= 10.0;
        }

        if (score > maxScore) {
          maxScore = score;
          bodyMesh = child;
        }
      }
    });

    // 4. Create and project DecalGeometries for all visible layers
    if (bodyMesh && layers && layers.length > 0) {
      sceneClone.updateMatrixWorld(true);
      bodyMesh.updateMatrixWorld(true);

      const chestY = center.y + (size.y > 0 ? size.y * 0.05 : 0);

      for (let i = 0; i < layers.length; i++) {
        const layer = layers[i];
        if (layer.visible === false) continue;

        let texture = null;
        if (layer.type === "text") {
          texture = createTextTexture(layer);
        } else if (layer.url && layer.url !== "/images/dumyImage.png") {
          texture = await loadTextureSafe(layer.url);
        }

        if (!texture) continue;

        // Calculate decal position and orientation
        const groupPos = new THREE.Vector3().fromArray(layer.position || [0, 0, 0]);
        const targetY = Math.abs(groupPos.y) < 0.01 ? chestY : groupPos.y;
        const targetX = groupPos.x !== 0 ? groupPos.x : center.x;
        const zSign = groupPos.z >= 0 ? 1 : -1;

        // Position ray from outside facing center
        const rayOrigin = new THREE.Vector3(targetX, targetY, center.z + zSign * 2.5).applyMatrix4(sceneClone.matrixWorld);
        const rayTarget = new THREE.Vector3(center.x, targetY, center.z).applyMatrix4(sceneClone.matrixWorld);
        const rayDir = new THREE.Vector3().subVectors(rayTarget, rayOrigin).normalize();

        const raycaster = new THREE.Raycaster();
        raycaster.set(rayOrigin, rayDir);

        let intersects = raycaster.intersectObject(bodyMesh, true);
        let hitPos = null;
        let hitNormal = null;

        if (intersects.length > 0) {
          hitPos = intersects[0].point;
          hitNormal = intersects[0].face ? intersects[0].face.normal.clone() : new THREE.Vector3(0, 0, zSign);
        } else {
          // Default front projection coordinates
          hitPos = new THREE.Vector3(0, 0.1, 0.15);
          hitNormal = new THREE.Vector3(0, 0, 1);
        }

        // Convert world hit coordinates to mesh local space
        const invMeshMatrix = new THREE.Matrix4().copy(bodyMesh.matrixWorld).invert();
        const localHitPos = hitPos.clone().applyMatrix4(invMeshMatrix);

        // Calculate local rotation euler
        const rotEuler = new THREE.Euler(0, 0, 0, "XYZ");
        if (Array.isArray(layer.rotation)) {
          rotEuler.set(layer.rotation[0] || 0, layer.rotation[1] || 0, layer.rotation[2] || 0);
        }

        const scaleArr = Array.isArray(layer.scale) ? layer.scale : [0.3, 0.3, 0.25];
        const decalScaleVec = new THREE.Vector3(
          Math.max(0.08, scaleArr[0] || 0.3),
          Math.max(0.08, scaleArr[1] || 0.3),
          Math.max(0.08, scaleArr[2] || 0.25)
        );

        try {
          const decalGeom = new DecalGeometry(bodyMesh, localHitPos, rotEuler, decalScaleVec);
          const decalMat = new THREE.MeshStandardMaterial({
            map: texture,
            transparent: true,
            depthTest: true,
            depthWrite: false,
            polygonOffset: true,
            polygonOffsetFactor: -4,
            roughness: 0.8,
            metalness: 0.05
          });

          const decalMesh = new THREE.Mesh(decalGeom, decalMat);
          decalMesh.name = "decal";
          decalMesh.renderOrder = 10 + i;
          bodyMesh.add(decalMesh);
        } catch (err) {
          console.warn("Could not create decal on 3D mesh:", err);
        }
      }
    }

    // 5. Setup Root Scene, Lighting, Camera, and Rotation Angle
    const rootScene3D = new THREE.Scene();

    // Studio Background
    if (!transparentBg) {
      rootScene3D.background = new THREE.Color("#f1f5f9");
    }

    // Studio Lighting
    const ambient = new THREE.AmbientLight(0xffffff, 1.6);
    rootScene3D.add(ambient);

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.2);
    keyLight.position.set(4, 5, 5);
    keyLight.castShadow = true;
    rootScene3D.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0xffffff, 1.4);
    rimLight.position.set(-4, 3, -5);
    rootScene3D.add(rimLight);

    const fillLeft = new THREE.DirectionalLight(0xffffff, 0.9);
    fillLeft.position.set(-5, 2, 2);
    rootScene3D.add(fillLeft);

    const fillRight = new THREE.DirectionalLight(0xffffff, 0.9);
    fillRight.position.set(5, 2, 2);
    rootScene3D.add(fillRight);

    // Model turntable group
    const modelGroup = new THREE.Group();
    const normAngle = (viewAngle === "side" ? "left" : viewAngle || "front").toLowerCase();
    let rotY = 0;
    if (normAngle === "back") {
      rotY = Math.PI;
    } else if (normAngle === "left") {
      rotY = Math.PI / 2;
    } else if (normAngle === "right") {
      rotY = -Math.PI / 2;
    }

    modelGroup.rotation.y = rotY;
    modelGroup.add(sceneClone);
    rootScene3D.add(modelGroup);

    // Camera
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(0, 0.1, 3.8);
    camera.lookAt(0, 0, 0);

    // 6. WebGL Offscreen Renderer
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      antialias: true,
      alpha: true,
      preserveDrawingBuffer: true,
      powerPreference: "high-performance"
    });

    renderer.setSize(width, height, false);
    renderer.setPixelRatio(1);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Render frame
    rootScene3D.updateMatrixWorld(true);
    renderer.render(rootScene3D, camera);

    const dataUrl = renderer.domElement.toDataURL("image/png");

    // Clean up WebGL resources
    renderer.dispose();
    rootScene3D.traverse((obj) => {
      if (obj.geometry) obj.geometry.dispose();
    });

    return dataUrl;
  } catch (err) {
    console.error("3D Offscreen render error:", err);
    return null;
  }
};
