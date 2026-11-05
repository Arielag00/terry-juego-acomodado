import Phaser from "phaser";
import { PreguntaJuego } from "../../datos/preguntas";

export interface ResumenPartida {
  puntos: number;
  correctas: number;
  incorrectas: number;
  vidas: number;
  puntosAntesBonus?: number;
  bonusMeta?: number;
  bonusVidas?: number;
}

const RUTA_INTERFAZ = "/interfaz/";
const ASPECTO_UI_HORIZONTAL = 2172 / 724;
const ASPECTO_PANEL_PREGUNTA = 1672 / 941;

export class InterfazJuego {
  private camaraInterfaz?: Phaser.Cameras.Scene2D.Camera;

  private fondoVidas?: Phaser.GameObjects.Image;
  private corazonesHud: Phaser.GameObjects.Image[] = [];
  private vidasActuales = 3;
  private usarSegundoFrameCorazon = false;

  private fondoPuntos?: Phaser.GameObjects.Image;
  private textoPuntos?: Phaser.GameObjects.Text;
  private imagenInstrucciones?: Phaser.GameObjects.Image;
  private mensajeCentral?: Phaser.GameObjects.Text;

  private elementosPregunta: Phaser.GameObjects.GameObject[] = [];
  private preguntaActual?: PreguntaJuego;
  private alResponder?: (indice: number, pregunta: PreguntaJuego) => void;

  constructor(private readonly escena: Phaser.Scene) {}

  static precargar(escena: Phaser.Scene): void {
    escena.load.image("ui-hud-vidas-base", `${RUTA_INTERFAZ}hud/hud-vidas-base.png`);
    escena.load.image("ui-corazon-full-1", `${RUTA_INTERFAZ}hud/corazon-full-1.png`);
    escena.load.image("ui-corazon-full-2", `${RUTA_INTERFAZ}hud/corazon-full-2.png`);
    escena.load.image("ui-corazon-empty", `${RUTA_INTERFAZ}hud/corazon-empty.png`);
    escena.load.image("ui-hud-puntos-base", `${RUTA_INTERFAZ}hud/hud-puntos-base.png`);
    escena.load.image("ui-hud-controles", `${RUTA_INTERFAZ}hud/hud-controles.png`);
    escena.load.image("ui-quiz-panel-base", `${RUTA_INTERFAZ}preguntas/quiz-panel-base.png`);
  }

  crear(): void {
    this.crearCamaraInterfaz();
    this.crearHUD();
    this.ajustar();
  }

  registrarMundoDinamico<T extends Phaser.GameObjects.GameObject>(objeto: T): T {
    this.camaraInterfaz?.ignore(objeto);
    return objeto;
  }

  actualizarHUD(vidas: number, puntos: number): void {
    this.vidasActuales = Phaser.Math.Clamp(vidas, 0, 3);
    this.actualizarCorazones();
    this.textoPuntos?.setText(puntos.toString().padStart(4, "0"));
  }

  mostrarMensaje(texto: string): void {
    if (!this.mensajeCentral) return;
    this.mensajeCentral.setText(texto).setAlpha(1).setScale(0.8);
    this.escena.tweens.add({
      targets: this.mensajeCentral,
      scale: 1,
      duration: 160,
      ease: "Back.Out",
    });
    this.escena.time.delayedCall(900, () => {
      if (this.mensajeCentral?.scene) this.mensajeCentral.setText("");
    });
  }

