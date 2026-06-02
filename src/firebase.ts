// ── Firebase 초기화 ───────────────────────────────────────────────────────
// 설정값은 .env.local 파일에 VITE_FB_* 환경변수로 주입합니다.
// (https://console.firebase.google.com → 프로젝트 설정 → 앱 등록 → 구성 복사)
import { initializeApp } from 'firebase/app';
import { getDatabase }  from 'firebase/database';
import type { Database } from 'firebase/database';

const cfg = {
  apiKey:            import.meta.env.VITE_FB_API_KEY             ?? '',
  authDomain:        import.meta.env.VITE_FB_AUTH_DOMAIN         ?? '',
  databaseURL:       import.meta.env.VITE_FB_DATABASE_URL        ?? '',
  projectId:         import.meta.env.VITE_FB_PROJECT_ID          ?? '',
  storageBucket:     import.meta.env.VITE_FB_STORAGE_BUCKET      ?? '',
  messagingSenderId: import.meta.env.VITE_FB_MESSAGING_SENDER_ID ?? '',
  appId:             import.meta.env.VITE_FB_APP_ID              ?? '',
};

export function isFirebaseReady(): boolean {
  return !!cfg.databaseURL;
}

let _db: Database | null = null;
export function getDB(): Database {
  if (!_db) {
    if (!cfg.databaseURL) throw new Error('Firebase 미설정 — .env.local 확인');
    _db = getDatabase(initializeApp(cfg));
  }
  return _db;
}
