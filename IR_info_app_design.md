# IR情報収集アプリ「IR Radar」設計書

> Claude Code にこのファイルをそのまま渡して「この設計書をもとに作って」と頼める粒度で書いています。
> My Coach アプリと同じ技術スタック（Next.js 14 + TypeScript + Tailwind + Supabase + Vercel + Claude API）を流用します。

---

## 0. このアプリの目的（北極星）

隙間時間にスマホから、IRとして押さえるべき最新動向を**網羅的に・効率よく**インプットし、
「いいな」と思った事例・重要ニュースを**メモと共に Notion に蓄積**して、業務とスキルアップに活かす。
究極のゴールは「インプット → 業務の進化 → 出世」のサイクルを回すこと。

### 設計の3原則
1. **開いて3秒で価値が伝わる** — スマホ起点、タップ操作中心、表示が速い
2. **コスト最小** — 全件AI要約はしない。収集は無料、重要度評価のみ軽量に
3. **流さず貯める** — 価値ある情報は必ず Notion に「メモ＋自社への示唆」付きで残す

---

## 1. 全体フロー

```
[1] 情報ソースを巡回（RSS自動取得 + 公式ページへのディープリンク集）
        ↓
[2] 新着を一覧表示（カテゴリ・重要度でフィルタ）
        ↓ スマホで隙間時間にスワイプして眺める
[3] 気になった記事をタップ → 元記事へ / その場で軽くメモ
        ↓ 「これは業務で使える」と思ったら
[4] メモ＋自社への示唆を書いて「Notionに保存」ボタン
        ↓
[5] Notion「IR情報ストック」DBに1ページとして追加
```

---

## 2. 情報ソース（チェックすべきメディア・チャネル）

優先用途の順（①スキルアップ ②業務直結 ③投資リサーチ）に沿って4階層で整理。
`収集方式` は RSS=自動取得 / LINK=公式ページへのディープリンク（タップで飛んで自分で見る）。

### 第1階層：業務直結・必須ウォッチ（毎営業日〜週次）
| ソース | カテゴリ | 収集方式 | URL（フィード or ページ） |
|---|---|---|---|
| TDnet 適時開示 | 開示 | LINK | https://www.release.tdnet.info/inbs/I_main_00.html |
| 東証 制度・規則 | 規制 | LINK | https://www.jpx.co.jp/rules-participants/rules/index.html |
| 東証 上場会社向けナビ | 規制 | LINK | https://www.jpx.co.jp/equities/listing/index.html |
| 株探 決算発表予定 | 市場 | LINK | https://kabutan.jp/news/marketnews/?category=9 |
| IRバンク | 市場 | LINK | https://irbank.net/ |

### 第2階層：スキルアップ・IRトレンド（週次でじっくり）★今回の主役
| ソース | カテゴリ | 収集方式 | URL |
|---|---|---|---|
| 日本IR協議会（調査・研究/イベント） | IRトレンド | LINK | https://www.jira.or.jp/ |
| 東証「英文開示」関連（実践ハンドブック等） | IRトレンド/英訳 | LINK | https://www.jpx.co.jp/equities/listing/disclosure/index.html |
| 大和IR | IRトレンド | LINK | https://www.daiwair.co.jp/ |
| 宝印刷ディスクロージャー | IRトレンド | LINK | https://www.takara-print.co.jp/ |
| QUICK / Bloomberg（IR・ガバナンス記事） | IRトレンド | LINK | （キーワードフィルタで運用） |
| IR実務者・アナリストのnote/ブログ | IRトレンド | RSS | （信頼できる発信者を数人登録。noteはRSS提供あり: `https://note.com/{user}/rss`） |

### 第3階層：投資リサーチ・市場動向（随時）
| ソース | カテゴリ | 収集方式 | URL |
|---|---|---|---|
| 日経（セクター/ガバナンス/東証改革キーワード） | 市場 | LINK | https://www.nikkei.com/ |
| JPX 市場区分・指数（プライム150/スタートアップ指数） | 市場 | LINK | https://www.jpx.co.jp/markets/indices/index.html |
| ベンチマーク企業IRページ | 投資/IRトレンド | LINK | （企業ごとに登録。下記マスタ参照） |