  mostrarPregunta(
    pregunta: PreguntaJuego,
    alResponder: (indice: number, pregunta: PreguntaJuego) => void
  ): void {
    this.cerrarPregunta(false);
    this.preguntaActual = pregunta;
    this.alResponder = alResponder;

    const anchoPantalla = this.escena.scale.width;
    const altoPantalla = this.escena.scale.height;
    const escala = this.obtenerEscala();
    const centroX = anchoPantalla / 2;

    let anchoPanel = Math.min(760 * escala, anchoPantalla - 28 * escala);
    let altoPanel = anchoPanel / ASPECTO_PANEL_PREGUNTA;

    const altoMaximo = altoPantalla - 34 * escala;
    if (altoPanel > altoMaximo) {
      altoPanel = altoMaximo;
      anchoPanel = altoPanel * ASPECTO_PANEL_PREGUNTA;
    }

    const centroPanelY = altoPantalla / 2;

    const oscuridad = this.registrarInterfaz(
      this.escena.add.rectangle(
        centroX,
        altoPantalla / 2,
        anchoPantalla,
        altoPantalla,
        0x000000,
        0.3
      )
    )
      .setScrollFactor(0)
      .setDepth(500);

    const panel = this.registrarInterfaz(
      this.escena.add.image(centroX, centroPanelY, "ui-quiz-panel-base")
    )
      .setDisplaySize(anchoPanel, altoPanel)
      .setScrollFactor(0)
      .setDepth(501);

    // El titulo y la pregunta se posicionan usando las zonas reales dibujadas
    // dentro de quiz-panel-base.png. Asi quedan contenidos en el bloque superior
    // aunque cambie la resolucion de pantalla.
    const arribaPanel = centroPanelY - altoPanel / 2;

    const producto = this.registrarInterfaz(
      this.escena.add.text(
        centroX,
        arribaPanel + altoPanel * 0.225,
        pregunta.producto.toUpperCase(),
        {
          fontFamily: "Arial, Helvetica, sans-serif",
          fontSize: `${Math.round(13 * escala)}px`,
          fontStyle: "bold",
          color: "#f6a23a",
          stroke: "#1b2730",
          strokeThickness: Math.max(2, Math.round(2 * escala)),
        }
      )
    )
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(503);

    const textoPregunta = this.registrarInterfaz(
      this.escena.add.text(
        centroX,
        arribaPanel + altoPanel * 0.325,
        pregunta.pregunta,
        {
          fontFamily: "Arial, Helvetica, sans-serif",
          fontSize: `${Math.round(19 * escala)}px`,
          fontStyle: "bold",
          color: "#ffffff",
          align: "center",
          stroke: "#14212b",
          strokeThickness: Math.max(2, Math.round(3 * escala)),
          wordWrap: { width: anchoPanel * 0.78 },
        }
      )
    )
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(503);

    this.elementosPregunta.push(oscuridad, panel, producto, textoPregunta);

    // El PNG ya contiene los cuatro fondos de opcion. Estos rectangulos son
    // hitboxes transparentes: solo agregan un hover sutil y reciben el click.
    // Centros medidos sobre el propio PNG de preguntas. Las cuatro opciones
    // estan dibujadas una debajo de otra, no en una grilla 2x2.
    const anchoOpcion = anchoPanel * 0.79;
    const altoOpcion = altoPanel * 0.082;
    const centrosOpciones = [0.495, 0.602, 0.708, 0.813];
    const xTexto = centroX - anchoPanel / 2 + anchoPanel * 0.115;

    pregunta.opciones.forEach((opcion, indice) => {
      const y = arribaPanel + altoPanel * centrosOpciones[indice];
      const letra = String.fromCharCode(65 + indice);

      const hitbox = this.registrarInterfaz(
        this.escena.add.rectangle(centroX, y, anchoOpcion, altoOpcion, 0x63b7e6, 0)
      )
        .setScrollFactor(0)
        .setDepth(502)
        .setInteractive({ useHandCursor: true });

      const texto = this.registrarInterfaz(
        this.escena.add.text(xTexto, y + 3 * escala, `${letra}. ${opcion}`, {
          fontFamily: "Arial, Helvetica, sans-serif",
          fontSize: `${Math.round(15 * escala)}px`,
          fontStyle: "bold",
          color: "#ffffff",
          stroke: "#1a2730",
          strokeThickness: Math.max(1, Math.round(2 * escala)),
        })
      )
        .setOrigin(0, 0.5)
        .setScrollFactor(0)
        .setDepth(504)
        .setInteractive({ useHandCursor: true });

      const hoverOn = () => hitbox.setFillStyle(0x8fd7ff, 0.14);
      const hoverOff = () => hitbox.setFillStyle(0x63b7e6, 0);
      const responder = () => {
        if (!this.preguntaActual || !this.alResponder) return;
        this.alResponder(indice, this.preguntaActual);
      };

      hitbox
        .on("pointerover", hoverOn)
        .on("pointerout", hoverOff)
        .on("pointerdown", responder);
      texto
        .on("pointerover", hoverOn)
        .on("pointerout", hoverOff)
        .on("pointerdown", responder);

      this.elementosPregunta.push(hitbox, texto);
    });
  }

  cerrarPregunta(limpiarEstado = true): void {
    for (const elemento of this.elementosPregunta) elemento.destroy();
    this.elementosPregunta = [];
    if (limpiarEstado) {
      this.preguntaActual = undefined;
      this.alResponder = undefined;
    }
  }

