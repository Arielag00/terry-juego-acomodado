import Phaser from "phaser";
import { CONFIGURACION_JUEGO } from "../../configuracion/juego";
import { EtapaInicio } from "../etapas/EtapaInicio";
import { Terry } from "../personajes/Terry";
import { AlineadorSprites } from "../utilidades/AlineadorSprites";
import { BarreraJuego, Desafio } from "../tipos";
import {
  activarFisicaTerrySobreLinea,
  desactivarFisicaTerry,
} from "../utilidades/FisicaTerry";
import { EfectosJuego } from "./EfectosJuego";

interface DependenciasObstaculos {
  escena: Phaser.Scene;
  terry: Terry;
  barreras: Map<number, BarreraJuego>;
  efectos: EfectosJuego;
  alTerminarAccion: () => void;
  alGameOver: () => void;
}

export class CinematicasObstaculos {
  private readonly alineador: AlineadorSprites;

  constructor(private readonly dependencias: DependenciasObstaculos) {
    this.alineador = new AlineadorSprites(dependencias.escena);
  }

  troncoCorrecto(): void {
    const { escena, terry, alTerminarAccion } = this.dependencias;
    terry.reproducirVictoria();
    escena.time.delayedCall(400, () => {
      terry.reproducirIdle();
      alTerminarAccion();
    });
  }

  troncoIncorrecto(sinVidas: boolean): void {
    const { escena, terry, efectos, alTerminarAccion, alGameOver } =
      this.dependencias;

    /*
     * El "titileo" venia de mezclar dos sistemas al mismo tiempo:
     * - una animacion Phaser que cambiaba los 4 PNG de fall automaticamente;
     * - dos tweens que movian el centro del sprite mientras esos PNG tienen
     *   distinta silueta/margen transparente.
     *
     * El resultado era un pequeno salto visual entre frames que parecia que
     * Terry se trababa. Ahora la secuencia se controla frame por frame y cada
     * imagen se alinea por su borde visible inferior. No hay una animacion
     * interna compitiendo con los tweens.
     */
    desactivarFisicaTerry(terry);
    terry.setFlipX(false).reproducirCorrer();

    const xAntesTronco = EtapaInicio.xTronco - 55;
    const distanciaAlTronco = Math.abs(xAntesTronco - terry.x);
    const duracionAcercamiento = Phaser.Math.Clamp(
      distanciaAlTronco * 1.7,
      80,
      180
    );

    escena.tweens.add({
      targets: terry,
      x: xAntesTronco,
      duration: duracionAcercamiento,
      ease: "Linear",
      onComplete: () => {
        const lineaSuelo = CONFIGURACION_JUEGO.ySuperficieSuelo;
        const lineaTronco = EtapaInicio.ySuperiorTronco;

        terry.stop().setVelocity(0, 0).setFlipX(false);

        // FRAME 1: empieza el tropiezo todavia apoyado en el camino.
        this.alineador.colocarSobreLinea(
          terry,
          "terry-fall-1",
          xAntesTronco,
          lineaSuelo
        );

        // Un solo tween horizontal. Las Y se corrigen al cambiar cada frame
        // usando la silueta visible real de cada PNG.
        escena.tweens.add({
          targets: terry,
          x: EtapaInicio.xTronco,
          duration: 360,
          ease: "Quad.Out",
          onComplete: () => {
            efectos.polvo(
              EtapaInicio.xTronco,
              EtapaInicio.ySuperiorTronco + 5
            );

            if (sinVidas) {
              escena.time.delayedCall(420, () => terry.reproducirDerrota());
              escena.time.delayedCall(1250, alGameOver);
              return;
            }

            escena.time.delayedCall(150, () => {
              // Primero cambiamos al idle y despues alineamos el collider UNA
              // sola vez con la tapa del tronco. Asi tampoco hay parpadeo al
              // devolver el control al jugador.
              terry.reproducirIdle();
              activarFisicaTerrySobreLinea(
                terry,
                EtapaInicio.xTronco,
                EtapaInicio.ySuperiorTronco
              );
              terry.setVelocity(0, 0);
              alTerminarAccion();
            });
          },
        });

        escena.time.delayedCall(95, () => {
          const xActual = terry.x;
          this.alineador.colocarSobreLinea(
            terry,
            "terry-fall-2",
            xActual,
            lineaSuelo - 8
          );
          terry.setFlipX(false);
        });

        escena.time.delayedCall(195, () => {
          const xActual = terry.x;
          this.alineador.colocarSobreLinea(
            terry,
            "terry-fall-3",
            xActual,
            lineaSuelo - 22
          );
          terry.setFlipX(false);
        });

        escena.time.delayedCall(295, () => {
          const xActual = terry.x;
          this.alineador.colocarSobreLinea(
            terry,
            "terry-fall-4",
            xActual,
            lineaTronco
          );
          terry.setFlipX(false);
        });
      },
    });
  }

