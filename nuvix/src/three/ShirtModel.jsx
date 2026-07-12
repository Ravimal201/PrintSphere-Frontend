import { useEffect, useState, useRef } from "react";
import * as THREE from "three";
import { useGLTF } from "@react-three/drei";
import { createPortal, useThree } from "@react-three/fiber";
import { DecalGeometry } from "three-stdlib";
import { createTextTexture } from "./TextureCanvas";

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
function DecalItem({ layer, isSelected, targetMesh, onUpdateLayers, onDeleteLayer, scene, onInteractionStart, onInteractionEnd }) {
  const { scene: rootScene } = useThree();
  const [texture, setTexture] = useState(null);
  const [isScaling, setIsScaling] = useState(false);
  const [isRotating, setIsRotating] = useState(false);
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
    e.target.setPointerCapture(e.pointerId);
  };

  const handleScaleMove = (e) => {
    e.stopPropagation();
    if (!isScaling) return;
    if (!groupRef.current) return;
    
    const localPoint = groupRef.current.worldToLocal(e.point.clone());
    // Calculate new scale in mesh local space
    const newLocalScaleX = Math.max(0.05, Math.abs(localPoint.x) * 2);
    const aspect = layer.aspectRatio || (layer.scale[0] / layer.scale[1]) || 1;
    const newLocalScaleY = newLocalScaleX / aspect;

    // Convert back to scene group scale space
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
  };

  const handleScaleUp = (e) => {
    e.stopPropagation();
    setIsScaling(false);
    e.target.releasePointerCapture(e.pointerId);
    if (onInteractionEnd) onInteractionEnd();
  };

  const handleRotateDown = (e) => {
    e.stopPropagation();
    setIsRotating(true);
    if (onInteractionStart) onInteractionStart();
    e.target.setPointerCapture(e.pointerId);
  };

  const handleRotateMove = (e) => {
    e.stopPropagation();
    if (!isRotating) return;
    if (!groupRef.current) return;
    
    const localPoint = groupRef.current.worldToLocal(e.point.clone());
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
  };

  const handleRotateUp = (e) => {
    e.stopPropagation();
    setIsRotating(false);
    e.target.releasePointerCapture(e.pointerId);
    if (onInteractionEnd) onInteractionEnd();
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

          {/* Scale Handle (Bottom Right) */}
          <mesh
            position={[decalScale[0] / 2, -decalScale[1] / 2, 0.01]}
            name="decal-helper-handle"
            userData={{ isDecal: true }}
            onPointerDown={handleScaleDown}
            onPointerMove={handleScaleMove}
            onPointerUp={handleScaleUp}
            onPointerOver={(e) => {
              e.stopPropagation();
              document.body.style.cursor = "nwse-resize";
            }}
            onPointerOut={() => {
              document.body.style.cursor = "auto";
            }}
          >
            <sphereGeometry args={[0.012, 16, 16]} />
            <meshBasicMaterial color="#ffffff" depthTest={false} />
            <mesh>
              <sphereGeometry args={[0.006, 16, 16]} />
              <meshBasicMaterial color="#4f46e5" depthTest={false} />
            </mesh>
          </mesh>

          {/* Rotate Handle (Top Center) */}
          <mesh
            position={[0, decalScale[1] / 2 + 0.025 / (meshWorldScale.y || 1), 0.01]}
            name="decal-helper-handle"
            userData={{ isDecal: true }}
            onPointerDown={handleRotateDown}
            onPointerMove={handleRotateMove}
            onPointerUp={handleRotateUp}
            onPointerOver={(e) => {
              e.stopPropagation();
              document.body.style.cursor = "grab";
            }}
            onPointerOut={() => {
              document.body.style.cursor = "auto";
            }}
          >
            <sphereGeometry args={[0.012, 16, 16]} />
            <meshBasicMaterial color="#ffffff" depthTest={false} />
            <mesh>
              <sphereGeometry args={[0.006, 16, 16]} />
              <meshBasicMaterial color="#10b981" depthTest={false} />
            </mesh>
          </mesh>

          {/* Delete Handle (Top Left) */}
          <mesh
            position={[-decalScale[0] / 2, decalScale[1] / 2, 0.01]}
            name="decal-helper-handle"
            userData={{ isDecal: true }}
            onPointerDown={handleDeleteClick}
            onPointerOver={(e) => {
              e.stopPropagation();
              document.body.style.cursor = "pointer";
            }}
            onPointerOut={() => {
              document.body.style.cursor = "auto";
            }}
          >
            <sphereGeometry args={[0.012, 16, 16]} />
            <meshBasicMaterial color="#ffffff" depthTest={false} />
            <mesh>
              <sphereGeometry args={[0.006, 16, 16]} />
              <meshBasicMaterial color="#ef4444" depthTest={false} />
            </mesh>
          </mesh>
        </group>
      )}
    </group>
  );
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
  const { scene: rootScene } = useThree();
  const { scene } = useGLTF(modelPath);
  const bodyMeshRef = useRef(null);
  const [meshLoaded, setMeshLoaded] = useState(false);
  const [activeScene, setActiveScene] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartWorldOffsetRef = useRef(null);
  const draggedLayerIdRef = useRef(null);
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
        if (layer.projectedForModel === modelPath) return layer;

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
          
          changed = true;
          return {
            ...layer,
            position: [scenePoint.x, scenePoint.y, scenePoint.z],
            rotation: [rotation.x, rotation.y, layer.rotation[2] || 0],
            projectedForModel: modelPath,
            targetMeshName: targetMesh.name
          };
        } else {
          // If the raycast misses (e.g. geometry shifted slightly on style change),
          // mark it as projected for the new model to prevent infinite retries.
          // Since the coordinates are stored in scene group-space, they remain valid.
          changed = true;
          return {
            ...layer,
            projectedForModel: modelPath,
            targetMeshName: mesh.name
          };
        }
      });
      
      if (changed) {
        onUpdateLayers(nextLayers);
      }
    }
  }, [meshLoaded, scene, layers, onUpdateLayers, modelPath]);

  const activeLayer = layers.find((l) => l.id === selectedLayerId);

  const updateDecalFromRaycast = (e) => {
    if (!selectedLayerId || activeLayer?.locked) return;

    // Filter out decal and decal helper meshes to get the actual model mesh underneath
    const intersection = e.intersections?.find(
      (intersect) =>
        intersect.object &&
        intersect.object.name !== "decal" &&
        intersect.object.name !== "decal-helper" &&
        intersect.object.name !== "decal-helper-handle" &&
        !intersect.object.userData?.isDecal
    );

    if (!intersection) return;

    const mesh = intersection.object;
    if (!mesh || !mesh.isMesh) return;

    // Force update world matrices
    rootScene.updateMatrixWorld(true);

    const point = intersection.point;
    let normal = intersection.face?.normal;
    if (!normal) return;

    // 1. Convert world intersection point to scene group-space
    const scenePoint = scene.worldToLocal(point.clone());

    // 2. Transform normal from mesh local space to world space and then to scene local space
    const worldNormal = normal.clone().transformDirection(mesh.matrixWorld);
    const sceneNormal = worldNormal.clone().transformDirection(scene.matrixWorld.clone().invert()).normalize();

    // 3. Compute lookAt rotation to project along surface normal relative to the scene group
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

    // 4. Update the layer parameters in State in scene group-space
    onUpdateLayers((prev) =>
      prev.map((l) => {
        if (l.id === selectedLayerId) {
          return {
            ...l,
            position: [scenePoint.x, scenePoint.y, scenePoint.z],
            rotation: [rotation.x, rotation.y, l.rotation[2] || 0],
            projectedForModel: modelPath,
            targetMeshName: mesh.name
          };
        }
        return l;
      })
    );
  };

  const updateDecalFromDrag = (e) => {
    if (!draggedLayerIdRef.current || !dragStartWorldOffsetRef.current) return;

    const layerId = draggedLayerIdRef.current;
    const activeLayerObj = layers.find((l) => l.id === layerId);
    if (!activeLayerObj || activeLayerObj.locked) return;

    // Filter out decal and decal helper meshes to get the actual model mesh underneath
    const intersection = e.intersections?.find(
      (intersect) =>
        intersect.object &&
        intersect.object.name !== "decal" &&
        intersect.object.name !== "decal-helper" &&
        intersect.object.name !== "decal-helper-handle" &&
        !intersect.object.userData?.isDecal
    );

    if (!intersection) return;

    const mesh = intersection.object;
    if (!mesh || !mesh.isMesh) return;

    // Force update world matrices
    rootScene.updateMatrixWorld(true);

    const currentWorldPoint = intersection.point.clone();
    
    // Calculate target decal center in world space using the world offset
    const targetDecalWorldPoint = new THREE.Vector3().subVectors(currentWorldPoint, dragStartWorldOffsetRef.current);
    
    // Convert target world point to scene group-space
    const scenePoint = scene.worldToLocal(targetDecalWorldPoint.clone());
    
    const normal = intersection.face?.normal;
    if (!normal) return;

    // Transform normal from mesh local space to world space and then to scene local space
    const worldNormal = normal.clone().transformDirection(mesh.matrixWorld);
    const sceneNormal = worldNormal.clone().transformDirection(scene.matrixWorld.clone().invert()).normalize();

    // Compute lookAt rotation to project along surface normal relative to the scene group
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

    onUpdateLayers((prev) =>
      prev.map((l) => {
        if (l.id === layerId) {
          return {
            ...l,
            position: [scenePoint.x, scenePoint.y, scenePoint.z],
            rotation: [rotation.x, rotation.y, l.rotation[2] || 0],
            projectedForModel: modelPath,
            targetMeshName: mesh.name
          };
        }
        return l;
      })
    );
  };

  const handlePointerDown = (e) => {
    e.stopPropagation();
    
    // 1. Check if we clicked directly on a decal to select it
    const decalIntersect = e.intersections?.find(
      (intersect) =>
        intersect.object &&
        (intersect.object.name === "decal" || intersect.object.userData?.isDecal)
    );

    let targetLayerId = selectedLayerId;
    if (decalIntersect) {
      const clickedLayerId = decalIntersect.object.userData?.layerId;
      if (clickedLayerId) {
        onSelectLayer(clickedLayerId);
        targetLayerId = clickedLayerId;
      }
    }

    const activeLayerObj = layers.find((l) => l.id === targetLayerId);
    if (targetLayerId && activeLayerObj && !activeLayerObj.locked) {
      // 2. Find intersection on the shirt mesh underneath
      const intersection = e.intersections?.find(
        (intersect) =>
          intersect.object &&
          intersect.object.name !== "decal" &&
          intersect.object.name !== "decal-helper" &&
          intersect.object.name !== "decal-helper-handle" &&
          !intersect.object.userData?.isDecal
      );
      if (!intersection) return;

      const mesh = intersection.object;
      if (!mesh || !mesh.isMesh) return;

      // Force update world matrices
      rootScene.updateMatrixWorld(true);

      // 3. Compute active layer's current center in world space (it is in scene group-space)
      const groupPos = new THREE.Vector3().fromArray(activeLayerObj.position);
      const activeLayerWorldPoint = groupPos.clone().applyMatrix4(scene.matrixWorld);

      // 4. Calculate world offset from target center to intersection click point
      const clickWorldPoint = intersection.point.clone();
      dragStartWorldOffsetRef.current = new THREE.Vector3().subVectors(clickWorldPoint, activeLayerWorldPoint);
      draggedLayerIdRef.current = targetLayerId;

      setIsDragging(true);
      if (onInteractionStart) onInteractionStart();
      e.target.setPointerCapture(e.pointerId);
    }
  };

  const handlePointerMove = (e) => {
    e.stopPropagation();
    if (isDragging && draggedLayerIdRef.current) {
      updateDecalFromDrag(e);
    }
  };

  const handlePointerUp = (e) => {
    e.stopPropagation();
    if (isDragging) {
      setIsDragging(false);
      draggedLayerIdRef.current = null;
      dragStartWorldOffsetRef.current = null;
      e.target.releasePointerCapture(e.pointerId);
      if (onInteractionEnd) onInteractionEnd();
    }
  };

  return (
    <group ref={rootGroupRef}>
      <primitive
        object={scene}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      />

      {/* Render decals inside target mesh portals so they inherit their local coordinates */}
      {meshLoaded && activeScene === scene && bodyMeshRef.current && layers.map((layer) => {
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
              />,
              targetMesh
            )}
          </group>
        );
      })}
    </group>
  );
}

// Preload all dynamic GLB models to eliminate switching latency
useGLTF.preload("/images/models/male normal t-shirt1.glb");
useGLTF.preload("/images/models/female normal t-shirt.glb");
useGLTF.preload("/images/models/long_sleeve_t-_shirt.glb");
useGLTF.preload("/images/models/oversized t-sdirt1.glb");
useGLTF.preload("/images/models/t_shirt_hoodie.glb");