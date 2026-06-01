import type { SimState, SimUnit } from '../sim/types';
import type { Grid } from '../game/Grid';
import { getUnit } from '../data/units';
import { drawUnitToken } from './visuals';
import { timeRemaining } from '../sim/Simulation';

const OWNER_BORDER: [string, string] = ['#5bc0ff', '#ff6b6b'];
const OWNER_ZONE_FILL: [string, string] = ['rgba(50,110,200,0.06)', 'rgba(200,60,60,0.06)'];

export class BattleRenderer {
  private ctx: CanvasRenderingContext2D;
  private cell = 0;
  private ox = 0;
  private oy = 0;

  constructor(private canvas: HTMLCanvasElement, private grid: Grid) {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('2D ctx 없음');
    this.ctx = ctx;
  }

  resize(): void {
    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();
    const w = rect.width, h = rect.height;
    if (w <= 0 || h <= 0) return;
    const nw = Math.max(1, Math.round(w * dpr));
    const nh = Math.max(1, Math.round(h * dpr));
    if (this.canvas.width !== nw || this.canvas.height !== nh) {
      this.canvas.width = nw; this.canvas.height = nh;
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    const cw = w / this.grid.cols, ch = h / this.grid.rows;
    this.cell = Math.floor(Math.min(cw, ch));
    this.ox = Math.floor((w - this.cell * this.grid.cols) / 2);
    this.oy = Math.floor((h - this.cell * this.grid.rows) / 2);
  }

  private ensureLayout(): void {
    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();
    if (rect.width <= 0) return;
    const expected = Math.max(1, Math.round(rect.width * dpr));
    if (this.canvas.width !== expected || this.cell <= 0) this.resize();
  }

  draw(state: SimState): void {
    this.ensureLayout();
    const { ctx, grid, cell, ox, oy } = this;
    const rect = this.canvas.getBoundingClientRect();
    const w = rect.width, h = rect.height;
    ctx.clearRect(0, 0, w, h);

    this.drawGrid(w, h);
    this.drawZones(w);
    state.units.filter((u) => u.hp > 0).forEach((u) => this.drawUnit(u, cell));
    this.drawHud(state, w);
  }

  private drawGrid(w: number, h: number): void {
    const { ctx, grid, cell, ox, oy } = this;
    ctx.fillStyle = '#0d1217';
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = '#1e2d38';
    ctx.lineWidth = 0.5;
    for (let r = 0; r <= grid.rows; r++) {
      ctx.beginPath();
      ctx.moveTo(ox, oy + r * cell);
      ctx.lineTo(ox + grid.cols * cell, oy + r * cell);
      ctx.stroke();
    }
    for (let c = 0; c <= grid.cols; c++) {
      ctx.beginPath();
      ctx.moveTo(ox + c * cell, oy);
      ctx.lineTo(ox + c * cell, oy + grid.rows * cell);
      ctx.stroke();
    }

    // 진영 경계선
    const midY = oy + (grid.rows - grid.playerRows) * cell;
    ctx.strokeStyle = '#445566';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.moveTo(ox, midY);
    ctx.lineTo(ox + grid.cols * cell, midY);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  private drawZones(w: number): void {
    const { ctx, grid, cell, ox, oy } = this;
    // AI zone (top)
    const aiRows = grid.rows - grid.playerRows;
    ctx.fillStyle = OWNER_ZONE_FILL[1];
    ctx.fillRect(ox, oy, grid.cols * cell, aiRows * cell);
    // Player zone (bottom)
    ctx.fillStyle = OWNER_ZONE_FILL[0];
    ctx.fillRect(ox, oy + aiRows * cell, grid.cols * cell, grid.playerRows * cell);
  }

  private drawUnit(unit: SimUnit, cell: number): void {
    const { ctx, ox, oy } = this;
    const def = getUnit(unit.defId);
    const cx = ox + unit.x * cell;
    const cy = oy + unit.y * cell;
    const r = Math.min(cell * def.radius, cell * 0.44);

    const hasFrenzy = unit.statusEffects.some((se) => se.type === 'frenzy');
    const hasPackBuff = unit.statusEffects.some((se) => se.tag === 'packLeader');

    ctx.save();
    // 광란: 빨간 외곽 링
    if (hasFrenzy) {
      ctx.strokeStyle = '#ff3366';
      ctx.lineWidth = 2;
      ctx.shadowColor = '#ff3366';
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(cx, cy, r + 3, 0, Math.PI * 2);
      ctx.stroke();
      ctx.shadowBlur = 0;
    }
    // 팩 리더 버프: 금색 외곽 링
    if (hasPackBuff) {
      ctx.strokeStyle = '#ffd700';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([3, 2]);
      ctx.beginPath();
      ctx.arc(cx, cy, r + (hasFrenzy ? 6 : 3), 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // 소유자 오라 (글로우)
    ctx.shadowColor = OWNER_BORDER[unit.owner];
    ctx.shadowBlur = 4;
    drawUnitToken(ctx, def, cx, cy, r, unit.owner);
    ctx.shadowBlur = 0;
    ctx.restore();

    // 상태이상 아이콘 (유닛 위)
    if (hasFrenzy || hasPackBuff) {
      ctx.font = `${Math.max(8, Math.floor(r * 0.9))}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      const icons = [hasFrenzy ? '😵' : '', hasPackBuff ? '👑' : ''].filter(Boolean).join('');
      ctx.fillText(icons, cx, cy - r - 3);
    }

    // HP 바
    this.drawHpBar(cx, cy, r, unit);
  }

  private drawHpBar(cx: number, cy: number, r: number, unit: SimUnit): void {
    const { ctx } = this;
    const ratio = unit.hp / unit.maxHp;
    const bw = r * 2.2;
    const bh = Math.max(2, r * 0.22);
    const bx = cx - bw / 2;
    const by = cy - r - bh - 2;

    ctx.fillStyle = '#1a2530';
    ctx.fillRect(bx, by, bw, bh);

    const color = ratio > 0.5 ? '#4cba6a' : ratio > 0.25 ? '#e0b32a' : '#d94444';
    ctx.fillStyle = color;
    ctx.fillRect(bx, by, bw * ratio, bh);
  }

  private drawHud(state: SimState, w: number): void {
    const { ctx, grid, cell, ox, oy } = this;

    // 페이즈 + 타이머 (그리드 위)
    const isOvertime = state.phase === 'overtime';
    const isDone = state.phase === 'done';
    const phaseLabel = isDone ? '전투 종료' : isOvertime ? '⚡ 연장전' : '전투';
    const timeColor = isDone ? '#aaa' : isOvertime ? '#ff9c44' : '#cde';
    const time = timeRemaining(state).toFixed(1);

    ctx.save();
    ctx.font = `bold ${Math.floor(cell * 0.52)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillStyle = timeColor;
    ctx.fillText(`${phaseLabel}  ${isDone ? '' : time + 's'}`, ox + (grid.cols * cell) / 2, oy - 4);

    // 생존 유닛 수
    const alive0 = state.units.filter((u) => u.owner === 0 && u.hp > 0).length;
    const alive1 = state.units.filter((u) => u.owner === 1 && u.hp > 0).length;
    ctx.font = `${Math.floor(cell * 0.38)}px sans-serif`;
    ctx.textAlign = 'left';
    ctx.fillStyle = OWNER_BORDER[0];
    ctx.fillText(`▲ 나 ${alive0}`, ox + 2, oy - 4);
    ctx.textAlign = 'right';
    ctx.fillStyle = OWNER_BORDER[1];
    ctx.fillText(`AI ${alive1} ▼`, ox + grid.cols * cell - 2, oy - 4);
    ctx.restore();
  }
}
