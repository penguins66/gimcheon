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
import {
  createPlayerState, upgradeBuilding, updateDerived,
} from './game/PlayerState';
import { investStat, unlockAbility } from './game/Research';
import type { ResearchStatKey } from './game/Research';
import { calcIncome, applySettlement } from './game/Economy';
import type { SimState }       from './sim/types';
import type { PlayerState }    from './game/PlayerState';
import { isFirebaseReady, getDB } from './firebase';
import { OnlineRoom } from './game/OnlineRoom';
import type { RoomSnap }       from './game/OnlineRoom';

// ── 게임 상태 ─────────────────────────────────────────────────────────────
type GamePhase = 'prep' | 'battle' | 'settlement';
type GameMode  = '1p' | '2p' | 'online';

let gamePhase:   GamePhase = 'prep';
let gameMode:    GameMode  = '1p';
let prepOwner:   0 | 1 = 0;       // 2P 로컬: 현재 준비 중인 플레이어
let simState:    SimState | null = null;
let rafId:       number | null = null;
let lastTime    = 0;
let accumulator = 0;
const MS_PER_TICK = 1000 / 30;
let sellMode     = false;
let hatcheryMode = false;

// 온라인 상태
let onlineRoom:         OnlineRoom | null = null;
let onlineBattleArmed  = false; // 이미 배틀 트리거됐는지 (중복 방지)

