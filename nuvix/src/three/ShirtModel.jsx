import { useEffect, useState, useRef } from "react";
import * as THREE from "three";
import { useGLTF, Html } from "@react-three/drei";
import { createPortal, useThree } from "@react-three/fiber";
import { DecalGeometry } from "three-stdlib";
import { createTextTexture } from "./TextureCanvas";
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

// Custom raycaster to force handles to the front of intersections, preventing shirt mesh from blocking clicks
function forceOnTopRaycast(raycaster, intersects) {
  const localIntersects = [];
  THREE.Mesh.prototype.raycast.call(this, raycaster, localIntersects);
  for (let i = 0; i < localIntersects.length; i++) {
    localIntersects[i].distance = 0.0001; // extremely close, sorting first
    intersects.push(localIntersects[i]);
  }
}


// Custom Safe Decal Component to prevent React 19/R3F null ref crashes
function SafeDecal({
  mesh,
  position,
  rotation,
  scale,
  children,
  polygonOffsetFactor = -10,
  depthTest = false,
  map,
  ...props
}) {
  const [decalMesh, setDecalMesh] = useState(null);
  const [geometry, setGeometry] = useState(null);

  useEffect(() => {
    if (!decalMesh) return;

    const parent = (mesh && mesh.current) || decalMesh.parent;
    if (!parent || !(parent instanceof THREE.Mesh)) {
      return;
    }

    // Save parent's matrixWorld and identity it for DecalGeometry calculation
    const matrixWorld = parent.matrixWorld.clone();
    parent.matrixWorld.identity();

    const posVec = new THREE.Vector3().fromArray(vecToArray(position));
    const scaleVec = new THREE.Vector3().fromArray(vecToArray(scale));
    
    let rotEuler;
    if (!rotation || typeof rotation === 'number') {
      const o = new THREE.Object3D();
      o.position.copy(posVec);

      if (parent.geometry.attributes.normal === undefined) {
        parent.geometry.computeVertexNormals();
      }
      
      const vertices = parent.geometry.attributes.position.array;
      const normal = parent.geometry.attributes.normal.array;
      
      let distance = Infinity;
      let closestNormal = new THREE.Vector3();
      const ox = o.position.x;
      const oy = o.position.y;
      const oz = o.position.z;
      const vLength = vertices.length;
      let chosenIdx = -1;
      
      for (let i = 0; i < vLength; i += 3) {
        const x = vertices[i];
        const y = vertices[i + 1];
        const z = vertices[i + 2];
        const xDiff = x - ox;
        const yDiff = y - oy;
        const zDiff = z - oz;
        const distSquared = xDiff * xDiff + yDiff * yDiff + zDiff * zDiff;
        if (distSquared < distance) {
          distance = distSquared;
          chosenIdx = i;
        }
      }
      
      closestNormal.fromArray(normal, chosenIdx);
      o.lookAt(o.position.clone().add(closestNormal));
      o.rotateZ(Math.PI);
      o.rotateY(Math.PI);
      if (typeof rotation === 'number') o.rotateZ(rotation);
      rotEuler = o.rotation.clone();
    } else if (rotation instanceof THREE.Euler) {
      rotEuler = rotation;
    } else {
      rotEuler = new THREE.Euler().fromArray(vecToArray(rotation));
    }

    let geom = null;
    try {
      geom = new DecalGeometry(parent, posVec, rotEuler, scaleVec);
      setGeometry(geom);
    } catch (err) {
      console.error("SafeDecal geometry generation failed:", err);
    }

    // Restore parent's matrixWorld
    parent.matrixWorld.copy(matrixWorld);

    return () => {
      setGeometry(null);
      if (geom) {
        geom.dispose();
      }
    };
  }, [
    decalMesh,
    mesh,
    ...vecToArray(position),
    ...vecToArray(scale),
    ...vecToArray(rotation)
  ]);

  return (
    <mesh
      ref={setDecalMesh}
      geometry={geometry || undefined}
      name="decal"
      material-transparent
      material-polygonOffset
      material-polygonOffsetFactor={polygonOffsetFactor}
      material-depthTest={depthTest}
      material-map={map}
      {...props}
      userData={{ isDecal: true, ...props.userData }}
    >
      {children}
    </mesh>
  );
}

