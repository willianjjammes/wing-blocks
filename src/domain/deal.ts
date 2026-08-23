import { PIECE_IDS } from "./pieces";
import type { PieceId } from "./types";

export function cyclingPieces(order: PieceId[] = [...PIECE_IDS]): () => PieceId {
  let i = 0;
  return () => order[i++ % order.length]!;
}
