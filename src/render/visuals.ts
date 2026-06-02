import type { UnitDef } from '../sim/types';
import { getSpriteTemplate, lighten, darken } from './sprites';
import { getUnitSprite } from './spriteLoader';

// ── 유닛 토큰 렌더링 ──────────────────────────────────────────────────────
// 1순위: public/sprites/{id}.png 존재 → drawImage (픽셀 퍼펙트)
// 2순위: 프로그래매틱 16×16 픽셀 스프라이트 폴백
export function drawUnitToken(
  ctx: CanvasRenderingContext2D,
  def: UnitDef,
  cx: number,
  cy: number,
  r: number,
  owner: 0 | 1,
): void {
  const startX = Math.round(cx - r);
  const startY = Math.round(cy - r);
  const size   = Math.round(r * 2);

  const ownerColor = owner === 0 ? '#5bc0ff' : '#ff6b6b';

  ctx.save();
  ctx.imageSmoothingEnabled = false;

  // 소유자 배경 글로우
  ctx.fillStyle = ownerColor + '22';
  ctx.fillRect(startX - 2, startY - 2, size + 4, size + 4);

  // ── 스프라이트 그리기 ──────────────────────────────────────────────
  const extSprite = getUnitSprite(def.id);
  if (extSprite) {
    // 외부 PNG 사용
    ctx.drawImage(extSprite, startX, startY, size, size);
  } else {
    // 프로그래매틱 픽셀 폴백
    drawPixelFallback(ctx, def, startX, startY, size);
  }

  // 소유자 아웃라인
  ctx.strokeStyle = ownerColor;
  ctx.lineWidth   = Math.max(1, Math.round(r * 0.08));
  ctx.strokeRect(startX + 0.5, startY + 0.5, size - 1, size - 1);

  // 공중 레이어 마커
  if (def.layer === 'air') {
    ctx.fillStyle = '#9bd1ff';
    ctx.beginPath();
    ctx.arc(
      Math.round(cx + r * 0.72),
      Math.round(cy - r * 0.72),
      Math.max(2, Math.round(r * 0.26)),
      0, Math.PI * 2,
    );
    ctx.fill();
  }

  ctx.restore();
}

// ── 프로그래매틱 픽셀 폴백 ───────────────────────────────────────────────
function drawPixelFallback(
  ctx: CanvasRenderingContext2D,
  def: UnitDef,
  startX: number,
  startY: number,
  totalSize: number,
): void {
  const template = getSpriteTemplate(def.id, def.role);
  const rows = template.length;
  const cols = template[0].length;

  const base = def.visual.color;
  const palette: Record<string, string> = {
    K: '#111111',
    B: base,
    b: darken(base, 0.35),
    H: lighten(base, 0.40),
    h: lighten(base, 0.65),
    e: '#080808',
  };

  for (let ri = 0; ri < rows; ri++) {
    const py = startY + Math.floor(ri * totalSize / rows);
    const ph = startY + Math.floor((ri + 1) * totalSize / rows) - py;
    for (let ci = 0; ci < cols; ci++) {
      const ch = template[ri][ci];
      if (ch === '.') continue;
      const color = palette[ch];
      if (!color) continue;
      const px = startX + Math.floor(ci * totalSize / cols);
      const pw = startX + Math.floor((ci + 1) * totalSize / cols) - px;
      ctx.fillStyle = color;
      ctx.fillRect(px, py, pw, ph);
    }
  }
}
