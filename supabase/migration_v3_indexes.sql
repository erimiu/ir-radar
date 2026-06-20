-- Migration v3: パフォーマンス改善のためのインデックス追加
-- Supabase SQL Editor で実行してください

-- items テーブル: 開示タブのサーバーサイドクエリを高速化
-- SELECT url FROM items WHERE source_id IS NULL AND is_read = true
CREATE INDEX IF NOT EXISTS items_tdnet_read_idx
  ON items(url)
  WHERE source_id IS NULL AND is_read = true;

-- SELECT url FROM items WHERE source_id IS NULL AND saved_for_later = true
CREATE INDEX IF NOT EXISTS items_tdnet_saved_idx
  ON items(url)
  WHERE source_id IS NULL AND saved_for_later = true;

-- items テーブル: tdnet-read / tdnet-later ルートの SELECT id WHERE url = ? を高速化
-- url には既に unique index があるが念のため確認用コメント
-- CREATE UNIQUE INDEX IF NOT EXISTS items_url_uniq ON items(url); -- schema.sql で作成済み

-- companies テーブル: 会社名検索（ILIKE）を高速化
-- name.ilike.%keyword% が毎回 3920 件フルスキャンにならないように GIN トライグラムインデックスを追加
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX IF NOT EXISTS companies_name_trgm_idx
  ON companies USING GIN (name gin_trgm_ops);

-- benchmark_companies テーブル: securities_code 検索を高速化
CREATE INDEX IF NOT EXISTS benchmark_companies_code_idx
  ON benchmark_companies(securities_code);
