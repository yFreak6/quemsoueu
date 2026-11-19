import { Canvas } from '@react-three/fiber';
import CameraRig from './CameraRig.jsx';
import Doll from './Doll.jsx';
import Environment from './Environment.jsx';
import Npcs from './Npcs.jsx';
import { tableLayout } from './layout.js';

/**
 * Cena 3D. Todos (inclusive o host) veem da cadeira do próprio jogador.
 * O boneco do assento de onde se olha NÃO é desenhado: é a "sua" cabeça.
 * A regra de visibilidade é garantida pelo servidor: o próprio papel nem chega aqui.
 */
export default function Scene({ state, reactions }) {
  const { players, turn, you, result } = state;
  const n = players.length;
  const layout = tableLayout(n);
  const { seatR, tableR } = layout;

  const me = players.find((p) => p.id === you.id);
  const camSeat = me?.seat ?? 0;
  const turnSeat = players.find((p) => p.id === turn?.playerId)?.seat ?? null;

  return (
    <Canvas shadows dpr={[1, 1.75]} camera={{ fov: 62, near: 0.1, far: 60, position: [0, 1.42, seatR] }}>
      <color attach="background" args={['#1d1210']} />
      <fog attach="fog" args={['#1d1210', layout.roomR * 0.8, layout.roomR * 1.6]} />

      {/* luz de bar: ambiente quente e baixo + luz principal para sombras suaves + lâmpada sobre a mesa + neon */}
      <ambientLight intensity={0.38} color="#ffd9a8" />
      <hemisphereLight args={['#ffe2b8', '#5a3a22', 0.55]} />
      <directionalLight position={[4, 8, 3]} intensity={0.35} color="#ffd9a0" />

      <Environment players={players} n={n} seatR={seatR} tableR={tableR} roomR={layout.roomR} wallH={layout.wallH} />

      <Npcs seatR={seatR} roomR={layout.roomR} />

      {players.map((p) =>
        p.seat === camSeat ? null : (
          <Doll
            key={p.id}
            player={p}
            n={n}
            seatR={seatR}
            isTurn={turn?.playerId === p.id}
            reaction={reactions[p.id]}
            isWinner={result?.winnerId === p.id}
          />
        ),
      )}

      <CameraRig seat={camSeat} n={n} seatR={seatR} turnSeat={turnSeat} shakeAt={reactions[you.id]?.at} />
    </Canvas>
  );
}
