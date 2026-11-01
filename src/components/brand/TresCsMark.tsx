// Símbolo "3 Cs": três letras C, uma dentro da outra, do maior para o menor.
// Os Cs encostam do lado esquerdo e se abrem para a direita, como som saindo de uma boca.
// Não são concêntricos nem têm quatro arcos finos, para não lembrar o símbolo de pagamento por aproximação.

const SW = 3.8;

type C = { cx: number; r: number; open: number };

// open = metade da abertura do C, em graus
const CS: C[] = [
  { cx: 18, r: 16.5, open: 42 },
  { cx: 19.8, r: 10.2, open: 50 },
  { cx: 21.6, r: 4.2, open: 72 },
];

// Cada C é um círculo com um recorte à direita (traço tracejado), que fica liso em qualquer tamanho
function cProps({ cx, r, open }: C, cy = 20) {
  const len = 2 * Math.PI * r;
  const visible = (len * (360 - 2 * open)) / 360;
  return {
    cx,
    cy,
    r,
    strokeDasharray: `${visible.toFixed(3)} ${len.toFixed(3)}`,
    strokeDashoffset: (-(open / 360) * len).toFixed(3),
  };
}

export function TresCs({ colors, strokeWidth = SW }: { colors: [string, string, string]; strokeWidth?: number }) {
  return (
    <g fill="none" strokeLinecap="round" strokeWidth={strokeWidth}>
      {CS.map((c, i) => (
        <circle key={i} {...cProps(c)} stroke={colors[i]} />
      ))}
    </g>
  );
}

export const TRES_CS_VIEWBOX = "-1 0.5 35 39";
