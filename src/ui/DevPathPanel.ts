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
  ): void {
    const [p1, p2] = devPaths;
    this.overlay.style.display = 'flex';

    const renderPath = (p: DevPathDef): string => {
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

      const icon = p.id === 'nature.ancient' ? '🏛️' : '🕳️';

      return `
        <div class="devpath-choice" data-id="${p.id}">
          <div class="devpath-choice-icon">${icon}</div>
          <div class="devpath-choice-title">${p.name}</div>
          <div class="devpath-choice-desc">${descOf(p.id)}</div>
          <div class="devpath-choice-units">${unitItems}</div>
          <button class="devpath-select-btn" data-id="${p.id}">선택하기</button>
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
        <p class="devpath-note">선택 후 해당 유닛이 상점에 해금됩니다 · 한 칸 최대 3유닛 배치 가능</p>
      </div>`;

    // 클릭 이벤트 — 선택지 카드 또는 버튼 모두 작동
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

function descOf(pathId: string): string {
  if (pathId === 'nature.ancient') {
    return '고대 생물들의 힘을 얻습니다.\n느리지만 압도적인 체력·방어력을 가진 유닛들이 해금됩니다.';
  }
  if (pathId === 'nature.underground') {
    return '지하 생물들의 독과 기습을 활용합니다.\n빠른 이동속도와 상태이상 특화 유닛들이 해금됩니다.';
  }
  return '';
}
