// Free local embeddings using @xenova/transformers (no API keys)
// Model: all-MiniLM-L6-v2 (~384 dims). First run downloads weights to cache.
import { pipeline } from "@xenova/transformers";

let embedder: any;

export async function embedText(text: string): Promise<number[]> {
  const cleaned = (text ?? "").trim();
  if (!cleaned) return [];
  if (!embedder) {
    embedder = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");
  }
  const output = await embedder(cleaned, { pooling: "mean", normalize: true });
  // Convert TypedArray to plain number[]
  return Array.from(output.data as Float32Array);
}
