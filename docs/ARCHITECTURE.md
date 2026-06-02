# 아키텍처 & 데이터 스키마

> 목표: **수정이 쉬운 데이터 주도 설계** + **멀티플레이어로 확장 가능한 결정론적 시뮬레이션**.
> 게임 규칙은 [GAME_DESIGN.md](GAME_DESIGN.md), 콘텐츠는 [RACES.md](RACES.md).

---

## 1. 기술 스택

- **TypeScript + Vite** (번들러/개발서버)
- 렌더링: 전투는 **Canvas 2D**, 준비기간 UI(상점·건물·연구)는 **DOM**.
- 게임 엔진 미사용 → 시뮬레이션을 순수 로직으로 완전 통제(결정론·테스트·서버 재사용 용이).
- 외부 의존성 최소. (필요 시 시드 RNG 등 소형 유틸만)

---

## 2. 핵심 원칙

1. **시뮬레이션과 렌더링 분리.** `sim/`은 DOM/Canvas/시간(wall-clock)을 모름. 입력 = (초기 상태 + 양측 배치 + 시드), 출력 = 결정론적 전투 결과 + 리플레이 로그.
2. **데이터 주도.** 유닛·종족·건물·연구·밸런스 상수는 전부 `data/`에 선언형으로. 새 유닛 추가 = 데이터 파일 1개 추가.
3. **결정론.** 고정 timestep, 시드 RNG 단일 소스, `unitId` 순서 고정, 부동소수 사용 시 동일 연산 순서 보장. (멀티/리플레이 필수)
4. **메타 루프와 전투 루프 분리.** `game/`(턴·경제·목숨·상점)와 `sim/`(전투)는 별개 모듈.

---

## 3. 폴더 구조 (제안)

```
Gimcheon/
  index.html
  package.json
  tsconfig.json
  vite.config.ts
  docs/                  # 본 설계 문서들
  src/
    main.ts              # 진입점, 화면 전환
    config.ts            # 전역 밸런스 상수 (한 곳에서 튜닝)

    sim/                 # ── 순수 결정론 전투 시뮬레이션 (DOM 금지)
      types.ts           #   SimUnit, SimState, BattleResult, ReplayLog
      Simulation.ts      #   tick(state) 루프
      targeting.ts       #   타깃 선정 + 레이어 규칙
      combat.ts          #   데미지 공식, 공격 처리
      movement.ts        #   이동 + 분리 스티어링
      collision.ts       #   원형 충돌 해소(겹침 방지) + 자연 스택(stackId) 예외
      rng.ts             #   시드 RNG (mulberry32 등)

    game/                # ── 매치/메타 루프
      Match.ts           #   턴 상태머신(준비/전투/정산), 목숨
      Economy.ts         #   코인 정산, 이자, 연승/연패
      Research.ts        #   보석, 연구 트리 적용
      Buildings.ts       #   건물 레벨/효과
      Player.ts          #   플레이어 상태(코인·보석·목숨·보유유닛·건물·발전선택)
      effectiveStats.ts  #   기본스탯 + 연구 + 시대 + 강화 → 실효 스탯 산출

    data/                # ── 콘텐츠(데이터 주도, 수정 지점)
      races/ { nature.ts, human.ts, demon.ts, index.ts }
      units/ { nature/*.ts, human/*.ts, demon/*.ts, index.ts }
      buildings.ts
      research/ { nature.ts, human.ts, demon.ts }
      abilities.ts
      devpaths.ts

    render/              # ── Canvas/DOM 렌더 (상태를 읽기만)
      BattleRenderer.ts  #   SimState → Canvas 그리기 + 보간
      GridRenderer.ts    #   배치 그리드
      visuals.ts         #   유닛 비주얼(현재 이모지/도형/색 → 추후 스프라이트)

    ui/                  # ── 준비기간 UI
      ShopPanel.ts, BuildingPanel.ts, ResearchPanel.ts,
      PlacementBoard.ts, Hud.ts (목숨/코인/보석/타이머)

    ai/                  # ── 솔로 모드 상대
      AiController.ts    #   준비기간 의사결정(구매·배치·업글·연구·발전선택)

    net/                 # ── (미래) 멀티: 전송/서버 호스트 추상화
      (placeholder)
```

---

## 4. 데이터 스키마 (TypeScript 인터페이스 초안)

> 합의용 초안. 필드는 구현하며 다듬되 형태는 이 골격을 유지.

