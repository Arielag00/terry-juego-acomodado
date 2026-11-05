import Phaser from "phaser";

type PasoIntro = {
  etiqueta: string;
  titulo: string;
  descripcion: string;
  items: Array<{
    titulo: string;
    detalle: string;
  }>;
};

export class Intro extends Phaser.Scene {
  private indicePaso = 0;

  private readonly pasos: PasoIntro[] = [
    {
      etiqueta: "ANTES DE ARRANCAR",
      titulo: "Llegá a la meta.",
      descripcion:
        "Recorré el camino hasta Estación Conlara y superá los desafíos sin quedarte sin vidas.",
      items: [
        {
          titulo: "3 VIDAS",
          detalle: "Cada error te cuesta una.",
        },
        {
          titulo: "PUNTOS",
          detalle: "Las respuestas correctas suman.",
        },
        {
          titulo: "META",
          detalle: "Llegá con el mejor puntaje posible.",
        },
      ],
    },

    {
      etiqueta: "CONTROLES",
      titulo: "Moverse es simple.",
      descripcion:
        "Usá el teclado para avanzar por el escenario y activar las acciones especiales.",
      items: [
        {
          titulo: "A / D o flechas",
          detalle: "Mover",
        },
        {
          titulo: "ESPACIO",
          detalle: "Saltar",
        },
        {
          titulo: "E",
          detalle: "Interactuar",
        },
      ],
    },

    {
      etiqueta: "DESAFÍOS",
      titulo: "Pensá antes de responder.",
      descripcion:
        "Durante el recorrido aparecen preguntas e interacciones. Elegí bien y seguí avanzando.",
      items: [
        {
          titulo: "CORRECTA",
          detalle: "Sumás puntos y continuás.",
        },
        {
          titulo: "INCORRECTA",
          detalle: "Perdés una vida.",
        },
        {
          titulo: "EXPLORÁ",
          detalle: "Hay acciones especiales en el camino.",
        },
      ],
    },
  ];

  private portada?: Phaser.GameObjects.Image;

  private overlayPortada!: Phaser.GameObjects.Rectangle;
  private panelDerecho!: Phaser.GameObjects.Rectangle;
  private separador!: Phaser.GameObjects.Rectangle;

  private marcaTitulo!: Phaser.GameObjects.Text;
  private marcaSubtitulo!: Phaser.GameObjects.Text;
  private marcaLinea!: Phaser.GameObjects.Rectangle;
  private marcaTexto!: Phaser.GameObjects.Text;

  private etiquetaPaso!: Phaser.GameObjects.Text;
  private tituloPaso!: Phaser.GameObjects.Text;
  private descripcionPaso!: Phaser.GameObjects.Text;
  private contadorPaso!: Phaser.GameObjects.Text;

  private filas: Array<{
    fondo: Phaser.GameObjects.Rectangle;
    acento: Phaser.GameObjects.Rectangle;
    titulo: Phaser.GameObjects.Text;
    detalle: Phaser.GameObjects.Text;
  }> = [];

  private botonPrincipal!: Phaser.GameObjects.Rectangle;
  private textoBotonPrincipal!: Phaser.GameObjects.Text;
  private botonAnterior!: Phaser.GameObjects.Text;
  private saltarIntro!: Phaser.GameObjects.Text;

  private indicadores: Phaser.GameObjects.Arc[] = [];

  private contenidoDerecho: Phaser.GameObjects.GameObject[] = [];

  constructor() {
    super("Intro");
  }

  preload(): void {
    this.load.image(
      "intro-portada",
      "/interfaz/intro/portada-terry.jpg"
    );
  }