// ── DOM ──────────────────────────────────────────────────────────────────
const app = document.getElementById('app')!;
app.innerHTML = `
  <header class="topbar">
    <h1>Gimcheon <span class="tag" id="phase-tag">준비기간</span></h1>
    <div class="topbar-sub" id="topbar-sub">종족: 자연 · 그리드 7×8 · 아래 4행이 내 진영</div>
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

const phaseTag      = document.getElementById('phase-tag')!;
const topbarSub     = document.getElementById('topbar-sub')!;
const resultOverlay = document.getElementById('result-overlay')!;
const canvas        = document.getElementById('board') as HTMLCanvasElement;
const sidebarTop    = document.getElementById('sidebar-top')!;
const sidebarShop   = document.getElementById('sidebar-shop')!;
const sidebarBuilding = document.getElementById('sidebar-building')!;
const bldBarHost    = document.getElementById('building-bar-host')!;

// 2P 화면 가리개
const coverEl = document.createElement('div');
coverEl.className = 'p2-cover-overlay';
coverEl.style.display = 'none';
coverEl.innerHTML = `
  <div class="p2-cover-box">
    <div class="p2-cover-icon">🔄</div>
    <h2 id="cover-title">플레이어 2 차례</h2>
    <p id="cover-desc">화면을 가린 후 준비되면 클릭하세요</p>
    <button class="result-btn" id="cover-btn">준비 시작 →</button>
  </div>`;
document.body.appendChild(coverEl);

// 온라인 대기 오버레이
const waitEl = document.createElement('div');
waitEl.className = 'p2-cover-overlay';
waitEl.style.display = 'none';
waitEl.innerHTML = `
  <div class="p2-cover-box">
    <div class="p2-cover-icon" id="wait-icon">⏳</div>
    <h2 id="wait-title">상대방 대기 중</h2>
    <p id="wait-desc">상대방이 준비를 완료하면 자동으로 시작됩니다</p>
    <button class="result-btn" id="wait-cancel" style="opacity:.6">준비 취소</button>
  </div>`;
document.body.appendChild(waitEl);
waitEl.querySelector('#wait-cancel')!.addEventListener('click', () => {
  waitEl.style.display = 'none';
  onlineBattleArmed = false;
  gamePhase = 'prep';
  // Firebase에 ready=false 기록 — 상대방이 먼저 ready여도 전투가 잘못 시작되지 않게
  onlineRoom?.cancelReady().catch(console.error);
  showShopPanel();
  hud.el.style.display  = '';
  shop.el.style.display = '';
});

// ── 보드 · 플레이어 상태 ─────────────────────────────────────────────────
const grid   = new Grid();
const board0 = new Board(grid, getRace('nature'), 0);
const board1 = new Board(grid, getRace('nature'), 1);
let p0State: PlayerState = createPlayerState();
let p1State: PlayerState = createPlayerState();

let playerState: PlayerState = p0State;
let activeBoard:  Board       = board0;

const gridRenderer   = new GridRenderer(canvas, grid, board0);
const battleRenderer = new BattleRenderer(canvas, grid);

// ── UI 컴포넌트 ──────────────────────────────────────────────────────────
const gameHud = new GameHud(sidebarTop);

const hud = new Hud(sidebarShop, board0, {
  onToggleDev: (v) => { activeBoard.devPathChosen = v; hudRefresh(); draw(); },
  onClear:     ()  => { refundAll(); hudRefresh(); draw(); },
  onStartBattle: () => {
    if (gameMode === '1p')     { startBattle(); }
    else if (gameMode === '2p') {
      if (prepOwner === 0) switchPrepToPlayer1();
      else                 startBattle();
    } else { // online
      startOnlineReady().catch(console.error);
    }
  },
  onSellMode: (active) => { sellMode = active; hud.setSellMode(active); },
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
  (id) => { if (upgradeBuilding(playerState, id)) onPlayerStateChange(); },
  () => { buildingBar.select(null); showShopPanel(); },
  () => {
    if (!playerState.buildings['hatchery']?.unlocked || playerState.hatcherySlot) return;
    hatcheryMode = true;
    hud.setHatcheryMode(true);
    showShopPanel();
    canvas.style.cursor = 'crosshair';
  },
  () => {
    if (!playerState.hatcherySlot) return;
    const { defId, mutationLevel } = playerState.hatcherySlot;
    // 배치 불가 시 슬롯 유지 (코인 환불 없음 — 이미 구매한 유닛이므로)
    if (!placeInZone(activeBoard, defId, mutationLevel)) return;
    playerState.hatcherySlot = null;
    onPlayerStateChange();
    buildingPanel.refresh(playerState);
  },
);

const boardCanvasArea = canvas.parentElement!;
const devPathPanel = new DevPathPanel(boardCanvasArea);

const researchPanel = new ResearchPanel(
  sidebarBuilding, NATURE_UNITS,
  () => { if (upgradeBuilding(playerState, 'researchLab')) onPlayerStateChange(); },
  (unitId: string, stat: ResearchStatKey) => {
    const def = getUnit(unitId);
    const nodeDef = def.research?.[stat];
    if (nodeDef && investStat(playerState, unitId, stat, nodeDef)) onPlayerStateChange();
  },
  (unitId: string) => {
    const abilityNode = getUnit(unitId).research?.ability;
    if (abilityNode && unlockAbility(playerState, unitId, abilityNode)) onPlayerStateChange();
  },
  () => { buildingBar.select(null); showShopPanel(); },
);

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

function onPlayerStateChange(): void {
  updateDerived(playerState);
  activeBoard.currentCap = playerState.unitCap;
  hudRefresh();
  buildingBar.refresh(playerState);
  buildingPanel.refresh(playerState);
  researchPanel.refresh(playerState);
  shop.refresh(playerState.coins, playerState.maxTier, playerState.selectedDevPath);
  draw();
}
function hudRefresh(): void {
  gameHud.refresh(playerState);
  hud.board = activeBoard;
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
  gridRenderer.hoverCell = cellFromEvent(e); draw();
});
canvas.addEventListener('mouseleave', () => {
  gridRenderer.hoverCell = null;
  if (gamePhase === 'prep') draw();
});
canvas.addEventListener('click', (e) => {
  if (gamePhase !== 'prep') return;
  const cellId = cellFromEvent(e);
  if (cellId === null) return;

  if (hatcheryMode) {
    const top = activeBoard.unitsAt(cellId).at(-1);
    if (top) {
      activeBoard.removeTopAt(cellId);
      playerState.hatcherySlot = { defId: top.defId, mutationLevel: top.mutationLevel };
      hatcheryMode = false;
      hud.setHatcheryMode(false);
      canvas.style.cursor = '';
      onPlayerStateChange();
      buildingPanel.load('hatchery', playerState);
    }
    return;
  }
  if (sellMode) {
    const top = activeBoard.unitsAt(cellId).at(-1);
    if (top && activeBoard.removeTopAt(cellId)) {
      playerState.coins += getUnit(top.defId).cost;
      onPlayerStateChange();
    }
    return;
  }
  if (!shop.selectedId) return;
  const def = getUnit(shop.selectedId);
  if (def.tier > playerState.maxTier || playerState.coins < def.cost) return;
  if (activeBoard.place(cellId, shop.selectedId)) {
    playerState.coins -= def.cost;
    onPlayerStateChange();
  }
});
canvas.addEventListener('contextmenu', (e) => {
  e.preventDefault();
  if (gamePhase !== 'prep') return;
  if (hatcheryMode) {
    hatcheryMode = false; hud.setHatcheryMode(false); canvas.style.cursor = '';
    buildingPanel.load('hatchery', playerState); return;
  }
  const cellId = cellFromEvent(e);
  if (cellId === null) return;
  const top = activeBoard.unitsAt(cellId).at(-1);
  if (top && activeBoard.removeTopAt(cellId)) {
    playerState.coins += getUnit(top.defId).cost;
    onPlayerStateChange();
  }
});

function refundAll(): void {
  for (const { units } of activeBoard.allPlacements()) {
    for (const u of units) playerState.coins += getUnit(u.defId).cost;
  }
  activeBoard.clear();
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

// ── 2P 로컬: 준비 턴 전환 ────────────────────────────────────────────────
function switchPrepToPlayer1(): void {
  coverEl.style.display = 'flex';
  (coverEl.querySelector('#cover-title') as HTMLElement).textContent = '플레이어 2 차례';
  (coverEl.querySelector('#cover-desc')  as HTMLElement).textContent = '화면을 가린 후 플레이어 2가 준비되면 클릭하세요';
  (coverEl.querySelector('#cover-btn')   as HTMLButtonElement).textContent = '플레이어 2 준비 시작 →';
  coverEl.querySelector('#cover-btn')!.addEventListener('click', () => {
    coverEl.style.display = 'none';
    activatePlayer(1);
  }, { once: true });
}

function activatePlayer(owner: 0 | 1): void {
  prepOwner   = owner;
  playerState = owner === 0 ? p0State : p1State;
  activeBoard = owner === 0 ? board0 : board1;
  gridRenderer.board          = activeBoard;
  gridRenderer.secondaryBoard = gameMode === '2p'
    ? (owner === 0 ? board1 : board0) : null;
  activeBoard.devPathChosen = !!playerState.selectedDevPath;
  activeBoard.currentCap    = playerState.unitCap;
  hud.board = activeBoard;

  if (gameMode === '2p') {
    phaseTag.textContent = `준비기간 — P${owner + 1}`;
    topbarSub.textContent = owner === 0
      ? '플레이어 1 · 아래 4행에 유닛 배치 후 [준비완료] 클릭'
      : '플레이어 2 · 위 4행에 유닛 배치 후 [전투시작] 클릭';
    hud.setBattleBtnText(owner === 0 ? '✔ 준비완료 →' : '⚔ 전투 시작');
  } else {
    phaseTag.textContent  = '준비기간';
    topbarSub.textContent = '종족: 자연 · 그리드 7×8 · 아래 4행이 내 진영';
    hud.setBattleBtnText('⚔ 전투 시작');
  }

  onPlayerStateChange();
  showShopPanel();
  gridRenderer.resize();
  gridRenderer.draw();

  if (playerState.turn >= 7 && !playerState.selectedDevPath) {
    devPathPanel.show(NATURE_RACE.devPaths, NATURE_UNITS, (pathId) => {
      playerState.selectedDevPath = pathId;
      activeBoard.devPathChosen   = true;
      onPlayerStateChange();
    });
  }
}

// ── 공통 전투 시작 (시뮬레이션 생성 + 루프) ─────────────────────────────
function launchBattle(
  p0Placements: SimPlacement[], p1Placements: SimPlacement[],
  p0Research: Record<string, number>, p1Research: Record<string, number>,
  seed: number,
): void {
  try {
    simState = createSimState(p0Placements, p1Placements, grid, seed, p0Research, p1Research);
  } catch (err) {
    console.error('[launchBattle]', err);
    gamePhase = 'prep'; phaseTag.textContent = '준비기간'; return;
  }
  gamePhase = 'battle';
  phaseTag.textContent = '전투 중';
  topbarSub.textContent = '전투 진행 중';
  showShopPanel();
  hud.el.style.display  = 'none';
  shop.el.style.display = 'none';
  battleRenderer.resize();
  lastTime    = performance.now();
  accumulator = 0;
  rafId = requestAnimationFrame(battleLoop);
}

function battleLoop(now: number): void {
  const dt = Math.min(now - lastTime, 200);
  lastTime = now; accumulator += dt;
  while (accumulator >= MS_PER_TICK && simState!.phase !== 'done') {
    tick(simState!); accumulator -= MS_PER_TICK;
  }
  battleRenderer.draw(simState!);
  if (simState!.phase === 'done') {
    if (rafId !== null) cancelAnimationFrame(rafId);
    showSettlement(simState!.winner);
    return;
  }
  rafId = requestAnimationFrame(battleLoop);
}

// ── 1P / 2P 로컬 전투 시작 ───────────────────────────────────────────────
function startBattle(): void {
  if (gamePhase !== 'prep') return;
  if (hatcheryMode) { hatcheryMode = false; hud.setHatcheryMode(false); canvas.style.cursor = ''; }

  const p0Empty = board0.totalPlaced() === 0;
  if (p0Empty) { hud.el.style.display='none'; shop.el.style.display='none'; showSettlement(1); return; }

  [{ ps: p0State }, { ps: p1State }].forEach(({ ps }) => {
    if (ps.hatcherySlot) {
      ps.hatcheryQueue.push({ defId: ps.hatcherySlot.defId, mutationLevel: ps.hatcherySlot.mutationLevel + 1 });
      ps.hatcherySlot = null;
    }
  });

  const p0Pl: SimPlacement[] = board0.allPlacements().flatMap(({ cellId, units }) =>
    units.map(u => ({ cellId, defId: u.defId, mutationLevel: u.mutationLevel })));
  const p1Pl: SimPlacement[] = gameMode === '2p'
    ? board1.allPlacements().flatMap(({ cellId, units }) =>
        units.map(u => ({ cellId, defId: u.defId, mutationLevel: u.mutationLevel })))
    : createAiPlacements(grid, p0State.turn);

  launchBattle(p0Pl, p1Pl, p0State.research, gameMode === '2p' ? p1State.research : {}, Date.now() | 0);
}

// ── 온라인: 준비완료 버튼 ────────────────────────────────────────────────
async function startOnlineReady(): Promise<void> {
  if (!onlineRoom || gamePhase !== 'prep') return;
  if (hatcheryMode) { hatcheryMode = false; hud.setHatcheryMode(false); canvas.style.cursor = ''; }

  // 부화장 슬롯 → 큐
  if (playerState.hatcherySlot) {
    playerState.hatcheryQueue.push({
      defId: playerState.hatcherySlot.defId,
      mutationLevel: playerState.hatcherySlot.mutationLevel + 1,
    });
    playerState.hatcherySlot = null;
  }

  const placements = board0.allPlacements().flatMap(({ cellId, units }) =>
    units.map(u => ({ cellId, defId: u.defId, mutationLevel: u.mutationLevel })));

  // await 전에 설정해야 리스너 타이밍과 충돌 없음
  onlineBattleArmed = true;
  waitEl.style.display = 'flex';
  (waitEl.querySelector('#wait-icon') as HTMLElement).textContent = '⏳';
  (waitEl.querySelector('#wait-title') as HTMLElement).textContent = '상대방 준비 중...';
  (waitEl.querySelector('#wait-desc') as HTMLElement).textContent = '상대방이 준비완료를 클릭하면 전투가 시작됩니다';

  try {
    await onlineRoom.setReady(playerState, placements);
  } catch (err) {
    console.error('[setReady 실패]', err);
    onlineBattleArmed = false;
    waitEl.style.display = 'none';
    (waitEl.querySelector('#wait-desc') as HTMLElement).textContent = '';
    alert('준비 업로드 실패: ' + String(err));
    return;
  }

  // 백업 체크: onValue 콜백 타이밍이 맞지 않았을 경우 대비
  if (onlineBattleArmed) {
    try {
      const snap = await onlineRoom.fetchSnap();
      if (snap) handleRoomChange(snap);
    } catch { /* 무시 — onValue가 처리 */ }
  }
}

// ── 온라인: 방 상태 변경 핸들러 ─────────────────────────────────────────
function handleRoomChange(snap: RoomSnap): void {
  // 양쪽 준비 + 씨드 있음 → 배틀 시작
  if (snap.p0?.ready && snap.p1?.ready && snap.seed != null
      && onlineBattleArmed && gamePhase === 'prep') {
    onlineBattleArmed = false;
    waitEl.style.display = 'none';
    startOnlineBattle(snap);
  }
}

// ── 온라인: 시뮬레이션 시작 ─────────────────────────────────────────────
function startOnlineBattle(snap: RoomSnap): void {
  // 양쪽 클라이언트가 동일한 시뮬레이션을 실행하도록
  // 항상 snap.p0/p1 기준으로 구성 (myOwner에 무관하게 동일)
  // P0 유닛: 하단 행 그대로 (시뮬레이션 P0 진영)
  // P1 유닛: 하단 행 → 상단 행 미러 (시뮬레이션 P1 진영)
  const p0Pl: SimPlacement[] = (snap.p0?.placements ?? []).map(p => ({
    cellId: p.cellId, defId: p.defId, mutationLevel: p.mutationLevel ?? 0,
  }));
  const p1Pl: SimPlacement[] = (snap.p1?.placements ?? []).map(p => ({
    cellId: OnlineRoom.mirrorCell(p.cellId, grid),
    defId:  p.defId, mutationLevel: p.mutationLevel ?? 0,
  }));

  launchBattle(p0Pl, p1Pl, snap.p0!.research, snap.p1!.research, snap.seed!);
}

// ── 정산 ─────────────────────────────────────────────────────────────────
function showSettlement(winner: 0 | 1 | 'draw' | null): void {
  gamePhase = 'settlement';
  phaseTag.textContent = '정산';
  if (gameMode === 'online') showSettlementOnline(winner);
  else if (gameMode === '2p') showSettlement2P(winner);
  else showSettlement1P(winner);
}

function showSettlement1P(winner: 0 | 1 | 'draw' | null): void {
  const won = winner === 0, isDraw = winner === 'draw';
  const bd = calcIncome(p0State, won, isDraw);
  const prev = p0State.lives;
  applySettlement(p0State, bd, won, isDraw);

  const lbl = won ? '🎉 승리!' : isDraw ? '🤝 무승부' : '💀 패배';
  const col = won ? '#4fb286' : isDraw ? '#aaa' : '#ff6b6b';
  const hatchHtml = hatchQueueHtml(p0State);

  resultOverlay.style.display = 'flex';
  resultOverlay.innerHTML = `
    <div class="result-box settle-box">
      <div class="result-label" style="color:${col}">${lbl}</div>
      ${!isDraw && !won ? `<div class="settle-lives">목숨 ${'❤️'.repeat(prev)} → ${'❤️'.repeat(p0State.lives)}</div>` : ''}
      <div class="settle-income">
        <p class="settle-title">이번 턴 수입</p>
        <div class="settle-row"><span>기본 수입</span><span>+${bd.base}💰</span></div>
        ${bd.interest > 0 ? `<div class="settle-row"><span>이자</span><span>+${bd.interest}💰</span></div>` : ''}
        <div class="settle-row"><span>${isDraw?'':'승리/패배'} 보너스</span><span>+${bd.winLossBonus}💰</span></div>
        ${bd.streakBonus > 0 ? `<div class="settle-row bonus"><span>연속 보너스</span><span>+${bd.streakBonus}💰</span></div>` : ''}
        ${hatchHtml}
        <div class="settle-row total"><span>합계</span><span>+${bd.totalCoins}💰 · +${bd.gemIncome}💎</span></div>
      </div>
      <div class="settle-totals">코인 <b>${p0State.coins}💰</b> &nbsp; 보석 <b>${p0State.gems}💎</b></div>
      ${p0State.lives <= 0
        ? `<button class="result-btn" id="restart-btn">게임 오버 — 다시 시작</button>`
        : `<button class="result-btn" id="next-turn-btn">다음 준비기간 →</button>`}
    </div>`;

  if (p0State.lives <= 0) {
    document.getElementById('restart-btn')!.addEventListener('click', fullReset);
  } else {
    document.getElementById('next-turn-btn')!.addEventListener('click', nextTurn);
  }
  gameHud.refresh(p0State);
}

function showSettlement2P(winner: 0 | 1 | 'draw' | null): void {
  const isDraw = winner === 'draw';
  const bd0 = calcIncome(p0State, winner===0, isDraw);
  const bd1 = calcIncome(p1State, winner===1, isDraw);
  const prev0 = p0State.lives, prev1 = p1State.lives;
  applySettlement(p0State, bd0, winner===0, isDraw);
  applySettlement(p1State, bd1, winner===1, isDraw);

  const lbl = isDraw ? '🤝 무승부' : winner===0 ? '🎉 P1 승리!' : '🎉 P2 승리!';
  const col = isDraw ? '#aaa' : '#4fb286';
  const pRow = (ps: PlayerState, won: boolean, bd: ReturnType<typeof calcIncome>, label: string, prev: number) => `
    <div class="settle-p-col">
      <p class="settle-p-label">${label}</p>
      <p style="color:${won?'#4fb286':isDraw?'#aaa':'#ff6b6b'};font-weight:700;font-size:14px">${won?'승리':isDraw?'무승부':'패배'}</p>
      <p style="font-size:12px;color:var(--muted)">목숨 ${'❤️'.repeat(prev)} → ${'❤️'.repeat(ps.lives)}</p>
      <div class="settle-row" style="margin-top:6px"><span>수입</span><span>+${bd.totalCoins}💰</span></div>
      <div class="settle-row"><span>보석</span><span>+${bd.gemIncome}💎</span></div>
    </div>`;

  const gameOver0 = p0State.lives <= 0, gameOver1 = p1State.lives <= 0;
  const bottomBtn = (gameOver0 || gameOver1)
    ? `<button class="result-btn" id="restart-btn">다시 시작</button>`
    : `<button class="result-btn" id="next-turn-btn">다음 준비기간 →</button>`;

  resultOverlay.style.display = 'flex';
  resultOverlay.innerHTML = `
    <div class="result-box settle-box">
      <div class="result-label" style="color:${col};font-size:20px">${lbl}</div>
      <div class="settle-2p-row">
        ${pRow(p0State, winner===0, bd0, '🟦 플레이어 1', prev0)}
        <div class="settle-2p-vs">VS</div>
        ${pRow(p1State, winner===1, bd1, '🟥 플레이어 2', prev1)}
      </div>
      ${bottomBtn}
    </div>`;

  playerState = p0State; activeBoard = board0;
  gameHud.refresh(p0State);
  document.getElementById('restart-btn')?.addEventListener('click', fullReset);
  document.getElementById('next-turn-btn')?.addEventListener('click', nextTurn);
}

function showSettlementOnline(winner: 0 | 1 | 'draw' | null): void {
  const myOwner = onlineRoom!.myOwner;
  const myWon   = winner === myOwner;
  const isDraw  = winner === 'draw';
  const bd = calcIncome(playerState, myWon, isDraw);
  const prev = playerState.lives;
  applySettlement(playerState, bd, myWon, isDraw);

  const lbl = myWon ? '🎉 승리!' : isDraw ? '🤝 무승부' : '💀 패배';
  const col = myWon ? '#4fb286' : isDraw ? '#aaa' : '#ff6b6b';
  const hatch = hatchQueueHtml(playerState);

  resultOverlay.style.display = 'flex';
  resultOverlay.innerHTML = `
    <div class="result-box settle-box">
      <div class="result-label" style="color:${col}">${lbl}</div>
      ${!myWon && !isDraw ? `<div class="settle-lives">목숨 ${'❤️'.repeat(prev)} → ${'❤️'.repeat(playerState.lives)}</div>` : ''}
      <div class="settle-income">
        <p class="settle-title">이번 턴 수입</p>
        <div class="settle-row"><span>기본 수입</span><span>+${bd.base}💰</span></div>
        ${bd.interest>0?`<div class="settle-row"><span>이자</span><span>+${bd.interest}💰</span></div>`:''}
        <div class="settle-row"><span>승패 보너스</span><span>+${bd.winLossBonus}💰</span></div>
        ${bd.streakBonus>0?`<div class="settle-row bonus"><span>연속 보너스</span><span>+${bd.streakBonus}💰</span></div>`:''}
        ${hatch}
        <div class="settle-row total"><span>합계</span><span>+${bd.totalCoins}💰 · +${bd.gemIncome}💎</span></div>
      </div>
      <div class="settle-totals">코인 <b>${playerState.coins}💰</b> &nbsp; 보석 <b>${playerState.gems}💎</b></div>
      ${playerState.lives <= 0
        ? `<button class="result-btn" id="restart-btn">게임 종료</button>`
        : `<button class="result-btn" id="next-turn-btn">다음 준비기간 →</button>`}
    </div>`;

  gameHud.refresh(playerState);

  // Firebase 상태 업데이트 (비동기, fire-and-forget)
  onlineRoom!.setUnready(playerState).catch(console.error);

  document.getElementById('restart-btn')?.addEventListener('click', fullReset);
  document.getElementById('next-turn-btn')?.addEventListener('click', nextTurn);
}

function hatchQueueHtml(ps: PlayerState): string {
  if (!ps.hatcheryQueue.length) return '';
  const items = ps.hatcheryQueue.map(e => {
    try { const d = getUnit(e.defId); return `${d.visual.emoji??''} ${d.name}`; }
    catch { return e.defId; }
  }).join(' · ');
  return `<div class="settle-row" style="color:#ffd700"><span>🥚 부화 완료</span><span>${items}</span></div>`;
}

// ── 부화장 큐 배치 헬퍼 ──────────────────────────────────────────────────
function placeInZone(b: Board, defId: string, mutationLevel: number): boolean {
  const isP1 = b.placerOwner === 1;
  const startRow = isP1 ? 0 : grid.rows - grid.playerRows;
  const endRow   = isP1 ? grid.rows - grid.playerRows : grid.rows;
  for (let row = startRow; row < endRow; row++) {
    for (let col = 0; col < grid.cols; col++) {
      const cid = grid.cellId(col, row);
      if (b.canPlaceAt(cid)) { b.place(cid, defId, mutationLevel); return true; }
    }
  }
  return false;
}

function processHatcheryQueue(ps: PlayerState, b: Board): void {
  if (!ps.hatcheryQueue.length) return;
  const toAdd = [...ps.hatcheryQueue];
  ps.hatcheryQueue = [];
  for (const { defId, mutationLevel } of toAdd) {
    if (!placeInZone(b, defId, mutationLevel)) ps.hatcheryQueue.push({ defId, mutationLevel });
  }
}

// ── 다음 턴 ───────────────────────────────────────────────────────────────
function nextTurn(): void {
  if (gamePhase !== 'settlement') return;
  simState = null; sellMode = false; hud.setSellMode(false);
  gamePhase = 'prep';
  resultOverlay.style.display = 'none';

  if (gameMode === 'online') {
    // 온라인: board0만 사용
    processHatcheryQueue(playerState, board0);
    activatePlayer(0);
  } else {
    processHatcheryQueue(p0State, board0);
    if (gameMode === '2p') processHatcheryQueue(p1State, board1);
    activatePlayer(0);
  }

  showShopPanel();
  hud.el.style.display  = '';
  shop.el.style.display = '';
}

// ── 전체 리셋 ─────────────────────────────────────────────────────────────
function fullReset(): void {
  onlineRoom?.dispose();
  onlineRoom = null;
  onlineBattleArmed = false;
  waitEl.style.display = 'none';

  p0State = createPlayerState(); p1State = createPlayerState();
  playerState = p0State; activeBoard = board0; prepOwner = 0;
  board0.clear(); board0.devPathChosen = false;
  board1.clear(); board1.devPathChosen = false;
  devPathPanel.hide();
  sellMode = false; hatcheryMode = false;
  hud.setSellMode(false); hud.setHatcheryMode(false);
  canvas.style.cursor = '';
  simState = null; gamePhase = 'prep';
  resultOverlay.style.display = 'none';
  buildingBar.select(null);
  gridRenderer.board = board0; gridRenderer.secondaryBoard = null;
  hud.board = board0; coverEl.style.display = 'none';
  onPlayerStateChange();
  activatePlayer(0);
  showShopPanel();
  hud.el.style.display = ''; shop.el.style.display = '';
  showModeSelect();
}

// ── 모드 선택 오버레이 ────────────────────────────────────────────────────
function showModeSelect(): void {
  const el = document.createElement('div');
  el.className = 'mode-select-overlay';
  const fbReady = isFirebaseReady();
  el.innerHTML = `
    <div class="mode-select-box">
      <h2 class="mode-select-title">⚔️ Gimcheon</h2>
      <p class="mode-select-sub">게임 모드를 선택하세요</p>
      <button class="mode-btn" id="mode-1p">🤖 1인 플레이<span>vs AI</span></button>
      <button class="mode-btn" id="mode-2p">👥 로컬 2인<span>같은 화면에서 번갈아 플레이</span></button>
      <button class="mode-btn ${!fbReady ? 'mode-btn-disabled' : ''}" id="mode-online"
        ${!fbReady ? 'title="Firebase 미설정 — .env.local 파일이 필요합니다"' : ''}>
        🌐 온라인 대전<span>${fbReady ? '다른 기기 · 다른 와이파이도 OK' : 'Firebase 미설정 — .env.local 필요'}</span>
      </button>
    </div>`;
  document.body.appendChild(el);

  el.querySelector('#mode-1p')!.addEventListener('click', () => {
    gameMode = '1p'; el.remove();
    activatePlayer(0); showTutorial();
  });
  el.querySelector('#mode-2p')!.addEventListener('click', () => {
    gameMode = '2p'; p1State = createPlayerState(); el.remove();
    activatePlayer(0);
    gridRenderer.secondaryBoard = board1;
    showTutorial();
  });
  el.querySelector('#mode-online')!.addEventListener('click', () => {
    if (!fbReady) return;
    gameMode = 'online'; el.remove();
    showOnlineLobby();
  });
}

// ── 온라인 로비 ──────────────────────────────────────────────────────────
function showOnlineLobby(): void {
  const el = document.createElement('div');
  el.className = 'mode-select-overlay';
  el.innerHTML = `
    <div class="mode-select-box" style="max-width:420px">
      <h2 class="mode-select-title">🌐 온라인 대전</h2>
      <p class="mode-select-sub">방을 만들거나 코드를 입력해 참여하세요</p>
      <button class="mode-btn" id="lobby-create">방 만들기<span>4자리 코드 생성 → 상대방에게 공유</span></button>
      <div style="display:flex;gap:8px;width:100%">
        <input id="lobby-code" class="lobby-code-input" placeholder="ABCD" maxlength="4"
               style="flex:1;padding:12px;background:#0d1217;border:1px solid #2b3b46;border-radius:8px;color:#dce6ee;font-size:18px;text-align:center;letter-spacing:4px;text-transform:uppercase">
        <button class="mode-btn" id="lobby-join" style="flex:0 0 auto;padding:12px 20px">참여</button>
      </div>
      <p class="lobby-status" id="lobby-status" style="color:var(--muted);font-size:12px;min-height:18px"></p>
      <button class="result-btn" id="lobby-back" style="align-self:center">← 뒤로</button>
    </div>`;
  document.body.appendChild(el);

  const setStatus = (msg: string, color = 'var(--muted)') => {
    const s = el.querySelector('#lobby-status') as HTMLElement;
    s.textContent = msg; s.style.color = color;
  };

  el.querySelector('#lobby-back')!.addEventListener('click', () => {
    el.remove(); gameMode = '1p'; showModeSelect();
  });

  // 방 만들기
  el.querySelector('#lobby-create')!.addEventListener('click', async () => {
    setStatus('방 생성 중...');
    try {
      const { code, room } = await OnlineRoom.create(getDB());
      onlineRoom = room;
      el.innerHTML = `
        <div class="mode-select-box" style="max-width:420px">
          <h2 class="mode-select-title">🌐 대기 중</h2>
          <p class="mode-select-sub">상대방에게 코드를 알려주세요</p>
          <div class="lobby-room-code">${code}</div>
          <p style="color:var(--muted);font-size:12px">상대방이 입장하면 자동으로 시작됩니다</p>
          <p id="lobby-wait-status" style="color:var(--accent);font-size:13px">⏳ 상대방 대기 중...</p>
        </div>`;
      // 상대방 입장 감지
      room.listen((snap) => {
        if (snap.p1?.connected) {
          el.remove();
          // P1의 초기 상태로 내 playerState 업데이트는 없음 (각자 독립)
          lobbyEnterGame(room);
        }
      });
    } catch (e) {
      setStatus('방 생성 실패: ' + String(e), '#ff6b6b');
    }
  });

  // 방 참여
  el.querySelector('#lobby-join')!.addEventListener('click', async () => {
    const code = (el.querySelector('#lobby-code') as HTMLInputElement).value.toUpperCase().trim();
    if (code.length !== 4) { setStatus('4자리 코드를 입력하세요', '#ff6b6b'); return; }
    setStatus('방 입장 중...');
    try {
      const room = await OnlineRoom.join(getDB(), code);
      if (!room) { setStatus('방을 찾을 수 없거나 이미 가득 찼습니다', '#ff6b6b'); return; }
      onlineRoom = room;
      el.remove();
      lobbyEnterGame(room);
    } catch (e) {
      setStatus('입장 실패: ' + String(e), '#ff6b6b');
    }
  });

  // 코드 입력 시 대문자로
  (el.querySelector('#lobby-code') as HTMLInputElement).addEventListener('input', (e) => {
    const inp = e.target as HTMLInputElement;
    inp.value = inp.value.toUpperCase();
  });
}

function lobbyEnterGame(room: OnlineRoom): void {
  gameMode = 'online';
  p0State = createPlayerState();
  playerState = p0State;
  activeBoard = board0;
  gridRenderer.board = board0;
  gridRenderer.secondaryBoard = null;
  hud.board = board0;

  // 온라인: 내 소유자 표시
  const ownerLabel = room.myOwner === 0 ? '🟦 P1 (방장)' : '🟥 P2 (입장)';
  phaseTag.textContent = '준비기간';
  topbarSub.textContent = `온라인 대전 · ${ownerLabel} · 아래 4행에 유닛 배치`;
  hud.setBattleBtnText('✔ 준비완료');

  // 방 리스너 등록 (기존 리스너 대체)
  room.dispose();
  room.listen(handleRoomChange);

  onPlayerStateChange();
  showShopPanel();
  hud.el.style.display  = '';
  shop.el.style.display = '';
  gridRenderer.resize(); gridRenderer.draw();
}

// ── 튜토리얼 ─────────────────────────────────────────────────────────────
function showTutorial(): void {
  const STEPS = [
    { icon:'🖱️', title:'기본 조작', items:[
      '🖱 <b>클릭</b>: 선택한 유닛을 내 진영에 배치',
      '🔁 <b>우클릭</b>: 유닛 즉시 환불',
      '⚔️ <b>[전투 시작]</b> 버튼으로 배치 완료 후 전투 시작',
      '🔄 전투가 끝나도 보드의 유닛은 그대로 유지됩니다',
    ]},
    { icon:'💰', title:'경제 시스템', items:[
      '💰 매 턴 <b>기본 수입 5코인</b> — 승패에 따라 보너스',
      '📈 <b>이자 수입</b>: 보유 코인 10개당 +1코인 (최대 +5)',
      '🏆 <b>연승/연패 보너스</b>: 연속 결과에 따라 추가 코인',
      '💎 <b>보석</b>: 매 전투마다 획득 — 연구소에서 강화에 사용',
    ]},
    { icon:'🏠', title:'건물 & 연구', items:[
      '🏠 하단 <b>건물 바</b>에서 건물 클릭 → 코인·보석으로 업그레이드',
      '🔬 <b>연구소</b>: 보석💎으로 유닛 스탯 강화 & 어빌리티 해금',
      '🥚 <b>부화장</b>: 유닛 1기 투입 → 다음 턴 +20% 돌연변이로 귀환',
    ]},
    { icon:'🗡️', title:'유닛 레이어', items:[
      '🛡 <b>지상</b>: 기본 유닛 — 모두 공격 가능',
      '🌊 <b>공중</b>: 원거리·공중 유닛만 공격 가능',
      '🌑 <b>지하</b>: 평소엔 무적! 공격하는 순간만 2초 노출',
    ]},
    { icon:'🎯', title:'발전 방향', items:[
      '🌿 <b>7턴부터</b> 발전 방향 선택 — 고대 또는 지하',
      '🦕 <b>고대(Ancient)</b>: 티라노·매머드·돌거북·드래곤 해금',
      '🌑 <b>지하(Underground)</b>: 전갈·오소리·굼벵이·데스웜 해금',
    ]},
  ] as const;

  let current = 0;
  const el = document.createElement('div');
  el.className = 'tutorial-overlay';
  document.body.appendChild(el);

  function render(): void {
    const s = STEPS[current];
    const isFirst = current === 0, isLast = current === STEPS.length - 1;
    const dots = STEPS.map((_,i) => `<span class="tutorial-dot${i===current?' active':''}"></span>`).join('');
    const items = s.items.map(item => `<p>${item}</p>`).join('');
    el.innerHTML = `
      <div class="tutorial-box">
        <h2 class="tutorial-title">⚔️ Gimcheon</h2>
        <div class="tutorial-step-header">${s.icon} ${s.title}
          <span style="font-size:11px;color:var(--muted);font-weight:400;margin-left:6px">${current+1}/${STEPS.length}</span>
        </div>
        <div class="tutorial-list">${items}</div>
        <div class="tutorial-step-dots">${dots}</div>
        <div class="tutorial-nav">
          ${!isFirst ? `<button class="result-btn tutorial-nav-btn" id="tut-prev">← 이전</button>` : `<span style="flex:1"></span>`}
          ${!isLast
            ? `<button class="result-btn tutorial-nav-btn" id="tut-next">다음 →</button>`
            : `<button class="result-btn tutorial-start-btn" id="tut-close">시작하기 →</button>`}
        </div>
      </div>`;
    document.getElementById('tut-prev')?.addEventListener('click', () => { current--; render(); });
    document.getElementById('tut-next')?.addEventListener('click', () => { current++; render(); });
    document.getElementById('tut-close')?.addEventListener('click', () => el.remove());
  }
  render();
}

// ── 초기화 ────────────────────────────────────────────────────────────────
hudRefresh();
showShopPanel();
activatePlayer(0);

new ResizeObserver(() => resizeAndDraw()).observe(canvas.parentElement ?? canvas);
window.addEventListener('resize', resizeAndDraw);
resizeAndDraw();
setTimeout(resizeAndDraw, 50);
setTimeout(resizeAndDraw, 200);

showModeSelect();

if (import.meta.env.DEV) {
  (window as any).__debug = {
    getPhase:     () => gamePhase,
    getMode:      () => gameMode,
    getOnlineOwner: () => onlineRoom?.myOwner,
    getCoins:     () => playerState.coins,
    addGems:      (n: number) => { playerState.gems += n; onPlayerStateChange(); },
  };
}
