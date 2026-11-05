import Phaser from "phaser";

import {
  CONFIGURACION_JUEGO
} from "../../configuracion/juego";

import {
  crearDesafios
} from "../../datos/desafios";

import {
  preguntas,
  PreguntaJuego
} from "../../datos/preguntas";

import {
  EtapaCompetencia
} from "../etapas/EtapaCompetencia";

import {
  EtapaInicio
} from "../etapas/EtapaInicio";

import {
  EtapaGranja
} from "../etapas/EtapaGranja";

import {
  EtapaConlara
} from "../etapas/EtapaConlara";

import {
  EtapaProvisoria
} from "../etapas/EtapaProvisoria";

import {
  Terry
} from "../personajes/Terry";

import {
  CinematicasDesafios
} from "../sistemas/CinematicasDesafios";

import {
  EfectosJuego
} from "../sistemas/EfectosJuego";

import {
  FondoMundo
} from "../sistemas/FondoMundo";

import {
  GestorPajaros
} from "../sistemas/GestorPajaros";

import {
  InterfazJuego
} from "../sistemas/InterfazJuego";

import {
  BarreraJuego,
  Desafio,
  ElementosCompetencia
} from "../tipos";

export class Juego extends Phaser.Scene {
  private terry!: Terry;

  private interfaz!: InterfazJuego;

  private gestorPajaros!: GestorPajaros;

  private efectos!: EfectosJuego;

  private cinematicas!: CinematicasDesafios;

  private competencia!: ElementosCompetencia;

  private granja!: EtapaGranja;

  private conlara?: EtapaConlara;

  private desafios: Desafio[] = [];

  private desafioActivo?: Desafio;

  private rivales =
    new Map<
      number,
      Phaser.GameObjects.Container |
      Phaser.GameObjects.Sprite
    >();

  private barreras =
    new Map<
      number,
      BarreraJuego
    >();

  private vidas: number =
    CONFIGURACION_JUEGO
      .vidasIniciales;

  private puntos =
    0;

  private correctas =
    0;

  private incorrectas =
    0;

  private preguntaActiva =
    false;

  private accionAutomatica =
    false;

  private juegoTerminado =
    false;

  private metaAlcanzada =
    false;

  constructor() {
    super(
      "Juego"
    );
  }

  preload(): void {
    FondoMundo.precargar(
      this
    );

    Terry.precargar(
      this
    );

    EtapaInicio.precargar(
      this
    );

    EtapaCompetencia.precargar(
      this
    );

    EtapaGranja.precargar(
      this
    );

    EtapaConlara.precargar(
      this
    );

    EtapaProvisoria.precargar(
      this
    );

    InterfazJuego.precargar(
      this
    );
  }

