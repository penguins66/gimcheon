// 연구소 패널 — 건물 레벨 관리 + 유닛별 연구 트리 (스탯 3노드 + 어빌리티)
import type { PlayerState } from '../game/PlayerState';
import type { UnitDef } from '../sim/types';
import type { ResearchStatKey } from '../game/Research';
import { BUILDING_DEFS } from '../data/buildings';
import { canUpgrade, upgradeCost } from '../game/PlayerState';
import { canInvestStat, canUnlockAbility, getTotalStatLevel, statNodeId, abilityNodeId } from '../game/Research';

// 스탯 한국어 레이블
const STAT_KO: Record<ResearchStatKey, string> = {
  atk:         '공격력',
  defense:     '방어력',
  attackSpeed: '공격속도',
};
const STAT_ORDER: ResearchStatKey[] = ['atk', 'defense', 'attackSpeed'];

export class ResearchPanel {
  readonly el: HTMLElement;

  constructor(
    container: HTMLElement,
    private units: UnitDef[],
    private onUpgradeLab: () => void,
    private onInvestStat: (unitId: string, stat: ResearchStatKey) => void,
    private onUnlockAbility: (unitId: string) => void,
    private onBack: () => void,
  ) {
    this.el = document.createElement('div');
    this.el.className = 'panel research-panel';
    this.el.style.display = 'none';
    container.appendChild(this.el);
  }

  show(s: PlayerState): void {
    this.el.style.display = '';
    this.render(s);
  }

  hide(): void {
    this.el.style.display = 'none';
  }

  refresh(s: PlayerState): void {
    if (this.el.style.display !== 'none') this.render(s);
  }

