import Phaser from "phaser";
import { CONFIGURACION_JUEGO } from "../../configuracion/juego";

/**
 * FondoMundo
 * ----------
 * Unico lugar donde se dibujan el fondo general y el suelo general.
 *
 * Archivos:
 * public/recursos/fondos/general/fondo1.png
 * public/recursos/fondos/general/fondo2.png
 * public/recursos/fondos/general/suelo.png
 *
 * Regla del fondo:
 * - fondo1 empieza en x = 0.
 * - fondo2 SOLO se crea cuando termino visualmente fondo1 y todavia queda mundo.
 * - Si fondo1 ya cubre todo el mundo, fondo2 NO se crea.
 * - Si alguna vez el mundo fuera mas largo que fondo1 + fondo2, la secuencia
 *   vuelve a empezar: fondo1 -> fondo2 -> fondo1 -> fondo2...
 * - Nunca se superponen bloques y nunca se cortan antes de terminar.
 * - Cada imagen conserva su proporcion original; solo se escala por altura.
 *
 * El suelo usa una unica imagen y se repite de punta a punta.
 * Este archivo NO mueve carteles, edificios, corrales, personajes ni objetos.
 */
const CLAVE_FONDO_1 = "fondo-general-1";
const CLAVE_FONDO_2 = "fondo-general-2";
const CLAVE_SUELO = "suelo-general";

const RUTA_FONDO_1 = "/recursos/fondos/general/fondo1.png";
const RUTA_FONDO_2 = "/recursos/fondos/general/fondo2.png";
const RUTA_SUELO = "/recursos/fondos/general/suelo.png";

const ALTO_FONDO = 648;
const Y_INICIO_SUELO = 648;
const ALTO_SUELO_VISUAL = 144;

export class FondoMundo {
  static precargar(escena: Phaser.Scene): void {
    escena.load.image(CLAVE_FONDO_1, RUTA_FONDO_1);
    escena.load.image(CLAVE_FONDO_2, RUTA_FONDO_2);
    escena.load.image(CLAVE_SUELO, RUTA_SUELO);
  }

  /**
   * Crea fondo + suelo visual + piso fisico principal.
   * Devuelve el collider unico del piso para que Juego.ts lo use con Terry.
   */
  static crear(escena: Phaser.Scene): Phaser.GameObjects.Rectangle {
    const anchoMundo = CONFIGURACION_JUEGO.anchoMundo;

    this.crearFondo(escena, anchoMundo);
    this.crearSueloVisual(escena, anchoMundo);

    return this.crearPisoFisico(escena, anchoMundo);
  }

  private static crearFondo(escena: Phaser.Scene, anchoMundo: number): void {
    // Respaldo visual por si falta algun archivo. Queda DETRAS de las imagenes.
    escena.add
      .rectangle(
        anchoMundo / 2,
        ALTO_FONDO / 2,
        anchoMundo,
        ALTO_FONDO,
        0x69bff2
      )
      .setDepth(-100);

    const fondos = [
      { clave: CLAVE_FONDO_1, ruta: RUTA_FONDO_1, nombre: "fondo1.png" },
      { clave: CLAVE_FONDO_2, ruta: RUTA_FONDO_2, nombre: "fondo2.png" },
    ].filter((fondo) => this.texturaDisponible(escena, fondo.clave));

    if (fondos.length === 0) {
      console.error(
        `[FondoMundo] No se encontro ningun fondo. Esperaba ${RUTA_FONDO_1} y ${RUTA_FONDO_2}.`
      );
      return;
    }

    if (!this.texturaDisponible(escena, CLAVE_FONDO_1)) {
      console.error(`[FondoMundo] Falta ${RUTA_FONDO_1}.`);
    }

    if (!this.texturaDisponible(escena, CLAVE_FONDO_2)) {
      console.warn(
        `[FondoMundo] Falta ${RUTA_FONDO_2}. Se usara solamente fondo1.png mientras exista.`
      );
    }

    let x = 0;
    let indice = 0;
    let bloques = 0;

    while (x < anchoMundo) {
      const fondo = fondos[indice % fondos.length];
      const fuente = escena.textures
        .get(fondo.clave)
        .getSourceImage() as HTMLImageElement;

      // Escala UNIFORME por altura. No hay deformacion horizontal.
      const escala = ALTO_FONDO / fuente.height;
      const anchoVisible = fuente.width * escala;

      if (anchoVisible <= 0) {
        console.error(
          `[FondoMundo] ${fondo.nombre} tiene dimensiones invalidas: ${fuente.width}x${fuente.height}.`
        );
        break;
      }

      escena.add
        .image(x, 0, fondo.clave)
        .setOrigin(0, 0)
        .setScale(escala)
        .setDepth(-80);

      const inicio = x;
      x += anchoVisible;
      bloques++;

      console.info(
        `[FondoMundo] ${fondo.nombre}: x ${inicio.toFixed(2)} -> ${x.toFixed(2)} ` +
          `(fuente ${fuente.width}x${fuente.height}, visible ${anchoVisible.toFixed(2)}x${ALTO_FONDO}).`
      );

      // Recién ahora, despues de terminar completamente esta imagen,
      // avanzamos a la siguiente del orden fondo1 -> fondo2.
      indice++;
    }

    console.info(
      `[FondoMundo] Fondo cubierto hasta x=${x.toFixed(2)} para un mundo de ${anchoMundo}px. Bloques: ${bloques}.`
    );
  }

  private static crearSueloVisual(
    escena: Phaser.Scene,
    anchoMundo: number
  ): void {
    if (!this.texturaDisponible(escena, CLAVE_SUELO)) {
      console.error(
        `[FondoMundo] Falta ${RUTA_SUELO}. Debe llamarse exactamente suelo.png.`
      );

      escena.add
        .rectangle(
          anchoMundo / 2,
          Y_INICIO_SUELO + ALTO_SUELO_VISUAL / 2,
          anchoMundo,
          ALTO_SUELO_VISUAL,
          0x7a4b2a
        )
        .setDepth(-2);
      return;
    }

    const fuente = escena.textures
      .get(CLAVE_SUELO)
      .getSourceImage() as HTMLImageElement;

    const escala = ALTO_SUELO_VISUAL / fuente.height;
    const anchoVisible = fuente.width * escala;

    let x = 0;

    while (x < anchoMundo) {
      escena.add
        .image(x, Y_INICIO_SUELO, CLAVE_SUELO)
        .setOrigin(0, 0)
        .setScale(escala)
        .setDepth(-2);

      x += anchoVisible;
    }
  }

  private static crearPisoFisico(
    escena: Phaser.Scene,
    anchoMundo: number
  ): Phaser.GameObjects.Rectangle {
    const ySuperior = CONFIGURACION_JUEGO.ySuperficieSuelo;
    const altoFisico = Math.max(
      80,
      CONFIGURACION_JUEGO.altoMundo - ySuperior + 80
    );

    const piso = escena.add.rectangle(
      anchoMundo / 2,
      ySuperior + altoFisico / 2,
      anchoMundo,
      altoFisico,
      0x000000,
      0
    );

    escena.physics.add.existing(piso, true);
    return piso;
  }

  private static texturaDisponible(
    escena: Phaser.Scene,
    clave: string
  ): boolean {
    if (!escena.textures.exists(clave)) return false;

    const fuente = escena.textures.get(clave).getSourceImage() as HTMLImageElement;
    return fuente.width > 1 && fuente.height > 1;
  }
}