  create(): void {
    this.reiniciarEstado();

    this.configurarMundo();

    const pisoPrincipal =
      FondoMundo.crear(
        this
      );

    this.terry =
      new Terry(
        this,
        200,
        CONFIGURACION_JUEGO
          .yTerrySuelo
      );

    this.gestorPajaros =
      new GestorPajaros(
        this,
        this.terry,
        (
          x,
          y
        ) =>
          this.recogerPajaro(
            x,
            y
          )
      );

    const inicio =
      EtapaInicio.crear(
        this,
        this.gestorPajaros
      );

    this.competencia =
      EtapaCompetencia.crear(
        this,
        this.gestorPajaros
      );

    this.crearAmbientacionRestoMundo();

    const provisorios =
      EtapaProvisoria.crear(
        this,
        this.terry
      );

    this.granja =
      new EtapaGranja(
        this,
        this.terry
      );

    this.granja.crear();

    this.conlara =
      new EtapaConlara(
        this,
        this.terry
      );

    let conlaraDisponible =
      false;

    try {
      conlaraDisponible =
        this.conlara.crear();
    } catch (error) {
      console.error(
        "No se pudo crear EtapaConlara. El resto del juego sigue activo.",
        error
      );

      this.conlara =
        undefined;
    }

    this.physics.add.collider(
      this.terry,
      pisoPrincipal
    );

    this.physics.add.collider(
      this.terry,
      inicio.troncoCuerpo
    );

    provisorios.pisos.forEach(
      (
        piso
      ) =>
        this.physics.add.collider(
          this.terry,
          piso
        )
    );

    this.rivales =
      provisorios.rivales;

    this.rivales.set(
      2,
      this.competencia.asesor
    );

    this.rivales.set(
      4,
      this.granja.obtenerFlavio()
    );

    if (
      conlaraDisponible &&
      this.conlara
    ) {
      const genaro =
        this.conlara.obtenerGenaro();

      if (genaro) {
        this.rivales.set(
          3,
          genaro
        );
      }
    }

    this.barreras =
      provisorios.barreras;

    this.configurarCamaraMundo();

    this.ajustarPantalla();

    this.interfaz =
      new InterfazJuego(
        this
      );

    this.interfaz.crear();

    this.interfaz.actualizarHUD(
      this.vidas,
      this.puntos
    );

    this.efectos =
      new EfectosJuego(
        this,
        (
          objeto
        ) =>
          this.interfaz.registrarMundoDinamico(
            objeto
          )
      );

    this.cinematicas =
      new CinematicasDesafios({
        escena:
          this,

        terry:
          this.terry,

        competencia:
          this.competencia,

        rivales:
          this.rivales,

        barreras:
          this.barreras,

        efectos:
          this.efectos,

        mostrarMensaje:
          (
            texto
          ) =>
            this.interfaz.mostrarMensaje(
              texto
            ),

        alTerminarAccion:
          () => {
            this.accionAutomatica =
              false;
          },

        alGameOver:
          () =>
            this.gameOver(),

        alGolpeFlavio:
          () => {
            const devolvioChancho =
              this.granja.devolverChanchoAlCorralPorGolpeDeFlavio();

            if (
              devolvioChancho
            ) {
              this.interfaz.mostrarMensaje(
                "¡FLAVIO TE SACO EL CHANCHO!\nVOLVIO AL CORRAL XD"
              );
            }
          },
      });

    this.ajustarPantalla();

    /*
     * Todo el mundo ya fue creado:
     *
     * - fondo
     * - Terry
     * - edificios
     * - granja
     * - Conlara
     * - HUD
     * - desafíos
     *
     * Recién ahora quitamos
     * el loader.
     */
    this.ocultarLoader();

    this.scale.on(
      Phaser.Scale.Events.RESIZE,
      this.ajustarPantalla,
      this
    );

    this.events.once(
      Phaser.Scenes.Events.SHUTDOWN,
      () => {
        this.scale.off(
          Phaser.Scale.Events.RESIZE,
          this.ajustarPantalla,
          this
        );
      }
    );
  }

  // ============================================================
  // LOADER HTML
  // ============================================================

  private ocultarLoader(): void {
    const loader =
      document.getElementById(
        "game-loader"
      );

    if (!loader) {
      return;
    }

    /*
     * Dejamos dos frames para evitar
     * que aparezca una pantalla vacía
     * entre el loader y el primer
     * frame real del juego.
     */
    requestAnimationFrame(
      () => {
        requestAnimationFrame(
          () => {
            loader.classList.add(
              "loader-hidden"
            );
          }
        );
      }
    );
  }

  update(
    _time: number,
    delta: number
  ): void {
    if (
      this.juegoTerminado
    ) {
      return;
    }

    /*
     * Seguridad global:
     *
     * ninguna pregunta,
     * golpe, pesca o cambio
     * de textura puede dejar
     * a Terry penetrando el piso.
     */
    this.terry
      .corregirHundimiento();

    this.gestorPajaros.actualizar(
      delta,

      this.preguntaActiva ||
        this.accionAutomatica ||
        this.juegoTerminado
    );

    if (
      this.preguntaActiva
    ) {
      this.terry.setVelocityX(
        0
      );

      return;
    }

    if (
      this.accionAutomatica
    ) {
      return;
    }

    const xTerry =
      this.terry.x;

    /*
     * Cada etapa interactiva
     * solo puede bloquear a Terry
     * cuando realmente está dentro
     * de su zona.
     */
    if (
      xTerry >= 4700 &&
      xTerry <= 8600 &&
      this.granja.actualizar()
    ) {
      return;
    }

    if (
      this.conlara &&
      xTerry >= 8400 &&
      xTerry <= 12250 &&
      this.conlara.actualizar()
    ) {
      return;
    }

    this.terry.actualizar();

    const proximo =
      this.desafios.find(
        (
          desafio
        ) =>
          !desafio.resuelto
      );

    if (
      proximo &&
      this.puedeActivarDesafio(
        proximo
      )
    ) {
      this.activarDesafio(
        proximo
      );

      return;
    }

    if (
      !this.metaAlcanzada &&
      this.desafios.every(
        (
          desafio
        ) =>
          desafio.resuelto
      )
    ) {
      if (
        this.terry.x >=
        CONFIGURACION_JUEGO
          .posicionMeta -
          120
      ) {
        this.finalizarNivel();
      }
    }
  }

