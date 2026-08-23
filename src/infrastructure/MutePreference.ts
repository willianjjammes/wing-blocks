export class MutePreference {
  static readonly key = "wing-blocks:muted";

  constructor(private readonly storage: Pick<Storage, "getItem" | "setItem">) {}

  get(): boolean {
    try {
      return this.storage.getItem(MutePreference.key) === "1";
    } catch {
      return false;
    }
  }

  set(muted: boolean): void {
    try {
      this.storage.setItem(MutePreference.key, muted ? "1" : "0");
    } catch {
      /* ignore */
    }
  }
}
