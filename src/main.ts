import Phaser from "phaser";
import "./style.css";
import { Intro } from "./juego/escenas/Intro";
import { Juego } from "./juego/escenas/Juego";

const configuracion: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: "app",
  width: window.innerWidth,
  height: window.innerHeight,
  backgroundColor: "#87ceeb",
  render: {
    antialias: true,
    pixelArt: false,
    roundPixels: true,
  },
  physics: {
    default: "arcade",
    arcade: {
      gravity: { x: 0, y: 1200 },
      debug: false,
    },
  },
  scale: {
    mode: Phaser.Scale.RESIZE,
    width: "100%",
    height: "100%",
  },
  scene: [Intro, Juego],
};

new Phaser.Game(configuracion);
