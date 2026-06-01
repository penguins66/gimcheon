import type { UnitDef, Layer } from '../sim/types';

function layerLabel(l: Layer): string {
  if (l === 'air')         return '공중 🟦';
  if (l === 'underground') return '땅속 🟧';
  return '지상 🟫';
}

// 발전 유닛의 잠금 레이블 (경로 미선택 시)
function devPathLabel(pathId: string): string {
  if (pathId === 'nature.ancient')     return '고대의 길';
  if (pathId === 'nature.underground') return '지하의 길';
  return '발전 필요';
}

// 병력 구매 목록. 코인/티어 상태에 따라 버튼 활성/비활성.
export class ShopPanel {
  readonly el: HTMLElement;
  selectedId: string | null = null;
  private buttons = new Map<string, HTMLButtonElement>();
  private defs: UnitDef[];

  constructor(
    container: HTMLElement,
    units: UnitDef[],
    private onSelect: (id: string) => void,
  ) {
    this.defs = units;
    this.el = document.createElement('div');
    this.el.className = 'panel shop';

    const title = document.createElement('h3');
    title.textContent = '병력 — 자연';
    this.el.appendChild(title);

    const list = document.createElement('div');
    list.className = 'shop-list';
    for (const u of units) {
      const b = document.createElement('button');
      b.className = 'unit-btn';
      b.innerHTML =
        `<span class="emoji">${u.visual.emoji ?? '⬤'}</span>` +
        `<span class="uinfo">` +
          `<span class="uname">${u.name}<span class="ucost">${u.cost}💰</span></span>` +
          `<span class="ustats">HP ${u.baseStats.hp} · ATK ${u.baseStats.atk} · ${layerLabel(u.layer)}</span>` +
        `</span>` +
        `<span class="utier-badge" id="tier-${u.id}">T${u.tier}</span>`;
      b.addEventListener('click', () => {
        if (!b.disabled) this.select(u.id);
      });
      this.buttons.set(u.id, b);
      list.appendChild(b);
    }
    this.el.appendChild(list);
    container.appendChild(this.el);
  }

  select(id: string): void {
    this.selectedId = id;
    for (const [uid, b] of this.buttons) {
      b.classList.toggle('selected', uid === id);
    }
    this.onSelect(id);
  }

  // 코인·티어·발전경로 변경 시 호출
  refresh(coins: number, maxTier: number, selectedDevPath?: string | null): void {
    for (const u of this.defs) {
      const btn = this.buttons.get(u.id);
      if (!btn) continue;

      // ── 발전 유닛 처리 ──
      if (u.unlock?.kind === 'devpath') {
        const pathId = u.unlock.pathId;

        if (selectedDevPath && selectedDevPath !== pathId) {
          // 다른 경로 선택 → 완전 숨김
          btn.style.display = 'none';
          if (this.selectedId === u.id) {
            this.selectedId = null;
            btn.classList.remove('selected');
          }
          continue;
        }

        btn.style.display = '';

        if (!selectedDevPath) {
          // 아직 경로 미선택 → 잠금 표시 (클릭 불가)
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

        // 같은 경로 선택 → 일반 tier/coin 처리로 이어짐
        btn.classList.remove('dev-path-locked');
      } else {
        btn.style.display = ''; // 기본 유닛 항상 표시
      }

      // ── 기본 tier/coin 처리 ──
      const tierOk  = u.tier <= maxTier;
      const coinOk  = u.cost <= coins;
      const locked   = !tierOk;
      const noMoney  = tierOk && !coinOk;

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
