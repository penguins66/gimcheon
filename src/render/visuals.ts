import type { UnitDef } from '../sim/types';

// 유닛 토큰 그리기 (임시 비주얼: 도형 + 이모지 + 진영 테두리).
// 추후 def.visual.sprite 가 있으면 이미지로 교체.
export function drawUnitToken(
  ctx: CanvasRenderingContext2D,
  def: UnitDef,
  cx: number,
  cy: number,
  r: number,
  owner: 0 | 1,
): void {
  ctx.save();
  ctx.beginPath();
  ctx.fillStyle = def.visual.color;
  ctx.strokeStyle = owner === 0 ? '#cfe8ff' : '#ffd0d0';
  ctx.lineWidth = Math.max(1.5, r * 0.14);

  switch (def.visual.shape) {
    case 'square':
      ctx.rect(cx - r, cy - r, r * 2, r * 2);
      break;
    case 'triangle':
      ctx.moveTo(cx, cy - r);
      ctx.lineTo(cx + r, cy + r * 0.85);
      ctx.lineTo(cx - r, cy + r * 0.85);
      ctx.closePath();
      break;
    default:
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
  }
  ctx.fill();
  ctx.stroke();

  if (def.visual.emoji) {
    ctx.font = `${Math.floor(r * 1.15)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(def.visual.emoji, cx, cy + r * 0.06);
  }

  // 레이어 마커 (공중=파랑, 땅속=갈색)
  if (def.layer === 'air' || def.layer === 'underground') {
    ctx.beginPath();
    ctx.fillStyle = def.layer === 'air' ? '#9bd1ff' : '#b08968';
    ctx.arc(cx + r * 0.72, cy - r * 0.72, Math.max(2, r * 0.26), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}
