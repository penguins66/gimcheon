import './styles.css';
import { Grid }            from './game/Grid';
import { Board }           from './game/Board';
import { GridRenderer }    from './render/GridRenderer';
import { BattleRenderer }  from './render/BattleRenderer';
import { ShopPanel }       from './ui/ShopPanel';
import { Hud }             from './ui/Hud';
import { GameHud }         from './ui/GameHud';
import { BuildingBar }     from './ui/BuildingBar';
import { BuildingPanel }   from './ui/BuildingPanel';
import { ResearchPanel }   from './ui/ResearchPanel';
import { DevPathPanel }    from './ui/DevPathPanel';
import { NATURE_UNITS, NATURE_BASE_UNITS } from './data/units/nature';
import { getRace }         from './data/races';
import { NATURE_RACE }     from './data/races/nature';
import { getUnit }         from './data/units';
import { createSimState, tick, SimPlacement } from './sim/Simulation';
import { createAiPlacements }  from './ai/AiController';
import { createPlayerState, upgradeBuilding, updateDerived } from './game/PlayerState';
import { investStat, unlockAbility } from './game/Research';
import type { ResearchStatKey } from './game/Research';
import { calcIncome, applySettlement } from './game/Economy';
import type { SimState }   from './sim/types';
import type { PlayerState } from './game/PlayerState';

// ── 게임 상태 변수 (TDZ 방지: 사용 전에 최상단에 선언) ──────────────────
type GamePhase = 'prep' | 'battle' | 'settlement' | 'gameover';
let gamePhase: GamePhase = 'prep';
let simState: SimState | null = null;
let rafId: number | null = null;
let lastTime = 0;
let accumulator = 0;
const MS_PER_TICK = 1000 / 30;

// ── DOM 뼈대 ──────────────────────────────────────────────────────────────
const app = document.getElementById('app')!;
app.innerHTML = `
  <header class="topbar">
    <h1>Gimcheon <span class="tag" id="phase-tag">준비기간</span></h1>
    <div class="topbar-sub">종족: 자연 · 그리드 7×8 · 아래 4행이 내 진영</div>
  </header>
  <main class="layout">
    <section class="board-wrap">
      <div class="board-canvas-area">
        <canvas id="board"></canvas>
        <div class="result-overlay" id="result-overlay" style="display:none"></div>
      </div>
      <div id="building-bar-host"></div>
    </section>
    <aside class="sidebar">
      <div id="sidebar-top"></div>
      <div id="sidebar-shop"></div>
      <div id="sidebar-building"></div>
    </aside>
  </main>`;

const phaseTag       = document.getElementById('phase-tag')!;
const resultOverlay  = document.getElementById('result-overlay')!;
const canvas         = document.getElementById('board') as HTMLCanvasElement;
const sidebarTop     = document.getElementById('sidebar-top')!;
const sidebarShop    = document.getElementById('sidebar-shop')!;
const sidebarBuilding= document.getElementById('sidebar-building')!;
const bldBarHost     = document.getElementById('building-bar-host')!;

// ── 코어 객체 ────────────────────────────────────────────────────────────
const grid          = new Grid();
const board         = new Board(grid, getRace('nature'));
const gridRenderer  = new GridRenderer(canvas, grid, board);
const battleRenderer= new BattleRenderer(canvas, grid);
let   playerState: PlayerState = createPlayerState();

// ── UI 컴포넌트 ──────────────────────────────────────────────────────────
const gameHud = new GameHud(sidebarTop);

const hud = new Hud(sidebarShop, board, {
  onToggleDev: (v) => { board.devPathChosen = v; hudRefresh(); draw(); },
  onClear:     ()  => { refundAll(); hudRefresh(); draw(); },
  onStartBattle: () => { if (board.totalPlaced() > 0) startBattle(); },
});

const shop = new ShopPanel(sidebarShop, NATURE_UNITS, (id) => {
  hud.setSelected(getUnit(id).name);
});
shop.select(NATURE_BASE_UNITS[0].id);

const buildingBar = new BuildingBar(bldBarHost, 'nature', (id) => {
  if (id === 'researchLab') showResearchPanel();
  else if (id) showBuildingPanel(id);
  else showShopPanel();
});

const buildingPanel = new BuildingPanel(
  sidebarBuilding,
  (id) => {
    if (upgradeBuilding(playerState, id)) onPlayerStateChange();
  },
  () => {
    buildingBar.select(null);
    showShopPanel();
  },
);

// board-canvas-area 안에 DevPathPanel 오버레이 추가
const boardCanvasArea = canvas.parentElement!;
const devPathPanel = new DevPathPanel(boardCanvasArea);

