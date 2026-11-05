import Phaser from "phaser";
import { CONFIGURACION_JUEGO } from "../../configuracion/juego";
import { Terry } from "../personajes/Terry";
import { Desafio, ElementosCompetencia } from "../tipos";
import { AlineadorSprites } from "../utilidades/AlineadorSprites";
import {
  activarFisicaTerrySobreLinea,
  asegurarFisicaTerry,
  desactivarFisicaTerry,
} from "../utilidades/FisicaTerry";

interface DependenciasRivales {
  escena: Phaser.Scene;
  terry: Terry;
  competencia: ElementosCompetencia;
  rivales: Map<number, Phaser.GameObjects.Container | Phaser.GameObjects.Sprite>;
  mostrarMensaje: (texto: string) => void;
  alTerminarAccion: () => void;
  alGameOver: () => void;
  alGolpeFlavio: () => void;
}

const LINEA_SUELO = CONFIGURACION_JUEGO.ySuperficieSuelo;

export class CinematicasRivales {
  private readonly alineador: AlineadorSprites;

  constructor(private readonly dependencias: DependenciasRivales) {
    this.alineador = new AlineadorSprites(dependencias.escena);
  }

  rivalCorrecto(desafio: Desafio): void {
    if (desafio.id === 2) {
      this.ganarAAsesorCruz();
      return;
    }

    if (desafio.id === 3) {
      this.ganarAGenaro();
      return;
    }

    if (desafio.id === 4) {
      this.ganarAFlavio();
      return;
    }

    this.ganarARivalGenerico(desafio);
  }

  rivalIncorrecto(desafio: Desafio, sinVidas: boolean): void {
    if (desafio.id === 2) {
      this.perderContraAsesorCruz(sinVidas);
      return;
    }

    if (desafio.id === 3) {
      this.perderContraGenaro(sinVidas);
      return;
    }

    if (desafio.id === 4) {
      this.perderContraFlavio(sinVidas);
      return;
    }

    this.perderContraRivalGenerico(desafio, sinVidas);
  }

  private ganarARivalGenerico(desafio: Desafio): void {
    const { escena, terry, rivales, mostrarMensaje, alTerminarAccion } = this.dependencias;
    const rival = rivales.get(desafio.id);

    terry.setFlipX(false).reproducirCorrer();
    terry.setVelocityX(420);

    escena.time.delayedCall(420, () => {
      terry.setVelocityX(0);
      terry.reproducirAtaque();
      if (!rival) return;

      escena.time.delayedCall(170, () => {
        escena.cameras.main.shake(140, 0.009);
        escena.tweens.add({
          targets: rival,
          x: rival.x + 420,
          y: rival.y - 210,
          angle: 420,
          alpha: 0,
          duration: 650,
          ease: "Power2",
          onComplete: () => {
            rival.destroy();
            rivales.delete(desafio.id);
          },
        });
      });
    });

    escena.time.delayedCall(1150, () => {
      terry.reproducirVictoria();
      mostrarMensaje("¡AFUERA CRUZ!");
    });

    escena.time.delayedCall(1950, () => {
      terry.reproducirIdle();
      alTerminarAccion();
    });
  }

  private perderContraRivalGenerico(desafio: Desafio, sinVidas: boolean): void {
    const { escena, terry, rivales, alTerminarAccion, alGameOver } = this.dependencias;
    const rival = rivales.get(desafio.id);

    if (rival) {
      const xOriginal = rival.x;
      escena.tweens.add({
        targets: rival,
        x: rival.x - 135,
        duration: 150,
        ease: "Power2",
        onComplete: () => {
          terry.reproducirDanio();
          terry.setTint(0xff7777).setVelocity(-430, -280);
          escena.cameras.main.shake(180, 0.015);
          escena.tweens.add({ targets: rival, x: xOriginal, duration: 200 });
        },
      });
    }

    escena.time.delayedCall(900, () => {
      terry.setVelocity(0, 0).clearTint();
      if (rival) {
        rival.destroy();
        rivales.delete(desafio.id);
      }

      if (sinVidas) {
        terry.reproducirDerrota();
        escena.time.delayedCall(1000, alGameOver);
        return;
      }

      terry.reproducirIdle();
      asegurarFisicaTerry(terry, LINEA_SUELO);
      alTerminarAccion();
    });
  }


