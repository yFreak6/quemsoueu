// Simulação leve dos NPCs do bar (puramente cosmética, sem relação com o servidor).
// Cada NPC é um objeto mutável; `stepNpc` atualiza a pose a cada quadro.
// Convenção: yaw = atan2(dx, dz); a frente do boneco é (sin yaw, cos yaw).

const rnd = (a, b) => a + Math.random() * (b - a);
const angDiff = (a, b) => Math.atan2(Math.sin(a - b), Math.cos(a - b));
const SHIRTS = ['#c0504d', '#4f81bd', '#e0a526', '#7a4fa0', '#3d9970', '#d9733b'];

export function createNpcs({ seatR, roomR, barFrom, barTo, count = 5 }) {
  const br = roomR - 2.2;
  const ring = { rIn: seatR + 1.3, rOut: br - 1.4 };
  const mid = (barFrom + barTo) / 2;
  const bartenderR = roomR - 1.1;

  const list = [
    {
      id: 0, kind: 'bartender', shirt: '#2b2b2f', state: 'work', until: rnd(2, 4), a: mid, ta: mid, bartenderR,
      x: Math.sin(mid) * bartenderR, z: Math.cos(mid) * bartenderR, yaw: mid + Math.PI,
    },
  ];
  for (let i = 1; i <= count; i++) {
    const a = rnd(0, Math.PI * 2);
    const r = rnd(ring.rIn, ring.rOut);
    list.push({
      id: i, kind: 'guest', shirt: SHIRTS[i % SHIRTS.length], state: 'idle', until: rnd(0.5, 3), partner: null,
      x: Math.sin(a) * r, z: Math.cos(a) * r, yaw: rnd(0, 6.28), tx: 0, tz: 0,
    });
  }
  list.ring = ring;
  list.barFrom = barFrom;
  list.barTo = barTo;
  return list;
}

function clampRing(n, ring) {
  const r = Math.hypot(n.x, n.z) || 1;
  const c = Math.min(ring.rOut, Math.max(ring.rIn, r));
  if (c !== r) {
    n.x *= c / r;
    n.z *= c / r;
  }
}

export function stepNpc(n, all, dt, now) {
  const pose = { moving: false, armR: 0, armL: 0, headY: 0, headX: 0 };

  if (n.kind === 'bartender') {
    const speed = 0.6 / n.bartenderR; // rad/s
    if (n.state === 'walk') {
      const d = angDiff(n.ta, n.a);
      n.a += Math.sign(d) * Math.min(Math.abs(d), speed * dt);
      pose.moving = true;
      if (Math.abs(d) < 0.02) {
        n.state = 'work';
        n.until = now + rnd(3, 6);
      }
    } else {
      // limpa um copo
      pose.armR = -0.95 + Math.sin(now * 6) * 0.22;
      pose.armL = -0.8;
      pose.headX = 0.25;
      if (now > n.until) {
        n.state = 'walk';
        n.ta = all.barFrom + 0.3 + Math.random() * (all.barTo - all.barFrom - 0.6);
      }
    }
    n.x = Math.sin(n.a) * n.bartenderR;
    n.z = Math.cos(n.a) * n.bartenderR;
    n.yaw += angDiff(n.a + Math.PI, n.yaw) * Math.min(1, dt * 5); // de frente para o salão
  } else {
    let faceYaw = null;
    const p = n.partner != null ? all[n.partner] : null;

    if (n.state === 'idle') {
      const s = (now + n.id * 3) % 7; // um gole de vez em quando
      if (s < 1.3) pose.armR = -1.8 * Math.sin((s / 1.3) * Math.PI);
      pose.headY = Math.sin(now * 0.5 + n.id) * 0.4;
      if (now > n.until) {
        const others = all.filter((o) => o.kind === 'guest' && o.id !== n.id && o.state !== 'talk');
        if (others.length && Math.random() < 0.65) {
          n.partner = others[Math.floor(Math.random() * others.length)].id;
          n.state = 'walkTo';
        } else {
          const a = rnd(0, Math.PI * 2);
          const r = rnd(all.ring.rIn, all.ring.rOut);
          n.tx = Math.sin(a) * r;
          n.tz = Math.cos(a) * r;
          n.state = 'walk';
        }
      }
    } else if (n.state === 'walk' || n.state === 'walkTo') {
      let tx = n.tx;
      let tz = n.tz;
      if (n.state === 'walkTo') {
        if (!p || p.state === 'talk') {
          n.state = 'idle';
          n.until = now + 1;
          n.partner = null;
        } else {
          tx = p.x;
          tz = p.z;
        }
      }
      const dx = tx - n.x;
      const dz = tz - n.z;
      const dist = Math.hypot(dx, dz);
      const stop = n.state === 'walkTo' ? 1.0 : 0.15;
      if (dist <= stop) {
        if (n.state === 'walkTo' && p) {
          const until = now + rnd(6, 11);
          n.state = 'talk';
          n.until = until;
          p.state = 'talk';
          p.partner = n.id;
          p.until = until;
        } else {
          n.state = 'idle';
          n.until = now + rnd(2, 4);
        }
      } else {
        const v = 0.9 * dt;
        n.x += (dx / dist) * v;
        n.z += (dz / dist) * v;
        faceYaw = Math.atan2(dx, dz);
        pose.moving = true;
      }
    }

    if (n.state === 'talk') {
      if (!p || now > n.until) {
        n.state = 'idle';
        n.until = now + rnd(1.5, 3);
        n.partner = null;
      } else {
        faceYaw = Math.atan2(p.x - n.x, p.z - n.z);
        const speaking = (Math.floor(now / 3) + n.id) % 2 === 0;
        pose.armR = speaking ? -0.5 + Math.sin(now * 5) * 0.35 : -0.15;
        pose.headX = speaking ? 0 : Math.sin(now * 2.4) * 0.12; // quem escuta acena
        // brinde: os dois levantam o copo ao mesmo tempo
        const ph = (now + Math.min(n.id, p.id) * 1.7) % 5.5;
        if (ph > 4.2 && ph < 5.2) {
          const c = Math.sin((ph - 4.2) * Math.PI);
          pose.armR = pose.armR * (1 - c) + -1.6 * c;
        }
      }
    }

    // não atravessa os outros
    for (const o of all) {
      if (o === n || o.kind !== 'guest') continue;
      const dx = n.x - o.x;
      const dz = n.z - o.z;
      const d = Math.hypot(dx, dz);
      const min = n.partner === o.id ? 0.7 : 0.55;
      if (d > 0.001 && d < min) {
        n.x += (dx / d) * (min - d) * 0.5;
        n.z += (dz / d) * (min - d) * 0.5;
      }
    }
    clampRing(n, all.ring);
    if (faceYaw !== null) n.yaw += angDiff(faceYaw, n.yaw) * Math.min(1, dt * 6);
  }

  if (pose.moving) n.phase = (n.phase ?? 0) + dt * 6;
  n.pose = pose;
}
