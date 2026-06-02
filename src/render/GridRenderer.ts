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

  /** 현재 활성 플레이어의 보드 (배치 가능 구역, 호버 체크에 사용) */
  board: Board;
  /** 상대 플레이어의 보드 (읽기 전용으로 렌더링만 함, null=1P모드) */
  secondaryBoard: Board | null = null;

  constructor(
    private canvas: HTMLCanvasElement,
    private grid: Grid,
    board: Board,
  ) {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('2D 컨텍스트를 가져올 수 없습니다.');
    this.ctx = ctx;
    this.board = board;
  }

  resize(): void {
    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();
    const w = rect.width, h = rect.height;
    if (w <= 0 || h <= 0) return;

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

    // ── 셀 배경 ─────────────────────────────────────────────────────────
    for (let row = 0; row < grid.rows; row++) {
      for (let col = 0; col < grid.cols; col++) {
        const x = ox + col * cell;
        const y = oy + row * cell;

        // 활성 보드의 배치 구역은 더 밝게
        const inActiveZone = this.board.isInZone(row);
        const inSecondZone = this.secondaryBoard ? this.secondaryBoard.isInZone(row) : false;

        if (inActiveZone)       ctx.fillStyle = '#15242e';
        else if (inSecondZone)  ctx.fillStyle = '#2a1520'; // 상대 진영 (약간 붉게)
        else                    ctx.fillStyle = '#1a1a28';

        ctx.fillRect(x, y, cell, cell);
        ctx.strokeStyle = '#2b3b46';
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 0.5, y + 0.5, cell, cell);
      }
    }

    // ── 중앙선 ───────────────────────────────────────────────────────────
    const midY = oy + (grid.rows - grid.playerRows) * cell;
    ctx.strokeStyle = '#577794';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(ox, midY);
    ctx.lineTo(ox + grid.cols * cell, midY);
    ctx.stroke();

    // ── 호버 강조 ────────────────────────────────────────────────────────
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

    // ── 유닛 렌더링 (활성 보드 + 보조 보드) ──────────────────────────────
    const allBoards: Array<{ b: Board; owner: 0 | 1 }> = [
      { b: this.board, owner: this.board.placerOwner },
    ];
    if (this.secondaryBoard) {
      allBoards.push({ b: this.secondaryBoard, owner: this.secondaryBoard.placerOwner });
    }

    for (const { b, owner } of allBoards) {
      for (const { cellId, units } of b.allPlacements()) {
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
          drawUnitToken(ctx, def, cx0 + dx, cy0 + dy, r, owner);
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
}
