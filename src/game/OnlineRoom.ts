// ── 온라인 방 관리 ────────────────────────────────────────────────────────
// 구조: rooms/{code}/p0, p1, seed, winner
// 흐름: waiting → (양쪽 ready) → battle(seed 생성) → settlement → 반복
import type { Database, DatabaseReference } from 'firebase/database';
import { ref, set, get, onValue, update } from 'firebase/database';
import type { PlayerState, HatcheryEntry } from './PlayerState';
import type { Grid } from './Grid';

// Firebase에 저장하는 플레이어 스냅샷
export interface OnlinePlayerSnap {
  connected:         boolean;
  ready:             boolean;
  placements:        Array<{ cellId: number; defId: string; mutationLevel: number }>;
  research:          Record<string, number>;
  era:               number;   // 인간 종족 시대 (1~5). 자연은 1.
  coins:             number;
  gems:              number;
  lives:             number;
  turn:              number;
  consecutiveWins:   number;
  consecutiveLosses: number;
  buildings:         Record<string, { level: number; unlocked: boolean }>;
  selectedDevPath:   string | null;
  hatcheryQueue:     HatcheryEntry[];
  hatcherySlot:      HatcheryEntry | null;
}

// 방 전체 스냅샷
export interface RoomSnap {
  seed:   number | null;
  p0:     OnlinePlayerSnap | null;
  p1:     OnlinePlayerSnap | null;
  winner: 0 | 1 | 'draw' | null;
}

// PlayerState → Firebase 스냅샷 변환
function toSnap(
  ps: PlayerState,
  placements: OnlinePlayerSnap['placements'],
  ready: boolean,
): OnlinePlayerSnap {
  return {
    connected: true, ready, placements,
    research: { ...ps.research },
    era: ps.era ?? 1,
    coins: ps.coins, gems: ps.gems, lives: ps.lives, turn: ps.turn,
    consecutiveWins:   ps.consecutiveWins,
    consecutiveLosses: ps.consecutiveLosses,
    buildings: JSON.parse(JSON.stringify(ps.buildings)),
    selectedDevPath: ps.selectedDevPath,
    hatcheryQueue: [...ps.hatcheryQueue],
    hatcherySlot:  ps.hatcherySlot ? { ...ps.hatcherySlot } : null,
  };
}

// Firebase 스냅샷 → PlayerState에 덮어쓰기
export function applySnap(ps: PlayerState, snap: OnlinePlayerSnap): void {
  ps.coins             = snap.coins;
  ps.gems              = snap.gems;
  ps.lives             = snap.lives;
  ps.turn              = snap.turn;
  ps.consecutiveWins   = snap.consecutiveWins;
  ps.consecutiveLosses = snap.consecutiveLosses;
  ps.research          = { ...snap.research };
  ps.buildings         = JSON.parse(JSON.stringify(snap.buildings));
  ps.selectedDevPath   = snap.selectedDevPath;
  ps.hatcheryQueue     = snap.hatcheryQueue ? [...snap.hatcheryQueue] : [];
  ps.hatcherySlot      = snap.hatcherySlot  ? { ...snap.hatcherySlot }  : null;
}

function defaultSnap(): OnlinePlayerSnap {
  // 방 생성/입장 시점에는 종족이 미결정 → 공통 건물 3개만 포함.
  // 실제 종족별 상태는 setReady() 호출 시 toSnap()으로 완전히 덮어씀.
  return {
    connected: true, ready: false, placements: [], research: {},
    era: 1,  // 기본값; 인간=선사, 자연=무시
    coins: 10, gems: 0, lives: 6, turn: 1,
    consecutiveWins: 0, consecutiveLosses: 0,
    buildings: {
      production:  { level: 1, unlocked: true },
      researchLab: { level: 1, unlocked: true },
      capacity:    { level: 1, unlocked: true },
    },
    selectedDevPath: null, hatcheryQueue: [], hatcherySlot: null,
  };
}

// ── 방 클래스 ─────────────────────────────────────────────────────────────
export class OnlineRoom {
  readonly code:    string;
  readonly myOwner: 0 | 1;
  private db:       Database;
  private roomRef:  DatabaseReference;
  private unsub:    (() => void) | null = null;

