import React from "react";
import { Environment, Lightformer } from "@react-three/drei";

/**
 * Pure procedural studio environment for R3F.
 * Replaces remote HDRI network downloads (which cause HTTP 429 rate limit errors).
 */
export default function StudioEnvironment() {
  return (
    <Environment resolution={256}>
      <group rotation={[-Math.PI / 4, 0, 0]}>
        {/* Overhead Key Soft Light */}
        <Lightformer
          form="rect"
          intensity={3.2}
          color="#ffffff"
          position={[0, 6, -5]}
          scale={[12, 12, 1]}
          rotation-x={Math.PI / 2}
        />
        {/* Soft Left Fill Light */}
        <Lightformer
          form="rect"
          intensity={1.8}
          color="#e0e7ff"
          position={[-6, 2, 2]}
          scale={[10, 10, 1]}
          rotation-y={Math.PI / 2}
        />
        {/* Soft Right Fill Light */}
        <Lightformer
          form="rect"
          intensity={1.8}
          color="#f8fafc"
          position={[6, 2, 2]}
          scale={[10, 10, 1]}
          rotation-y={-Math.PI / 2}
        />
        {/* Subtle Back Rim Light */}
        <Lightformer
          form="ring"
          intensity={1.2}
          color="#ffffff"
          position={[0, 4, 6]}
          scale={[10, 10, 1]}
        />
      </group>
    </Environment>
  );
}