  private ganarAGenaro(): void {
    const { escena, terry, rivales, alTerminarAccion } = this.dependencias;
    const rival = rivales.get(3);

    if (!(rival instanceof Phaser.GameObjects.Sprite)) {
      alTerminarAccion();
      return;
    }

    const genaro = rival;
    const xBase = Number(genaro.getData("xBase")) || genaro.x;
    const yBase = Number(genaro.getData("yBase")) || genaro.y;
    const xAtaque = xBase - 95;

    desactivarFisicaTerry(terry);
    terry.setFlipX(false).reproducirCorrer();

    escena.tweens.add({
      targets: terry,
      x: xAtaque,
      duration: 420,
      ease: "Linear",
      onComplete: () => {
        terry.reproducirAtaque();

        escena.time.delayedCall(150, () => {
          genaro.stop().setPosition(xBase, yBase).setFlipX(false);
          genaro.play("conlara-genaro-golpeado", true);
          escena.cameras.main.shake(150, 0.01);

          escena.tweens.add({
            targets: genaro,
            x: xBase + 55,
            duration: 260,
            ease: "Quad.Out",
          });
        });
      },
    });

    escena.time.delayedCall(1050, () => {
      genaro.stop().setPosition(xBase, yBase).setFlipX(false);
      genaro.play("conlara-genaro-idle", true);

      terry.reproducirIdle();
      activarFisicaTerrySobreLinea(terry, terry.x, LINEA_SUELO);
      alTerminarAccion();
    });
  }

  private perderContraGenaro(sinVidas: boolean): void {
    const { escena, terry, rivales, alTerminarAccion, alGameOver } = this.dependencias;
    const rival = rivales.get(3);

    if (!(rival instanceof Phaser.GameObjects.Sprite)) {
      if (sinVidas) {
        alGameOver();
        return;
      }
      alTerminarAccion();
      return;
    }

    const genaro = rival;
    const xBase = Number(genaro.getData("xBase")) || genaro.x;
    const yBase = Number(genaro.getData("yBase")) || genaro.y;
    const xTerry = terry.x;
    const yTerry = terry.y;
    const xGolpe = xTerry + 82;

    // Conservamos la Y REAL que tenia Terry antes de la cinematica.
    // Forzarlo a yTerrySuelo era lo que generaba la caida al terminar.
    desactivarFisicaTerry(terry);
    terry
      .stop()
      .setVisible(true)
      .setAlpha(1)
      .clearTint()
      .setOrigin(0.5, 0.5)
      .setPosition(xTerry, yTerry)
      .setFlipX(false)
      .setVelocity(0, 0);

    genaro.stop().setPosition(xBase, yBase).setFlipX(false);

    escena.tweens.add({
      targets: genaro,
      x: xGolpe,
      duration: 230,
      ease: "Quad.Out",
      onComplete: () => {
        genaro.play("conlara-genaro-golpe", true);

        escena.time.delayedCall(150, () => {
          this.reproducirGolpeSobreTerry(terry, xTerry, yTerry, 48);
          escena.cameras.main.shake(170, 0.013);
        });
      },
    });

    escena.time.delayedCall(850, () => {
      genaro.stop().setPosition(xBase, yBase).setFlipX(false);
      genaro.play("conlara-genaro-idle", true);

      if (sinVidas) {
        terry.reproducirIdle();
        activarFisicaTerrySobreLinea(terry, xTerry - 48, LINEA_SUELO);
        terry.reproducirDerrota();
        escena.time.delayedCall(900, alGameOver);
        return;
      }

      terry.setVisible(true).setAlpha(1).clearTint().setOrigin(0.5, 0.5);
      terry.reproducirIdle();
      activarFisicaTerrySobreLinea(terry, xTerry - 48, LINEA_SUELO);
      alTerminarAccion();
    });
  }