const researchPanel = new ResearchPanel(
  sidebarBuilding,
  NATURE_UNITS,
  // 연구소 건물 업그레이드
  () => {
    if (upgradeBuilding(playerState, 'researchLab')) onPlayerStateChange();
  },
  // 스탯 노드 투자
  (unitId: string, stat: ResearchStatKey) => {
    const def = getUnit(unitId);
    const nodeDef = def.research?.[stat];
    if (nodeDef && investStat(playerState, unitId, stat, nodeDef)) onPlayerStateChange();
  },
  // 어빌리티 해금
  (unitId: string) => {
    const abilityNode = getUnit(unitId).research?.ability;
    if (abilityNode && unlockAbility(playerState, unitId, abilityNode)) onPlayerStateChange();
  },
  // 뒤로가기
  () => {
    buildingBar.select(null);
    showShopPanel();
  },
);

// 초기 UI 상태
hudRefresh();
showShopPanel();

// ── 패널 전환 ─────────────────────────────────────────────────────────────
function showShopPanel(): void {
  hud.el.style.display      = '';
  shop.el.style.display     = '';
  buildingPanel.hide();
  researchPanel.hide();
}
function showBuildingPanel(id: string): void {
  hud.el.style.display  = 'none';
  shop.el.style.display = 'none';
  researchPanel.hide();
  buildingPanel.load(id, playerState);
}
function showResearchPanel(): void {
  hud.el.style.display  = 'none';
  shop.el.style.display = 'none';
  buildingPanel.hide();
  researchPanel.show(playerState);
}

// PlayerState 변경 후 모든 UI 동기화
function onPlayerStateChange(): void {
  updateDerived(playerState);
  board.currentCap = playerState.unitCap;
  hudRefresh();
  buildingBar.refresh(playerState);
  buildingPanel.refresh(playerState);
  researchPanel.refresh(playerState);
  shop.refresh(playerState.coins, playerState.maxTier, playerState.selectedDevPath);
  draw();
}

function hudRefresh(): void {
  gameHud.refresh(playerState);
  hud.setUnitCap(playerState.unitCap);
  hud.refresh();
  shop.refresh(playerState.coins, playerState.maxTier, playerState.selectedDevPath);
  buildingBar.refresh(playerState);
}

// ── 배치 이벤트 ───────────────────────────────────────────────────────────
function cellFromEvent(e: MouseEvent): number | null {
  const rect = canvas.getBoundingClientRect();
  return gridRenderer.pixelToCell(e.clientX - rect.left, e.clientY - rect.top);
}

canvas.addEventListener('mousemove', (e) => {
  if (gamePhase !== 'prep') return;
  gridRenderer.hoverCell = cellFromEvent(e);
  draw();
});
canvas.addEventListener('mouseleave', () => {
  gridRenderer.hoverCell = null;
  if (gamePhase === 'prep') draw();
});
canvas.addEventListener('click', (e) => {
  if (gamePhase !== 'prep' || !shop.selectedId) return;
  const cellId = cellFromEvent(e);
  if (cellId === null) return;

  const def = getUnit(shop.selectedId);
  if (def.tier > playerState.maxTier) return;   // 티어 게이팅
  if (playerState.coins < def.cost)   return;   // 코인 부족

  if (board.place(cellId, shop.selectedId)) {
    playerState.coins -= def.cost;
    onPlayerStateChange();
  }
});
canvas.addEventListener('contextmenu', (e) => {
  e.preventDefault();
  if (gamePhase !== 'prep') return;
  const cellId = cellFromEvent(e);
  if (cellId === null) return;
  const top = board.unitsAt(cellId).at(-1);
  if (top && board.removeTopAt(cellId)) {
    playerState.coins += getUnit(top.defId).cost; // 환불
    onPlayerStateChange();
  }
});

function refundAll(): void {
  for (const { units } of board.allPlacements()) {
    for (const u of units) playerState.coins += getUnit(u.defId).cost;
  }
  board.clear();
}

// ── 렌더 ─────────────────────────────────────────────────────────────────
function draw(): void {
  if (gamePhase === 'battle' || gamePhase === 'settlement') {
    if (simState) battleRenderer.draw(simState);
  } else {
    gridRenderer.draw();
  }
}
function resizeAndDraw(): void {
  if (gamePhase === 'battle' || gamePhase === 'settlement') {
    battleRenderer.resize(); if (simState) battleRenderer.draw(simState);
  } else {
    gridRenderer.resize(); gridRenderer.draw();
  }
}

