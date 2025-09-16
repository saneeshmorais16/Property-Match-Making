import dotenv from "dotenv";
import { hybridMatch } from "../src/match";
dotenv.config();

function arg(name: string, def?: string) {
  const i = process.argv.indexOf(`--${name}`);
  return i === -1 ? def : process.argv[i+1];
}

(async () => {
  const side = (arg("side","user") as "user"|"landlord");
  const id = arg("id");
  const alpha = Number(arg("alpha","0.7"));
  const topK = Number(arg("topK","10"));
  if (!id) throw new Error("Provide --id <uuid>");
  const result = await hybridMatch(side, id, alpha, topK);
  console.log(JSON.stringify(result, null, 2));
})().catch(e => {
  console.error(e);
  process.exit(1);
});