  create(): void {
    this.cameras.main.setBackgroundColor("#071d15");

    this.crearEstructura();
    this.crearPortada();
    this.crearContenidoDerecho();
    this.configurarInteracciones();

    this.mostrarPaso(false);
    this.ajustarPantalla();

    /*
     * La intro ya está completamente creada.
     *
     * Recién ahora ocultamos el loader HTML
     * para evitar mostrar la pantalla vacía.
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

  private crearEstructura(): void {
    this.overlayPortada = this.add
      .rectangle(
        0,
        0,
        10,
        10,
        0x031c13,
        0.5
      )
      .setOrigin(0)
      .setDepth(2);

    this.panelDerecho = this.add
      .rectangle(
        0,
        0,
        10,
        10,
        0xf7f5ef
      )
      .setOrigin(0)
      .setDepth(5);

    this.separador = this.add
      .rectangle(
        0,
        0,
        3,
        10,
        0xf5a126
      )
      .setOrigin(
        0.5,
        0
      )
      .setDepth(6);
  }

  private crearPortada(): void {
    if (
      this.textures.exists(
        "intro-portada"
      )
    ) {
      this.portada = this.add
        .image(
          0,
          0,
          "intro-portada"
        )
        .setOrigin(0.5)
        .setDepth(0);
    }

    this.marcaTitulo = this.add
      .text(
        0,
        0,
        "TERRY",
        {
          fontFamily:
            "Arial, sans-serif",

          fontSize:
            "42px",

          fontStyle:
            "bold",

          color:
            "#ffffff",

          stroke:
            "#09251a",

          strokeThickness:
            4,
        }
      )
      .setDepth(3);

    this.marcaSubtitulo =
      this.add
        .text(
          0,
          0,
          "CAMINO A LA META",
          {
            fontFamily:
              "Arial, sans-serif",

            fontSize:
              "14px",

            fontStyle:
              "bold",

            color:
              "#f6aa2b",

            letterSpacing:
              2,
          }
        )
        .setDepth(3);

    this.marcaLinea = this.add
      .rectangle(
        0,
        0,
        74,
        4,
        0xf6a027
      )
      .setOrigin(
        0,
        0.5
      )
      .setDepth(3);

    this.marcaTexto = this.add
      .text(
        0,
        0,
        "EL CAMINO EMPIEZA ACÁ.",
        {
          fontFamily:
            "Arial, sans-serif",

          fontSize:
            "14px",

          fontStyle:
            "bold",

          color:
            "#ffffff",
        }
      )
      .setDepth(3);
  }

  private crearContenidoDerecho(): void {
    this.etiquetaPaso = this.add
      .text(
        0,
        0,
        "",
        {
          fontFamily:
            "Arial, sans-serif",

          fontSize:
            "13px",

          fontStyle:
            "bold",

          color:
            "#e98712",

          letterSpacing:
            1.6,
        }
      )
      .setDepth(10);

    this.tituloPaso = this.add
      .text(
        0,
        0,
        "",
        {
          fontFamily:
            "Arial, sans-serif",

          fontSize:
            "38px",

          fontStyle:
            "bold",

          color:
            "#0d1713",
        }
      )
      .setDepth(10);

    this.descripcionPaso =
      this.add
        .text(
          0,
          0,
          "",
          {
            fontFamily:
              "Arial, sans-serif",

            fontSize:
              "17px",

            color:
              "#68716c",

            lineSpacing:
              6,
          }
        )
        .setDepth(10);

    this.contadorPaso = this.add
      .text(
        0,
        0,
        "",
        {
          fontFamily:
            "Arial, sans-serif",

          fontSize:
            "12px",

          fontStyle:
            "bold",

          color:
            "#8a928e",
        }
      )
      .setOrigin(
        1,
        0
      )
      .setDepth(10);

    for (
      let i = 0;
      i < 3;
      i++
    ) {
      const fondo = this.add
        .rectangle(
          0,
          0,
          100,
          62,
          0xffffff,
          0.92
        )
        .setStrokeStyle(
          1,
          0xdde2de,
          1
        )
        .setOrigin(
          0,
          0.5
        )
        .setDepth(9);

      const acento = this.add
        .rectangle(
          0,
          0,
          5,
          38,
          i === 0
            ? 0xf5a126
            : 0x0c5a3a
        )
        .setOrigin(
          0,
          0.5
        )
        .setDepth(10);

      const titulo = this.add
        .text(
          0,
          0,
          "",
          {
            fontFamily:
              "Arial, sans-serif",

            fontSize:
              "14px",

            fontStyle:
              "bold",

            color:
              "#14231d",
          }
        )
        .setOrigin(
          0,
          0.5
        )
        .setDepth(10);

      const detalle = this.add
        .text(
          0,
          0,
          "",
          {
            fontFamily:
              "Arial, sans-serif",

            fontSize:
              "14px",

            color:
              "#707975",
          }
        )
        .setOrigin(
          0,
          0.5
        )
        .setDepth(10);

      this.filas.push({
        fondo,
        acento,
        titulo,
        detalle,
      });

      this.contenidoDerecho.push(
        fondo,
        acento,
        titulo,
        detalle
      );
    }

    for (
      let i = 0;
      i < this.pasos.length;
      i++
    ) {
      const punto = this.add
        .circle(
          0,
          0,
          4,
          0xc8ceca
        )
        .setDepth(10);

      this.indicadores.push(
        punto
      );
    }

    this.botonPrincipal =
      this.add
        .rectangle(
          0,
          0,
          100,
          58,
          0xf5a126
        )
        .setOrigin(
          0,
          0.5
        )
        .setDepth(10)
        .setInteractive({
          useHandCursor:
            true,
        });

    this.textoBotonPrincipal =
      this.add
        .text(
          0,
          0,
          "SIGUIENTE",
          {
            fontFamily:
              "Arial, sans-serif",

            fontSize:
              "17px",

            fontStyle:
              "bold",

            color:
              "#102019",
          }
        )
        .setOrigin(0.5)
        .setDepth(11)
        .setInteractive({
          useHandCursor:
            true,
        });

    this.botonAnterior = this.add
      .text(
        0,
        0,
        "← ANTERIOR",
        {
          fontFamily:
            "Arial, sans-serif",

          fontSize:
            "13px",

          fontStyle:
            "bold",

          color:
            "#66716c",
        }
      )
      .setOrigin(
        0,
        0.5
      )
      .setDepth(10)
      .setInteractive({
        useHandCursor:
          true,
      });

    this.saltarIntro = this.add
      .text(
        0,
        0,
        "SALTAR INTRO",
        {
          fontFamily:
            "Arial, sans-serif",

          fontSize:
            "12px",

          fontStyle:
            "bold",

          color:
            "#7c8580",
        }
      )
      .setOrigin(
        1,
        1
      )
      .setDepth(10)
      .setInteractive({
        useHandCursor:
          true,
      });

    this.contenidoDerecho.push(
      this.etiquetaPaso,
      this.tituloPaso,
      this.descripcionPaso,
      this.contadorPaso
    );
  }

  private configurarInteracciones(): void {
    const avanzar = () =>
      this.avanzar();

    this.botonPrincipal
      .on(
        "pointerdown",
        avanzar
      )
      .on(
        "pointerover",
        () =>
          this.botonPrincipal.setFillStyle(
            0xffad35
          )
      )
      .on(
        "pointerout",
        () =>
          this.botonPrincipal.setFillStyle(
            0xf5a126
          )
      );

    this.textoBotonPrincipal.on(
      "pointerdown",
      avanzar
    );

    this.botonAnterior
      .on(
        "pointerdown",
        () =>
          this.retroceder()
      )
      .on(
        "pointerover",
        () =>
          this.botonAnterior.setColor(
            "#14231d"
          )
      )
      .on(
        "pointerout",
        () =>
          this.botonAnterior.setColor(
            "#66716c"
          )
      );

    this.saltarIntro
      .on(
        "pointerdown",
        () =>
          this.iniciarJuego()
      )
      .on(
        "pointerover",
        () =>
          this.saltarIntro.setColor(
            "#14231d"
          )
      )
      .on(
        "pointerout",
        () =>
          this.saltarIntro.setColor(
            "#7c8580"
          )
      );
  }

  private mostrarPaso(
    animar = true
  ): void {
    const actualizar = () => {
      const paso =
        this.pasos[
          this.indicePaso
        ];

      this.etiquetaPaso.setText(
        paso.etiqueta
      );

      this.tituloPaso.setText(
        paso.titulo
      );

      this.descripcionPaso.setText(
        paso.descripcion
      );

      this.contadorPaso.setText(
        `${String(
          this.indicePaso + 1
        ).padStart(
          2,
          "0"
        )} / ${String(
          this.pasos.length
        ).padStart(
          2,
          "0"
        )}`
      );

      this.filas.forEach(
        (
          fila,
          indice
        ) => {
          const item =
            paso.items[
              indice
            ];

          fila.titulo.setText(
            item.titulo
          );

          fila.detalle.setText(
            item.detalle
          );
        }
      );

      this.textoBotonPrincipal.setText(
        this.indicePaso ===
          this.pasos.length - 1
          ? "JUGAR"
          : "SIGUIENTE"
      );

      this.botonAnterior.setVisible(
        this.indicePaso > 0
      );

      this.indicadores.forEach(
        (
          punto,
          indice
        ) => {
          punto.setFillStyle(
            indice ===
              this.indicePaso
              ? 0xf5a126
              : 0xc8ceca
          );

          punto.setRadius(
            indice ===
              this.indicePaso
              ? 5
              : 4
          );
        }
      );
    };

    if (!animar) {
      actualizar();

      return;
    }

    this.tweens.add({
      targets:
        this.contenidoDerecho,

      alpha:
        0,

      x:
        "+=10",

      duration:
        120,

      ease:
        "Sine.easeIn",

      onComplete:
        () => {
          actualizar();

          this.ajustarPantalla();

          this.tweens.add({
            targets:
              this.contenidoDerecho,

            alpha:
              1,

            x:
              "-=10",

            duration:
              170,

            ease:
              "Sine.easeOut",
          });
        },
    });
  }

  private avanzar(): void {
    if (
      this.indicePaso <
      this.pasos.length - 1
    ) {
      this.indicePaso++;

      this.mostrarPaso(
        true
      );

      return;
    }

    this.iniciarJuego();
  }

  private retroceder(): void {
    if (
      this.indicePaso <= 0
    ) {
      return;
    }

    this.indicePaso--;

    this.mostrarPaso(
      true
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

    const compacto =
      ancho < 900;

    const anchoIzquierdo =
      compacto
        ? Math.round(
            ancho * 0.46
          )
        : Math.round(
            ancho * 0.53
          );

    const anchoDerecho =
      ancho -
      anchoIzquierdo;

    if (this.portada) {
      const escala =
        Math.max(
          anchoIzquierdo /
            this.portada.width,

          alto /
            this.portada.height
        );

      this.portada
        .setPosition(
          anchoIzquierdo /
            2,

          alto /
            2
        )
        .setScale(
          escala
        );
    }

    this.overlayPortada
      .setPosition(
        0,
        0
      )
      .setSize(
        anchoIzquierdo,
        alto
      )
      .setFillStyle(
        0x021d14,
        0.5
      );

    this.panelDerecho
      .setPosition(
        anchoIzquierdo,
        0
      )
      .setSize(
        anchoDerecho,
        alto
      );

    this.separador
      .setPosition(
        anchoIzquierdo,
        0
      )
      .setSize(
        3,
        alto
      );

    const margenIzq =
      Phaser.Math.Clamp(
        anchoIzquierdo *
          0.065,

        34,
        68
      );

    const margenArriba =
      Phaser.Math.Clamp(
        alto *
          0.065,

        30,
        58
      );

    this.marcaTitulo
      .setPosition(
        margenIzq,
        margenArriba
      )
      .setFontSize(
        Phaser.Math.Clamp(
          alto * 0.052,
          32,
          48
        )
      );

    this.marcaSubtitulo
      .setPosition(
        margenIzq + 2,

        this.marcaTitulo.y +
          this.marcaTitulo.height +
          2
      )
      .setFontSize(
        Phaser.Math.Clamp(
          alto * 0.017,
          11,
          15
        )
      );

    this.marcaLinea.setPosition(
      margenIzq,
      alto - 120
    );

    this.marcaTexto
      .setPosition(
        margenIzq,
        alto - 99
      )
      .setFontSize(
        Phaser.Math.Clamp(
          alto * 0.017,
          11,
          14
        )
      );

    const margenPanelX =
      Phaser.Math.Clamp(
        anchoDerecho *
          0.16,

        44,
        130
      );

    const xContenido =
      anchoIzquierdo +
      margenPanelX;

    const anchoContenido =
      anchoDerecho -
      margenPanelX * 2;

    const yInicio =
      Phaser.Math.Clamp(
        alto *
          0.15,

        88,
        145
      );

    this.etiquetaPaso
      .setPosition(
        xContenido,
        yInicio
      )
      .setFontSize(
        Phaser.Math.Clamp(
          alto * 0.016,
          11,
          14
        )
      );

    this.contadorPaso
      .setPosition(
        xContenido +
          anchoContenido,

        yInicio + 1
      )
      .setFontSize(
        Phaser.Math.Clamp(
          alto * 0.014,
          10,
          12
        )
      );

    this.tituloPaso
      .setPosition(
        xContenido,
        yInicio + 31
      )
      .setFontSize(
        Phaser.Math.Clamp(
          alto * 0.046,
          29,
          40
        )
      );

    this.descripcionPaso
      .setPosition(
        xContenido,

        this.tituloPaso.y +
          this.tituloPaso.height +
          18
      )
      .setFontSize(
        Phaser.Math.Clamp(
          alto * 0.019,
          14,
          17
        )
      );

    this.descripcionPaso.setWordWrapWidth(
      anchoContenido,
      true
    );

    const yFilas =
      this.descripcionPaso.y +
      this.descripcionPaso.height +
      38;

    const altoFila =
      Phaser.Math.Clamp(
        alto *
          0.075,

        54,
        66
      );

    const separacion =
      Phaser.Math.Clamp(
        alto *
          0.017,

        10,
        15
      );

    this.filas.forEach(
      (
        fila,
        indice
      ) => {
        const y =
          yFilas +
          indice *
            (
              altoFila +
              separacion
            );

        const anchoTitulo =
          Phaser.Math.Clamp(
            anchoContenido *
              0.34,

            112,
            170
          );

        fila.fondo
          .setPosition(
            xContenido,
            y +
              altoFila /
                2
          )
          .setSize(
            anchoContenido,
            altoFila
          );

        fila.acento
          .setPosition(
            xContenido +
              14,

            y +
              altoFila /
                2
          )
          .setSize(
            4,

            altoFila *
              0.56
          );

        fila.titulo
          .setPosition(
            xContenido +
              30,

            y +
              altoFila /
                2
          )
          .setFontSize(
            Phaser.Math.Clamp(
              alto *
                0.0165,

              12,
              15
            )
          );

        fila.detalle
          .setPosition(
            xContenido +
              30 +
              anchoTitulo,

            y +
              altoFila /
                2
          )
          .setFontSize(
            Phaser.Math.Clamp(
              alto *
                0.016,

              12,
              14
            )
          );
      }
    );

    const anchoBoton =
      Phaser.Math.Clamp(
        anchoContenido,
        250,
        520
      );

    const yBoton =
      Math.min(
        alto - 112,

        yFilas +
          3 *
            (
              altoFila +
              separacion
            ) +
          22
      );

    this.botonPrincipal
      .setPosition(
        xContenido,
        yBoton
      )
      .setSize(
        anchoBoton,

        Phaser.Math.Clamp(
          alto *
            0.068,

          50,
          60
        )
      );

    this.textoBotonPrincipal
      .setPosition(
        xContenido +
          anchoBoton /
            2,

        yBoton
      )
      .setFontSize(
        Phaser.Math.Clamp(
          alto *
            0.019,

          14,
          17
        )
      );

    this.botonAnterior
      .setPosition(
        xContenido,
        yBoton + 51
      )
      .setFontSize(
        Phaser.Math.Clamp(
          alto *
            0.014,

          11,
          13
        )
      );

    const anchoIndicadores =
      (
        this.indicadores.length -
        1
      ) *
      20;

    const xIndicadorInicial =
      xContenido +
      anchoContenido -
      anchoIndicadores;

    this.indicadores.forEach(
      (
        punto,
        indice
      ) => {
        punto.setPosition(
          xIndicadorInicial +
            indice * 20,

          yBoton + 51
        );
      }
    );

    this.saltarIntro
      .setPosition(
        anchoIzquierdo +
          anchoDerecho -
          Math.max(
            24,

            anchoDerecho *
              0.05
          ),

        alto -
          Math.max(
            22,

            alto *
              0.04
          )
      )
      .setFontSize(
        Phaser.Math.Clamp(
          alto *
            0.014,

          10,
          12
        )
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
     * Esperamos dos frames para que Phaser
     * pinte la intro antes de retirar
     * la capa de carga.
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

  private mostrarLoader(): void {
    const loader =
      document.getElementById(
        "game-loader"
      );

    if (!loader) {
      return;
    }

    loader.classList.remove(
      "loader-hidden"
    );
  }

  private iniciarJuego(): void {
    this.scale.off(
      Phaser.Scale.Events.RESIZE,
      this.ajustarPantalla,
      this
    );

    /*
     * Volvemos a mostrar Cargando...
     * antes de entrar al juego.
     */
    this.mostrarLoader();

    /*
     * Esperamos dos frames.
     *
     * Esto permite que el navegador
     * alcance a pintar el loader antes
     * de que Phaser empiece a cargar
     * la escena Juego.
     */
    requestAnimationFrame(
      () => {
        requestAnimationFrame(
          () => {
            this.scene.start(
              "Juego"
            );
          }
        );
      }
    );
  }
}