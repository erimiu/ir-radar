-- Migration v2: カテゴリをマルチセレクト、重要度をセレクト（text）に変更
-- Supabase SQL Editor で実行してください

-- 1. カテゴリ: category_tag (text) → category_tags (text[])
alter table memos add column if not exists category_tags text[] default '{}';
-- 既存データがある場合は移行
update memos set category_tags = array[category_tag] where category_tag is not null and category_tags = '{}';
alter table memos drop column if exists category_tag;

-- 2. 自社への示唆フィールドを削除
alter table memos drop column if exists insight;

-- 3. 重要度: int → text（高/中/低）
alter table memos drop constraint if exists memos_importance_check;
alter table memos alter column importance type text using
  case importance::int
    when 5 then '高'
    when 4 then '高'
    when 3 then '中'
    when 2 then '低'
    when 1 then '低'
    else null
  end;