  ajustar(): void {
    const ancho = this.escena.scale.width;
    const alto = this.escena.scale.height;
    if (ancho <= 0 || alto <= 0) return;

    this.camaraInterfaz?.setViewport(0, 0, ancho, alto).setScroll(0, 0).setZoom(1);
    this.ajustarHUD();

    if (this.preguntaActual && this.alResponder) {
      const pregunta = this.preguntaActual;
      const responder = this.alResponder;
      this.mostrarPregunta(pregunta, responder);
    }
  }

  mostrarResultados(resumen: ResumenPartida, alReiniciar: () => void): void {
    const lineas = [
      `${resumen.puntos} PUNTOS`,
      "",
      `Correctas: ${resumen.correctas}`,
      `Incorrectas: ${resumen.incorrectas}`,
      `Vidas restantes: ${resumen.vidas}`,
    ];

    if (resumen.puntosAntesBonus !== undefined) {
      lineas.push(
        "",
        `Recorrido: ${resumen.puntosAntesBonus}`,
        `Meta: +${resumen.bonusMeta ?? 0}`,
        `Vidas: +${resumen.bonusVidas ?? 0}`
      );
    }

    this.mostrarPantallaFinal(
      "🏁 ¡NIVEL COMPLETADO!",
      lineas,
      "JUGAR DE NUEVO",
      alReiniciar
    );
  }

  mostrarGameOver(resumen: ResumenPartida, alReiniciar: () => void): void {
    this.cerrarPregunta();
    this.mostrarPantallaFinal(
      "GAME OVER",
      [
        `PUNTOS: ${resumen.puntos}`,
        `CORRECTAS: ${resumen.correctas}`,
        `INCORRECTAS: ${resumen.incorrectas}`,
        "VIDAS: 0",
      ],
      "REINTENTAR",
      alReiniciar
    );
  }

  private crearCamaraInterfaz(): void {
    if (this.camaraInterfaz) return;
    this.camaraInterfaz = this.escena.cameras.add(
      0,
      0,
      this.escena.scale.width,
      this.escena.scale.height,
      false,
      "interfaz"
    );
    this.camaraInterfaz.setScroll(0, 0).setZoom(1);
    this.camaraInterfaz.roundPixels = true;
    this.camaraInterfaz.ignore([...this.escena.children.list]);
  }

  private crearHUD(): void {
    this.fondoVidas = this.registrarInterfaz(
      this.escena.add.image(0, 0, "ui-hud-vidas-base")
    )
      .setScrollFactor(0)
      .setDepth(100);

    this.corazonesHud = [0, 1, 2].map(() =>
      this.registrarInterfaz(this.escena.add.image(0, 0, "ui-corazon-full-1"))
        .setScrollFactor(0)
        .setDepth(102)
    );

    this.fondoPuntos = this.registrarInterfaz(
      this.escena.add.image(0, 0, "ui-hud-puntos-base")
    )
      .setScrollFactor(0)
      .setDepth(100);

    this.textoPuntos = this.registrarInterfaz(
      this.escena.add.text(0, 0, "0000", {
        fontFamily: "Arial, Helvetica, sans-serif",
        fontSize: "22px",
        fontStyle: "bold",
        color: "#ffd23f",
        stroke: "#301900",
        strokeThickness: 4,
      })
    )
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(102);

    this.imagenInstrucciones = this.registrarInterfaz(
      this.escena.add.image(0, 0, "ui-hud-controles")
    )
      .setScrollFactor(0)
      .setDepth(100);

    this.mensajeCentral = this.registrarInterfaz(
      this.escena.add.text(0, 0, "", {
        fontFamily: "Arial, Helvetica, sans-serif",
        fontSize: "34px",
        fontStyle: "bold",
        color: "#ffffff",
        stroke: "#000000",
        strokeThickness: 6,
        align: "center",
      })
    )
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(300);

    // Latido liviano: alterna los dos frames solo en los corazones activos.
    this.escena.time.addEvent({
      delay: 380,
      loop: true,
      callback: () => {
        this.usarSegundoFrameCorazon = !this.usarSegundoFrameCorazon;
        this.actualizarCorazones();
      },
    });
  }

  private actualizarCorazones(): void {
    const texturaLlena = this.usarSegundoFrameCorazon
      ? "ui-corazon-full-2"
      : "ui-corazon-full-1";

    this.corazonesHud.forEach((corazon, indice) => {
      corazon.setTexture(indice < this.vidasActuales ? texturaLlena : "ui-corazon-empty");
    });
  }

