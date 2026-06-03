// 발전 방향 선택 오버레이 — 7턴 이후 1회, 닫기 불가 강제 선택
import type { DevPathDef, UnitDef } from '../sim/types';

export class DevPathPanel {
  private overlay: HTMLElement;

  constructor(container: HTMLElement) {
    this.overlay = document.createElement('div');
    this.overlay.className = 'devpath-overlay';
    this.overlay.style.display = 'none';
    container.appendChild(this.overlay);
  }

  show(
    devPaths: [DevPathDef, DevPathDef],
    allUnits: UnitDef[],
    onChoose: (pathId: string) => void,
    era = 1,
    note = '선택 후 해당 유닛이 상점에 해금됩니다',
  ): void {
    const [p1, p2] = devPaths;
    this.overlay.style.display = 'flex';

    const renderPath = (p: DevPathDef): string => {
      const locked = isPathLocked(p, era);
      const lockReason = locked ? getLockReason(p) : '';

      const unlockUnits = p.unitsUnlocked
        .map((id) => allUnits.find((u) => u.id === id))
        .filter((u): u is UnitDef => !!u);

      const unitItems = unlockUnits
        .map(
          (u) =>
            `<div class="devpath-unit-item">` +
              `<span class="devpath-unit-emoji">${u.visual.emoji ?? ''}</span>` +
              `<span class="devpath-unit-name">${u.name}</span>` +
              `<span class="devpath-unit-stat">HP ${u.baseStats.hp} · ATK ${u.baseStats.atk}</span>` +
            `</div>`,
        )
        .join('');

      const lockedOverlay = locked
        ? `<div class="devpath-lock-overlay">🔒 ${lockReason}</div>`
        : '';

      return `
        <div class="devpath-choice${locked ? ' devpath-choice-locked' : ''}" data-id="${locked ? '' : p.id}">
          ${lockedOverlay}
          <div class="devpath-choice-icon">${getPathIcon(p.id)}</div>
          <div class="devpath-choice-title">${p.name}</div>
          <div class="devpath-choice-desc">${descOf(p.id)}</div>
          <div class="devpath-choice-units">${unitItems}</div>
          ${locked
            ? `<button class="devpath-select-btn" disabled style="opacity:.4">🔒 잠김</button>`
            : `<button class="devpath-select-btn" data-id="${p.id}">선택하기</button>`}
        </div>`;
    };

    this.overlay.innerHTML = `
      <div class="devpath-box">
        <div class="devpath-header">
          <div class="devpath-title">⚔️ 발전 방향 선택</div>
          <div class="devpath-subtitle">7턴 이후 — 한 번 선택하면 되돌릴 수 없습니다</div>
        </div>
        <div class="devpath-choices">
          ${renderPath(p1)}
          <div class="devpath-vs">VS</div>
          ${renderPath(p2)}
        </div>
        <p class="devpath-note">${note}</p>
      </div>`;

    // 클릭 이벤트 — 잠기지 않은 선택지만 작동
    this.overlay.querySelectorAll<HTMLElement>('[data-id]').forEach((el) => {
      el.addEventListener('click', () => {
        const id = el.dataset['id'];
        if (id) {
          this.hide();
          onChoose(id);
        }
      });
    });
  }

  hide(): void {
    this.overlay.style.display = 'none';
  }
}

function isPathLocked(path: DevPathDef, era: number): boolean {
  if (!path.condition) return false;
  if (path.condition.kind === 'era') {
    if (path.condition.min != null && era < path.condition.min) return true;
    if (path.condition.max != null && era > path.condition.max) return true;
  }
  return false;
}

function getLockReason(path: DevPathDef): string {
  if (!path.condition || path.condition.kind !== 'era') return '조건 미충족';
  const { min, max } = path.condition;
  if (min != null) return `에라 ${ERA_NAME_OF(min)} 이상 필요`;
  if (max != null) return `에라 ${ERA_NAME_OF(max)} 이하 필요`;
  return '조건 미충족';
}

function ERA_NAME_OF(era: number): string {
  return ['선사', '철기', '중세', '근대', '현대'][era - 1] ?? `${era}`;
}

function getPathIcon(pathId: string): string {
  if (pathId === 'nature.ancient')     return '🏛️';
  if (pathId === 'nature.underground') return '🕳️';
  if (pathId === 'human.advanced')     return '🤖';
  if (pathId === 'human.magic')        return '✨';
  return '⚔️';
}

function descOf(pathId: string): string {
  if (pathId === 'nature.ancient') {
    return '고대 생물들의 힘을 얻습니다.\n느리지만 압도적인 체력·방어력을 가진 유닛들이 해금됩니다.';
  }
  if (pathId === 'nature.underground') {
    return '지하 생물들의 독과 기습을 활용합니다.\n빠른 이동속도와 상태이상 특화 유닛들이 해금됩니다.';
  }
  if (pathId === 'human.advanced') {
    return '첨단 기술로 강력한 전투 병기를 제작합니다.\n에라 4(근대) 이상이어야 선택 가능합니다.';
  }
  if (pathId === 'human.magic') {
    return '마법의 힘을 군사력으로 활용합니다.\n에라 3(중세) 이하일 때만 선택 가능합니다.';
  }
  return '';
}
