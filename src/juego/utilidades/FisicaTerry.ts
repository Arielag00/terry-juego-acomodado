import Phaser from "phaser";
import { Terry } from "../personajes/Terry";

interface EstadoFisicaGuardado {
  y: number;
}

const estadosGuardados = new WeakMap<Terry, EstadoFisicaGuardado>();

/**
 * Congela el body durante una cinematica y guarda la Y real previa.
 */
export function desactivarFisicaTerry(terry: Terry): void {
  const cuerpo = terry.body as Phaser.Physics.Arcade.Body;

  terry.corregirHundimiento();

  if (cuerpo.enable && !estadosGuardados.has(terry)) {
    estadosGuardados.set(terry, { y: terry.y });
  }

  terry.setVelocity(0, 0);
  cuerpo.enable = false;
}

/**
 * Reactiva la fisica restaurando la Y real guardada.
 * Se mantiene para las cinematicas que necesitan conservar exactamente
 * la altura previa.
 */
export function activarFisicaTerry(
  terry: Terry,
  x: number,
  y?: number
): void {
  const cuerpo = terry.body as Phaser.Physics.Arcade.Body;
  const guardado = estadosGuardados.get(terry);
  const yBase = guardado?.y ?? y ?? terry.y;

  terry
    .setActive(true)
    .setVisible(true)
    .setAlpha(1)
    .setOrigin(0.5, 0.5)
    .setPosition(x, yBase)
    .clearTint();

  terry.sincronizarCuerpoFisico();

  cuerpo.enable = true;
  cuerpo.moves = true;
  cuerpo.allowGravity = true;
  cuerpo.immovable = false;
  cuerpo.reset(x, yBase);
  cuerpo.setVelocity(0, 0);

  terry.corregirHundimiento();
  estadosGuardados.delete(terry);
}

/**
 * Reactiva a Terry y apoya el borde inferior REAL de su collider sobre una
 * linea concreta. Es la opcion correcta despues de golpes, caidas y escenas
 * donde el PNG visible cambia de tamano.
 */
/**
 * Reactiva la fisica en una posicion EXACTA, ignorando la Y guardada por
 * desactivarFisicaTerry(). Se usa cuando una cinematica necesita devolver a
 * Terry a otro apoyo (por ejemplo, encima del tronco).
 */
export function activarFisicaTerryEnPosicion(
  terry: Terry,
  x: number,
  y: number
): void {
  const cuerpo = terry.body as Phaser.Physics.Arcade.Body;

  terry
    .setActive(true)
    .setVisible(true)
    .setAlpha(1)
    .setOrigin(0.5, 0.5)
    .setPosition(x, y)
    .clearTint();

  terry.sincronizarCuerpoFisico();

  cuerpo.enable = true;
  cuerpo.moves = true;
  cuerpo.allowGravity = true;
  cuerpo.immovable = false;
  cuerpo.reset(x, y);
  cuerpo.setVelocity(0, 0);

  estadosGuardados.delete(terry);
}

export function activarFisicaTerrySobreLinea(
  terry: Terry,
  x: number,
  lineaY: number
): void {
  const cuerpo = terry.body as Phaser.Physics.Arcade.Body;

  terry
    .setActive(true)
    .setVisible(true)
    .setAlpha(1)
    .setOrigin(0.5, 0.5)
    .setPosition(x, terry.y)
    .clearTint();

  terry.sincronizarCuerpoFisico();

  cuerpo.enable = true;
  cuerpo.moves = true;
  cuerpo.allowGravity = true;
  cuerpo.immovable = false;
  cuerpo.reset(x, terry.y);
  cuerpo.setVelocity(0, 0);

  terry.alinearCuerpoConLinea(lineaY);
  estadosGuardados.delete(terry);
}

/**
 * Garantiza que el body siga habilitado. Si se pasa lineaSoporte, tambien
 * corrige la altura usando el collider real y no el borde visual del PNG.
 */
export function asegurarFisicaTerry(
  terry: Terry,
  lineaSoporte?: number
): void {
  const cuerpo = terry.body as Phaser.Physics.Arcade.Body;

  cuerpo.enable = true;
  cuerpo.moves = true;
  cuerpo.allowGravity = true;
  cuerpo.immovable = false;

  terry
    .setActive(true)
    .setVisible(true)
    .setAlpha(1)
    .setOrigin(0.5, 0.5)
    .clearTint();

  terry.sincronizarCuerpoFisico();
  cuerpo.reset(terry.x, terry.y);
  cuerpo.setVelocity(0, 0);

  if (lineaSoporte !== undefined) {
    terry.alinearCuerpoConLinea(lineaSoporte);
  } else {
    terry.corregirHundimiento();
  }

  estadosGuardados.delete(terry);
}
