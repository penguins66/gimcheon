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
    private onHatcherySelect?: () => void,   // 부화장: 투입할 유닛 선택 모드
    private onHatcheryRetrieve?: () => void, // 부화장: 슬롯 유닛 회수
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
    const nextDef  = bDef.levels[curLevel];
    const cost     = upgradeCost(s, id);
    const affordable = canUpgrade(s, id);

    let html =
      `<div class="bp-header">` +
        `<button class="bp-back" id="bp-back">← 병력</button>` +
        `<span class="bp-title">${bDef.icon} ${bDef.name}</span>` +
        `<span class="bp-lv-badge">${isLocked ? '🔒 잠김' : `Lv.${curLevel}`}</span>` +
      `</div>`;

    if (isLocked) {
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
      html +=
        `<div class="bp-section">` +
          `<p class="bp-cur-label">현재 효과</p>` +
          `<p class="bp-desc">${curDef?.description ?? ''}</p>` +
          `<p class="bp-max-badge">✦ 최대 레벨 달성</p>` +
        `</div>`;

      if (id === 'hatchery') html += this.hatcherySection(s);
    } else {
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

      if (id === 'hatchery') html += this.hatcherySection(s);
    }

    this.el.innerHTML = html;

    this.el.querySelector('#bp-back')!.addEventListener('click', this.onBack);
    const upgBtn = this.el.querySelector('#bp-upg');
    if (upgBtn) upgBtn.addEventListener('click', () => this.onUpgrade(id));

    // 부화장 버튼 이벤트
    if (id === 'hatchery') {
      this.el.querySelector('#hatch-select')?.addEventListener('click', () => {
        this.onHatcherySelect?.();
      });
      this.el.querySelector('#hatch-retrieve')?.addEventListener('click', () => {
        this.onHatcheryRetrieve?.();
      });
    }
  }

  // ── 부화장 섹션 ────────────────────────────────────────────────────────
  private hatcherySection(s: PlayerState): string {
    const slot = s.hatcherySlot;

    if (!slot) {
      // 슬롯 비어있음 — 유닛 선택 버튼
      return `
        <div class="bp-section bp-note">
          <p style="font-weight:600;margin-bottom:6px">🥚 부화장 슬롯 — 비어있음</p>
          <p style="color:var(--muted);font-size:12px;margin-bottom:10px">
            유닛 1기를 투입하면 다음 전투 후 HP·ATK·DEF +20% 돌연변이로 귀환합니다.
          </p>
          <button class="bp-upg-btn" id="hatch-select">보드에서 유닛 투입</button>
        </div>`;
    }

    // 슬롯 사용 중 — 부화 중인 유닛 정보 표시
    let unitName = slot.defId;
    let unitEmoji = '';
    try {
      const def = getUnit(slot.defId);
      unitName  = def.name;
      unitEmoji = def.visual.emoji ?? '';
    } catch { /**/ }

    const nextLv = slot.mutationLevel + 1;
    return `
      <div class="bp-section bp-note bp-note-active">
        <p style="font-weight:600;margin-bottom:6px">⏳ 부화 중</p>
        <p style="font-size:14px;margin-bottom:4px">${unitEmoji} ${unitName}</p>
        <p style="color:var(--muted);font-size:12px;margin-bottom:10px">
          다음 전투 후 <b>돌연변이 Lv.${nextLv}</b> (+${nextLv * 20}% 능력치)로 귀환
        </p>
        <button class="bp-upg-btn" id="hatch-retrieve" style="background:#555">
          유닛 회수 (돌연변이 취소)
        </button>
      </div>`;
  }
}