// 디버그: 개발 모드에서만 전역 노출
if (import.meta.env.DEV) {
  (window as any).__debug = {
    getPhase:       () => gamePhase,
    getSelected:    () => shop.selectedId,
    getCoins:       () => playerState.coins,
    getGems:        () => playerState.gems,
    addGems:        (n: number) => { playerState.gems += n; onPlayerStateChange(); },
    getResearch:    () => ({ ...playerState.research }),
    getMaxTier:     () => playerState.maxTier,
    getTotalPlaced: () => board.totalPlaced(),
    canPlace:       (col: number, row: number) => board.canPlaceAt(grid.cellId(col, row)),
    placeUnit:      (col: number, row: number, defId = 'nature.wildDogs') => {
      const def = getUnit(defId);
      const cellId = grid.cellId(col, row);
      const result = board.place(cellId, defId);
      if (result) {
        playerState.coins -= def.cost;
        onPlayerStateChange();
      }
      return {
        success: !!result,
        cellId,
        coins: playerState.coins,
        placed: board.totalPlaced(),
        canPlace: board.canPlaceAt(cellId),
      };
    },
  };
}

// ResizeObserver: 부모 요소(board-canvas-area) 관찰 — 절대위치 canvas는
// 자기 자신의 크기 변화를 ResizeObserver로 감지하기 어려우므로 부모로 관찰.
const observeTarget = canvas.parentElement ?? canvas;
const canvasResizeObserver = new ResizeObserver(() => resizeAndDraw());
canvasResizeObserver.observe(observeTarget);

window.addEventListener('resize', resizeAndDraw);
resizeAndDraw();
// 레이아웃 완전 정착 보장 폴백
setTimeout(resizeAndDraw, 50);
setTimeout(resizeAndDraw, 200);

// ── 부화장: 보드에서 2기 이상 동일 유닛 감지 ─────────────────────────────
function detectHatcheryPairs(): string[] {
  const counts = new Map<string, number>();
  for (const { units } of board.allPlacements()) {
    for (const u of units) counts.set(u.defId, (counts.get(u.defId) ?? 0) + 1);
  }
  const pairs: string[] = [];
  for (const [defId, count] of counts) {
    if (count >= 2) pairs.push(defId);
  }
  return pairs;
}

// ── 부화장 큐 → board에 자동 배치 ────────────────────────────────────────
function processHatcheryQueue(): void {
  if (!playerState.hatcheryQueue.length) return;
  const toAdd = [...playerState.hatcheryQueue];
  playerState.hatcheryQueue = [];

  for (const defId of toAdd) {
    const def = getUnit(defId);
    if (def.tier > playerState.maxTier) continue; // 티어 미달 시 스킵
    // player zone 내 빈 칸 탐색 (좌→우, 위→아래)
    let placed = false;
    outer: for (let row = grid.rows - grid.playerRows; row < grid.rows; row++) {
      for (let col = 0; col < grid.cols; col++) {
        const cellId = grid.cellId(col, row);
        if (board.canPlaceAt(cellId)) {
          board.place(cellId, defId); // 무료 (코인 차감 없음)
          placed = true;
          break outer;
        }
      }
    }
    if (!placed) {
      // 빈 칸 없으면 다시 큐에 적립 (다음 턴 재시도)
      playerState.hatcheryQueue.push(defId);
    }
  }
}

// ── 전투 시작 ─────────────────────────────────────────────────────────────
function startBattle(): void {
  gamePhase = 'battle';
  phaseTag.textContent = '전투 중';

  // 부화장 해금 시 동일 유닛 2기 쌍 감지 → 다음 턴 복제 예약
  if (playerState.buildings['hatchery']?.unlocked) {
    const pairs = detectHatcheryPairs();
    for (const defId of pairs) {
      if (!playerState.hatcheryQueue.includes(defId)) {
        playerState.hatcheryQueue.push(defId);
      }
    }
  }

  const p0: SimPlacement[] = board.allPlacements().flatMap(({ cellId, units }) =>
    units.map((u) => ({ cellId, defId: u.defId })),
  );
  const p1 = createAiPlacements(grid);
  // 플레이어 연구 스탯이 반영된 시뮬레이션 생성
  simState = createSimState(p0, p1, grid, Date.now() | 0, playerState.research);

  // 준비 UI 숨기기
  showShopPanel();
  hud.el.style.display   = 'none';
  shop.el.style.display  = 'none';

  battleRenderer.resize();
  lastTime    = performance.now();
  accumulator = 0;
  rafId = requestAnimationFrame(battleLoop);
}

