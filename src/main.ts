import Phaser from "phaser";
import { registerServiceWorker } from "./infrastructure/registerServiceWorker";
import { MenuScene } from "./presentation/MenuScene";
import { PlayScene } from "./presentation/PlayScene";
import { TitleScene } from "./presentation/TitleScene";

registerServiceWorker();

new Phaser.Game({
  type: Phaser.AUTO,
  parent: "game",
  backgroundColor: "#07152a",
  render: {
    antialias: true,
    roundPixels: true,
    powerPreference: "high-performance",
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 390,
    height: 844,
  },
  scene: [TitleScene, MenuScene, PlayScene],
});

document.getElementById("boot-status")?.remove();
