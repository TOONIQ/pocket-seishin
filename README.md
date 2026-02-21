# 制進 (seishin) - ポケット制作進行

フリーランスアニメーター向けの制作進行管理PWA。モバイルファーストで、オフラインでも動作する軽量パーソナルツール。

## ポジショニング

- **AnimaTime** = スタジオ側（発注・全体管理）
- **制進** = フリーランス側（受注・個人管理）= ポケット制作進行

## 機能

- カット単位の進捗管理（10工程）
- 締切アラート・ダッシュボード
- スケジュールタイムライン表示
- オフライン対応（IndexedDB）
- AnimaTime連携（Phase 2）

## セットアップ

```bash
npm install
npm run dev
```

http://localhost:3000 でアクセス。

## 工程フロー

```
LO原画 → LO演出 → LO作監 → 原画 → 原画演出 → 原画作監 → 動画 → 仕上 → 撮影 → V編
```

## 技術スタック

- Next.js 15 + App Router
- TypeScript
- Tailwind CSS 4 + shadcn/ui
- Dexie (IndexedDB)
- Serwist (PWA/Service Worker)

## 旧版

Python CLI版は `legacy/` ディレクトリに保存。
