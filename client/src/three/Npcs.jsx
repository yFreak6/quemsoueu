import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { BAR_FROM, BAR_TO } from './layout.js';
import { createNpcs, stepNpc } from './npcSim.js';

const damp = THREE.MathUtils.damp;
const SKIN = '#f6f6f3';

/** Boneco em pé (NPC). Torso colorido para não ser confundido com os jogadores. */
function Npc({ n, all }) {
  const root = useRef();
  const head = useRef();
  const body = useRef();
  const armR = useRef();
  const armL = useRef();
  const legR = useRef();
  const legL = useRef();
  const shirt = useMemo(() => new THREE.MeshStandardMaterial({ color: n.shirt, roughness: 0.7 }), [n.shirt]);
  const skin = useMemo(() => new THREE.MeshStandardMaterial({ color: SKIN, roughness: 0.55 }), []);

  useFrame(({ clock }, dtRaw) => {
    const dt = Math.min(dtRaw, 0.05);
    const t = clock.elapsedTime;
    stepNpc(n, all, dt, t);
    const p = n.pose;
    if (!root.current) return;
    root.current.position.set(n.x, 0, n.z);
    root.current.rotation.y = n.yaw;
    const swing = p.moving ? Math.sin(n.phase) * 0.55 : 0;
    legR.current.rotation.x = damp(legR.current.rotation.x, swing, 12, dt);
    legL.current.rotation.x = damp(legL.current.rotation.x, -swing, 12, dt);
    armR.current.rotation.x = damp(armR.current.rotation.x, p.armR !== 0 ? p.armR : p.moving ? -swing * 0.8 : Math.sin(t * 1.5 + n.id) * 0.03, 10, dt);
    armL.current.rotation.x = damp(armL.current.rotation.x, p.armL !== 0 ? p.armL : p.moving ? swing * 0.8 : 0, 10, dt);
    body.current.position.y = p.moving ? Math.abs(Math.sin(n.phase)) * 0.025 : Math.sin(t * 1.6 + n.id) * 0.006;
    head.current.rotation.y = damp(head.current.rotation.y, p.headY, 5, dt);
    head.current.rotation.x = damp(head.current.rotation.x, p.headX, 5, dt);
  });

  return (
    <group ref={root}>
      <group ref={body}>
        {/* pernas (pivô no quadril) */}
        {[[-0.1, legR], [0.1, legL]].map(([x, ref]) => (
          <group key={x} ref={ref} position={[x, 0.62, 0]}>
            <mesh position={[0, -0.3, 0]} castShadow material={n.kind === 'bartender' ? shirt : skin}>
              <capsuleGeometry args={[0.075, 0.46, 4, 10]} />
            </mesh>
          </group>
        ))}
        <mesh position={[0, 0.92, 0]} castShadow material={shirt}>
          <capsuleGeometry args={[0.18, 0.36, 6, 14]} />
        </mesh>
        {n.kind === 'bartender' && (
          <mesh position={[0, 0.7, 0.17]}>
            <boxGeometry args={[0.3, 0.42, 0.02]} />
            <meshStandardMaterial color="#f4f1ea" />
          </mesh>
        )}
        {/* braços (pivô no ombro); o direito segura um copo */}
        <group ref={armR} position={[0.24, 1.12, 0]}>
          <mesh position={[0, -0.24, 0]} castShadow material={skin}>
            <capsuleGeometry args={[0.055, 0.34, 4, 8]} />
          </mesh>
          <mesh position={[0, -0.5, 0.04]}>
            <cylinderGeometry args={[0.04, 0.032, 0.1, 10]} />
            <meshStandardMaterial color="#e0a526" roughness={0.3} />
          </mesh>
        </group>
        <group ref={armL} position={[-0.24, 1.12, 0]}>
          <mesh position={[0, -0.24, 0]} castShadow material={skin}>
            <capsuleGeometry args={[0.055, 0.34, 4, 8]} />
          </mesh>
        </group>
        <group ref={head} position={[0, 1.3, 0]}>
          <mesh position={[0, 0.12, 0]} castShadow material={skin}>
            <sphereGeometry args={[0.15, 24, 18]} />
          </mesh>
          {n.kind === 'bartender' && (
            <mesh position={[0, 0.25, 0]}>
              <cylinderGeometry args={[0.12, 0.13, 0.08, 16]} />
              <meshStandardMaterial color="#222" />
            </mesh>
          )}
        </group>
      </group>
    </group>
  );
}

export default function Npcs({ seatR, roomR }) {
  const sim = useMemo(() => createNpcs({ seatR, roomR, barFrom: BAR_FROM, barTo: BAR_TO }), [seatR, roomR]);
  return sim.map((n) => <Npc key={n.id} n={n} all={sim} />);
}