```ts
// ── 공통 식별자
export type RaceId = 'nature' | 'human' | 'demon';
export type Layer = 'ground' | 'air' | 'underground';

// ── 능력치
export interface Stats {
  hp: number;
  atk: number;
  attackSpeed: number; // 초당 공격 수
  moveSpeed: number;   // 칸/초
  range: number;       // 칸
  defense: number;     // 아머 포인트
}

// ── 타게팅 플래그
export interface TargetingFlags {
  canHitAir: boolean;
  canHitUnderground: boolean;
}

// ── 유닛 정의 (콘텐츠)
export interface UnitDef {
  id: string;                 // 'nature.wolf'
  raceId: RaceId;
  name: string;               // 표시명(현재 한국어)
  layer: Layer;
  cost: number;               // 코인
  tier: number;               // 생산시설 레벨 게이트
  baseStats: Stats;
  radius: number;             // 충돌 반경(칸)
  targeting: TargetingFlags;
  abilities?: string[];       // AbilityDef id 참조
  research?: ResearchTreeDef;  // 이 유닛의 연구 트리
  visual: VisualDef;          // 임시 비주얼(추후 스프라이트)
  unlock?: UnlockCondition;   // 발전 방향/시대 게이팅
}

export interface VisualDef {
  shape: 'circle' | 'square' | 'triangle';
  color: string;              // 진영 보정과 합성
  emoji?: string;             // 🐺 등 임시
  sprite?: string;            // 추후 이미지 경로
}

export type UnlockCondition =
  | { kind: 'devpath'; pathId: string }
  | { kind: 'era'; min?: number; max?: number }
  | { kind: 'summon'; from: { unitId: string; count: number }[] }; // 첨단 합체

// ── 연구 트리 (보석)
export interface ResearchTreeDef {
  nodes: ResearchNode[];
}
export interface ResearchNode {
  id: string;
  name: string;
  cost: number;               // 보석
  maxLevel: number;           // 반복 강화 가능 횟수
  effect: ResearchEffect;
  requires?: { nodeId: string; level: number }[]; // 임계치 해금
}
export type ResearchEffect =
  | { kind: 'stat'; stat: keyof Stats; addPerLevel: number }
  | { kind: 'unlockAbility'; abilityId: string };

// ── 능력
export interface AbilityDef {
  id: string;
  name: string;
  trigger: 'onAttack' | 'onHit' | 'onDeath' | 'passive' | 'periodic';
  // effect는 구현 단계에서 핸들러로 연결(데이터→로직 매핑 레지스트리)
  params?: Record<string, number>;
}

// ── 건물
export interface BuildingDef {
  id: 'production' | 'researchLab' | 'capacity' | string;
  name: string;
  levels: BuildingLevel[];    // 0-indexed 레벨
}
export interface BuildingLevel {
  upgradeCost: number;        // 코인 (이 레벨로 올리는 비용)
  effects: Record<string, number>; // 예: { unitCap: +1 } 또는 { gemsPerTurn: 3, maxTier: 2 }
}

// ── 발전 방향
export interface DevPathDef {
  id: string;                 // 'nature.ancient'
  raceId: RaceId;
  name: string;
  unlockTurn: number;         // 7 (6턴 종료 후)
  condition?: UnlockCondition;
  unitsUnlocked: string[];    // UnitDef id 목록
}

// ── 종족
export interface RaceDef {
  id: RaceId;
  name: string;
  baseUnitIds: string[];
  buildingIds: string[];      // 공통 + 고유
  devPaths: [DevPathDef, DevPathDef];
  mechanic: 'hatchery' | 'era' | 'prism';
  cellCapacity: number;             // 배치 칸당 유닛 수, 기본 1
  cellCapacityAfterDevPath?: number; // 발전 후 칸 용량. 자연 = 3 (겹침 배치)
}

// 전역: 출전 유닛 상한은 config.ts의 MAX_UNIT_CAP = 20 (전투 인원 증가 시설 레벨로 0→20 해금).
```