  private reiniciarEstado(): void {
    this.desafios =
      crearDesafios();

    this.desafioActivo =
      undefined;

    this.rivales.clear();

    this.barreras.clear();

    this.vidas =
      CONFIGURACION_JUEGO
        .vidasIniciales;

    this.puntos =
      0;

    this.correctas =
      0;

    this.incorrectas =
      0;

    this.preguntaActiva =
      false;

    this.accionAutomatica =
      false;

    this.juegoTerminado =
      false;

    this.metaAlcanzada =
      false;
  }

  private configurarMundo(): void {
    this.physics.world.setBounds(
      0,
      0,
      CONFIGURACION_JUEGO
        .anchoMundo,
      CONFIGURACION_JUEGO
        .altoMundo
    );

    this.cameras.main.setBounds(
      0,
      0,
      CONFIGURACION_JUEGO
        .anchoMundo,
      CONFIGURACION_JUEGO
        .altoMundo
    );

    this.cameras.main.roundPixels =
      true;
  }

  private configurarCamaraMundo(): void {
    this.cameras.main.startFollow(
      this.terry,
      true,
      0.1,
      0.1
    );

    this.cameras.main.setDeadzone(
      300,
      150
    );
  }

  private ajustarPantalla(): void {
    const ancho =
      this.scale.width;

    const alto =
      this.scale.height;

    if (
      ancho <= 0 ||
      alto <= 0
    ) {
      return;
    }

    this.cameras.main.setViewport(
      0,
      0,
      ancho,
      alto
    );

    this.cameras.main.setZoom(
      alto /
        CONFIGURACION_JUEGO
          .altoMundo
    );

    this.interfaz?.ajustar();
  }

  private puedeActivarDesafio(
    desafio: Desafio
  ): boolean {
    if (
      this.terry.x <
      desafio.triggerX
    ) {
      return false;
    }

    if (
      desafio.tipo !==
      "rival"
    ) {
      return true;
    }

    const rival =
      this.rivales.get(
        desafio.id
      );

    if (!rival) {
      return true;
    }

    /*
     * Para Genaro y Cruz,
     * la pregunta solo aparece
     * cuando Terry realmente
     * está frente al personaje.
     */
    const margenAntes =
      145;

    const margenDespues =
      70;

    return (
      this.terry.x >=
        rival.x -
          margenAntes &&
      this.terry.x <=
        rival.x +
          margenDespues
    );
  }

  private activarDesafio(
    desafio: Desafio
  ): void {
    if (
      desafio.resuelto ||
      this.preguntaActiva ||
      this.accionAutomatica
    ) {
      return;
    }

    const pregunta =
      preguntas[
        desafio.preguntaIndice
      ];

    if (!pregunta) {
      return;
    }

    this.desafioActivo =
      desafio;

    this.preguntaActiva =
      true;

    /*
     * Durante la pregunta
     * NO apagamos el body
     * ni tocamos gravedad.
     */
    this.terry.setVelocityX(
      0
    );

    this.terry.estaApoyado()
      ? this.terry.reproducirIdle()
      : this.terry.reproducirSalto();

    this.interfaz.mostrarPregunta(
      pregunta,

      (
        respuesta,
        preguntaRespondida
      ) => {
        this.responderPregunta(
          respuesta,
          preguntaRespondida
        );
      }
    );
  }

