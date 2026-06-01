import type { PlayerState } from '../game/PlayerState';
import { BUILDING_DEFS } from '../data/buildings';
import { canUpgrade, upgradeCost } from '../game/PlayerState';
import { getUnit } from '../data/units';

// 사이드바 컨텍스트 — 건물 상세/업그레이드
export class BuildingPanel {
  readonly el: HTMLElement;
  private buildingId: string = '';

  constructor(
    container: HTMLElement,
    private onUpgrade: (id: string) => void,
    private onBack: () => void,
  ) {
    this.el = document.createElement('div');
    this.el.className = 'panel building-panel';
    this.el.style.display = 'none';
    container.appendChild(this.el);
  }

  load(buildingId: string, s: PlayerState): void {
    this.buildingId = buildingId;
    this.el.style.display = '';
    this.render(s);
  }

  hide(): void {
    this.el.style.display = 'none';
    this.buildingId = '';
  }

  refresh(s: PlayerState): void {
    if (this.buildingId) this.render(s);
  }

  private render(s: PlayerState): void {
    const id     = this.buildingId;
    const bDef   = BUILDING_DEFS[id];
    const bState = s.buildings[id];
    if (!bDef || !bState) return;

    const isLocked = !bState.unlocked;
    const isMax    = bState.unlocked && bState.level >= bDef.levels.length;
    const curLevel = bState.level;
    const curDef   = bDef.levels[curLevel - 1];
    const nextDef  = bDef.levels[curLevel]; // undefined if max
    const cost     = upgradeCost(s, id);
    const affordable = canUpgrade(s, id);

    let html =
      `<div class="bp-header">` +
        `<button class="bp-back" id="bp-back">← 병력</button>` +
        `<span class="bp-title">${bDef.icon} ${bDef.name}</span>` +
        `<span class="bp-lv-badge">${isLocked ? '🔒 잠김' : `Lv.${curLevel}`}</span>` +
      `</div>`;

    if (isLocked) {
      // 해금 섹션
      html +=
        `<div class="bp-section">` +
          `<p class="bp-desc">${bDef.summary}</p>` +
          `<div class="bp-effect-row"><span>해금 후 효과</span><span>${bDef.levels[0].description}</span></div>` +
        `</div>` +
        `<div class="bp-upgrade-box ${affordable ? '' : 'unaffordable'}">` +
          `<div class="bp-cost">해금 비용 <b>${bDef.unlockCost}💰</b></div>` +
          `<button class="bp-upg-btn" id="bp-upg" ${affordable ? '' : 'disabled'}>해금하기</button>` +
          `${!affordable ? `<p class="bp-lack">코인 부족 (보유: ${s.coins}💰)</p>` : ''}` +
        `</div>`;
    } else if (isMax) {
      // 최대 레벨
      html +=
        `<div class="bp-section">` +
          `<p class="bp-cur-label">현재 효과</p>` +
          `<p class="bp-desc">${curDef?.description ?? ''}</p>` +
          `<p class="bp-max-badge">✦ 최대 레벨 달성</p>` +
        `</div>`;

      if (id === 'hatchery') html += this.hatcheryNote(s);
    } else {
      // 업그레이드 가능
      html +=
        `<div class="bp-section">` +
          `<p class="bp-cur-label">현재 효과 (Lv.${curLevel})</p>` +
          `<p class="bp-desc">${curDef?.description ?? ''}</p>` +
        `</div>` +
        `<div class="bp-upgrade-box ${affordable ? '' : 'unaffordable'}">` +
          `<p class="bp-next-label">▶ 다음 레벨 (Lv.${curLevel + 1})</p>` +
          `<p class="bp-desc">${nextDef?.description ?? ''}</p>` +
          `<div class="bp-cost">업그레이드 비용 <b>${cost}💰</b></div>` +
          `<button class="bp-upg-btn" id="bp-upg" ${affordable ? '' : 'disabled'}>업그레이드</button>` +
          `${!affordable ? `<p class="bp-lack">코인 부족 (보유: ${s.coins}💰)</p>` : ''}` +
        `</div>`;

      if (id === 'hatchery') html += this.hatcheryNote(s);
    }

    this.el.innerHTML = html;

    this.el.querySelector('#bp-back')!.addEventListener('click', this.onBack);
    const upgBtn = this.el.querySelector('#bp-upg');
    if (upgBtn) upgBtn.addEventListener('click', () => this.onUpgrade(id));
  }

  private hatcheryNote(s: PlayerState): string {
    const queue = s.hatcheryQueue ?? [];
    if (queue.length === 0) {
      return `<div class="bp-section bp-note">` +
        `<p>📝 사용법</p>` +
        `<p>준비기간 중 같은 종류 유닛 2기를 배치하면<br>다음 준비기간 시작 시 복제체 1기가 무료 추가됩니다.</p>` +
      `</div>`;
    }
    const items = queue
      .map((defId) => {
        try {
          const def = getUnit(defId);
          return `${def.visual.emoji ?? ''} ${def.name}`;
        } catch {
          return defId;
        }
      })
      .join(' · ');
    return `<div class="bp-section bp-note bp-note-active">` +
      `<p>⏳ 다음 준비기간에 복제 예정</p>` +
      `<p>${items}</p>` +
    `</div>`;
  }
}