  pozoCorrecto(): void {
    const { escena, terry, alTerminarAccion } = this.dependencias;
    desactivarFisicaTerry(terry);
    terry.setFlipX(false).reproducirCorrer();

    escena.tweens.add({
      targets: terry,
      x: 3820,
      y: CONFIGURACION_JUEGO.yTerrySuelo,
      duration: 330,
      ease: "Linear",
      onComplete: () => {
        terry.reproducirSalto();
        escena.tweens.add({
          targets: terry,
          x: 3985,
          y: 475,
          duration: 340,
          ease: "Quad.Out",
          onComplete: () => {
            escena.tweens.add({
              targets: terry,
              x: 4140,
              y: CONFIGURACION_JUEGO.yTerrySuelo,
              duration: 340,
              ease: "Quad.In",
              onComplete: () => {
                activarFisicaTerrySobreLinea(
                  terry,
                  4140,
                  CONFIGURACION_JUEGO.ySuperficieSuelo
                );
                terry.reproducirVictoria();
                escena.time.delayedCall(500, () => {
                  terry.reproducirIdle();
                  alTerminarAccion();
                });
              },
            });
          },
        });
      },
    });
  }

  pozoIncorrecto(sinVidas: boolean): void {
    const { escena, terry, alTerminarAccion, alGameOver } = this.dependencias;
    desactivarFisicaTerry(terry);
    terry.setFlipX(false).reproducirCorrer();

    escena.tweens.add({
      targets: terry,
      x: 3850,
      y: CONFIGURACION_JUEGO.yTerrySuelo,
      duration: 350,
      ease: "Linear",
      onComplete: () => {
        terry.reproducirCaida();
        escena.tweens.add({
          targets: terry,
          x: 3970,
          y: 760,
          duration: 650,
          ease: "Quad.In",
          onComplete: () => {
            if (sinVidas) {
              escena.time.delayedCall(500, alGameOver);
              return;
            }

            terry.setAlpha(0);
            activarFisicaTerrySobreLinea(
              terry,
              4140,
              CONFIGURACION_JUEGO.ySuperficieSuelo
            );
            terry.reproducirIdle();
            escena.tweens.add({ targets: terry, alpha: 1, duration: 250, onComplete: alTerminarAccion });
          },
        });
      },
    });
  }

  barreraCorrecta(desafio: Desafio): void {
    const { escena, terry, barreras, alTerminarAccion } = this.dependencias;
    const barrera = barreras.get(desafio.id);

    if (barrera) {
      barrera.colision.destroy();
      barrera.cuerpo.destroy();
      escena.tweens.add({
        targets: barrera.visual,
        y: barrera.visual.y + 80,
        angle: 20,
        alpha: 0,
        duration: 500,
        onComplete: () => {
          barrera.visual.destroy();
          barreras.delete(desafio.id);
        },
      });
    }

    terry.reproducirSalto();
    terry.setVelocity(380, -470);
    escena.time.delayedCall(900, () => {
      terry.setVelocityX(0);
      terry.reproducirIdle();
      alTerminarAccion();
    });
  }

  barreraIncorrecta(desafio: Desafio, sinVidas: boolean): void {
    const { escena, terry, barreras, alTerminarAccion, alGameOver } = this.dependencias;
    const barrera = barreras.get(desafio.id);
    terry.reproducirDanio();
    terry.setTint(0xff7777).setVelocity(-280, -170);

    escena.time.delayedCall(500, () => {
      if (barrera) {
        barrera.colision.destroy();
        barrera.cuerpo.destroy();
        barrera.visual.destroy();
        barreras.delete(desafio.id);
      }

      terry.setPosition(desafio.destinoX ?? terry.x + 300, terry.y);
      terry.setVelocity(0, 0).clearTint();
      terry.alinearCuerpoConLinea(CONFIGURACION_JUEGO.ySuperficieSuelo);

      if (sinVidas) {
        terry.reproducirDerrota();
        escena.time.delayedCall(900, alGameOver);
        return;
      }

      terry.reproducirIdle();
      alTerminarAccion();
    });
  }
}
