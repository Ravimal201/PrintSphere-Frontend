import { useEffect, useState, useRef } from "react";
import * as THREE from "three";
import { useGLTF, Decal } from "@react-three/drei";
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

  return (
    <group>
      {/* 3D Projected Decal on target Mesh */}
      <Decal
        mesh={targetMesh}
        position={layer.position}
        rotation={layer.rotation}
        scale={layer.scale}
      >
        <meshBasicMaterial
          map={texture}
          transparent
          alphaTest={0.01}
          polygonOffset
          polygonOffsetFactor={-10}
          side={THREE.DoubleSide}
        />
      </Decal>

      {/* Blue wireframe bounding helper when selected */}
      {isSelected && (
        <mesh position={layer.position} rotation={layer.rotation}>
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
  shirtColor,
  layers,
  selectedLayerId,
  onSelectLayer,
  onUpdateLayers
}) {
  const { scene } = useGLTF("/images/models/t_shirt.glb");
  const bodyMeshRef = useRef(null);
  const [meshLoaded, setMeshLoaded] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Sync fabric colors and resolve target body mesh
  useEffect(() => {
    if (scene) {
      scene.traverse((child) => {
        if (child.isMesh) {
          // Color mesh
          if (child.material) {
            if (Array.isArray(child.material)) {
              child.material.forEach((mat) => {
                mat.color.set(shirtColor);
                mat.needsUpdate = true;
              });
            } else {
              child.material.color.set(shirtColor);
              child.material.needsUpdate = true;
            }
          }
          // Match main body mesh
          if (child.name.includes("Object_6") || child.name.toLowerCase().includes("body")) {
            bodyMeshRef.current = child;
            setMeshLoaded(true);
          }
        }
      });

      // Fallback: If no node name matches, use the first mesh found as target
      if (!bodyMeshRef.current) {
        scene.traverse((child) => {
          if (child.isMesh && !bodyMeshRef.current) {
            bodyMeshRef.current = child;
            setMeshLoaded(true);
          }
        });
      }
    }
  }, [scene, shirtColor]);

  const activeLayer = layers.find((l) => l.id === selectedLayerId);

  const updateDecalFromRaycast = (e) => {
    const mesh = bodyMeshRef.current;
    if (!mesh || !e.point || !e.normal || !selectedLayerId || activeLayer?.locked) return;

    // 1. Calculate local coordinates on the targeted body mesh
    const localPoint = mesh.worldToLocal(e.point.clone());

    // 2. Calculate local normal vector
    const normalMatrix = new THREE.Matrix3().getNormalMatrix(mesh.matrixWorld);
    const localNormal = e.normal.clone().applyMatrix3(normalMatrix).normalize();

    // 3. Compute lookAt rotation to project along surface normal
    const up = new THREE.Vector3(0, 1, 0);
    const target = localNormal.clone();
    const matrix = new THREE.Matrix4().lookAt(
      new THREE.Vector3(0, 0, 0),
      target,
      up
    );
    const rotation = new THREE.Euler().setFromRotationMatrix(matrix);

    // 4. Update the layer parameters in State
    onUpdateLayers((prev) =>
      prev.map((l) => {
        if (l.id === selectedLayerId) {
          return {
            ...l,
            position: [localPoint.x, localPoint.y, localPoint.z],
            rotation: [rotation.x, rotation.y, l.rotation[2] || 0]
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
      {/* 
        Original GLTF hierarchy primitive. Safe from key changes.
      */}
      <primitive
        object={scene}
        scale={1.8}
        position={[0.02, -1.0, -0.1]}
        rotation={[0.13, 0.5, -0.04]}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      />

      {/* Render decals targeting the bodyMeshRef */}
      {meshLoaded && bodyMeshRef.current && layers.map((layer) => (
        <DecalItem
          key={layer.id}
          layer={layer}
          isSelected={selectedLayerId === layer.id}
          targetMesh={bodyMeshRef}
        />
      ))}
    </group>
  );
}

useGLTF.preload("/images/models/t_shirt.glb");