  private responderPregunta(
    respuesta: number,
    pregunta: PreguntaJuego
  ): void {
    if (
      !this.preguntaActiva ||
      !this.desafioActivo
    ) {
      return;
    }

    const desafio =
      this.desafioActivo;

    this.preguntaActiva =
      false;

    this.interfaz
      .cerrarPregunta();

    /*
     * El body nunca se desactiva
     * durante la pregunta.
     */
    this.terry.setVelocityX(
      0
    );

    this.terry
      .corregirHundimiento();

    desafio.resuelto =
      true;

    this.desafioActivo =
      undefined;

    this.accionAutomatica =
      true;

    /*
     * RESPUESTA CORRECTA
     */
    if (
      respuesta ===
      pregunta.correcta
    ) {
      this.correctas++;

      this.puntos +=
        CONFIGURACION_JUEGO
          .puntosRespuestaCorrecta;

      this.interfaz.actualizarHUD(
        this.vidas,
        this.puntos
      );

      /*
       * CHANCHO
       */
      if (
        desafio.tipo ===
        "chancho"
      ) {
        this.interfaz.mostrarMensaje(
          "¡CORRECTO!\n¡TERRY SE LLEVA EL CHANCHO! +100"
        );

        this.granja
          .resolverChanchoCorrecto(
            () => {
              this.accionAutomatica =
                false;
            }
          );

        return;
      }

      this.interfaz.mostrarMensaje(
        "¡CORRECTO!\n+100"
      );

      this.cinematicas
        .resolverCorrecta(
          desafio
        );

      return;
    }

    /*
     * RESPUESTA INCORRECTA
     */
    this.incorrectas++;

    this.vidas =
      Math.max(
        0,
        this.vidas - 1
      );

    this.interfaz.actualizarHUD(
      this.vidas,
      this.puntos
    );

    /*
     * CHANCHO
     */
    if (
      desafio.tipo ===
      "chancho"
    ) {
      this.interfaz.mostrarMensaje(
        "INCORRECTO\nEL CHANCHO SE QUEDA ADENTRO XD"
      );

      this.granja
        .resolverChanchoIncorrecto(
          () => {
            if (
              this.vidas === 0
            ) {
              this.gameOver();

              return;
            }

            this.accionAutomatica =
              false;
          }
        );

      return;
    }

    /*
     * Fallar una pregunta
     * ya NO hace perder
     * el chancho.
     *
     * Solamente la patada
     * de Flavio puede quitárselo.
     */
    this.interfaz.mostrarMensaje(
      "INCORRECTO\n-1 VIDA"
    );

    this.cinematicas
      .resolverIncorrecta(
        desafio,
        this.vidas === 0
      );
  }

  private recogerPajaro(
    x: number,
    y: number
  ): void {
    this.efectos.plumas(
      x,
      y
    );

    this.puntos +=
      CONFIGURACION_JUEGO
        .puntosPajaro;

    this.interfaz.actualizarHUD(
      this.vidas,
      this.puntos
    );

    this.interfaz.mostrarMensaje(
      "¡PAJARO!\n+50"
    );

    this.accionAutomatica =
      true;

    this.terry
      .reproducirVictoriaEnMovimiento();

    this.time.delayedCall(
      450,
      () => {
        this.terry.estaApoyado()
          ? this.terry.reproducirIdle()
          : this.terry.reproducirSalto();

        this.accionAutomatica =
          false;
      }
    );
  }

