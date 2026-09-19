import * as THREE from 'three';

// Mesh inside scene
const scene = new THREE.Group();
const S = 1.8;
scene.scale.set(S, S, S);
const mesh = new THREE.Mesh();
scene.add(mesh);

scene.updateMatrixWorld(true);

const meshWorldScale = new THREE.Vector3();
mesh.getWorldScale(meshWorldScale);
console.log("meshWorldScale:", meshWorldScale);

const groupScale = [0.3, 0.3, 0.25];
const decalScaleVec = new THREE.Vector3(
  groupScale[0] / meshWorldScale.x,
  groupScale[1] / meshWorldScale.y,
  groupScale[2] / meshWorldScale.z
);
console.log("decalScaleVec (in mesh local space):", decalScaleVec);

// In scene local space, mesh has scale (1, 1, 1) relative to scene.
// So in scene local space, the decal dimensions are decalScaleVec:
console.log("Decal dimensions in scene space:", decalScaleVec.x, decalScaleVec.y);
console.log("Helper dimensions currently in scene space:", groupScale[0], groupScale[1]);
console.log("Ratio:", groupScale[0] / decalScaleVec.x, "(Helper is", (groupScale[0] / decalScaleVec.x).toFixed(2), "times bigger than decal!)");