### 第4階層：海外IR事例（月次・余裕があるとき）
| ソース | カテゴリ | 収集方式 | URL |
|---|---|---|---|
| NIRI（米国IR協会） | 海外 | LINK | https://www.niri.org/ |
| 海外優良企業IRサイト | 海外 | LINK | （企業ごとに登録） |

> **ベンチマーク企業マスタ**は `sources` テーブルに company フラグを持たせて登録。
> 初期登録候補はEriさんの既存リサーチ対象から（例：Toyokumo, Septeni, Gunosy など）。

---

## 3. 重要度評価のしくみ（コスト最小設計）

全件AI要約はしない。代わりに2段階で「これは見るべき」を浮かび上がらせる。

### Stage 1：ルールベース（無料・収集時に自動付与）
- キーワードマッチでスコアリング。例：
  - 高(+3)：`東証` `開示義務` `ガバナンス・コード` `英文開示` `SSBJ` `自社セクター名` `ベンチマーク企業名`
  - 中(+2)：`決算` `統合報告書` `個人投資家` `生成AI IR`
  - 低(+1)：その他
- 新着フラグ（未読）を付与

### Stage 2：AI重要度判定（任意・ボタン押下時のみ／安価）
- 一覧で「気になる束」を選んで「AIに重要度を聞く」ボタン → まとめて1リクエスト
- Claude Haiku など安価なモデルで「IR担当(note Inc.)にとっての重要度を1-5で。理由を1行で」
- **全件自動では呼ばない**（コスト管理）。requestは束ねてトークン節約

> AI要約（本文の要約）は「本当に深掘りしたい記事だけ」手動ボタンで実行。普段は元記事リンクへ飛ぶ。

---

## 4. データベース設計（Supabase / PostgreSQL）

```sql
-- 情報ソースマスタ
create table sources (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  url text not null,                 -- フィード or ページURL
  fetch_type text not null,          -- 'rss' | 'link'
  category text not null,            -- 'disclosure'|'regulation'|'market'|'ir_trend'|'investment'|'overseas'
  tier int not null,                 -- 1-4（階層）
  is_company boolean default false,  -- ベンチマーク企業フラグ
  enabled boolean default true,
  created_at timestamptz default now()
);

-- 収集した記事
create table items (
  id uuid primary key default gen_random_uuid(),
  source_id uuid references sources(id),
  title text not null,
  url text not null,
  published_at timestamptz,
  fetched_at timestamptz default now(),
  rule_score int default 0,          -- Stage1 ルールスコア
  ai_score int,                      -- Stage2 AIスコア(1-5) nullable
  ai_reason text,                    -- AI判定理由1行 nullable
  is_read boolean default false,
  is_saved boolean default false,    -- Notionに保存済みか
  created_at timestamptz default now()
);
create unique index items_url_uniq on items(url);  -- 重複防止

-- その場メモ（Notion保存前の下書きも兼ねる）
create table memos (
  id uuid primary key default gen_random_uuid(),
  item_id uuid references items(id),
  note text,                         -- 自分のメモ
  insight text,                      -- 自社note Inc.への示唆
  category_tag text,
  importance int,                    -- 自己評価の重要度
  synced_to_notion boolean default false,
  notion_page_url text,
  created_at timestamptz default now()
);
```

> Supabase は SQL Editor から手動で上記を実行（My Coach同様、テーブルは手動作成が必要）。

---

## 5. 画面設計（スマホファースト）

### 画面1：フィード（トップ）
- 上部にカテゴリタブ：`すべて / IRトレンド / 開示 / 規制 / 市場 / 投資`
- 重要度ソート（ルールスコア降順）／新着順 切替
- カード表示：タイトル・ソース名・重要度バッジ・公開日
- カードを**タップ → 元記事を新規タブ**、**長押し or ボタン → メモ画面**
- 既読は薄く表示

