// Backfill embeddings for users & landlords using free local model
import dotenv from "dotenv";
import { supabase } from "../src/supabase";
import { embedText } from "../src/embeddings";
dotenv.config();

async function backfill(table: "users" | "landlords") {
  console.log(`Backfilling embeddings for ${table}...`);
  const { data, error } = await supabase.from(table).select("*").is("embedding", null);
  if (error) throw error;

  for (const row of data || []) {
    const text = (row.bio ?? "").trim();
    if (!text) { console.log(`skip ${row.id} (empty bio)`); continue; }
    const embedding = await embedText(text);
    if (!embedding.length) { console.log(`skip ${row.id} (no embedding)`); continue; }
    const { error: upErr } = await supabase.from(table).update({ embedding }).eq("id", row.id);
    if (upErr) throw upErr;
    console.log(`updated ${row.id}`);
  }
}

(async () => {
  await backfill("users");
  await backfill("landlords");
  console.log("Done.");
})().catch(e => {
  console.error(e);
  process.exit(1);
});