  private ajustarHUD(): void {
    const ancho = this.escena.scale.width;
    const alto = this.escena.scale.height;
    const escala = this.obtenerEscala();
    const margen = 14 * escala;

    const anchoVidas = 205 * escala;
    const altoVidas = anchoVidas / ASPECTO_UI_HORIZONTAL;
    const xVidas = margen + anchoVidas / 2;
    const yVidas = margen + altoVidas / 2;

    this.fondoVidas
      ?.setPosition(xVidas, yVidas)
      .setDisplaySize(anchoVidas, altoVidas);

    // Los PNG de corazon tienen algo de margen transparente. Se muestran un
    // poco mas grandes para llenar visualmente los tres huecos del HUD.
    const posicionesCorazon = [0.3135, 0.4993, 0.6851];
    const tamanoCorazon = 41 * escala;
    this.corazonesHud.forEach((corazon, indice) => {
      corazon
        .setPosition(
          xVidas - anchoVidas / 2 + anchoVidas * posicionesCorazon[indice],
          yVidas + 0.5 * escala
        )
        .setDisplaySize(tamanoCorazon, tamanoCorazon);
    });

    const anchoPuntos = 235 * escala;
    const altoPuntos = anchoPuntos / ASPECTO_UI_HORIZONTAL;
    const xPuntos = ancho - margen - anchoPuntos / 2;
    const yPuntos = margen + altoPuntos / 2;

    this.fondoPuntos
      ?.setPosition(xPuntos, yPuntos)
      .setDisplaySize(anchoPuntos, altoPuntos);

    this.textoPuntos
      ?.setPosition(
        xPuntos - anchoPuntos / 2 + anchoPuntos * 0.715,
        yPuntos + 2.5 * escala
      )
      .setFontSize(Math.round(15 * escala))
      .setStroke("#301900", Math.max(2, Math.round(4 * escala)));

    const anchoControles = Math.min(320 * escala, ancho * 0.44);
    const altoControles = anchoControles / ASPECTO_UI_HORIZONTAL;
    this.imagenInstrucciones
      ?.setPosition(
        margen + anchoControles / 2,
        alto - margen - altoControles / 2
      )
      .setDisplaySize(anchoControles, altoControles);

    this.mensajeCentral
      ?.setPosition(ancho / 2, 95 * escala)
      .setFontSize(Math.round(34 * escala))
      .setStroke("#000000", Math.max(4, Math.round(6 * escala)));
  }

  private mostrarPantallaFinal(
    tituloTexto: string,
    lineas: string[],
    textoBoton: string,
    alReiniciar: () => void
  ): void {
    const ancho = this.escena.scale.width;
    const alto = this.escena.scale.height;
    const escala = this.obtenerEscala();
    const centroX = ancho / 2;

    this.registrarInterfaz(
      this.escena.add.rectangle(centroX, alto / 2, ancho, alto, 0x000000, 0.82)
    )
      .setScrollFactor(0)
      .setDepth(1000);

    this.registrarInterfaz(
      this.escena.add.text(centroX, alto * 0.25, tituloTexto, {
        fontFamily: "Arial, Helvetica, sans-serif",
        fontSize: `${Math.round(42 * escala)}px`,
        fontStyle: "bold",
        color: "#ffffff",
      })
    )
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(1001);

    this.registrarInterfaz(
      this.escena.add.text(centroX, alto * 0.5, lineas.join("\n"), {
        fontFamily: "Arial, Helvetica, sans-serif",
        fontSize: `${Math.round(21 * escala)}px`,
        color: "#ffffff",
        align: "center",
        lineSpacing: Math.round(7 * escala),
      })
    )
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(1001);

    const y = alto * 0.78;
    const boton = this.registrarInterfaz(
      this.escena.add.rectangle(
        centroX,
        y,
        260 * escala,
        54 * escala,
        0xe47b2c
      )
    )
      .setScrollFactor(0)
      .setDepth(1100)
      .setInteractive({ useHandCursor: true });

    const etiqueta = this.registrarInterfaz(
      this.escena.add.text(centroX, y, textoBoton, {
        fontFamily: "Arial, Helvetica, sans-serif",
        fontSize: `${Math.round(19 * escala)}px`,
        fontStyle: "bold",
        color: "#ffffff",
      })
    )
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(1101)
      .setInteractive({ useHandCursor: true });

    boton.on("pointerdown", alReiniciar);
    etiqueta.on("pointerdown", alReiniciar);
  }

  private obtenerEscala(): number {
    return Phaser.Math.Clamp(
      Math.min(this.escena.scale.width / 1280, this.escena.scale.height / 720),
      0.75,
      1
    );
  }

  private registrarInterfaz<T extends Phaser.GameObjects.GameObject>(objeto: T): T {
    this.escena.cameras.main.ignore(objeto);
    return objeto;
  }
}