  private ganarAAsesorCruz(): void {
    const { escena, terry, competencia, mostrarMensaje, alTerminarAccion } = this.dependencias;
    const asesor = competencia.asesor;
    const edificio = competencia.edificio;
    const lineaTerry = this.alineador.obtenerLineaInferior(terry);
    const lineaAsesor = this.alineador.obtenerLineaInferior(asesor);
    const xAtaque = asesor.x - 92;
    const xPuerta = edificio.x + 34;
    const yAsesorBase = Number(asesor.getData("yBase")) || CONFIGURACION_JUEGO.ySuperficieSuelo + 27;
    const yVuelo = CONFIGURACION_JUEGO.ySuperficieSuelo - 62;

    desactivarFisicaTerry(terry);
    terry.setFlipX(false);

    const framesCarrera = ["terry-run-1", "terry-run-2", "terry-run-3", "terry-run-4"];
    let indice = 0;
    this.alineador.colocarSobreLinea(terry, framesCarrera[0], terry.x, lineaTerry);

    const eventoCarrera = escena.time.addEvent({
      delay: 90,
      loop: true,
      callback: () => {
        indice = (indice + 1) % framesCarrera.length;
        this.alineador.colocarSobreLinea(terry, framesCarrera[indice], terry.x, lineaTerry);
      },
    });

    escena.tweens.add({
      targets: terry,
      x: xAtaque,
      duration: 410,
      ease: "Linear",
      onComplete: () => {
        eventoCarrera.remove(false);
        this.alineador.colocarSobreLinea(terry, "terry-attack-1", xAtaque, lineaTerry);
        escena.time.delayedCall(105, () => {
          this.alineador.colocarSobreLinea(terry, "terry-attack-2", xAtaque, lineaTerry);
        });

        escena.time.delayedCall(145, () => {
          asesor.stop().setFlipX(false).setAngle(0).setOrigin(0.5, 1);
          asesor.setTexture("asesor-cruz-golpeado-1").setPosition(asesor.x, yAsesorBase);
          escena.cameras.main.shake(125, 0.008);

          escena.time.delayedCall(90, () => {
            asesor.setTexture("asesor-cruz-golpeado-2").setOrigin(0.5, 0.5);
            asesor.setPosition(asesor.x, CONFIGURACION_JUEGO.ySuperficieSuelo - 48);

            escena.tweens.add({
              targets: asesor,
              x: xPuerta,
              y: yVuelo,
              duration: 190,
              ease: "Quad.Out",
              onUpdate: () => {
                if (asesor.x >= xPuerta - 18) asesor.setTexture("asesor-cruz-golpeado-3");
              },
              onComplete: () => {
                asesor.stop().setTexture("asesor-cruz-golpeado-3").setPosition(xPuerta, yVuelo).setAngle(0);
                escena.cameras.main.shake(180, 0.012);

                escena.time.delayedCall(95, () => {
                  const ySuperior = asesor.y - asesor.displayHeight * asesor.originY;
                  asesor.setTexture("asesor-cruz-golpeado-4");
                  const margen = this.alineador.obtenerMargenInferior("asesor-cruz-golpeado-4");
                  const altoFrame = asesor.frame.realHeight || asesor.height;
                  const altoVisible = Math.max(0, altoFrame - margen) * Math.abs(asesor.scaleY);
                  const yFinal = lineaAsesor - altoVisible;
                  asesor.setOrigin(0.5, 0).setPosition(xPuerta, ySuperior);

                  escena.tweens.add({
                    targets: asesor,
                    y: yFinal,
                    duration: 210,
                    ease: "Quad.In",
                    onComplete: () => {
                      this.alineador.colocarSobreLinea(
                        asesor,
                        "asesor-cruz-golpeado-4",
                        xPuerta,
                        lineaAsesor
                      );
                      asesor.setAngle(0);
                    },
                  });
                });
              },
            });
          });
        });
      },
    });

    escena.time.delayedCall(1180, () => {
      terry.reproducirIdle();
      activarFisicaTerrySobreLinea(terry, terry.x, LINEA_SUELO);
      terry.reproducirVictoria();
      mostrarMensaje("¡AFUERA CRUZ!");
    });

    escena.time.delayedCall(1780, () => {
      terry.reproducirIdle();
      asegurarFisicaTerry(terry, LINEA_SUELO);
      alTerminarAccion();
    });
  }

