import { useEffect, useState, useRef } from "react";
import * as THREE from "three";
import { useGLTF } from "@react-three/drei";
import { createPortal } from "@react-three/fiber";
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
    } else {
      rotEuler = new THREE.Euler().fromArray(vecToArray(rotation));
    }

    let geom = null;
    try {
      geom = new DecalGeometry(parent, posVec, rotEuler, scaleVec);
      decalMesh.geometry = geom;
    } catch (err) {
      console.error("SafeDecal geometry generation failed:", err);
    }

    // Restore parent's matrixWorld
    parent.matrixWorld.copy(matrixWorld);

    return () => {
      if (decalMesh && decalMesh.geometry) {
        decalMesh.geometry.dispose();
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
function DecalItem({ layer, isSelected, targetMesh, onUpdateLayers, onDeleteLayer }) {
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

  if (!layer.visible || !texture || !targetMesh?.current) return null;

  const mesh = targetMesh.current;
  mesh.geometry.computeBoundingBox();
  const localBox = mesh.geometry.boundingBox;
  const localCenter = new THREE.Vector3();
  localBox.getCenter(localCenter);

  const decalPos = [
    localCenter.x + layer.position[0],
    localCenter.y + layer.position[1],
    localCenter.z + layer.position[2]
  ];

  const handleScaleDown = (e) => {
    e.stopPropagation();
    setIsScaling(true);
    e.target.setPointerCapture(e.pointerId);
  };

  const handleScaleMove = (e) => {
    e.stopPropagation();
    if (!isScaling) return;
    if (!groupRef.current) return;
    
    const localPoint = groupRef.current.worldToLocal(e.point.clone());
    const newScaleX = Math.max(0.05, Math.abs(localPoint.x) * 2);
    const aspect = layer.aspectRatio || (layer.scale[0] / layer.scale[1]) || 1;
    const newScaleY = newScaleX / aspect;
    
    if (onUpdateLayers) {
      onUpdateLayers((prev) =>
        prev.map((l) =>
          l.id === layer.id
            ? { ...l, scale: [newScaleX, newScaleY, l.scale[2]] }
            : l
        )
      );
    }
  };

  const handleScaleUp = (e) => {
    e.stopPropagation();
    setIsScaling(false);
    e.target.releasePointerCapture(e.pointerId);
  };

  const handleRotateDown = (e) => {
    e.stopPropagation();
    setIsRotating(true);
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

  // Copy parent fabric texture settings and normal map (wrinkles) to decal
  const parentMat = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material;
  const normalMap = parentMat?.normalMap || null;
  const roughnessMap = parentMat?.roughnessMap || null;
  const metalnessMap = parentMat?.metalnessMap || null;
  const normalScale = parentMat?.normalScale || new THREE.Vector2(1, 1);
  const roughness = parentMat?.roughness ?? 0.8;
  const metalness = parentMat?.metalness ?? 0.0;

  return (
    <group>
      {/* 3D Projected Decal on target Mesh */}
      <SafeDecal
        mesh={targetMesh}
        position={decalPos}
        rotation={layer.rotation}
        scale={layer.scale}
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
        <group ref={groupRef} position={decalPos} rotation={layer.rotation}>
          {/* Outline Box */}
          <mesh name="decal-helper" userData={{ isDecal: true }}>
            <planeGeometry args={[layer.scale[0], layer.scale[1]]} />
            <meshBasicMaterial
              color="#4f46e5"
              wireframe
              transparent
              opacity={0.8}
              depthWrite={false}
            />
          </mesh>

          {/* Scale Handle (Bottom Right) */}
          <mesh
            position={[layer.scale[0] / 2, -layer.scale[1] / 2, 0.01]}
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
            position={[0, layer.scale[1] / 2 + 0.025, 0.01]}
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
            position={[-layer.scale[0] / 2, layer.scale[1] / 2, 0.01]}
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
  onDeleteLayer
}) {
  const { scene } = useGLTF(modelPath);
  const bodyMeshRef = useRef(null);
  const [meshLoaded, setMeshLoaded] = useState(false);
  const [activeScene, setActiveScene] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartWorldOffsetRef = useRef(null);
  const draggedLayerIdRef = useRef(null);

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
      let changed = false;
      const nextLayers = layers.map((layer) => {
        if (layer.locked) return layer;
        if (layer.projectedForModel === modelPath) return layer;

        const mesh = (layer.targetMeshName && scene.getObjectByName(layer.targetMeshName)) || bodyMeshRef.current;
        if (!mesh) return layer;

        mesh.updateMatrixWorld(true);
        mesh.geometry.computeBoundingBox();
        const localBox = mesh.geometry.boundingBox;
        const localCenter = new THREE.Vector3();
        localBox.getCenter(localCenter);

        const lx = localCenter.x + layer.position[0];
        const ly = localCenter.y + layer.position[1];
        
        // Raycast down along local Z axis to find outer surface
        const localOrigin = new THREE.Vector3(lx, ly, localBox.max.z + 2.0);
        const localDir = new THREE.Vector3(0, 0, -1);
        
        const worldOrigin = localOrigin.clone().applyMatrix4(mesh.matrixWorld);
        const worldDir = localDir.clone().transformDirection(mesh.matrixWorld).normalize();
        
        const raycaster = new THREE.Raycaster();
        raycaster.set(worldOrigin, worldDir);
        const intersects = raycaster.intersectObject(mesh);
        
        if (intersects.length > 0) {
          const hit = intersects[0];
          const localHitPoint = mesh.worldToLocal(hit.point.clone());
          
          const newOffsetX = localHitPoint.x - localCenter.x;
          const newOffsetY = localHitPoint.y - localCenter.y;
          const newOffsetZ = localHitPoint.z - localCenter.z;
          
          let localNormal;
          if (hit.face && hit.face.normal) {
            localNormal = hit.face.normal.clone().normalize();
          } else {
            localNormal = new THREE.Vector3(0, 0, 1);
          }
          
          let up = new THREE.Vector3(0, 1, 0);
          if (Math.abs(localNormal.dot(up)) > 0.99) {
            up.set(0, 0, 1);
          }
          
          const matrix = new THREE.Matrix4().lookAt(
            new THREE.Vector3(0, 0, 0),
            localNormal,
            up
          );
          const rotation = new THREE.Euler().setFromRotationMatrix(matrix);
          
          changed = true;
          return {
            ...layer,
            position: [newOffsetX, newOffsetY, newOffsetZ],
            rotation: [rotation.x, rotation.y, layer.rotation[2] || 0],
            projectedForModel: modelPath,
            targetMeshName: mesh.name
          };
        } else {
          // Even if raycast fails, mark it as projected to prevent infinite retries
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

    const point = intersection.point;
    let normal = intersection.face?.normal;
    if (!normal) return;

    // 1. Calculate local coordinates on the targeted body mesh
    const localPoint = mesh.worldToLocal(point.clone());

    // 2. Calculate local normal vector
    const normalMatrix = new THREE.Matrix3().getNormalMatrix(mesh.matrixWorld).invert();
    const localNormal = normal.clone().applyMatrix3(normalMatrix).normalize();

    // 3. Compute lookAt rotation to project along surface normal
    let up = new THREE.Vector3(0, 1, 0);
    if (Math.abs(localNormal.dot(up)) > 0.99) {
      up.set(0, 0, 1);
    }
    const target = localNormal.clone();
    const matrix = new THREE.Matrix4().lookAt(
      new THREE.Vector3(0, 0, 0),
      target,
      up
    );
    const rotation = new THREE.Euler().setFromRotationMatrix(matrix);

    // Get local center of the mesh geometry
    mesh.geometry.computeBoundingBox();
    const localBox = mesh.geometry.boundingBox;
    const localCenter = new THREE.Vector3();
    localBox.getCenter(localCenter);

    // Store position as offset from localCenter
    const offsetX = localPoint.x - localCenter.x;
    const offsetY = localPoint.y - localCenter.y;
    const offsetZ = localPoint.z - localCenter.z;

    // 4. Update the layer parameters in State
    onUpdateLayers((prev) =>
      prev.map((l) => {
        if (l.id === selectedLayerId) {
          return {
            ...l,
            position: [offsetX, offsetY, offsetZ],
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

    const currentWorldPoint = intersection.point.clone();
    
    // Calculate target decal center in world space using the world offset
    const targetDecalWorldPoint = new THREE.Vector3().subVectors(currentWorldPoint, dragStartWorldOffsetRef.current);
    
    // Project target world point onto the current intersected mesh local coordinates
    const localPoint = mesh.worldToLocal(targetDecalWorldPoint.clone());
    
    const normal = intersection.face?.normal;
    if (!normal) return;

    // Calculate local normal and rotation
    const normalMatrix = new THREE.Matrix3().getNormalMatrix(mesh.matrixWorld).invert();
    const localNormal = normal.clone().applyMatrix3(normalMatrix).normalize();

    let up = new THREE.Vector3(0, 1, 0);
    if (Math.abs(localNormal.dot(up)) > 0.99) {
      up.set(0, 0, 1);
    }
    const matrix = new THREE.Matrix4().lookAt(
      new THREE.Vector3(0, 0, 0),
      localNormal,
      up
    );
    const rotation = new THREE.Euler().setFromRotationMatrix(matrix);

    // Compute current mesh local center
    mesh.geometry.computeBoundingBox();
    const localBox = mesh.geometry.boundingBox;
    const localCenter = new THREE.Vector3();
    localBox.getCenter(localCenter);

    const newPosition = [
      localPoint.x - localCenter.x,
      localPoint.y - localCenter.y,
      localPoint.z - localCenter.z
    ];

    onUpdateLayers((prev) =>
      prev.map((l) => {
        if (l.id === layerId) {
          return {
            ...l,
            position: newPosition,
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

      // 3. Compute active layer's current center in world space
      const layerMesh = (activeLayerObj.targetMeshName && scene.getObjectByName(activeLayerObj.targetMeshName)) || bodyMeshRef.current;
      if (!layerMesh) return;

      layerMesh.geometry.computeBoundingBox();
      const localBox = layerMesh.geometry.boundingBox;
      const localCenter = new THREE.Vector3();
      localBox.getCenter(localCenter);

      const localPos = new THREE.Vector3(
        localCenter.x + activeLayerObj.position[0],
        localCenter.y + activeLayerObj.position[1],
        localCenter.z + activeLayerObj.position[2]
      );
      const activeLayerWorldPoint = localPos.clone().applyMatrix4(layerMesh.matrixWorld);

      // 4. Calculate world offset from target center to intersection click point
      const clickWorldPoint = intersection.point.clone();
      dragStartWorldOffsetRef.current = new THREE.Vector3().subVectors(clickWorldPoint, activeLayerWorldPoint);
      draggedLayerIdRef.current = targetLayerId;

      setIsDragging(true);
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
    }
  };

  return (
    <group>
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
        return createPortal(
          <DecalItem
            key={layer.id}
            layer={layer}
            isSelected={selectedLayerId === layer.id}
            targetMesh={meshRef}
            onUpdateLayers={onUpdateLayers}
            onDeleteLayer={onDeleteLayer}
          />,
          targetMesh
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