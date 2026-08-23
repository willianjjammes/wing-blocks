/** Piece ids — UI names live in i18n (Pluma, Escudo, Asa, Halo, Lança, Cruz, Bloco). */
export type PieceId =
  | "plume"
  | "shield"
  | "wing"
  | "halo"
  | "lance"
  | "cross"
  | "block";

export type GameMode = "calm" | "classic";

export type PowerupId =
  | "timeWing"
  | "skyShield"
  | "halo"
  | "gust"
  | "plumeSwap"
  | "royalStrike";

export const BOARD_WIDTH = 10;
export const VISIBLE_HEIGHT = 20;
export const BUFFER_HEIGHT = 2;
