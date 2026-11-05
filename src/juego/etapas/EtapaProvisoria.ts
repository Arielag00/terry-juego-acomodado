import Phaser from "phaser";
import { CONFIGURACION_JUEGO } from "../../configuracion/juego";
import { Terry } from "../personajes/Terry";
import { BarreraJuego, ElementosProvisorios } from "../tipos";

export class EtapaProvisoria {
  static precargar(escena: Phaser.Scene): void {
    escena.load.image("ui-meta-cartel", "/interfaz/meta/meta-cartel.png");
  }

  static crear(escena: Phaser.Scene, _terry: Terry): ElementosProvisorios {
    // Esta etapa queda libre. No revive barreras, pozos ni rivales viejos.
    // El piso fisico continuo lo crea Juego.ts para todo el ancho del mundo.
    const pisos: Phaser.GameObjects.Rectangle[] = [];
    const rivales = new Map<
      number,
      Phaser.GameObjects.Container | Phaser.GameObjects.Sprite
    >();
    const barreras = new Map<number, BarreraJuego>();

    this.crearMeta(escena);

    return {
      pisos,
      rivales,
      barreras,
    };
  }

  private static crearMeta(escena: Phaser.Scene): void {
    const x = CONFIGURACION_JUEGO.posicionMeta;
    const ySuelo = CONFIGURACION_JUEGO.ySuperficieSuelo;

    escena.add
      .image(x, ySuelo + 4, "ui-meta-cartel")
      .setOrigin(0.5, 1)
      .setDisplaySize(200, 300)
      .setDepth(5);
  }
}