**시뮬레이션 측 타입(런타임)**
```ts
export interface SimUnit {
  id: number;                 // 결정론 순서 키
  owner: 0 | 1;               // 진영
  defId: string;              // UnitDef 참조
  layer: Layer;
  x: number; y: number;       // 연속 좌표(칸 단위)
  hp: number; maxHp: number;
  stats: Stats;               // 실효 스탯(연구·시대·강화 반영)
  targeting: TargetingFlags;
  radius: number;
  targetId: number | null;
  attackCooldown: number;     // 남은 쿨다운(초)
  stackId: number;            // 배치 원점 칸 id. 같은 owner+stackId끼리는 상호 충돌 무시(자연 겹침). 비스택 유닛은 고유값 → 정상 충돌
}

export interface SimState {
  tick: number;
  phase: 'battle' | 'overtime';
  units: SimUnit[];
  rng: RngState;
}

export interface BattleResult {
  winner: 0 | 1 | 'draw';
  survivors: { owner: 0|1; remainingHp: number }[];
  replay: ReplayLog;          // 렌더/검증용 이벤트 스트림
}
```

> 핵심: **`effectiveStats.ts`가 `UnitDef.baseStats` + 연구 + 시대 진화 + 군단장 강화**를 합쳐 `SimUnit.stats`(실효 스탯)를 만든다. 시뮬레이션은 실효 스탯만 본다 → 메타 시스템과 전투가 깔끔히 분리.

---

## 5. 멀티플레이어 대비 (지금 코드에 반영할 것)

- 전투는 **서버 권위(server-authoritative)** 로 갈 수 있게: 클라는 배치만 전송, 서버가 `Simulation`을 돌려 `BattleResult`/리플레이를 양측에 전송. 솔로에선 클라가 양쪽을 다 돌림 → **동일한 `sim/` 모듈 재사용**.
- 그래서 `sim/`은: 무작위=시드 RNG만, wall-clock 금지, 부동소수 연산 순서 고정, 외부 가변 전역 금지.
- `net/`은 지금은 빈 추상화만 두고, 인터페이스(`BattleHost`)만 정의해 솔로 구현체를 끼움.

---

## 6. 로드맵 (마일스톤)

| M | 내용 | 산출물 |
|---|---|---|
| **M0** | 설계 문서 합의 | (본 문서) ✅ 진행 중 |
| **M1** | 프로젝트 스켈레톤(Vite+TS), config, 데이터 스키마 코드화, 그리드 렌더 + 배치(전투 X) | 화면에 그리드·유닛 배치 |
| **M2** | 전투 시뮬레이션 코어(이동·타깃·전투·사망·승패·연장전) + 배틀 렌더 | 자동 전투 1회 동작 |
| **M3** | 메타 루프(턴 상태머신, 코인 정산, 목숨, 유닛 구매, 인원 상한) | 준비→전투→정산 반복 |
| **M4** | 보석·연구소·건물 시스템 | 연구로 스탯 강화 반영 |
| **M5** | 자연 종족 풀 콘텐츠 + 발전(고대/땅밑) + 부화장 | 자연 완성 |
| **M6** | 인간(시대 진화) + 발전(첨단/마법) | 인간 완성 |
| **M7** | 마계(군단장·프리즘) + 발전(1/2군단장) | 마계 완성 |
| **M8** | 솔로 AI + 난이도 | 대 AI 1판 완주 |
| **M9** | 폴리시(UI 피드백·연출·사운드 스텁) + 밸런싱 패스 | 플레이어블 빌드 |
| **이후** | 멀티 1대1(서버 권위 시뮬·매치메이킹) | 온라인 |

---

## 7. "새 유닛 추가" 예시 (수정 용이성 확인)

```ts
// src/data/units/nature/wolf.ts
import type { UnitDef } from '../../../sim/types';
export const wolf: UnitDef = {
  id: 'nature.wolf', raceId: 'nature', name: '늑대', layer: 'ground',
  cost: 1, tier: 1,
  baseStats: { hp: 350, atk: 28, attackSpeed: 1.0, moveSpeed: 3.5, range: 1, defense: 5 },
  radius: 0.35,
  targeting: { canHitAir: false, canHitUnderground: false },
  visual: { shape: 'circle', color: '#6b8e23', emoji: '🐺' },
  research: { nodes: [
    { id: 'wolf.atk', name: '송곳니 강화', cost: 4, maxLevel: 3, effect: { kind: 'stat', stat: 'atk', addPerLevel: 8 } },
    { id: 'wolf.pack', name: '무리 본능', cost: 8, maxLevel: 1,
      effect: { kind: 'unlockAbility', abilityId: 'wolf.packBuff' },
      requires: [{ nodeId: 'wolf.atk', level: 3 }] }, // 임계치 해금
  ]},
};
```
→ 새 유닛은 이런 파일 하나 추가 후 `units/index.ts`에 등록하면 끝. 밸런스 수치는 전부 데이터.
