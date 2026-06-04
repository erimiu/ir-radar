-- IR Radar スキーマ
-- Supabase SQL Editor にそのままペーストして実行してください

-- 情報ソースマスタ
create table if not exists sources (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  url text not null,
  fetch_type text not null check (fetch_type in ('rss', 'link')),
  category text not null check (category in ('disclosure', 'regulation', 'market', 'ir_trend', 'investment', 'overseas')),
  tier int not null check (tier between 1 and 4),
  is_company boolean default false,
  enabled boolean default true,
  created_at timestamptz default now()
);

-- 収集した記事
create table if not exists items (
  id uuid primary key default gen_random_uuid(),
  source_id uuid references sources(id) on delete set null,
  title text not null,
  url text not null,
  published_at timestamptz,
  fetched_at timestamptz default now(),
  rule_score int default 0,
  ai_score int check (ai_score between 1 and 5),
  ai_reason text,
  is_read boolean default false,
  is_saved boolean default false,
  created_at timestamptz default now()
);

create unique index if not exists items_url_uniq on items(url);

-- その場メモ（Notion保存前の下書き兼ねる）
create table if not exists memos (
  id uuid primary key default gen_random_uuid(),
  item_id uuid unique references items(id) on delete cascade,
  note text,
  insight text,
  category_tag text,
  importance int check (importance between 1 and 5),
  synced_to_notion boolean default false,
  notion_page_url text,
  created_at timestamptz default now()
);

-- RLS（MVP段階: 全操作を許可。認証追加時にポリシーを絞る）
alter table sources enable row level security;
alter table items enable row level security;
alter table memos enable row level security;

create policy "allow all on sources" on sources for all using (true) with check (true);
create policy "allow all on items" on items for all using (true) with check (true);
create policy "allow all on memos" on memos for all using (true) with check (true);

-- 初期ソースデータ（設計書の第1・第2・第4階層）
insert into sources (name, url, fetch_type, category, tier) values
  ('TDnet 適時開示',          'https://www.release.tdnet.info/inbs/I_main_00.html',          'link', 'disclosure',  1),
  ('東証 制度・規則',          'https://www.jpx.co.jp/rules-participants/rules/index.html',    'link', 'regulation',  1),
  ('東証 上場会社向けナビ',    'https://www.jpx.co.jp/equities/listing/index.html',            'link', 'regulation',  1),
  ('株探 決算発表予定',        'https://kabutan.jp/news/marketnews/?category=9',                'link', 'market',      1),
  ('IRバンク',                 'https://irbank.net/',                                           'link', 'investment',  1),
  ('日本IR協議会',             'https://www.jira.or.jp/',                                       'link', 'ir_trend',    2),
  ('東証 英文開示関連',        'https://www.jpx.co.jp/equities/listing/disclosure/index.html', 'link', 'ir_trend',    2),
  ('大和IR',                   'https://www.daiwair.co.jp/',                                    'link', 'ir_trend',    2),
  ('宝印刷ディスクロージャー', 'https://www.takara-print.co.jp/',                               'link', 'ir_trend',    2),
  ('NIRI（米国IR協会）',       'https://www.niri.org/',                                         'link', 'overseas',    4)
on conflict do nothing;

-- Notion DB のプロパティ構成（手動で作成してください）
-- Title      : タイトル（デフォルト）
-- URL        : URL 型
-- カテゴリ   : セレクト型
-- 重要度     : 数値型
-- メモ       : テキスト型
-- 自社への示唆: テキスト型
-- 保存日     : 日付型
-- ソース     : テキスト型