### 画面2：メモ＆Notion保存
- 記事タイトル・URL（自動）
- 入力欄：①メモ ②自社への示唆 ③カテゴリタグ ④重要度(1-5)
- 「Notionに保存」ボタン → Notion APIでページ作成 → 成功したら `is_saved=true`

### 画面3：ソース管理
- ソース一覧（有効/無効トグル）
- 新規ソース追加（name / url / type / category / tier）

### 画面4（任意）：週次まとめ
- 直近7日で `rule_score` 高 or `is_saved` の記事を一覧 → 振り返り用

### デザイントーン（Claude Codeへの具体指定用）
- 配色：ベース `#FFFFFF` / 文字 `#1A1A1A` / アクセント `#2D6A4F`（落ち着いた緑）/ 重要度バッジ赤系 `#E63946`
- 角丸 `rounded-2xl`、カード影は控えめ、余白広め、フォントは可読性優先
- タップターゲットは最低44px（スマホ前提）

---

## 6. 自動収集のしくみ

- **Vercel Cron Jobs** で1日1回（朝6:00 JST想定）巡回 ← My Coachで実績あり
- `fetch_type='rss'` のソースをパース → `items` に upsert（url重複は無視）
- ルールスコアを付与して保存
- `fetch_type='link'` はディープリンク集として常時表示（巡回不要）
- RSSパースは `rss-parser` などの軽量ライブラリ

---

## 7. Notion連携

- 既存のNotion connectorのワークスペースに **「IR情報ストック」DB** を1つ用意
- DBプロパティ：
  - Title（記事タイトル）/ URL / カテゴリ(Select) / 重要度(Number)
  - メモ(Text) / 自社への示唆(Text) / 保存日(Date) / ソース(Text)
- アプリの「Notionに保存」ボタン → Notion API でページ作成
  - APIトークンはVercel環境変数に設定（`NOTION_API_KEY` `NOTION_DATABASE_ID`）
- 既存の投資メモシステムと**同じワークスペース**に置くことで横断検索・相互参照が効く

---

## 8. 環境変数（Vercel に手動設定）

```
NEXT_PUBLIC_SUPABASE_URL=（My Coachのものを流用可）
NEXT_PUBLIC_SUPABASE_ANON_KEY=（流用可）
ANTHROPIC_API_KEY=（流用可）
NOTION_API_KEY=（新規取得：Notion Integrations）
NOTION_DATABASE_ID=（IR情報ストックDBのID）
```

---

## 9. 開発ステップ（Claude Codeへの依頼順）

1. プロジェクト雛形（Next.js 14 + TS + Tailwind）+ Supabaseクライアント設定
2. 上記DBのSQLを生成（SQL Editorに貼る用）
3. ソース管理画面（画面3）→ 手動でソースを数件登録できる状態に
4. RSS収集ロジック + ルールスコア + Vercel Cron 設定
5. フィード画面（画面1）
6. メモ＆Notion保存（画面2）+ Notion API連携
7. AI重要度判定ボタン（Stage2）※安価モデル
8. 週次まとめ（画面4）※任意
9. GitHub push → Vercel連携 → 環境変数設定 → デプロイ

> **依頼のコツ（My Coachの学び）**：一度に複数頼むときは番号付き、DB設計は先に渡す、
> デザインはカラーコードまで指定、エラーは「エラーを確認して修正して」でOK。

---

## 10. MVP（まず最小で動かす範囲）

最初から全部作らず、ここまでで一度デプロイして使ってみる：
- ソース管理（画面3）＋ フィード（画面1・LINK中心でOK）＋ メモ＆Notion保存（画面2）

RSS自動収集・AI判定・週次まとめは「使ってみて欲しくなったら」後乗せ。
My Coach同様、小さく出して育てるのが続けるコツ。