  private crearAmbientacionRestoMundo(): void {
    /*
     * EtapaInicio y EtapaCompetencia
     * ya crean sus propias nubes
     * y pájaros.
     *
     * A partir de la granja
     * completamos la ambientación.
     */
    const nubes = [
      {
        x: 5200,
        y: 150,
        clave: "nube-inicio-1",
        ancho: 280,
        alto: 110,
        dx: 135,
        duracion: 19000,
      },

      {
        x: 6250,
        y: 205,
        clave: "nube-inicio-2",
        ancho: 250,
        alto: 96,
        dx: -120,
        duracion: 22500,
      },

      {
        x: 7480,
        y: 155,
        clave: "nube-inicio-3",
        ancho: 295,
        alto: 112,
        dx: 145,
        duracion: 20500,
      },

      {
        x: 8700,
        y: 210,
        clave: "nube-inicio-1",
        ancho: 245,
        alto: 95,
        dx: -105,
        duracion: 23500,
      },

      {
        x: 9950,
        y: 145,
        clave: "nube-inicio-2",
        ancho: 300,
        alto: 115,
        dx: 150,
        duracion: 21000,
      },

      {
        x: 11250,
        y: 205,
        clave: "nube-inicio-3",
        ancho: 260,
        alto: 100,
        dx: -125,
        duracion: 23000,
      },

      {
        x: 12500,
        y: 155,
        clave: "nube-inicio-1",
        ancho: 275,
        alto: 108,
        dx: 115,
        duracion: 20000,
      },
    ];

    for (
      const config of nubes
    ) {
      if (
        config.x >
        CONFIGURACION_JUEGO
          .anchoMundo +
          200
      ) {
        continue;
      }

      const nube =
        this.add
          .image(
            config.x,
            config.y,
            config.clave
          )
          .setDisplaySize(
            config.ancho,
            config.alto
          )
          .setAlpha(
            0.88
          )
          .setDepth(
            -55
          );

      this.tweens.add({
        targets:
          nube,

        x:
          nube.x +
          config.dx,

        duration:
          config.duracion,

        yoyo:
          true,

        repeat:
          -1,

        ease:
          "Sine.InOut",
      });
    }

    const crearPajaro = (
      x: number,
      y: number,
      velocidad: number,
      direccion: 1 | -1,
      xMinimo: number,
      xMaximo: number,
      tamano: number
    ): void => {
      this.gestorPajaros.crear({
        x,
        y,
        velocidad,
        direccion,
        tamano,

        yMinimo:
          y - 35,

        yMaximo:
          y + 35,

        xMinimo,

        xMaximo:
          Math.min(
            xMaximo,
            CONFIGURACION_JUEGO
              .anchoMundo +
              80
          ),

        texturaInicial:
          "pajaro-inicio-1",

        animacion:
          "pajaro-inicio-volando",
      });
    };

    /*
     * GRANJA
     */
    crearPajaro(
      5300,
      360,
      46,
      1,
      4850,
      8450,
      72
    );

    crearPajaro(
      7350,
      420,
      -40,
      -1,
      4850,
      8450,
      68
    );

    /*
     * ESTACIÓN CONLARA
     */
    crearPajaro(
      8850,
      370,
      48,
      1,
      8400,
      12250,
      72
    );

    crearPajaro(
      10350,
      320,
      -42,
      -1,
      8400,
      12250,
      68
    );

    crearPajaro(
      11650,
      430,
      44,
      1,
      8400,
      12250,
      70
    );

    /*
     * FINAL
     */
    if (
      CONFIGURACION_JUEGO
        .anchoMundo >
      12250
    ) {
      crearPajaro(
        12600,
        350,
        -38,
        -1,
        12200,
        CONFIGURACION_JUEGO
          .anchoMundo +
          80,
        66
      );
    }
  }

  private finalizarNivel(): void {
    if (
      this.metaAlcanzada ||
      this.juegoTerminado
    ) {
      return;
    }

    this.metaAlcanzada =
      true;

    this.juegoTerminado =
      true;

    this.accionAutomatica =
      true;

    this.terry.setVelocity(
      0,
      0
    );

    const puntosAntesBonus =
      this.puntos;

    const bonusVidas =
      this.vidas *
      CONFIGURACION_JUEGO
        .bonusPorVida;

    this.puntos +=
      CONFIGURACION_JUEGO
        .bonusMeta +
      bonusVidas;

    this.interfaz.actualizarHUD(
      this.vidas,
      this.puntos
    );

    this.terry
      .reproducirVictoriaFinal();

    this.interfaz.mostrarMensaje(
      "🏁 ¡LLEGASTE!"
    );

    this.time.delayedCall(
      2000,
      () => {
        this.interfaz
          .mostrarResultados(
            {
              puntos:
                this.puntos,

              correctas:
                this.correctas,

              incorrectas:
                this.incorrectas,

              vidas:
                this.vidas,

              puntosAntesBonus,

              bonusMeta:
                CONFIGURACION_JUEGO
                  .bonusMeta,

              bonusVidas,
            },

            () =>
              this.scene.restart()
          );
      }
    );
  }

  private gameOver(): void {
    if (
      this.juegoTerminado
    ) {
      return;
    }

    this.juegoTerminado =
      true;

    this.preguntaActiva =
      false;

    this.accionAutomatica =
      true;

    this.terry.setVelocity(
      0,
      0
    );

    this.interfaz.mostrarGameOver(
      {
        puntos:
          this.puntos,

        correctas:
          this.correctas,

        incorrectas:
          this.incorrectas,

        vidas:
          0,
      },

      () =>
        this.scene.restart()
    );
  }
}