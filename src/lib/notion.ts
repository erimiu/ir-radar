import { Client } from '@notionhq/client'

export const notion = new Client({ auth: process.env.NOTION_API_KEY })

export async function saveToNotion({
  title,
  url,
  categories,
  importance,
  note,
  sourceName,
}: {
  title: string
  url: string
  categories: string[]
  importance: string | null
  note: string
  sourceName: string
}) {
  return notion.pages.create({
    parent: { database_id: process.env.NOTION_DATABASE_ID! },
    properties: {
      Title: { title: [{ text: { content: title } }] },
      URL: { url },
      カテゴリ: { multi_select: categories.map(name => ({ name })) },
      重要度: importance ? { select: { name: importance } } : { select: null },
      ソース: { rich_text: [{ text: { content: sourceName } }] },
      メモ: { rich_text: [{ text: { content: note } }] },
    },
  })
}
