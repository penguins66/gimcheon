import type { UnitDef, Layer } from '../sim/types';
import { ERA_STAT_MULTIPLIERS } from '../game/PlayerState';

function layerLabel(l: Layer): string {
  if (l === 'air')         return '공중 🟦';
  if (l === 'underground') return '땅속 🟧';
  return '지상 🟫';
}

function devPathLabel(pathId: string): string {
  if (pathId === 'nature.ancient')     return '고대의 길';
  if (pathId === 'nature.underground') return '지하의 길';
  if (pathId === 'human.advanced')     return '첨단의 길';
  if (pathId === 'human.magic')        return '마법의 길';
  return '발전 필요';
}

// 병력 구매 목록. 코인/티어 상태에 따라 버튼 활성/비활성.
export class ShopPanel {
  readonly el: HTMLElement;
  selectedId: string | null = null;
  private buttons = new Map<string, HTMLButtonElement>();
  private defs: UnitDef[] = [];
  private listEl: HTMLElement;
  private titleEl: HTMLElement;
  private onSelect: (id: string) => void;

  constructor(
    container: HTMLElement,
    units: UnitDef[],
    onSelect: (id: string) => void,
  ) {
    this.onSelect = onSelect;
    this.el = document.createElement('div');
    this.el.className = 'panel shop';

    this.titleEl = document.createElement('h3');
    this.el.appendChild(this.titleEl);

    this.listEl = document.createElement('div');
    this.listEl.className = 'shop-list';
    this.el.appendChild(this.listEl);

    container.appendChild(this.el);
    this.buildList(units, '자연');
  }

  private buildList(units: UnitDef[], raceName: string): void {
    this.defs = units;
    this.selectedId = null;
    this.buttons.clear();
    this.listEl.innerHTML = '';
    this.titleEl.textContent = `병력 — ${raceName}`;

    for (const u of units) {
      const b = document.createElement('button');
      b.className = 'unit-btn';
      b.innerHTML =
        `<span class="emoji" id="emoji-${u.id}">${u.visual.emoji ?? '⬤'}</span>` +
        `<span class="uinfo">` +
          `<span class="uname"><span id="uname-${u.id}">${u.name}</span><span class="ucost">${u.cost}💰</span></span>` +
          `<span class="ustats" id="ustats-${u.id}">HP ${u.baseStats.hp} · ATK ${u.baseStats.atk} · DEF ${u.baseStats.defense} · ${layerLabel(u.layer)}</span>` +
        `</span>` +
        `<span class="utier-badge" id="tier-${u.id}">T${u.tier}</span>`;
      b.addEventListener('click', () => {
        if (!b.disabled) this.select(u.id);
      });
      this.buttons.set(u.id, b);
      this.listEl.appendChild(b);
    }
  }

  /** 종족 전환 시 상점 재초기화 */
  reset(units: UnitDef[], raceName: string): void {
    this.buildList(units, raceName);
  }

  select(id: string): void {
    this.selectedId = id;
    for (const [uid, b] of this.buttons) {
      b.classList.toggle('selected', uid === id);
    }
    this.onSelect(id);
  }

  // 코인·티어·발전경로·에라 변경 시 호출
  refresh(coins: number, maxTier: number, selectedDevPath?: string | null, era?: number): void {
    for (const u of this.defs) {
      const btn = this.buttons.get(u.id);
      if (!btn) continue;

      // ── 에라 표시 업데이트 (인간 종족 유닛) ──
      if (era !== undefined && u.eraNames && u.eraEmojis) {
        const eraIdx = era - 1;
        const emojiEl = btn.querySelector(`#emoji-${u.id}`) as HTMLElement | null;
        const nameEl  = btn.querySelector(`#uname-${u.id}`) as HTMLElement | null;
        const statsEl = btn.querySelector(`#ustats-${u.id}`) as HTMLElement | null;
        if (emojiEl) emojiEl.textContent = u.eraEmojis[eraIdx] ?? u.visual.emoji ?? '⬤';
        if (nameEl)  nameEl.textContent  = u.eraNames[eraIdx]  ?? u.name;
        // 스탯도 era 기준으로 갱신 (기본유닛만: 발전유닛은 era 스케일 없음)
        if (statsEl && u.raceId === 'human' && !u.unlock) {
          const mult = ERA_STAT_MULTIPLIERS[eraIdx] ?? 1.0;
          const hp  = Math.round(u.baseStats.hp      * mult);
          const atk = Math.round(u.baseStats.atk     * mult);
          const def = Math.round(u.baseStats.defense  * mult);
          statsEl.textContent = `HP ${hp} · ATK ${atk} · DEF ${def} · ${layerLabel(u.layer)}`;
        }
      }

      // ── 발전 유닛 처리 ──
      if (u.unlock?.kind === 'devpath') {
        const pathId = u.unlock.pathId;

        if (selectedDevPath && selectedDevPath !== pathId) {
          btn.style.display = 'none';
          if (this.selectedId === u.id) {
            this.selectedId = null;
            btn.classList.remove('selected');
          }
          continue;
        }

        btn.style.display = '';

        if (!selectedDevPath) {
          btn.disabled = true;
          btn.classList.remove('tier-locked', 'no-coins');
          btn.classList.add('dev-path-locked');
          const badge = btn.querySelector(`#tier-${u.id}`) as HTMLElement;
          if (badge) badge.textContent = `🔒 ${devPathLabel(pathId)}`;
          if (this.selectedId === u.id) {
            this.selectedId = null;
            btn.classList.remove('selected');
          }
          continue;
        }

        btn.classList.remove('dev-path-locked');
      } else {
        btn.style.display = '';
      }

      // ── 기본 tier/coin 처리 ──
      const tierOk = u.tier <= maxTier;
      const coinOk = u.cost <= coins;
      const locked  = !tierOk;
      const noMoney = tierOk && !coinOk;

      btn.disabled = locked;
      btn.classList.toggle('tier-locked', locked);
      btn.classList.toggle('no-coins', noMoney);

      const badge = btn.querySelector(`#tier-${u.id}`) as HTMLElement;
      if (badge) badge.textContent = locked ? `🔒T${u.tier}` : `T${u.tier}`;

      if (locked && this.selectedId === u.id) {
        this.selectedId = null;
        btn.classList.remove('selected');
      }
    }
  }
}
