import { Board } from '../game/Board';

interface HudCallbacks {
  onToggleDev: (value: boolean) => void;
  onClear: () => void;
  onStartBattle: () => void;
  onSellMode: (active: boolean) => void;
}

// 배치 컨트롤 패널 (준비기간에만 표시)
export class Hud {
  readonly el: HTMLElement;
  private countEl: HTMLElement;
  private selEl: HTMLElement;
  private hintEl: HTMLElement;
  private sellBtn: HTMLButtonElement;

  constructor(container: HTMLElement, public board: Board, cb: HudCallbacks) {
    this.el = document.createElement('div');
    this.el.className = 'panel hud';
    const cap = board.race.cellCapacityAfterDevPath ?? 1;
    this.el.innerHTML =
      `<div class="hud-row"><span>출전 인원</span><b id="hud-count">0 / ${board.unitCap()}</b></div>` +
      `<div class="hud-row"><span>선택 유닛</span><b id="hud-sel">없음</b></div>` +
      `<label class="hud-row toggle"><input type="checkbox" id="hud-dev"> 발전 완료 (겹침 최대 ${cap})</label>` +
      `<div class="hud-btn-row">` +
      `<button class="ghost-btn sell-btn" id="hud-sell">💰 판매</button>` +
      `<button class="ghost-btn" id="hud-clear">전체 비우기</button>` +
      `</div>` +
      `<button class="start-battle-btn" id="hud-start">⚔ 전투 시작</button>` +
      `<p class="hint" id="hud-hint"></p>`;
    container.appendChild(this.el);

    this.countEl = this.req('#hud-count');
    this.selEl   = this.req('#hud-sel');
    this.hintEl  = this.req('#hud-hint');
    this.sellBtn = this.req('#hud-sell') as HTMLButtonElement;

    (this.req('#hud-dev') as HTMLInputElement)
      .addEventListener('change', (e) => cb.onToggleDev((e.target as HTMLInputElement).checked));
    this.req('#hud-clear').addEventListener('click', () => cb.onClear());
    this.req('#hud-start').addEventListener('click', () => cb.onStartBattle());
    this.sellBtn.addEventListener('click', () => {
      const active = !this.sellBtn.classList.contains('active');
      cb.onSellMode(active);
    });

    this.refresh();
  }

  private req(sel: string): HTMLElement {
    return this.el.querySelector(sel) as HTMLElement;
  }

  setSelected(name: string): void { this.selEl.textContent = name; }

  setSellMode(active: boolean): void {
    this.sellBtn.classList.toggle('active', active);
    this.updateHint();
  }

  setHatcheryMode(active: boolean): void {
    this.hintEl.textContent = active
      ? '🥚 부화장 모드 — 투입할 유닛을 클릭하세요 (우클릭 = 취소)'
      : '';
    if (!active) this.updateHint();
  }

  private updateHint(): void {
    if (this.sellBtn?.classList.contains('active')) {
      this.hintEl.textContent = '🔴 판매 모드 — 유닛 클릭해서 판매 (코인 환불) · 버튼 다시 클릭해서 취소';
    } else {
      this.hintEl.textContent = `좌클릭=배치 · 우클릭=판매(환불) · 칸당 최대 ${this.board.cellCapacity()}유닛`;
    }
  }

  refresh(): void {
    this.countEl.textContent = `${this.board.totalPlaced()} / ${this.board.unitCap()}`;
    this.updateHint();
  }

  setUnitCap(cap: number): void {
    this.board.currentCap = cap;
    this.refresh();
  }

  setBattleBtnText(text: string): void {
    const btn = this.el.querySelector('#hud-start');
    if (btn) btn.textContent = text;
  }
}
