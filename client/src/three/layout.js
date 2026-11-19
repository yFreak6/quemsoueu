// Geometria da mesa. Os assentos crescem com o número de jogadores.
// Assento i fica no ângulo 2π·i/n. O jogador do assento seguinte (i+1) está
// sempre à DIREITA de quem está sentado, então "passar para a direita" = seat + 1.

export const EYE_HEIGHT = 1.42;
export const TABLE_TOP = 0.8; // altura da superfície da mesa

export function tableLayout(n) {
  const seatR = Math.max(2.3, 0.33 * n + 0.4);
  return { seatR, tableR: seatR - 0.45, roomR: seatR + 7, wallH: 4.6 };
}

export const seatAngle = (seat, n) => (seat / n) * Math.PI * 2;

export function seatPosition(seat, n, seatR) {
  const a = seatAngle(seat, n);
  return [Math.sin(a) * seatR, 0, Math.cos(a) * seatR];
}

// Trecho da parede (em radianos) ocupado pelo balcão do bar
export const BAR_FROM = 0.9;
export const BAR_TO = 2.5;