  private perderContraAsesorCruz(sinVidas: boolean): void {
    const { escena, terry, competencia, alTerminarAccion, alGameOver } = this.dependencias;
    const asesor = competencia.asesor;
    const xAsesorBase = Number(asesor.getData("xBase")) || asesor.x;
    const xTerry = terry.x;
    const yTerry = terry.y;
    const xAsesorGolpe = xTerry + 82;

    // Terry se mantiene siempre visible. Los PNG de golpeado estan cargados
    // con la clave "terry-terry-golpeado-X"; antes se usaba una clave que
    // no existia y por eso Terry desaparecia al recibir el golpe.
    desactivarFisicaTerry(terry);
    terry
      .stop()
      .setVisible(true)
      .setAlpha(1)
      .clearTint()
      .setOrigin(0.5, 0.5)
      .setPosition(xTerry, yTerry)
      .setFlipX(false)
      .setVelocity(0, 0);

    // El asesor camina y ataca siempre alineado a la misma linea de suelo.
    // Esto evita que los margenes transparentes de cada PNG lo hagan levitar.
    this.moverAsesorEnPasos(asesor, xAsesorBase, xAsesorGolpe, () => {
      // Los PNG originales miran hacia la izquierda. Ajustamos el espejo
      // segun la posicion REAL de Terry para que nunca ataque de espalda.
      const terryEstaALaDerecha = terry.x > asesor.x;
      asesor.setFlipX(terryEstaALaDerecha);

      this.reproducirSecuenciaAlineada(
        asesor,
        [
          "asesor-cruz-ataque-1",
          "asesor-cruz-ataque-2",
          "asesor-cruz-ataque-3",
          "asesor-cruz-ataque-4",
        ],
        xAsesorGolpe,
        LINEA_SUELO,
        95
      );

      escena.time.delayedCall(190, () => {
        this.reproducirGolpeSobreTerry(terry, xTerry, yTerry, 54);
        escena.cameras.main.shake(170, 0.013);
      });

      escena.time.delayedCall(900, () => {
        this.alineador.colocarSobreLinea(
          asesor,
          "asesor-cruz-saludo-1",
          xAsesorBase,
          LINEA_SUELO
        );
        asesor.setVisible(true).setAlpha(1).setAngle(0).setFlipX(false);

        if (sinVidas) {
          terry.reproducirIdle();
          activarFisicaTerrySobreLinea(terry, xTerry - 54, LINEA_SUELO);
          terry.reproducirDerrota();
          escena.time.delayedCall(900, alGameOver);
          return;
        }

        terry.setVisible(true).setAlpha(1).clearTint().setOrigin(0.5, 0.5);
        terry.reproducirIdle();
        activarFisicaTerrySobreLinea(terry, xTerry - 54, LINEA_SUELO);
        asesor.play("asesor-cruz-saludo", true);
        alTerminarAccion();
      });
    });
  }

  private ganarAFlavio(): void {
    const { escena, terry, rivales, alTerminarAccion } = this.dependencias;
    const rival = rivales.get(4);

    if (rival instanceof Phaser.GameObjects.Sprite) {
      const xBase = Number(rival.getData("xBase")) || rival.x;
      const yBase = Number(rival.getData("yBase")) || rival.y;
      rival.stop().setPosition(xBase, yBase).setFlipX(false);
      rival.play("granja-flavio-idle", true);
    }

    // En una respuesta correcta de Flavio nunca apagamos la fisica, por lo
    // tanto no hay que resetear la posicion de Terry. Solo aseguramos que el
    // body siga habilitado y dejamos correr su idle normal.
    terry.setVelocity(0, 0);
    terry.reproducirIdle();
    asegurarFisicaTerry(terry, LINEA_SUELO);

    escena.time.delayedCall(320, () => {
      terry.reproducirIdle();
      alTerminarAccion();
    });
  }

  private perderContraFlavio(sinVidas: boolean): void {
    const { escena, terry, rivales, alTerminarAccion, alGameOver } = this.dependencias;
    const rival = rivales.get(4);

    if (!(rival instanceof Phaser.GameObjects.Sprite)) {
      if (sinVidas) {
        alGameOver();
        return;
      }
      alTerminarAccion();
      return;
    }

    const flavio = rival;
    const xBase = Number(flavio.getData("xBase")) || flavio.x;
    const yBase = Number(flavio.getData("yBase")) || flavio.y;
    const xTerry = terry.x;
    const yTerry = terry.y;
    const xPatada = xTerry + 105;

    // Igual que con Genaro: guardamos la Y real del collider y nunca lo
    // reposicionamos a una coordenada teorica antes de la patada.
    desactivarFisicaTerry(terry);
    terry
      .stop()
      .setVisible(true)
      .setAlpha(1)
      .clearTint()
      .setOrigin(0.5, 0.5)
      .setPosition(xTerry, yTerry)
      .setFlipX(false)
      .setVelocity(0, 0);

    flavio.stop().setPosition(xBase, yBase).setFlipX(false);

    escena.tweens.add({
      targets: flavio,
      x: xPatada,
      duration: 180,
      ease: "Quad.Out",
      onComplete: () => {
        if (escena.anims.exists("granja-flavio-patada")) {
          flavio.play("granja-flavio-patada", true);
        } else {
          // Mientras no esten cargados los dos frames nuevos, no se rompe la escena.
          flavio.stop().setTexture("granja-flavio-idle-2");
        }

        escena.time.delayedCall(145, () => {
          // Este callback ocurre EXACTAMENTE en el impacto de la patada.
          // Solo Flavio puede hacer que Terry pierda el chancho.
          // Si Terry no llevaba ninguno, el callback no modifica nada.
          this.dependencias.alGolpeFlavio();

          this.reproducirGolpeSobreTerry(terry, xTerry, yTerry, 62);
          escena.cameras.main.shake(170, 0.013);
        });
      },
    });

    escena.time.delayedCall(820, () => {
      flavio.stop().setPosition(xBase, yBase).setFlipX(false);
      flavio.play("granja-flavio-idle", true);

      if (sinVidas) {
        terry.reproducirIdle();
        activarFisicaTerrySobreLinea(terry, xTerry - 62, LINEA_SUELO);
        terry.reproducirDerrota();
        escena.time.delayedCall(900, alGameOver);
        return;
      }

      terry.setVisible(true).setAlpha(1).clearTint().setOrigin(0.5, 0.5);
      terry.reproducirIdle();
      activarFisicaTerrySobreLinea(terry, xTerry - 62, LINEA_SUELO);
      alTerminarAccion();
    });
  }

