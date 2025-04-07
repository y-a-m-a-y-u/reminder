require('dotenv').config();
const { Client } = require("@notionhq/client")

const notion = new Client({ auth: process.env.Notion_Token });

// ステータスカウント取得関数
async function getStatusCounts() {
    const dbResponse = await notion.databases.query({
      database_id: process.env.Database_ID,
      filter: {
        property: "type",
        select: { equals: "assignment" }
      }
    });
    return dbResponse.results.reduce((acc, page) => {
        const progress = page.properties["progress"]?.status?.name;
        if(progress === "in progress") acc.inProgress++;
        if(progress === "Not started") acc.notStarted++;
        return acc;
      }, { inProgress: 0, notStarted: 0 });
}

// ブロック更新関数
async function updateStatusBlock() {
    // カウント取得
    const { inProgress, notStarted } = await getStatusCounts();
    
    // 更新対象ブロックの特定（例: 既存ブロックIDを指定）
    const targetBlockId = "1cefbef3b6db8006bcfbfcf53e14564e"; // 実際はAPI経由で取得推奨
  
    // ブロック更新処理
    await notion.blocks.update({
      block_id: targetBlockId,
      paragraph: {
        rich_text: [{
          text: {
            content: `提出していない課題:${inProgress + notStarted}件`
          }
        }]
      }
    });
}


// メイン実行
updateStatusBlock().catch(console.error);

const cron = require('node-cron');
cron.schedule('* * * * *', () => updateStatusBlock());