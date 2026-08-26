import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import * as THREE from "three";
import { useGLTF, useFBX, Html } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { DecalGeometry } from "three-stdlib";
import { createTextTexture } from "./TextureCanvas";
import ThreeErrorBoundary from "../components/ThreeErrorBoundary";
import { Maximize2, RotateCw, Trash2 } from "lucide-react";

// Helper to convert vectors/eulers to arrays
function vecToArray(vec = [0, 0, 0]) {
  if (Array.isArray(vec)) {
    return vec;
  } else if (vec instanceof THREE.Vector3 || vec instanceof THREE.Euler) {
    return [vec.x, vec.y, vec.z];
  } else {
    return [vec, vec, vec];
  }
}

// Dedicated Sub-component for Decal selection outlines & control handles
function DecalHelperControls({
  groupRef,
  position,
  rotation,
  scale,
  meshWorldScale,
  onScaleDown,
  onRotateDown,
  onDeleteClick,
  onDecalPointerDown
}) {
  const halfW = (scale[0] || 0.3) / 2;
  const halfH = (scale[1] || 0.3) / 2;
  const borderPoints = useMemo(() => [
    new THREE.Vector3(-halfW, halfH, 0),
    new THREE.Vector3(halfW, halfH, 0),
    new THREE.Vector3(halfW, -halfH, 0),
    new THREE.Vector3(-halfW, -halfH, 0),
    new THREE.Vector3(-halfW, halfH, 0)
  ], [halfW, halfH]);

  const borderGeometry = useMemo(() => {
    const geom = new THREE.BufferGeometry();
    geom.setFromPoints(borderPoints);
    return geom;
  }, [borderPoints]);

  return (
    <group ref={groupRef} position={position} rotation={rotation}>
      {/* Clean rectangular border without diagonal line */}
      <line name="decal-helper" geometry={borderGeometry} userData={{ isDecal: true }}>
        <lineBasicMaterial
          color="#4f46e5"
          linewidth={1.5}
          transparent
          opacity={0.8}
          depthWrite={false}
        />
      </line>

      {/* Invisible Drag Helper Plane (extends drag zone to the entire outline area when selected) */}
      <mesh
        name="decal-drag-plane"
        userData={{ isDecal: true }}
        position={[0, 0, 0.005]}
        onPointerDown={onDecalPointerDown}
      >
        <planeGeometry args={[scale[0] || 0.3, scale[1] || 0.3]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      {/* Scale Handle (Bottom Right) */}
      <group position={[(scale[0] || 0.3) / 2, -(scale[1] || 0.3) / 2, 0.01]}>
        <Html center>
          <div
            onPointerDown={onScaleDown}
            onPointerOver={() => {
              document.body.style.cursor = "nwse-resize";
            }}
            onPointerOut={() => {
              document.body.style.cursor = "auto";
            }}
            className="flex items-center justify-center w-6 h-6 bg-indigo-600 text-white rounded-full shadow-md border border-white transform scale-80 select-none cursor-pointer"
          >
            <Maximize2 className="w-3 h-3" />
          </div>
        </Html>
      </group>

      {/* Rotate Handle (Top Center) */}
      <group position={[0, (scale[1] || 0.3) / 2 + 0.04, 0.01]}>
        <Html center>
          <div
            onPointerDown={onRotateDown}
            onPointerOver={() => {
              document.body.style.cursor = "grab";
            }}
            onPointerOut={() => {
              document.body.style.cursor = "auto";
            }}
            className="flex items-center justify-center w-6 h-6 bg-emerald-500 text-white rounded-full shadow-md border border-white transform scale-80 select-none cursor-pointer"
          >
            <RotateCw className="w-3 h-3" />
          </div>
        </Html>
      </group>

      {/* Delete Handle (Top Left) */}
      <group position={[-(scale[0] || 0.3) / 2, (scale[1] || 0.3) / 2, 0.01]}>
        <Html center>
          <div
            onPointerDown={onDeleteClick}
            onPointerOver={() => {
              document.body.style.cursor = "pointer";
            }}
            onPointerOut={() => {
              document.body.style.cursor = "auto";
            }}
            className="flex items-center justify-center w-6 h-6 bg-rose-500 text-white rounded-full shadow-md border border-white transform scale-80 select-none cursor-pointer"
          >
            <Trash2 className="w-3 h-3" />
          </div>
        </Html>
      </group>
    </group>
  );
}

// Sub-component to manage texture loading, 3D decal mesh on targetMesh, and helper controls
function DecalItem({
  layer,
  isSelected,
  targetMesh,
  onUpdateLayers,
  onDeleteLayer,
  scene,
  onInteractionStart,
  onInteractionEnd,
  modelPath,
  onSelectLayer
}) {
  const { scene: rootScene, camera, raycaster, gl } = useThree();
  const [texture, setTexture] = useState(null);
  const [isScaling, setIsScaling] = useState(false);
  const [isRotating, setIsRotating] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartWorldOffsetRef = useRef(null);
  const groupRef = useRef(null);
  const dragStartRotationAngleRef = useRef(0);
  const dragStartDecalRollRef = useRef(0);
  const dragStartPlaneRef = useRef(null);
  const dragStartWorldPosRef = useRef(null);
  const dragStartBasisXRef = useRef(null);
  const dragStartBasisYRef = useRef(null);

  useEffect(() => {
    if (layer.visible === false) {
      setTexture(null);
      return;
    }

    let isMounted = true;

    if (layer.type === "text") {
      const tex = createTextTexture(layer);
      if (isMounted) {
        setTexture(tex);
      } else if (tex) {
        tex.dispose();
      }
    } else {
      // Image or Logo layer
      if (!layer.url) return;
      const loader = new THREE.TextureLoader();
      loader.load(
        layer.url,
        (loadedTex) => {
          if (isMounted) {
            loadedTex.colorSpace = THREE.SRGBColorSpace;
            loadedTex.needsUpdate = true;
            setTexture(loadedTex);
          } else {
            loadedTex.dispose();
          }
        },
        undefined,
        (err) => {
          console.error("TextureLoader error for decal layer:", layer.url, err);
        }
      );
    }

    return () => {
      isMounted = false;
    };
  }, [
    layer.type,
    layer.text,
    layer.fontFamily,
    layer.color,
    layer.bold,
    layer.italic,
    layer.url,
    layer.visible
  ]);

  useEffect(() => {
    if (texture) {
      const flipX = layer.flipX ?? false;
      const flipY = layer.flipY ?? false;

      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      texture.center.set(0.5, 0.5);

      // DecalGeometry defaults to mirroring horizontally, so default repeat.x is -1.
      const repeatX = flipX ? 1 : -1;
      const repeatY = flipY ? -1 : 1;

      texture.repeat.set(repeatX, repeatY);
      texture.needsUpdate = true;
    }
  }, [texture, layer.flipX, layer.flipY]);

  // Listen to mouse pointer events globally on window
  useEffect(() => {
    if (!isDragging && !isScaling && !isRotating) return;

    const handlePointerMove = (e) => {
      if (!targetMesh?.current) return;
      const mesh = targetMesh.current;

      const canvas = gl.domElement;
      const rect = canvas.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      const mouseVec = new THREE.Vector2(x, y);
      raycaster.setFromCamera(mouseVec, camera);

      if (isDragging) {
        const intersects = raycaster.intersectObjects(scene.children, true);
        const validHit = intersects.find((hit) => {
          const child = hit.object;
          if (!child.isMesh || child.name === "decal" || child.name === "decal-helper" || child.userData?.isDecal) {
            return false;
          }
          const nameLower = child.name.toLowerCase();
          if (nameLower.includes("inside") || nameLower.includes("inner") || nameLower.includes("collar_in")) {
            return false;
          }
          return true;
        });

        if (validHit) {
          const hit = validHit;
          const hitMesh = hit.object;

          rootScene.updateMatrixWorld(true);

          const targetDecalWorldPoint = hit.point.clone();
          if (dragStartWorldOffsetRef.current) {
            targetDecalWorldPoint.sub(dragStartWorldOffsetRef.current);
          }
          const scenePoint = scene.worldToLocal(targetDecalWorldPoint.clone());

          let normal = hit.face?.normal || new THREE.Vector3(0, 0, 1);
          const worldNormal = normal.clone().transformDirection(hitMesh.matrixWorld);
          const sceneNormal = worldNormal.clone().transformDirection(scene.matrixWorld.clone().invert()).normalize();

          let up = new THREE.Vector3(0, 1, 0);
          if (Math.abs(sceneNormal.dot(up)) > 0.99) {
            up.set(0, 0, 1);
          }

          const matrix = new THREE.Matrix4().lookAt(
            new THREE.Vector3(0, 0, 0),
            sceneNormal,
            up
          );
          const rotation = new THREE.Euler().setFromRotationMatrix(matrix, "YXZ");

          if (onUpdateLayers) {
            onUpdateLayers((prev) =>
              prev.map((l) => {
                if (l.id === layer.id) {
                  return {
                    ...l,
                    position: [scenePoint.x, scenePoint.y, scenePoint.z],
                    rotation: [rotation.x, rotation.y, l.rotation?.[2] || 0],
                    projectedForModel: modelPath,
                    targetMeshName: hitMesh.name
                  };
                }
                return l;
              })
            );
          }
        }
      } else if (isScaling || isRotating) {
        if (!groupRef.current) return;

        rootScene.updateMatrixWorld(true);

        const decalWorldPos = new THREE.Vector3();
        groupRef.current.getWorldPosition(decalWorldPos);

        const decalWorldNormal = new THREE.Vector3(0, 0, 1);
        decalWorldNormal.applyQuaternion(groupRef.current.getWorldQuaternion(new THREE.Quaternion()));

        const plane = new THREE.Plane().setFromNormalAndCoplanarPoint(decalWorldNormal, decalWorldPos);
        const intersectionPoint = new THREE.Vector3();
        raycaster.ray.intersectPlane(plane, intersectionPoint);

        const localPoint = groupRef.current.worldToLocal(intersectionPoint.clone());

        if (isScaling) {
          const newWorldScaleX = Math.max(0.05, Math.abs(localPoint.x) * 2);
          const aspect = layer.aspectRatio || (layer.scale[0] / layer.scale[1]) || 1;
          const newWorldScaleY = newWorldScaleX / aspect;

          const sceneWorldScale = new THREE.Vector3();
          scene.getWorldScale(sceneWorldScale);

          const newGroupScaleX = newWorldScaleX / (sceneWorldScale.x || 1);
          const newGroupScaleY = newWorldScaleY / (sceneWorldScale.y || 1);

          if (onUpdateLayers) {
            onUpdateLayers((prev) =>
              prev.map((l) =>
                l.id === layer.id
                  ? { ...l, scale: [newGroupScaleX, newGroupScaleY, l.scale[2] || 0.25] }
                  : l
              )
            );
          }
        } else if (isRotating) {
          if (
            dragStartPlaneRef.current &&
            dragStartWorldPosRef.current &&
            dragStartBasisXRef.current &&
            dragStartBasisYRef.current
          ) {
            const intersectionPoint = new THREE.Vector3();
            if (raycaster.ray.intersectPlane(dragStartPlaneRef.current, intersectionPoint)) {
              const vec = intersectionPoint.clone().sub(dragStartWorldPosRef.current);
              const x = vec.dot(dragStartBasisXRef.current);
              const y = vec.dot(dragStartBasisYRef.current);

              const angle = Math.atan2(x, y);
              const deltaAngle = angle - dragStartRotationAngleRef.current;
              const rawRoll = dragStartDecalRollRef.current - deltaAngle;
              const newRoll = Math.atan2(Math.sin(rawRoll), Math.cos(rawRoll));

              if (onUpdateLayers) {
                onUpdateLayers((prev) =>
                  prev.map((l) =>
                    l.id === layer.id
                      ? { ...l, rotation: [l.rotation[0], l.rotation[1], newRoll] }
                      : l
                  )
                );
              }
            }
          }
        }
      }
    };

    const handlePointerUp = () => {
      setIsDragging(false);
      setIsScaling(false);
      setIsRotating(false);
      dragStartWorldOffsetRef.current = null;
      dragStartPlaneRef.current = null;
      dragStartWorldPosRef.current = null;
      dragStartBasisXRef.current = null;
      dragStartBasisYRef.current = null;
      if (onInteractionEnd) onInteractionEnd();
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [
    isDragging,
    isScaling,
    isRotating,
    camera,
    raycaster,
    gl,
    scene,
    rootScene,
    layer,
    modelPath,
    onUpdateLayers,
    onInteractionEnd,
    targetMesh
  ]);

  const mesh = targetMesh?.current;

  // Convert layer transforms to targetMesh local space for DecalGeometry
  const rawPos = vecToArray(layer.position || [0, 0, 0]);
  const groupPos = new THREE.Vector3(Number(rawPos[0]) || 0, Number(rawPos[1]) || 0, Number(rawPos[2]) || 0);

  const rawScale = vecToArray(layer.scale || [0.3, 0.3, 0.25]);
  const groupScale = new THREE.Vector3(
    Math.max(0.01, Number(rawScale[0]) || 0.3),
    Math.max(0.01, Number(rawScale[1]) || 0.3),
    Math.max(0.01, Number(rawScale[2]) || 0.25)
  );

  const rawRot = vecToArray(layer.rotation || [0, 0, 0]);

  // Decal mesh lifecycle on targetMesh
  useEffect(() => {
    if (!mesh || !(mesh instanceof THREE.Mesh) || !texture || layer.visible === false || !scene) {
      return;
    }

    rootScene.updateMatrixWorld(true);
    scene.updateMatrixWorld(true);
    mesh.updateMatrixWorld(true);

    const worldPos = groupPos.clone().applyMatrix4(scene.matrixWorld);
    const localPos = worldPos.clone().applyMatrix4(mesh.matrixWorld.clone().invert());
    const decalPosVec = new THREE.Vector3(
      isNaN(localPos.x) ? 0 : localPos.x,
      isNaN(localPos.y) ? 0 : localPos.y,
      isNaN(localPos.z) ? 0 : localPos.z
    );

    const meshWorldScale = new THREE.Vector3(1, 1, 1);
    mesh.getWorldScale(meshWorldScale);
    const decalScaleVec = new THREE.Vector3(
      Math.max(0.01, groupScale.x / (meshWorldScale.x || 1)),
      Math.max(0.01, groupScale.y / (meshWorldScale.y || 1)),
      Math.max(0.6, (groupScale.z / (meshWorldScale.z || 1)) * 3)
    );

    const sceneQuaternion = new THREE.Quaternion().setFromRotationMatrix(scene.matrixWorld);
    const layerQuaternion = new THREE.Quaternion().setFromEuler(
      new THREE.Euler(Number(rawRot[0]) || 0, Number(rawRot[1]) || 0, Number(rawRot[2]) || 0, "YXZ")
    );
    const worldQuaternion = sceneQuaternion.clone().multiply(layerQuaternion);
    const meshQuaternion = new THREE.Quaternion().setFromRotationMatrix(mesh.matrixWorld);
    const localQuaternion = meshQuaternion.clone().invert().multiply(worldQuaternion);
    const rotEuler = new THREE.Euler().setFromQuaternion(localQuaternion, "YXZ");

    const matrixWorld = mesh.matrixWorld.clone();
    mesh.matrixWorld.identity();

    let geom = null;
    let decalMeshObj = null;

    try {
      geom = new DecalGeometry(mesh, decalPosVec, rotEuler, decalScaleVec);

      if (geom.attributes.position && geom.attributes.position.count > 0) {
        const mat = new THREE.MeshStandardMaterial({
          map: texture,
          transparent: true,
          polygonOffset: true,
          polygonOffsetFactor: -10,
          polygonOffsetUnits: -10,
          roughness: 0.7,
          metalness: 0.0,
          side: THREE.DoubleSide,
          depthTest: true,
          depthWrite: false,
          toneMapped: false
        });

        decalMeshObj = new THREE.Mesh(geom, mat);
        decalMeshObj.name = "decal";
        decalMeshObj.renderOrder = 100;
        decalMeshObj.userData = { isDecal: true, layerId: layer.id };

        mesh.add(decalMeshObj);
      } else {
        if (geom) geom.dispose();
      }
    } catch (err) {
      console.warn("DecalGeometry generation failed:", err);
    } finally {
      mesh.matrixWorld.copy(matrixWorld);
    }

    return () => {
      if (decalMeshObj) {
        if (mesh) mesh.remove(decalMeshObj);
        if (decalMeshObj.geometry) decalMeshObj.geometry.dispose();
        if (decalMeshObj.material) decalMeshObj.material.dispose();
      }
    };
  }, [
    mesh,
    texture,
    layer.visible,
    layer.id,
    scene,
    rawPos[0],
    rawPos[1],
    rawPos[2],
    rawScale[0],
    rawScale[1],
    rawScale[2],
    rawRot[0],
    rawRot[1],
    rawRot[2]
  ]);

  if (!isSelected || layer.visible === false || !mesh || !(mesh instanceof THREE.Mesh) || !scene) {
    return null;
  }

  // Calculate world coordinates for the helper controls outline
  rootScene.updateMatrixWorld(true);
  scene.updateMatrixWorld(true);

  const worldPos = groupPos.clone().applyMatrix4(scene.matrixWorld);
  const sceneQuaternion = new THREE.Quaternion().setFromRotationMatrix(scene.matrixWorld);
  const layerQuaternion = new THREE.Quaternion().setFromEuler(
    new THREE.Euler(Number(rawRot[0]) || 0, Number(rawRot[1]) || 0, Number(rawRot[2]) || 0, "YXZ")
  );
  const worldQuaternion = sceneQuaternion.clone().multiply(layerQuaternion);
  const worldEuler = new THREE.Euler().setFromQuaternion(worldQuaternion, "YXZ");

  const sceneWorldScale = new THREE.Vector3(1, 1, 1);
  scene.getWorldScale(sceneWorldScale);
  const helperScale = [
    groupScale.x * sceneWorldScale.x,
    groupScale.y * sceneWorldScale.y,
    1
  ];

  const meshWorldScale = new THREE.Vector3(1, 1, 1);
  mesh.getWorldScale(meshWorldScale);

  const handleScaleDown = (e) => {
    e.stopPropagation();
    setIsScaling(true);
    if (onInteractionStart) onInteractionStart();
  };

  const handleRotateDown = (e) => {
    e.stopPropagation();
    setIsRotating(true);
    if (onInteractionStart) onInteractionStart();

    if (groupRef.current) {
      rootScene.updateMatrixWorld(true);
      const decalWorldPos = new THREE.Vector3();
      groupRef.current.getWorldPosition(decalWorldPos);
      dragStartWorldPosRef.current = decalWorldPos;

      const groupQuat = groupRef.current.getWorldQuaternion(new THREE.Quaternion());
      const decalWorldNormal = new THREE.Vector3(0, 0, 1).applyQuaternion(groupQuat);

      const plane = new THREE.Plane().setFromNormalAndCoplanarPoint(decalWorldNormal, decalWorldPos);
      dragStartPlaneRef.current = plane;

      const basisX = new THREE.Vector3(1, 0, 0).applyQuaternion(groupQuat);
      const basisY = new THREE.Vector3(0, 1, 0).applyQuaternion(groupQuat);
      dragStartBasisXRef.current = basisX;
      dragStartBasisYRef.current = basisY;

      const intersectionPoint = new THREE.Vector3();
      raycaster.ray.intersectPlane(plane, intersectionPoint);

      const vec = intersectionPoint.clone().sub(decalWorldPos);
      const x = vec.dot(basisX);
      const y = vec.dot(basisY);

      dragStartRotationAngleRef.current = Math.atan2(x, y);
      dragStartDecalRollRef.current = layer.rotation?.[2] || 0;
    }
  };

  const handleDeleteClick = (e) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this layer?")) {
      if (onDeleteLayer) {
        onDeleteLayer(layer.id);
      } else if (onUpdateLayers) {
        onUpdateLayers((prev) => prev.filter((l) => l.id !== layer.id));
      }
    }
  };

  const handleDecalPointerDown = (e) => {
    e.stopPropagation();
    if (onSelectLayer) {
      onSelectLayer(layer.id);
    }
    if (layer.locked) return;

    const intersection = e.intersections?.find(
      (intersect) =>
        intersect.object &&
        intersect.object.name !== "decal" &&
        intersect.object.name !== "decal-helper" &&
        intersect.object.name !== "decal-helper-handle" &&
        intersect.object.name !== "decal-drag-plane" &&
        !intersect.object.userData?.isDecal
    );

    const hitPoint = intersection ? intersection.point.clone() : null;

    rootScene.updateMatrixWorld(true);

    const activeLayerWorldPoint = groupPos.clone().applyMatrix4(scene.matrixWorld);

    if (hitPoint) {
      dragStartWorldOffsetRef.current = new THREE.Vector3().subVectors(hitPoint, activeLayerWorldPoint);
    } else {
      dragStartWorldOffsetRef.current = new THREE.Vector3(0, 0, 0);
    }

    setIsDragging(true);
    if (onInteractionStart) onInteractionStart();
  };

  return (
    <DecalHelperControls
      groupRef={groupRef}
      position={[worldPos.x, worldPos.y, worldPos.z]}
      rotation={worldEuler}
      scale={helperScale}
      meshWorldScale={meshWorldScale}
      onScaleDown={handleScaleDown}
      onRotateDown={handleRotateDown}
      onDeleteClick={handleDeleteClick}
      onDecalPointerDown={handleDecalPointerDown}
    />
  );
}

// Subcomponents to dynamically load and clone GLTF (.glb, .gltf) or FBX (.fbx) models
function ModelSceneLoader({ modelPath, onSceneReady }) {
  const isFbx = typeof modelPath === "string" && modelPath.toLowerCase().endsWith(".fbx");
  if (isFbx) {
    return <FBXModelLoaderSub modelPath={modelPath} onSceneReady={onSceneReady} />;
  }
  return <GLTFModelLoaderSub modelPath={modelPath} onSceneReady={onSceneReady} />;
}

function FBXModelLoaderSub({ modelPath, onSceneReady }) {
  const fbx = useFBX(modelPath);
  const scene = useMemo(() => (fbx ? fbx.clone(true) : null), [fbx]);
  useEffect(() => {
    if (scene) onSceneReady(scene);
  }, [scene, onSceneReady]);
  return null;
}

function GLTFModelLoaderSub({ modelPath, onSceneReady }) {
  const { scene: rawScene } = useGLTF(modelPath);
  const scene = useMemo(() => (rawScene ? rawScene.clone(true) : null), [rawScene]);
  useEffect(() => {
    if (scene) onSceneReady(scene);
  }, [scene, onSceneReady]);
  return null;
}

export default function ShirtModel({
  modelPath = "/images/models/male normal t-shirt1.glb",
  shirtColor,
  layers,
  selectedLayerId,
  onSelectLayer,
  onUpdateLayers,
  onDeleteLayer,
  onInteractionStart,
  onInteractionEnd
}) {
  const resolvedModelPath = (typeof modelPath === "string" && (
    modelPath.toLowerCase().endsWith(".glb") ||
    modelPath.toLowerCase().endsWith(".gltf") ||
    modelPath.toLowerCase().endsWith(".fbx")
  ))
    ? modelPath
    : "/images/models/male normal t-shirt1.glb";

  const { scene: rootScene } = useThree();
  const [scene, setScene] = useState(null);

  const handleSceneReady = useCallback((loadedScene) => {
    setScene(loadedScene);
  }, []);
  const bodyMeshRef = useRef(null);
  const [meshLoaded, setMeshLoaded] = useState(false);
  const [activeScene, setActiveScene] = useState(null);
  const rootGroupRef = useRef(null);
  const modelCenterRef = useRef(new THREE.Vector3(0, 0, 0));
  const modelSizeRef = useRef(new THREE.Vector3(1, 1, 1));
  const [localLayers, setLocalLayers] = useState(() => layers || []);

  useEffect(() => {
    setLocalLayers(layers || []);
  }, [layers]);

  // Center and normalize scale once when model loads
  useEffect(() => {
    if (scene) {
      // 1. Reset scene transforms to get clean, unmutated dimensions
      scene.position.set(0, 0, 0);
      scene.scale.set(1, 1, 1);
      scene.rotation.set(0, 0, 0);
      scene.updateMatrixWorld(true);

      // 2. Compute bounding box of original meshes only (exclude decals/helpers)
      const box = new THREE.Box3();
      let hasMesh = false;
      scene.traverse((child) => {
        if (child.isMesh && child.name !== "decal" && child.name !== "decal-helper" && !child.userData?.isDecal) {
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

      // Fallback to full scene if no mesh found (should not happen)
      if (!hasMesh) {
        box.setFromObject(scene);
      }

      const size = new THREE.Vector3();
      box.getSize(size);
      const center = new THREE.Vector3();
      box.getCenter(center);

      modelCenterRef.current.copy(center);
      modelSizeRef.current.copy(size);

      // Scale so max dimension is 2.2 units
      const maxDim = Math.max(size.x, size.y, size.z);
      const targetScale = maxDim > 0 ? 2.2 / maxDim : 1.8;
      
      scene.scale.set(targetScale, targetScale, targetScale);
      
      // Center the model in viewport
      scene.position.set(
        -center.x * targetScale,
        -center.y * targetScale - 0.2,
        -center.z * targetScale
      );
      
      // Face slightly to the side for the default view
      scene.rotation.set(0.05, 0.3, 0);
    }
  }, [scene]);

  // Sync fabric colors and resolve target body mesh by volume & keywords
  useEffect(() => {
    if (scene) {
      setMeshLoaded(false);
      bodyMeshRef.current = null;
      setActiveScene(null);
      scene.updateMatrixWorld(true);
      let bestMesh = null;
      let maxScore = -1;

      scene.traverse((child) => {
        if (child.isMesh) {
          // Skip coloring decals or helpers
          if (child.name === "decal" || child.name === "decal-helper" || child.name === "decal-drag-plane" || child.userData?.isDecal) {
            return;
          }

          // Color mesh
          if (child.material) {
            const mats = Array.isArray(child.material) ? child.material : [child.material];
            mats.forEach((mat) => {
              mat.color.set(shirtColor);
              mat.needsUpdate = true;
            });
          }

          // Calculate mesh local volume in world space
          const box = new THREE.Box3().setFromObject(child);
          const size = new THREE.Vector3();
          box.getSize(size);
          const volume = size.x * size.y * size.z;
          
          let score = volume;
          const nameLower = child.name.toLowerCase();
          
          // Keyword score adjustment
          if (nameLower.includes("inside") || nameLower.includes("inner") || nameLower.includes("collar_in")) {
            score *= 0.05; // heavily penalize inner meshes
          }
          if (nameLower.includes("body") || nameLower.includes("front") || nameLower.includes("outside") || nameLower.includes("t-shirt") || nameLower.includes("shirt")) {
            score *= 10.0; // boost main outer parts
          }

          if (score > maxScore) {
            maxScore = score;
            bestMesh = child;
          }
        }
      });

      if (bestMesh) {
        bodyMeshRef.current = bestMesh;
        setMeshLoaded(true);
        setActiveScene(scene);
      }
    }
    return () => {
      setActiveScene(null);
      setMeshLoaded(false);
      bodyMeshRef.current = null;
    };
  }, [scene, shirtColor]);

  // Auto-project decals on the surface of the body mesh when scene or layers change
  useEffect(() => {
    if (meshLoaded && activeScene === scene && bodyMeshRef.current && localLayers && localLayers.length > 0) {
      // Safety guard: ensure bodyMeshRef.current belongs to the current scene
      let isCurrentMesh = false;
      scene.traverse((child) => {
        if (child === bodyMeshRef.current) isCurrentMesh = true;
      });
      if (!isCurrentMesh) return;

      // Force update all world matrices before raycasting
      rootScene.updateMatrixWorld(true);
      scene.updateMatrixWorld(true);

      const center = modelCenterRef.current;
      const size = modelSizeRef.current;
      const chestY = center.y + (size.y > 0 ? size.y * 0.05 : 0);

      let changed = false;
      const nextLayers = localLayers.map((layer) => {
        const targetMeshCheck = (layer.targetMeshName && scene.getObjectByName(layer.targetMeshName)) || bodyMeshRef.current;
        let isTargetValid = false;
        if (targetMeshCheck) {
          scene.traverse((c) => { if (c === targetMeshCheck) isTargetValid = true; });
        }

        // Only skip re-projection if locked AND already projected for THIS model AND target mesh is valid in current scene
        if (layer.locked && layer.projectedForModel === modelPath && isTargetValid) {
          return layer;
        }

        // Skip heavy raycasting if layer is already projected for this model and target mesh is valid
        if (layer.projectedForModel === modelPath && isTargetValid) {
          return layer;
        }

        const mesh = isTargetValid ? targetMeshCheck : bodyMeshRef.current;
        if (!mesh) return layer;

        // Project position from scene group-space onto the new mesh using a raycast from the outside towards the center
        const groupPos = new THREE.Vector3().fromArray(layer.position || [0, 0, 0]);
        
        // Target Y for raycasting: if layer position Y is near 0 or unprojected for current model, use chestY
        const targetY = (Math.abs(groupPos.y) < 0.01 || layer.projectedForModel !== modelPath) ? chestY : groupPos.y;
        const targetX = groupPos.x !== 0 ? groupPos.x : center.x;

        const zSign = groupPos.z >= 0 ? 1 : -1;
        const rayOriginScene = new THREE.Vector3(targetX, targetY, center.z + zSign * 2.5);
        const rayTargetScene = new THREE.Vector3(center.x, targetY, center.z);
        const rayDirScene = new THREE.Vector3().subVectors(rayTargetScene, rayOriginScene).normalize();

        const worldOrigin = rayOriginScene.clone().applyMatrix4(scene.matrixWorld);
        const worldDir = rayDirScene.clone().transformDirection(scene.matrixWorld).normalize();

        const raycaster = new THREE.Raycaster();
        raycaster.set(worldOrigin, worldDir);

        let intersects = raycaster.intersectObjects(scene.children, true);
        let validHit = intersects.find((hit) => {
          const child = hit.object;
          if (!child.isMesh || child.name === "decal" || child.name === "decal-helper" || child.userData?.isDecal) {
            return false;
          }
          const nameLower = child.name.toLowerCase();
          if (nameLower.includes("inside") || nameLower.includes("inner") || nameLower.includes("collar_in")) {
            return false;
          }
          return true;
        });

        // Fallback raycast straight at chest center if initial ray missed
        if (!validHit) {
          const fallbackOrigin = new THREE.Vector3(center.x, chestY, center.z + 2.5).applyMatrix4(scene.matrixWorld);
          const fallbackDir = new THREE.Vector3(0, 0, -1).transformDirection(scene.matrixWorld).normalize();
          raycaster.set(fallbackOrigin, fallbackDir);
          intersects = raycaster.intersectObjects(scene.children, true);
          validHit = intersects.find((hit) => {
            const child = hit.object;
            if (!child.isMesh || child.name === "decal" || child.name === "decal-helper" || child.userData?.isDecal) {
              return false;
            }
            const nameLower = child.name.toLowerCase();
            if (nameLower.includes("inside") || nameLower.includes("inner") || nameLower.includes("collar_in")) {
              return false;
            }
            return true;
          });
        }

        if (validHit) {
          const hit = validHit;
          const targetMesh = hit.object;
          // Convert the hit point back to group-space coordinates
          const scenePoint = scene.worldToLocal(hit.point.clone());
          
          let normal = hit.face?.normal || new THREE.Vector3(0, 0, 1);
          // Calculate normal vector relative to the scene group
          const worldNormal = normal.clone().transformDirection(targetMesh.matrixWorld);
          const sceneNormal = worldNormal.clone().transformDirection(scene.matrixWorld.clone().invert()).normalize();
          
          let up = new THREE.Vector3(0, 1, 0);
          if (Math.abs(sceneNormal.dot(up)) > 0.99) {
            up.set(0, 0, 1);
          }
          
          const matrix = new THREE.Matrix4().lookAt(
            new THREE.Vector3(0, 0, 0),
            sceneNormal,
            up
          );
          const rotation = new THREE.Euler().setFromRotationMatrix(matrix, "YXZ");
          
          // Check if coordinates have changed significantly, or if model changed
          const posChanged = 
            Math.abs(scenePoint.x - (layer.position?.[0] || 0)) > 0.001 ||
            Math.abs(scenePoint.y - (layer.position?.[1] || 0)) > 0.001 ||
            Math.abs(scenePoint.z - (layer.position?.[2] || 0)) > 0.001;

          const rotChanged =
            Math.abs(rotation.x - (layer.rotation?.[0] || 0)) > 0.01 ||
            Math.abs(rotation.y - (layer.rotation?.[1] || 0)) > 0.01;

          const modelChanged = layer.projectedForModel !== modelPath;

          if (posChanged || rotChanged || modelChanged) {
            changed = true;
            return {
              ...layer,
              position: [scenePoint.x, scenePoint.y, scenePoint.z],
              rotation: [rotation.x, rotation.y, layer.rotation?.[2] || 0],
              projectedForModel: modelPath,
              targetMeshName: targetMesh.name
            };
          }
          return layer;
        } else {
          // Raycast missed
          if (layer.projectedForModel !== modelPath) {
            changed = true;
            return {
              ...layer,
              projectedForModel: modelPath,
              targetMeshName: mesh.name
            };
          }
          return layer;
        }
      });
      
      if (changed) {
        setLocalLayers(nextLayers);
        if (onUpdateLayers) {
          onUpdateLayers(nextLayers);
        }
      }
    }
  }, [meshLoaded, scene, localLayers, onUpdateLayers, modelPath]);

  return (
    <group ref={rootGroupRef}>
      <ModelSceneLoader modelPath={resolvedModelPath} onSceneReady={handleSceneReady} />
      {scene && (
        <primitive
          object={scene}
        />
      )}

      {/* Render decals & control helpers cleanly without portals */}
      {meshLoaded && activeScene === scene && bodyMeshRef.current && (
        localLayers.map((layer) => {
          let targetMesh = (layer.targetMeshName && scene.getObjectByName(layer.targetMeshName)) || bodyMeshRef.current;
          let isTargetInScene = false;
          if (targetMesh) {
            scene.traverse((c) => {
              if (c === targetMesh) isTargetInScene = true;
            });
          }
          if (!isTargetInScene) {
            targetMesh = bodyMeshRef.current;
          }
          if (!targetMesh) return null;

          const meshRef = { current: targetMesh };
          return (
            <ThreeErrorBoundary key={layer.id} fallback={null}>
              <DecalItem
                layer={layer}
                isSelected={selectedLayerId === layer.id}
                targetMesh={meshRef}
                onUpdateLayers={onUpdateLayers}
                onDeleteLayer={onDeleteLayer}
                scene={scene}
                onInteractionStart={onInteractionStart}
                onInteractionEnd={onInteractionEnd}
                modelPath={modelPath}
                onSelectLayer={onSelectLayer}
              />
            </ThreeErrorBoundary>
          );
        })
      )}
    </group>
  );
}

// Preload all dynamic GLB models to eliminate switching latency
useGLTF.preload("/images/models/male normal t-shirt1.glb");
useGLTF.preload("/images/models/female normal t-shirt.glb");
useGLTF.preload("/images/models/long_sleeve_t-_shirt.glb");
useGLTF.preload("/images/models/oversized t-sdirt1.glb");
useGLTF.preload("/images/models/t_shirt_hoodie.glb");