  private render(s: PlayerState): void {
    const bDef   = BUILDING_DEFS['researchLab']!;
    const bState = s.buildings['researchLab']!;
    const curLv  = bState.level;
    const curDef = bDef.levels[curLv - 1]!;
    const nextDef = bDef.levels[curLv];
    const isMax  = curLv >= bDef.levels.length;
    const cost   = upgradeCost(s, 'researchLab');
    const affordable = canUpgrade(s, 'researchLab');

    // ── 건물 헤더 + 레벨 섹션 ──
    let html = `
      <div class="bp-header">
        <button class="bp-back" id="rp-back">← 병력</button>
        <span class="bp-title">🔬 연구소</span>
        <span class="bp-lv-badge">Lv.${curLv}</span>
      </div>
      <div class="bp-section">
        <p class="bp-cur-label">현재 효과 (Lv.${curLv})</p>
        <p class="bp-desc">${curDef.description}</p>
      </div>`;

    if (isMax) {
      html += `<p class="bp-max-badge">✦ 최대 레벨 달성</p>`;
    } else {
      html += `
        <div class="bp-upgrade-box ${affordable ? '' : 'unaffordable'}">
          <p class="bp-next-label">▶ 다음 레벨 (Lv.${curLv + 1})</p>
          <p class="bp-desc">${nextDef!.description}</p>
          <div class="bp-cost">업그레이드 비용 <b>${cost}💰</b></div>
          <button class="bp-upg-btn" id="rp-upg" ${affordable ? '' : 'disabled'}>업그레이드</button>
          ${!affordable ? `<p class="bp-lack">코인 부족 (보유: ${s.coins}💰)</p>` : ''}
        </div>`;
    }

    // ── 연구 트리 헤더 ──
    html += `
      <div class="rp-tree-header">
        <span>연구 트리</span>
        <span class="rp-gems">💎 ${s.gems}</span>
      </div>`;

    // ── 유닛별 연구 섹션 ──
    const researchUnits = this.units.filter((u) => u.research);
    for (const unit of researchUnits) {
      const tree = unit.research!;
      const totalLv  = getTotalStatLevel(unit.id, s.research);
      const maxTotal = (tree.atk.maxLevel + tree.defense.maxLevel + tree.attackSpeed.maxLevel);
      const abilityUnlocked = (s.research[abilityNodeId(unit.id)] ?? 0) >= 1;

      html += `
        <div class="rpu-section">
          <div class="rpu-header">
            <span class="rpu-emoji">${unit.visual.emoji ?? ''}</span>
            <span class="rpu-name">${unit.name}</span>
            <span class="rpu-total">총 Lv. ${totalLv}/${maxTotal}</span>
          </div>
          <div class="rp-nodes">`;

      // 스탯 3개 노드
      for (const stat of STAT_ORDER) {
        const nodeDef  = tree[stat];
        const lv       = s.research[statNodeId(unit.id, stat)] ?? 0;
        const maxed    = lv >= nodeDef.maxLevel;
        const investable = canInvestStat(s, unit.id, stat, nodeDef);
        const noGems   = s.gems < nodeDef.cost;

        const pips = Array.from({ length: nodeDef.maxLevel }, (_, i) =>
          `<span class="rp-pip ${i < lv ? 'filled' : ''}"></span>`
        ).join('');

        html += `
          <div class="rp-stat-row ${maxed ? 'maxed' : ''}">
            <span class="rpn-stat-label">${STAT_KO[stat]}</span>
            <span class="rp-pips">${pips}</span>
            <span class="rpn-lv">${maxed ? '✦' : `Lv.${lv}/${nodeDef.maxLevel}`}</span>
            ${!maxed
              ? `<span class="rpn-cost">${nodeDef.cost}💎</span>
                 <button class="rpn-btn" data-uid="${unit.id}" data-stat="${stat}"
                   ${investable ? '' : 'disabled'}>투자</button>`
              : ''}
          </div>
          ${!maxed && noGems ? `<p class="rpn-lack">보석 부족 (보유: ${s.gems}💎)</p>` : ''}`;
      }

      // 어빌리티 해금 노드
      if (tree.ability) {
        const abl = tree.ability;
        const totalNeeded  = abl.requiresTotalLevel;
        const conditionMet = totalLv >= totalNeeded;
        const canUnlock    = canUnlockAbility(s, unit.id, abl);

        if (abilityUnlocked) {
          html += `
            <div class="rp-ability-box unlocked">
              <div class="rpa-header">
                <span class="rpa-name">✦ ${abl.name}</span>
                <span class="rpa-badge unlocked">해금됨</span>
              </div>
              <p class="rpa-desc">${abl.description}</p>
            </div>`;
        } else {
          html += `
            <div class="rp-ability-box ${conditionMet ? '' : 'locked'}">
              <div class="rpa-header">
                <span class="rpa-name">${conditionMet ? '🔓' : '🔒'} ${abl.name}</span>
                <span class="rpa-badge req">총 Lv.${totalNeeded} 이상</span>
              </div>
              <p class="rpa-desc">${abl.description}</p>
              ${conditionMet
                ? `<div class="rpa-unlock-row">
                     <span class="rpn-cost">${abl.cost}💎</span>
                     <button class="rpa-btn" data-uid="${unit.id}"
                       ${canUnlock ? '' : 'disabled'}>해금하기</button>
                     ${!canUnlock && s.gems < abl.cost ? `<span class="rpn-lack">보석 부족</span>` : ''}
                   </div>`
                : `<p class="rpa-need">총 Lv. ${totalNeeded - totalLv} 더 필요</p>`}
            </div>`;
        }
      }

      html += `</div></div>`; // rp-nodes, rpu-section
    }

    this.el.innerHTML = html;

    // ── 이벤트 연결 ──
    this.el.querySelector('#rp-back')?.addEventListener('click', this.onBack);
    this.el.querySelector('#rp-upg')?.addEventListener('click', this.onUpgradeLab);

    this.el.querySelectorAll<HTMLButtonElement>('.rpn-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const uid  = btn.dataset['uid'];
        const stat = btn.dataset['stat'] as ResearchStatKey | undefined;
        if (uid && stat) this.onInvestStat(uid, stat);
      });
    });

    this.el.querySelectorAll<HTMLButtonElement>('.rpa-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const uid = btn.dataset['uid'];
        if (uid) this.onUnlockAbility(uid);
      });
    });
  }
}