function battleLoop(now: number): void {
  const dt = Math.min(now - lastTime, 200);
  lastTime     = now;
  accumulator += dt;

  while (accumulator >= MS_PER_TICK && simState!.phase !== 'done') {
    tick(simState!);
    accumulator -= MS_PER_TICK;
  }

  battleRenderer.draw(simState!);

  if (simState!.phase === 'done') {
    if (rafId !== null) cancelAnimationFrame(rafId);
    showSettlement(simState!.winner);
    return;
  }
  rafId = requestAnimationFrame(battleLoop);
}

// ── 정산 ─────────────────────────────────────────────────────────────────
function showSettlement(winner: 0 | 1 | 'draw' | null): void {
  gamePhase = 'settlement';
  phaseTag.textContent = '정산';

  const won    = winner === 0;
  const isDraw = winner === 'draw';
  const breakdown = calcIncome(playerState, won, isDraw);
  const prevLives = playerState.lives;
  applySettlement(playerState, breakdown, won, isDraw);
  const lostLife = !isDraw && !won; // 패배 시 목숨 -1

  const resultLabel = won ? '🎉 승리!' : isDraw ? '🤝 무승부' : '💀 패배';
  const resultColor = won ? '#4fb286' : isDraw ? '#aaa' : '#ff6b6b';

  const livesHtml = lostLife
    ? `<div class="settle-lives">목숨 ${'❤️'.repeat(prevLives)} → ${'❤️'.repeat(playerState.lives)}</div>`
    : '';

  const streakHtml = breakdown.streakBonus > 0
    ? `<div class="settle-row bonus"><span>${won ? '연승' : '연패'} 보너스</span><span>+${breakdown.streakBonus}💰</span></div>`
    : '';

  resultOverlay.style.display = 'flex';
  resultOverlay.innerHTML = `
    <div class="result-box settle-box">
      <div class="result-label" style="color:${resultColor}">${resultLabel}</div>
      ${livesHtml}
      <div class="settle-income">
        <p class="settle-title">이번 턴 수입</p>
        <div class="settle-row"><span>기본 수입</span><span>+${breakdown.base}💰</span></div>
        ${breakdown.interest > 0
          ? `<div class="settle-row"><span>이자 (${playerState.coins - breakdown.totalCoins}💰 보유)</span><span>+${breakdown.interest}💰</span></div>`
          : ''}
        <div class="settle-row"><span>${isDraw ? '' : won ? '승리' : '패배'} 보너스</span><span>+${breakdown.winLossBonus}💰</span></div>
        ${streakHtml}
        <div class="settle-row total"><span>합계</span><span>+${breakdown.totalCoins}💰 · +${breakdown.gemIncome}💎</span></div>
      </div>
      <div class="settle-totals">
        코인 <b>${playerState.coins}💰</b> &nbsp; 보석 <b>${playerState.gems}💎</b>
      </div>
      ${playerState.lives <= 0
        ? `<button class="result-btn" id="restart-btn">게임 오버 — 다시 시작</button>`
        : `<button class="result-btn" id="next-turn-btn">다음 준비기간 →</button>`}
    </div>`;

  if (playerState.lives <= 0) {
    document.getElementById('restart-btn')!.addEventListener('click', fullReset);
  } else {
    document.getElementById('next-turn-btn')!.addEventListener('click', nextTurn);
  }
}

// ── 다음 턴 ───────────────────────────────────────────────────────────────
function nextTurn(): void {
  board.clear();
  simState = null;
  gamePhase = 'prep';
  phaseTag.textContent = '준비기간';
  resultOverlay.style.display = 'none';

  // 부화장 큐 처리 → board에 무료 유닛 자동 배치
  processHatcheryQueue();

  // 패널 복구
  showShopPanel();
  hud.el.style.display  = '';
  shop.el.style.display = '';

  onPlayerStateChange();
  gridRenderer.resize();
  gridRenderer.draw();

  // 발전 방향 선택 — 7턴 이후, 아직 미선택 시 강제 오버레이
  if (playerState.turn >= 7 && !playerState.selectedDevPath) {
    devPathPanel.show(NATURE_RACE.devPaths, NATURE_UNITS, (pathId) => {
      playerState.selectedDevPath = pathId;
      board.devPathChosen = true;
      onPlayerStateChange();
    });
  }
}

// ── 전체 리셋 (게임 오버) ─────────────────────────────────────────────────
function fullReset(): void {
  playerState = createPlayerState();
  board.clear();
  board.devPathChosen = false;  // 발전 경로 초기화
  devPathPanel.hide();
  simState = null;
  gamePhase = 'prep';
  phaseTag.textContent = '준비기간';
  resultOverlay.style.display = 'none';
  buildingBar.select(null);
  showShopPanel();
  hud.el.style.display  = '';
  shop.el.style.display = '';
  onPlayerStateChange();
  gridRenderer.resize();
  gridRenderer.draw();
}
