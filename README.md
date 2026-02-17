# 制進 (seishin) - アニメ制作進行CLIツール

アニメ制作進行の業務を効率化するCLIツール。カット単位の進捗管理、クリエイター・外注管理、発注書生成、遅延シミュレーションを提供。

## インストール

```bash
pip install -e .
```

## 使い方

### 作品・話数管理

```bash
# 作品を追加（自動的にアクティブに設定）
seishin project add "作品X" --episodes 12

# アクティブプロジェクトを切り替え
seishin project switch 作品X

# 話数を追加
seishin ep add 1 --title "第一話" --air-date 2026-04-05
```

### カット管理

```bash
# カットを一括追加
seishin cut add 1 C001-C300

# 工程状態を更新
seishin cut update 1 C042 --phase lo_raw --status completed

# 工程別ボード表示
seishin cut board 1

# カット詳細
seishin cut show 1 C042
```

### クリエイター・外注会社

```bash
# クリエイター追加
seishin creator add "田中太郎" --category animator --speed 4 --skills action,mecha

# スキルでフィルタ
seishin creator list --skill action

# 外注会社追加
seishin company add "スタジオA" --capabilities niGen,douga --capacity 10
```

### 発注書

```bash
# 発注書作成
seishin order new 1 --phase niGen --creator 田中 --cuts C042-C050 --price 2500

# HTML出力
seishin order export 1
```

### 優先カットリスト

```bash
# 作監向け優先リスト
seishin priority 1 --section sakkan
```

### 遅延シミュレーション

```bash
# LO作監で5日遅延した場合の影響
seishin sim delay 1 --phase lo_sakkan --days 5
```

### ダッシュボード

```bash
seishin dashboard
```

## データ保存先

- DB: `~/.seishin/seishin.db`
- 設定: `~/.seishin/config.json`

## 工程フロー

```
LO原画 → LO演出 → LO作監 → 原画 → 原画演出 → 原画作監 → 動画 → 仕上 → 撮影 → V編
```

## 技術スタック

- Python 3.10+
- Click (CLI)
- Rich (表示)
- SQLite (データ)
- Jinja2 (発注書テンプレート)