  private reproducirGolpeSobreTerry(
    terry: Terry,
    xInicial: number,
    _yAncla: number,
    retrocesoTotal: number
  ): void {
    const { escena } = this.dependencias;

    // Los cuatro PNG de golpeado tienen canvases/margenes diferentes.
    // Si mantenemos una Y de centro fija, Terry parece levitar. Durante esta
    // cinematica el body esta apagado, asi que alineamos CADA frame por su
    // borde visible inferior a la misma linea del piso.
    const frames = [
      "terry-terry-golpeado-1",
      "terry-terry-golpeado-2",
      "terry-terry-golpeado-3",
      "terry-terry-golpeado-4",
    ];

    terry
      .stop()
      .setVisible(true)
      .setAlpha(1)
      .clearTint()
      .setVelocity(0, 0)
      .setFlipX(false);

    this.alineador.colocarSobreLinea(terry, frames[0], xInicial, LINEA_SUELO);

    escena.tweens.add({
      targets: terry,
      x: xInicial - retrocesoTotal,
      duration: 420,
      ease: "Quad.Out",
    });

    frames.slice(1).forEach((frame, indice) => {
      escena.time.delayedCall((indice + 1) * 95, () => {
        const xActual = terry.x;
        this.alineador.colocarSobreLinea(terry, frame, xActual, LINEA_SUELO);
        terry.setVisible(true).setAlpha(1).setFlipX(false);
      });
    });
  }

  private reproducirSecuenciaAlineada(
    sprite: Phaser.GameObjects.Sprite,
    frames: string[],
    x: number,
    lineaSuelo: number,
    intervalo: number
  ): void {
    const { escena } = this.dependencias;

    frames.forEach((frame, indice) => {
      escena.time.delayedCall(indice * intervalo, () => {
        this.alineador.colocarSobreLinea(sprite, frame, x, lineaSuelo);
        sprite.setVisible(true).setAlpha(1);
      });
    });
  }

  private moverAsesorEnPasos(
    asesor: Phaser.GameObjects.Sprite,
    xInicio: number,
    xFinal: number,
    alLlegar: () => void
  ): void {
    const { escena } = this.dependencias;
    const mueveHaciaIzquierda = xFinal < xInicio;
    // Los PNG de caminar/ataque estan dibujados mirando a la izquierda.
    // Solo se espejan cuando el asesor se mueve hacia la derecha.
    const flipX = !mueveHaciaIzquierda;
    const distancia = Math.abs(xFinal - xInicio);
    const duracion = Phaser.Math.Clamp(distancia * 2.2, 360, 720);
    const frames = ["asesor-cruz-caminar-1", "asesor-cruz-caminar-2"];
    let indice = 0;

    this.alineador.colocarSobreLinea(asesor, frames[0], xInicio, LINEA_SUELO);
    asesor.setFlipX(flipX).setVisible(true).setAlpha(1);

    const eventoCaminar = escena.time.addEvent({
      delay: 110,
      loop: true,
      callback: () => {
        indice = (indice + 1) % frames.length;
        const xActual = asesor.x;
        this.alineador.colocarSobreLinea(
          asesor,
          frames[indice],
          xActual,
          LINEA_SUELO
        );
        asesor.setFlipX(flipX);
      },
    });

    escena.tweens.add({
      targets: asesor,
      x: xFinal,
      duration: duracion,
      ease: "Linear",
      onComplete: () => {
        eventoCaminar.remove(false);
        this.alineador.colocarSobreLinea(
          asesor,
          frames[indice],
          xFinal,
          LINEA_SUELO
        );
        asesor.setFlipX(flipX);
        alLlegar();
      },
    });
  }
}

