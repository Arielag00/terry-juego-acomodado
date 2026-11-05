import Phaser from "phaser";

export type TipoDesafio = "tronco" | "pozo" | "rival" | "barrera" | "chancho";

export interface Desafio {
  id: number;
  tipo: TipoDesafio;
  preguntaIndice: number;
  triggerX: number;
  destinoX?: number;
  resuelto: boolean;
}

export interface BarreraJuego {
  visual: Phaser.GameObjects.Container;
  cuerpo: Phaser.GameObjects.Rectangle;
  colision: Phaser.Physics.Arcade.Collider;
}

export interface ElementosCompetencia {
  edificio: Phaser.GameObjects.Image;
  asesor: Phaser.GameObjects.Sprite;
}

export interface ElementosProvisorios {
  pisos: Phaser.GameObjects.Rectangle[];
  rivales: Map<number, Phaser.GameObjects.Container | Phaser.GameObjects.Sprite>;
  barreras: Map<number, BarreraJuego>;
}
