// Símbolo "Corrente" refinado: três anéis que crescem (o assunto ganhando força)
// e se entrelaçam de verdade, passando por cima e por baixo como elos.

type Ring = { cx: number; cy: number; r: number; color: string };

const STROKE = 4.6;

// Anéis alinhados pela base, do menor para o maior
const GEOMETRY = [
  { cx: 9.8, cy: 29, r: 7.5 },
  { cx: 23.5, cy: 25.5, r: 11 },
  { cx: 41.5, cy: 21.5, r: 15 },
];

function intersections(a: Ring, b: Ring): [number, number][] {
  const dx = b.cx - a.cx;
  const dy = b.cy - a.cy;
  const d = Math.hypot(dx, dy);
  const l = (a.r * a.r - b.r * b.r + d * d) / (2 * d);
  const h = Math.sqrt(Math.max(a.r * a.r - l * l, 0));
  const mx = a.cx + (l * dx) / d;
  const my = a.cy + (l * dy) / d;
  return [
    [mx + (h * dy) / d, my - (h * dx) / d],
    [mx - (h * dy) / d, my + (h * dx) / d],
  ];
}

/** pequeno arco do anel `ring` em volta do ponto (px, py) */
function arcAround(ring: Ring, px: number, py: number, spread = 0.42) {
  const ang = Math.atan2(py - ring.cy, px - ring.cx);
  const a1 = ang - spread;
  const a2 = ang + spread;
  const x1 = ring.cx + ring.r * Math.cos(a1);
  const y1 = ring.cy + ring.r * Math.sin(a1);
  const x2 = ring.cx + ring.r * Math.cos(a2);
  const y2 = ring.cy + ring.r * Math.sin(a2);
  return `M${x1.toFixed(2)} ${y1.toFixed(2)} A${ring.r} ${ring.r} 0 0 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`;
}

export function CorrenteRings({
  colors,
  gap,
}: {
  /** cor de cada anel, do menor para o maior */
  colors: [string, string, string];
  /** cor do fundo, usada no respiro do entrelaçado */
  gap: string;
}) {
  const rings: Ring[] = GEOMETRY.map((g, i) => ({ ...g, color: colors[i] }));
  const overs: { ring: Ring; at: [number, number] }[] = [];
  for (let i = 0; i < rings.length - 1; i++) {
    const [top, bottom] = intersections(rings[i], rings[i + 1]);
    // em cima: o anel da esquerda passa por cima; embaixo: o da direita
    overs.push({ ring: rings[i], at: top[1] < bottom[1] ? top : bottom });
    overs.push({ ring: rings[i + 1], at: top[1] < bottom[1] ? bottom : top });
  }
  return (
    <g fill="none" strokeLinecap="butt">
      {rings.map((r, i) => (
        <circle key={i} cx={r.cx} cy={r.cy} r={r.r} stroke={r.color} strokeWidth={STROKE} />
      ))}
      {overs.map((o, i) => (
        <g key={i}>
          <path d={arcAround(o.ring, o.at[0], o.at[1])} stroke={gap} strokeWidth={STROKE + 2.6} />
          <path d={arcAround(o.ring, o.at[0], o.at[1], 0.5)} stroke={o.ring.color} strokeWidth={STROKE} />
        </g>
      ))}
    </g>
  );
}

/** Versão para tamanhos pequenos (aba do navegador): três pontos que crescem */
export function CorrenteDots({ colors, gap }: { colors: [string, string, string]; gap: string }) {
  return (
    <g stroke={gap} strokeWidth="2.4">
      <circle cx="9" cy="29" r="8.5" fill={colors[0]} />
      <circle cx="24" cy="25" r="12" fill={colors[1]} />
      <circle cx="42" cy="21" r="16" fill={colors[2]} />
    </g>
  );
}

export const CORRENTE_VIEWBOX = "0 2 60 38";
