import type { PlayerState } from '../game/PlayerState';
import { CONFIG } from '../config';

// 사이드바 최상단 — 코인·보석·목숨·턴 항상 표시
export class GameHud {
  readonly el: HTMLElement;
  private coinsEl!: HTMLElement;
  private gemsEl!: HTMLElement;
  private livesEl!: HTMLElement;
  private turnEl!: HTMLElement;

  constructor(container: HTMLElement) {
    this.el = document.createElement('div');
    this.el.className = 'panel game-hud';
    this.el.innerHTML =
      `<div class="ghud-row">` +
        `<span class="ghud-item"><span class="ghud-icon">💰</span><b id="gh-coins">3</b></span>` +
        `<span class="ghud-item"><span class="ghud-icon">💎</span><b id="gh-gems">0</b></span>` +
        `<span class="ghud-item"><span id="gh-lives"></span></span>` +
        `<span class="ghud-item turn"><span class="ghud-icon">📅</span><b id="gh-turn">1턴</b></span>` +
      `</div>`;
    container.appendChild(this.el);
    this.coinsEl = this.el.querySelector('#gh-coins')!;
    this.gemsEl  = this.el.querySelector('#gh-gems')!;
    this.livesEl = this.el.querySelector('#gh-lives')!;
    this.turnEl  = this.el.querySelector('#gh-turn')!;
  }

  refresh(s: PlayerState): void {
    this.coinsEl.textContent = String(s.coins);
    this.gemsEl.textContent  = String(s.gems);
    this.livesEl.innerHTML   = '❤️'.repeat(s.lives) +
      '<span style="opacity:.25">🖤</span>'.repeat(Math.max(0, CONFIG.lives - s.lives));
    this.turnEl.textContent  = `${s.turn}턴`;
  }
}
