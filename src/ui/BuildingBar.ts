import type { PlayerState } from '../game/PlayerState';
import { BUILDING_DEFS, RACE_BUILDING_IDS } from '../data/buildings';
import { ERA_NAMES } from '../game/PlayerState';

// 캔버스 하단 건물 아이콘 바 — 클릭 시 사이드바에 해당 건물 패널 표시
export class BuildingBar {
  readonly el: HTMLElement;
  private buttons = new Map<string, HTMLButtonElement>();
  activeId: string | null = null;
  private onSelectCb: (buildingId: string | null) => void;

  constructor(
    container: HTMLElement,
    raceId: string,
    onSelect: (buildingId: string | null) => void,
  ) {
    this.onSelectCb = onSelect;
    this.el = document.createElement('nav');
    this.el.className = 'building-bar';
    container.appendChild(this.el);
    this.buildButtons(raceId);
  }

  private buildButtons(raceId: string): void {
    this.el.innerHTML = '';
    this.buttons.clear();
    this.activeId = null;

    const ids = RACE_BUILDING_IDS[raceId] ?? [];
    for (const id of ids) {
      const def = BUILDING_DEFS[id];
      if (!def) continue;
      const btn = document.createElement('button');
      btn.className = 'building-btn';
      btn.dataset['id'] = id;
      btn.title = def.summary;
      btn.innerHTML =
        `<span class="bld-icon">${def.icon}</span>` +
        `<span class="bld-name">${def.name}</span>` +
        `<span class="bld-level" id="blv-${id}">Lv1</span>`;
      btn.addEventListener('click', () => this.select(btn.dataset['id'] === this.activeId ? null : id));
      this.buttons.set(id, btn);
      this.el.appendChild(btn);
    }
  }

  /** 종족 전환 시 버튼 재구성 */
  resetRace(raceId: string): void {
    this.buildButtons(raceId);
  }

  select(id: string | null): void {
    this.activeId = id;
    for (const [bid, btn] of this.buttons) {
      btn.classList.toggle('active', bid === id);
    }
    this.onSelectCb(id);
  }

  refresh(s: PlayerState): void {
    for (const [id, btn] of this.buttons) {
      const lvEl = btn.querySelector(`#blv-${id}`)!;

      // ── 시대 진화 버튼: era 표시 ──
      if (id === 'eraEvolution') {
        const era = s.era ?? 1;
        lvEl.textContent = ERA_NAMES[era - 1] ?? `에라${era}`;
        btn.classList.remove('locked');
        if (era >= 5) btn.title = '현대 — 최고 시대 달성';
        continue;
      }

      const bState = s.buildings[id];
      const bDef   = BUILDING_DEFS[id];
      if (!bState || !bDef) continue;

      if (!bState.unlocked) {
        lvEl.textContent = '🔒';
        btn.classList.add('locked');
      } else {
        const isMax = bState.level >= bDef.levels.length;
        lvEl.textContent = isMax ? `Lv${bState.level}✦` : `Lv${bState.level}`;
        btn.classList.remove('locked');
      }
    }
  }
}