  constructor(code: string, myOwner: 0 | 1, db: Database) {
    this.code    = code;
    this.myOwner = myOwner;
    this.db      = db;
    this.roomRef = ref(db, `rooms/${code}`);
  }

  get myKey():  'p0' | 'p1' { return this.myOwner === 0 ? 'p0' : 'p1'; }
  get oppKey(): 'p0' | 'p1' { return this.myOwner === 0 ? 'p1' : 'p0'; }

  /** 준비완료: 배치 + 상태 업로드 (단일 write) */
  async setReady(ps: PlayerState, placements: OnlinePlayerSnap['placements']): Promise<void> {
    const snapData = toSnap(ps, placements, true);
    const upd: Record<string, unknown> = {
      [`rooms/${this.code}/${this.myKey}`]: snapData,
    };
    // P0이 씨드 생성 — snap과 동시에 원자적으로 업로드
    if (this.myOwner === 0) {
      upd[`rooms/${this.code}/seed`] = Date.now() | 0;
    }
    await update(ref(this.db, '/'), upd);
  }

  /** 준비완료 취소: ready=false, 배치 초기화, 씨드 삭제 (P0만) */
  async cancelReady(): Promise<void> {
    const upd: Record<string, unknown> = {
      [`rooms/${this.code}/${this.myKey}/ready`]:      false,
      [`rooms/${this.code}/${this.myKey}/placements`]: [],
    };
    if (this.myOwner === 0) upd[`rooms/${this.code}/seed`] = null;
    await update(ref(this.db, '/'), upd);
  }

  /** 정산 후 다음 턴 준비 (ready=false, 배치 초기화, 현 상태 저장) */
  async setUnready(ps: PlayerState): Promise<void> {
    // toSnap(ps, [], false) = setReady와 동일 직렬화, 단 ready:false·placements:[]
    const snapData = toSnap(ps, [], false);
    const upd: Record<string, unknown> = {
      [`rooms/${this.code}/${this.myKey}`]: snapData,
    };
    if (this.myOwner === 0) upd[`rooms/${this.code}/seed`] = null;
    await update(ref(this.db, '/'), upd);
  }

  /** 실시간 방 상태 리스너 등록 */
  listen(cb: (snap: RoomSnap) => void): void {
    // onValue는 모듈러 SDK에서 Unsubscribe 함수를 직접 반환
    this.unsub = onValue(this.roomRef, (snap) => { if (snap.exists()) cb(snap.val() as RoomSnap); });
  }

  /** 현재 방 스냅샷 1회 조회 (setReady 후 백업 체크용) */
  async fetchSnap(): Promise<RoomSnap | null> {
    const snap = await get(this.roomRef);
    return snap.exists() ? (snap.val() as RoomSnap) : null;
  }

  /** 리스너 해제 */
  dispose(): void { this.unsub?.(); this.unsub = null; }

  // ── 유틸 ────────────────────────────────────────────────────────────────

  /** P1 로컬 셀(하단 행) → 시뮬레이션 셀(상단 행) 변환 */
  static mirrorCell(cellId: number, grid: Grid): number {
    const { col, row } = grid.coord(cellId);
    return grid.cellId(col, grid.rows - 1 - row);
  }

  static generateCode(): string {
    const ch = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // O/0, I/1 제외
    return Array.from({ length: 4 }, () => ch[Math.floor(Math.random() * ch.length)]).join('');
  }

  // ── 팩토리 ──────────────────────────────────────────────────────────────

  /** 새 방 생성 → P0으로 입장 */
  static async create(db: Database): Promise<{ code: string; room: OnlineRoom }> {
    const code = OnlineRoom.generateCode();
    await set(ref(db, `rooms/${code}`), {
      seed: null, winner: null,
      p0: defaultSnap(),
      p1: null,
    });
    return { code, room: new OnlineRoom(code, 0, db) };
  }

  /** 코드로 기존 방 참여 → P1으로 입장. 없거나 꽉 차면 null */
  static async join(db: Database, code: string): Promise<OnlineRoom | null> {
    const snap = await get(ref(db, `rooms/${code}`));
    if (!snap.exists()) return null;
    const data = snap.val() as RoomSnap;
    if (data.p1 != null && data.p1.connected) return null; // 이미 참여 중
    await set(ref(db, `rooms/${code}/p1`), defaultSnap());
    return new OnlineRoom(code, 1, db);
  }
}
