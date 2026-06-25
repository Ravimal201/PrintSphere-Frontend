import { useEffect, useState, useRef } from "react";
import * as THREE from "three";
import { useGLTF, Decal } from "@react-three/drei";
import { createPortal } from "@react-three/fiber";
import { createTextTexture } from "./TextureCanvas";

// Sub-component to manage texture loading and rendering for each decal layer
function DecalItem({ layer, isSelected, targetMesh }) {
  const [texture, setTexture] = useState(null);

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

  return (
    <group>
      {/* 3D Projected Decal on target Mesh */}
      <Decal
        mesh={targetMesh}
        position={decalPos}
        rotation={layer.rotation}
        scale={layer.scale}
      >
        <meshStandardMaterial
          map={texture}
          transparent
          alphaTest={0.05}
          polygonOffset
          polygonOffsetFactor={-10}
          // Fabric settings
          roughness={0.8}
          metalness={0.0}
          side={THREE.DoubleSide}
          depthWrite={true}
        />
      </Decal>

      {/* Blue wireframe bounding helper when selected */}
      {isSelected && (
        <mesh position={decalPos} rotation={layer.rotation}>
          <boxGeometry args={[layer.scale[0], layer.scale[1], 0.05]} />
          <meshBasicMaterial
            color="#4f46e5"
            wireframe
            transparent
            opacity={0.7}
          />
        </mesh>
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
  onUpdateLayers
}) {
  const { scene } = useGLTF(modelPath);
  const bodyMeshRef = useRef(null);
  const [meshLoaded, setMeshLoaded] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Center and normalize scale once when model loads
  useEffect(() => {
    if (scene) {
      // Force matrix update
      scene.updateMatrixWorld(true);
      const box = new THREE.Box3().setFromObject(scene);
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
          if (nameLower.includes("object_6") || nameLower.includes("object_2")) {
            score *= 5.0; // boost known standard mesh nodes
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
      }
    }
  }, [scene, shirtColor]);

  // Auto-project decals on the surface of the body mesh when scene or layers change
  useEffect(() => {
    if (meshLoaded && bodyMeshRef.current && onUpdateLayers && layers.length > 0) {
      const mesh = bodyMeshRef.current;
      mesh.updateMatrixWorld(true);
      
      mesh.geometry.computeBoundingBox();
      const localBox = mesh.geometry.boundingBox;
      const localCenter = new THREE.Vector3();
      localBox.getCenter(localCenter);

      let changed = false;
      const nextLayers = layers.map((layer) => {
        if (layer.locked) return layer;
        if (layer.projectedForModel === modelPath) return layer;

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
          
          const normalMatrix = new THREE.Matrix3().getNormalMatrix(mesh.matrixWorld).invert();
          const localNormal = hit.normal.clone().applyMatrix3(normalMatrix).normalize();
          
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
            projectedForModel: modelPath
          };
        } else {
          // Even if raycast fails, mark it as projected to prevent infinite retries
          changed = true;
          return {
            ...layer,
            projectedForModel: modelPath
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
    const mesh = bodyMeshRef.current;
    if (!mesh || !e.point || !e.normal || !selectedLayerId || activeLayer?.locked) return;

    // 1. Calculate local coordinates on the targeted body mesh
    const localPoint = mesh.worldToLocal(e.point.clone());

    // 2. Calculate local normal vector
    const normalMatrix = new THREE.Matrix3().getNormalMatrix(mesh.matrixWorld).invert();
    const localNormal = e.normal.clone().applyMatrix3(normalMatrix).normalize();

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
            projectedForModel: modelPath
          };
        }
        return l;
      })
    );
  };

  const handlePointerDown = (e) => {
    e.stopPropagation();
    if (selectedLayerId && !activeLayer?.locked) {
      setIsDragging(true);
      e.target.setPointerCapture(e.pointerId);
      updateDecalFromRaycast(e);
    }
  };

  const handlePointerMove = (e) => {
    e.stopPropagation();
    if (isDragging) {
      updateDecalFromRaycast(e);
    }
  };

  const handlePointerUp = (e) => {
    e.stopPropagation();
    if (isDragging) {
      setIsDragging(false);
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

      {/* Render decals inside the bodyMeshRef portal so they inherit local transforms */}
      {meshLoaded && bodyMeshRef.current && createPortal(
        <>
          {layers.map((layer) => (
            <DecalItem
              key={layer.id}
              layer={layer}
              isSelected={selectedLayerId === layer.id}
              targetMesh={bodyMeshRef}
            />
          ))}
        </>,
        bodyMeshRef.current
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