// Sub-component to manage texture loading and rendering for each decal layer
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

  useEffect(() => {
    if (!layer.visible) return;

    let active = true;
    let createdTexture = null;

    if (layer.type === "text") {
      const tex = createTextTexture(layer);
      if (tex && active) {
        createdTexture = tex;
        setTexture(tex);
      }
    } else {
      // Image or Logo layer
      const loader = new THREE.TextureLoader();
      loader.load(layer.url, (tex) => {
        if (active) {
          tex.colorSpace = THREE.SRGBColorSpace;
          tex.needsUpdate = true;
          createdTexture = tex;
          setTexture(tex);
        }
      });
    }

    return () => {
      active = false;
      if (createdTexture) {
        createdTexture.dispose();
      }
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
      // flipX = true toggles horizontal mirror.
      // flipY = true toggles vertical mirror.
      const repeatX = flipX ? 1 : -1;
      const repeatY = flipY ? -1 : 1;
      
      texture.repeat.set(repeatX, repeatY);
      texture.needsUpdate = true;
    }
  }, [texture, layer.flipX, layer.flipY]);

  // Listen to mouse pointer events globally on the window to prevent lagging/losing focus
  useEffect(() => {
    if (!isDragging && !isScaling && !isRotating) return;

    const handlePointerMove = (e) => {
      if (!targetMesh?.current) return;
      const mesh = targetMesh.current;

      // Calculate NDC mouse coordinates
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
                    rotation: [rotation.x, rotation.y, l.rotation[2] || 0],
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
        const meshWorldScale = new THREE.Vector3();
        mesh.getWorldScale(meshWorldScale);

        if (isScaling) {
          const newLocalScaleX = Math.max(0.05, Math.abs(localPoint.x) * 2);
          const aspect = layer.aspectRatio || (layer.scale[0] / layer.scale[1]) || 1;
          const newLocalScaleY = newLocalScaleX / aspect;

          const newGroupScaleX = newLocalScaleX * meshWorldScale.x;
          const newGroupScaleY = newLocalScaleY * meshWorldScale.y;

          if (onUpdateLayers) {
            onUpdateLayers((prev) =>
              prev.map((l) =>
                l.id === layer.id
                  ? { ...l, scale: [newGroupScaleX, newGroupScaleY, l.scale[2]] }
                  : l
              )
            );
          }
        } else if (isRotating) {
          const angle = Math.atan2(localPoint.x, localPoint.y);
          if (onUpdateLayers) {
            onUpdateLayers((prev) =>
              prev.map((l) =>
                l.id === layer.id
                  ? { ...l, rotation: [l.rotation[0], l.rotation[1], -angle] }
                  : l
              )
            );
          }
        }
      }
    };

    const handlePointerUp = () => {
      setIsDragging(false);
      setIsScaling(false);
      setIsRotating(false);
      dragStartWorldOffsetRef.current = null;
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

  if (!layer.visible || !texture || !targetMesh?.current || !scene) return null;

  // Force update world matrices to avoid stale/identity matrix values
  rootScene.updateMatrixWorld(true);
  const mesh = targetMesh.current;

  mesh.geometry.computeBoundingBox();
  const localBox = mesh.geometry.boundingBox;
  const localCenter = new THREE.Vector3();
  localBox.getCenter(localCenter);

  // 1. Convert layer.position (stored in scene-group space) to mesh local space
  const groupPos = new THREE.Vector3().fromArray(layer.position);
  const worldPos = groupPos.clone().applyMatrix4(scene.matrixWorld);
  const localPos = worldPos.clone().applyMatrix4(mesh.matrixWorld.clone().invert());
  const decalPos = [localPos.x, localPos.y, localPos.z];

  // 2. Convert layer.scale (stored in scene-group space) to mesh local scale
  const groupScale = new THREE.Vector3().fromArray(layer.scale);
  const meshWorldScale = new THREE.Vector3();
  mesh.getWorldScale(meshWorldScale);
  const decalScale = [
    groupScale.x / (meshWorldScale.x || 1),
    groupScale.y / (meshWorldScale.y || 1),
    groupScale.z / (meshWorldScale.z || 1)
  ];

  // Copy parent fabric texture settings and normal map (wrinkles) to decal
  const parentMat = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material;
  const normalMap = parentMat?.normalMap || null;
  const roughnessMap = parentMat?.roughnessMap || null;
  const metalnessMap = parentMat?.metalnessMap || null;
  const normalScale = parentMat?.normalScale || new THREE.Vector2(1, 1);
  const roughness = parentMat?.roughness ?? 0.8;
  const metalness = parentMat?.metalness ?? 0.0;

  // Convert layer.rotation (stored in scene group-space YXZ Euler angles) to a local euler angle
  const sceneQuaternion = new THREE.Quaternion().setFromRotationMatrix(scene.matrixWorld);
  const layerQuaternion = new THREE.Quaternion().setFromEuler(
    new THREE.Euler(layer.rotation[0], layer.rotation[1], layer.rotation[2], "YXZ")
  );
  const worldQuaternion = sceneQuaternion.clone().multiply(layerQuaternion);
  const meshQuaternion = new THREE.Quaternion().setFromRotationMatrix(mesh.matrixWorld);
  const localQuaternion = meshQuaternion.clone().invert().multiply(worldQuaternion);
  const rotEuler = new THREE.Euler().setFromQuaternion(localQuaternion, "YXZ");

  const handleScaleDown = (e) => {
    e.stopPropagation();
    setIsScaling(true);
    if (onInteractionStart) onInteractionStart();
  };

  const handleRotateDown = (e) => {
    e.stopPropagation();
    setIsRotating(true);
    if (onInteractionStart) onInteractionStart();
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

    const groupPos = new THREE.Vector3().fromArray(layer.position);
    const activeLayerWorldPoint = groupPos.clone().applyMatrix4(scene.matrixWorld);

    if (hitPoint) {
      dragStartWorldOffsetRef.current = new THREE.Vector3().subVectors(hitPoint, activeLayerWorldPoint);
    } else {
      dragStartWorldOffsetRef.current = new THREE.Vector3(0, 0, 0);
    }

    setIsDragging(true);
    if (onInteractionStart) onInteractionStart();
  };
  // Define points for a clean rectangular outline (no diagonal lines)
  const halfW = decalScale[0] / 2;
  const halfH = decalScale[1] / 2;
  const borderPoints = [
    new THREE.Vector3(-halfW, halfH, 0),
    new THREE.Vector3(halfW, halfH, 0),
    new THREE.Vector3(halfW, -halfH, 0),
    new THREE.Vector3(-halfW, -halfH, 0),
    new THREE.Vector3(-halfW, halfH, 0)
  ];

  return (
    <group>
      {/* 3D Projected Decal on target Mesh */}
      <SafeDecal
        mesh={targetMesh}
        position={decalPos}
        rotation={rotEuler}
        scale={decalScale}
        userData={{ isDecal: true, layerId: layer.id }}
        onPointerDown={handleDecalPointerDown}
      >
        <meshStandardMaterial
          map={texture}
          transparent
          alphaTest={0.05}
          polygonOffset
          polygonOffsetFactor={-10}
          polygonOffsetUnits={-10}
          normalMap={normalMap}
          normalScale={normalScale}
          roughnessMap={roughnessMap}
          metalnessMap={metalnessMap}
          roughness={roughness}
          metalness={metalness}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </SafeDecal>
 
      {/* Interactive Bounding outline and control handles when selected */}
      {isSelected && (
        <group ref={groupRef} position={decalPos} rotation={rotEuler}>
          {/* Clean rectangular border without diagonal line */}
          <line name="decal-helper" userData={{ isDecal: true }}>
            <bufferGeometry attach="geometry" onUpdate={(self) => self.setFromPoints(borderPoints)} />
            <lineBasicMaterial
              attach="material"
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
            onPointerDown={handleDecalPointerDown}
          >
            <planeGeometry args={[decalScale[0], decalScale[1]]} />
            <meshBasicMaterial transparent opacity={0} depthWrite={false} />
          </mesh>

          {/* Scale Handle (Bottom Right) */}
          <mesh
            position={[decalScale[0] / 2, -decalScale[1] / 2, 0.01]}
            name="decal-helper-handle"
            userData={{ isDecal: true }}
            raycast={forceOnTopRaycast}
            onPointerDown={handleScaleDown}
            onPointerOver={(e) => {
              e.stopPropagation();
              document.body.style.cursor = "nwse-resize";
            }}
            onPointerOut={() => {
              document.body.style.cursor = "auto";
            }}
          >
            <sphereGeometry args={[0.03, 16, 16]} />
            <meshBasicMaterial transparent opacity={0} depthTest={false} />
            <Html pointerEvents="none" center>
              <div className="flex items-center justify-center w-6 h-6 bg-indigo-600 text-white rounded-full shadow-md border border-white transform scale-80 select-none">
                <Maximize2 className="w-3 h-3" />
              </div>
            </Html>
          </mesh>

          {/* Rotate Handle (Top Center) */}
          <mesh
            position={[0, decalScale[1] / 2 + 0.025 / (meshWorldScale.y || 1), 0.01]}
            name="decal-helper-handle"
            userData={{ isDecal: true }}
            raycast={forceOnTopRaycast}
            onPointerDown={handleRotateDown}
            onPointerOver={(e) => {
              e.stopPropagation();
              document.body.style.cursor = "grab";
            }}
            onPointerOut={() => {
              document.body.style.cursor = "auto";
            }}
          >
            <sphereGeometry args={[0.03, 16, 16]} />
            <meshBasicMaterial transparent opacity={0} depthTest={false} />
            <Html pointerEvents="none" center>
              <div className="flex items-center justify-center w-6 h-6 bg-emerald-500 text-white rounded-full shadow-md border border-white transform scale-80 select-none">
                <RotateCw className="w-3 h-3" />
              </div>
            </Html>
          </mesh>

          {/* Delete Handle (Top Left) */}
          <mesh
            position={[-decalScale[0] / 2, decalScale[1] / 2, 0.01]}
            name="decal-helper-handle"
            userData={{ isDecal: true }}
            raycast={forceOnTopRaycast}
            onPointerDown={handleDeleteClick}
            onPointerOver={(e) => {
              e.stopPropagation();
              document.body.style.cursor = "pointer";
            }}
            onPointerOut={() => {
              document.body.style.cursor = "auto";
            }}
          >
            <sphereGeometry args={[0.03, 16, 16]} />
            <meshBasicMaterial transparent opacity={0} depthTest={false} />
            <Html pointerEvents="none" center>
              <div className="flex items-center justify-center w-6 h-6 bg-rose-500 text-white rounded-full shadow-md border border-white transform scale-80 select-none">
                <Trash2 className="w-3 h-3" />
              </div>
            </Html>
          </mesh>
        </group>
      )}
    </group>
  );
}

const fallbackLayer = {
  id: "fallback-text-layer",
  type: "text",
  name: "Fallback Text",
  text: "PrintSphere",
  fontFamily: "Outfit",
  color: "#4f46e5",
  bold: true,
  italic: false,
  visible: true,
  locked: true,
  position: [0, 0.05, 0.16],
  rotation: [0, 0, 0],
  scale: [0.4, 0.12, 0.25]
};

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
  const { scene: rootScene } = useThree();
  const { scene } = useGLTF(modelPath);
  const bodyMeshRef = useRef(null);
  const [meshLoaded, setMeshLoaded] = useState(false);
  const [activeScene, setActiveScene] = useState(null);
  const rootGroupRef = useRef(null);

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
    if (meshLoaded && activeScene === scene && bodyMeshRef.current && onUpdateLayers && layers.length > 0) {
      // Safety guard: ensure bodyMeshRef.current belongs to the current scene
      let isCurrentMesh = false;
      scene.traverse((child) => {
        if (child === bodyMeshRef.current) isCurrentMesh = true;
      });
      if (!isCurrentMesh) return;

      // Force update all world matrices before raycasting
      rootScene.updateMatrixWorld(true);

      const parentMatrix = rootGroupRef.current ? rootGroupRef.current.matrixWorld : scene.matrixWorld;

      let changed = false;
      const nextLayers = layers.map((layer) => {
        if (layer.locked) return layer;

        const mesh = (layer.targetMeshName && scene.getObjectByName(layer.targetMeshName)) || bodyMeshRef.current;
        if (!mesh) return layer;

        // Project position from scene group-space onto the new mesh using a front-to-back raycast
        const groupPos = new THREE.Vector3().fromArray(layer.position);
        
        // Raycast from in front of the shirt group (Z=2) backwards (Z=-2) at the (x, y) coordinates
        const localOrigin = new THREE.Vector3(groupPos.x, groupPos.y, 2.0);
        const localDir = new THREE.Vector3(0, 0, -1);
        
        const worldOrigin = localOrigin.clone().applyMatrix4(parentMatrix);
        const worldDir = localDir.clone().transformDirection(parentMatrix).normalize();
        
        const raycaster = new THREE.Raycaster();
        raycaster.set(worldOrigin, worldDir);
        
        // Raycast against the entire GLTF scene hierarchy to find any valid outer mesh intersection
        const intersects = raycaster.intersectObjects(scene.children, true);

        // Find the first intersection that is a mesh and not helper/decal/inner
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
            Math.abs(scenePoint.x - layer.position[0]) > 0.001 ||
            Math.abs(scenePoint.y - layer.position[1]) > 0.001 ||
            Math.abs(scenePoint.z - layer.position[2]) > 0.001;

          const rotChanged =
            Math.abs(rotation.x - layer.rotation[0]) > 0.01 ||
            Math.abs(rotation.y - layer.rotation[1]) > 0.01;

          const modelChanged = layer.projectedForModel !== modelPath;

          if (posChanged || rotChanged || modelChanged) {
            changed = true;
            return {
              ...layer,
              position: [scenePoint.x, scenePoint.y, scenePoint.z],
              rotation: [rotation.x, rotation.y, layer.rotation[2] || 0],
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
        onUpdateLayers(nextLayers);
      }
    }
  }, [meshLoaded, scene, layers, onUpdateLayers, modelPath]);

  const activeLayer = layers.find((l) => l.id === selectedLayerId);

  return (
    <group ref={rootGroupRef}>
      <primitive
        object={scene}
      />

      {/* Render decals inside target mesh portals so they inherit their local coordinates */}
      {meshLoaded && activeScene === scene && bodyMeshRef.current && (
        layers.length === 0 ? (
          <group key="fallback-group">
            {createPortal(
              <DecalItem
                layer={fallbackLayer}
                isSelected={false}
                targetMesh={{ current: bodyMeshRef.current }}
                onUpdateLayers={null}
                onDeleteLayer={null}
                scene={scene}
                modelPath={modelPath}
                onSelectLayer={null}
              />,
              bodyMeshRef.current
            )}
          </group>
        ) : (
          layers.map((layer) => {
            const targetMesh = (layer.targetMeshName && scene.getObjectByName(layer.targetMeshName)) || bodyMeshRef.current;
            if (!targetMesh) return null;

            // Double check that targetMesh belongs to the current scene
            let isTargetInScene = false;
            scene.traverse((c) => {
              if (c === targetMesh) isTargetInScene = true;
            });
            if (!isTargetInScene) return null;

            const meshRef = { current: targetMesh };
            return (
              <group key={layer.id}>
                {createPortal(
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
                  />,
                  targetMesh
                )}
              </group>
            );
          })
        )
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