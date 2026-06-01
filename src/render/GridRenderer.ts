import { Grid } from '../game/Grid';
import { Board } from '../game/Board';
import { getUnit } from '../data/units';
import { drawUnitToken } from './visuals';

// 그리드 + 배치된 유닛을 Canvas에 그림. 마우스 좌표 ↔ 칸 변환 제공.
export class GridRenderer {
  private ctx: CanvasRenderingContext2D;
  private cell = 0;
  private ox = 0;
  private oy = 0;
  hoverCell: number | null = null;

  constructor(
    private canvas: HTMLCanvasElement,
    private grid: Grid,
    private board: Board,
  ) {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('2D 컨텍스트를 가져올 수 없습니다.');
    this.ctx = ctx;
  }

  // CSS 크기를 기반으로 layout 값(cell/ox/oy) + canvas 물리 크기를 갱신.
  // draw()와 pixelToCell()에서 canvas가 stale 상태면 자동 호출됨.
  resize(): void {
    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();
    const w = rect.width, h = rect.height;
    if (w <= 0 || h <= 0) return; // 아직 레이아웃 미완성 — 스킵

    const newW = Math.max(1, Math.round(w * dpr));
    const newH = Math.max(1, Math.round(h * dpr));
    if (this.canvas.width !== newW || this.canvas.height !== newH) {
      this.canvas.width  = newW;
      this.canvas.height = newH;
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    this.cell = Math.floor(Math.min(w / this.grid.cols, h / this.grid.rows));
    this.ox   = Math.floor((w - this.cell * this.grid.cols) / 2);
    this.oy   = Math.floor((h - this.cell * this.grid.rows) / 2);
  }

  // canvas 크기가 CSS와 다를 경우 자동 resize — stale layout 방어
  private ensureLayout(): void {
    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();
    if (rect.width <= 0) return;
    const expected = Math.max(1, Math.round(rect.width * dpr));
    if (this.canvas.width !== expected || this.cell <= 0) this.resize();
  }

  pixelToCell(px: number, py: number): number | null {
    this.ensureLayout();
    if (this.cell <= 0) return null;
    const col = Math.floor((px - this.ox) / this.cell);
    const row = Math.floor((py - this.oy) / this.cell);
    if (!this.grid.inBounds(col, row)) return null;
    return this.grid.cellId(col, row);
  }

  draw(): void {
    this.ensureLayout();
    const { ctx, grid, cell, ox, oy } = this;
    if (cell <= 0) return;

    const rect = this.canvas.getBoundingClientRect();
    const w = rect.width, h = rect.height;
    ctx.clearRect(0, 0, w, h);

    for (let row = 0; row < grid.rows; row++) {
      for (let col = 0; col < grid.cols; col++) {
        const x = ox + col * cell;
        const y = oy + row * cell;
        ctx.fillStyle = grid.isPlayerZone(row) ? '#15242e' : '#251722';
        ctx.fillRect(x, y, cell, cell);
        ctx.strokeStyle = '#2b3b46';
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 0.5, y + 0.5, cell, cell);
      }
    }

    const midY = oy + (grid.rows - grid.playerRows) * cell;
    ctx.strokeStyle = '#577794';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(ox, midY);
    ctx.lineTo(ox + grid.cols * cell, midY);
    ctx.stroke();

    if (this.hoverCell !== null) {
      const { col, row } = grid.coord(this.hoverCell);
      const x = ox + col * cell;
      const y = oy + row * cell;
      const ok = this.board.canPlaceAt(this.hoverCell);
      ctx.fillStyle = ok ? 'rgba(120,220,140,0.20)' : 'rgba(220,90,90,0.18)';
      ctx.fillRect(x, y, cell, cell);
      ctx.strokeStyle = ok ? '#79dc8c' : '#dc5a5a';
      ctx.lineWidth = 2;
      ctx.strokeRect(x + 1, y + 1, cell - 2, cell - 2);
    }

    for (const { cellId, units } of this.board.allPlacements()) {
      const { col, row } = grid.coord(cellId);
      const cx0 = ox + col * cell + cell / 2;
      const cy0 = oy + row * cell + cell / 2;
      const n = units.length;

      units.forEach((pu, i) => {
        const def = getUnit(pu.defId);
        let dx = 0, dy = 0;
        if (n > 1) {
          const spread = cell * 0.2;
          const ang = (i / n) * Math.PI * 2 - Math.PI / 2;
          dx = Math.cos(ang) * spread;
          dy = Math.sin(ang) * spread;
        }
        const baseR = Math.min(cell * def.radius, cell * 0.42);
        const r = n > 1 ? baseR * 0.78 : baseR;
        drawUnitToken(ctx, def, cx0 + dx, cy0 + dy, r, 0);
      });

      if (n > 1) {
        const bx = cx0 + cell * 0.32, by = cy0 - cell * 0.32;
        ctx.beginPath();
        ctx.fillStyle = 'rgba(8,12,16,0.85)';
        ctx.arc(bx, by, cell * 0.15, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.font = `bold ${Math.floor(cell * 0.19)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(n), bx, by);
      }
    }
  }
}
