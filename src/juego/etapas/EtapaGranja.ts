import Phaser from "phaser";
import { CONFIGURACION_JUEGO } from "../../configuracion/juego";
import { Terry } from "../personajes/Terry";
import {
  activarFisicaTerrySobreLinea,
  asegurarFisicaTerry,
  desactivarFisicaTerry,
} from "../utilidades/FisicaTerry";

const CARPETA_GRANJA = "/recursos/imagenes/etapa-03-granja/";

// Orden de la etapa:
// Cruz -> tramo libre -> cartel Fundacion -> perro -> corrales -> Flavio.
const X_CARTEL_FUNDACION = 5200;
const X_PERRO = 5750;
const X_CARPA_FUNDACION = X_PERRO + 170;
const X_CORRAL_1 = 6400;
const X_CORRAL_2 = 7000;
const X_CORRAL_3 = 7600;
const X_FLAVIO = 8200;

const DISTANCIA_ACTIVACION_PERRO = 190;
const DISTANCIA_REPETIR_PERRO = 360;
const DISTANCIA_LANZAMIENTO_RAMA = 330;
// Lugar donde el perro deja la rama cuando vuelve. Queda a su izquierda,
// visible y lista para poder repetir la interaccion con E.
const X_RAMA_REPOSO = X_PERRO - 115;

// Mismo tamano visual que el cartel de bienvenida del inicio.
const ANCHO_CARTEL = 430;
const ALTO_CARTEL = 215;
const ANCHO_CARPA_FUNDACION = 470;
// La referencia correcta no es el borde inferior total del PNG (las sillas bajan
// mas que las estacas), sino la base de las ANCLAS laterales de la carpa.
// En el PNG actual la base de esas anclas laterales esta en y ~= 1022 px.
// Esa linea se coloca EXACTAMENTE sobre Y_SUELO.
const Y_ANCLAS_CARPA_EN_IMAGEN = 1022;
// Las anclas del PNG ya se miden con Y_ANCLAS_CARPA_EN_IMAGEN. No agregamos
// ningun desplazamiento extra: sus bases quedan exactamente sobre Y_SUELO.
const AJUSTE_Y_CARPA_FUNDACION = -12;

// La rama de vuelo sigue siendo moderada; la del piso usa el asset dedicado
// rama-suelo.png, mas grande y visible antes de que el perro la recoja.
const ANCHO_RAMA_VOLANDO = 44;
const ANCHO_RAMA_PISO = 150;
const TIEMPO_RAMA_VISIBLE_EN_PISO = 120;
const Y_SUELO = CONFIGURACION_JUEGO.ySuperficieSuelo;
const DESPLAZAMIENTO_Y_CORRALES = 22;


export class EtapaGranja {
  private perro!: Phaser.GameObjects.Sprite;
  private rama!: Phaser.GameObjects.Sprite;
  private sombraRama!: Phaser.GameObjects.Ellipse;
  private textoInteractuar!: Phaser.GameObjects.Image;
  private flavio!: Phaser.GameObjects.Sprite;
  private chancho?: Phaser.GameObjects.Sprite;
  private tweenChancho?: Phaser.Tweens.Tween;
  private chanchoRobado = false;
  private readonly teclaInteractuar: Phaser.Input.Keyboard.Key;

  private interaccionPerroActiva = false;
  private primeraInteraccionPerroRealizada = false;

  constructor(
    private readonly escena: Phaser.Scene,
    private readonly terry: Terry
  ) {
    this.teclaInteractuar = escena.input.keyboard!.addKey(
      Phaser.Input.Keyboard.KeyCodes.E
    );
  }

  static precargar(escena: Phaser.Scene): void {
    escena.load.image(
      "granja-cartel-fundacion",
      `${CARPETA_GRANJA}carteles/cartel-fundacion-grupo-terra.png`
    );

    escena.load.image(
      "granja-carpa-fundacion",
      `${CARPETA_GRANJA}edificios/carpa-fundacion.png`
    );

    escena.load.image("granja-corral-1", `${CARPETA_GRANJA}edificios/corral-1.png`);
    escena.load.image("granja-corral-2", `${CARPETA_GRANJA}edificios/corral-2.png`);
    escena.load.image("granja-corral-3", `${CARPETA_GRANJA}edificios/corral-3.png`);

    for (let i = 1; i <= 4; i++) {
      escena.load.image(
        `granja-animal-corral-1-${i}`,
        `${CARPETA_GRANJA}animales/animal-corral-1-${i}.png`
      );
      escena.load.image(
        `granja-animal-corral-2-${i}`,
        `${CARPETA_GRANJA}animales/animal-corral-2-${i}.png`
      );
      escena.load.image(
        `granja-animal-corral-3-${i}`,
        `${CARPETA_GRANJA}animales/animal-corral-3-${i}.png`
      );
    }

    escena.load.image(
      "granja-perro-idle-1",
      `${CARPETA_GRANJA}animales/border-collie-idle.png`
    );
    escena.load.image(
      "granja-perro-idle-2",
      `${CARPETA_GRANJA}animales/border-collie-idle2.png`
    );

    for (let i = 1; i <= 4; i++) {
      escena.load.image(
        `granja-perro-run-${i}`,
        `${CARPETA_GRANJA}animales/border-collie-run-${i}.png`
      );
    }

    escena.load.image(
      "granja-perro-rama-1",
      `${CARPETA_GRANJA}animales/border-collie-rama.png`
    );
    escena.load.image(
      "granja-perro-rama-2",
      `${CARPETA_GRANJA}animales/border-collie-rama2.png`
    );
    escena.load.image(
      "granja-perro-ataque",
      `${CARPETA_GRANJA}animales/border-collie-ataque.png`
    );

    escena.load.image(
      "granja-flavio-idle-1",
      `${CARPETA_GRANJA}personajes/flavio-idle-1.png`
    );
    escena.load.image(
      "granja-flavio-idle-2",
      `${CARPETA_GRANJA}personajes/flavio-idle-2.png`
    );

    // Estos dos assets completan la respuesta incorrecta de Flavio.
    // Deben guardarse en etapa-03-granja/personajes/.
    escena.load.image(
      "granja-flavio-patada-1",
      `${CARPETA_GRANJA}personajes/flavio-patada-1.png`
    );
    escena.load.image(
      "granja-flavio-patada-2",
      `${CARPETA_GRANJA}personajes/flavio-patada-2.png`
    );

    // Frames originales de la rama VOLANDO.
    for (let i = 1; i <= 3; i++) {
      escena.load.image(
        `granja-rama-${i}`,
        `${CARPETA_GRANJA}obstaculos/rama-${i}.png`
      );
    }

    // Asset exclusivo para la rama YA TIRADA EN EL PISO.
    // No entra nunca en la animacion de vuelo.
    escena.load.image(
      "granja-rama-suelo",
      `${CARPETA_GRANJA}obstaculos/rama-suelo.png`
    );

    escena.load.image(
      "ui-interact-tirar-rama",
      "/interfaz/interacciones/interact-tirar-rama.png"
    );
  }

  crear(): void {
    this.crearAnimaciones();
    this.crearCartelFundacion();
    this.crearCarpaFundacion();
    this.crearPerro();
    this.crearCorrales();
    this.crearFlavio();
    this.crearRama();
    this.crearIndicadorPerro();
  }

  actualizar(): boolean {
    // Cuando no esta jugando con la rama, el perro sigue a Terry con la mirada.
    // Si Terry pasa de un lado al otro, el sprite se gira automaticamente.
    if (!this.interaccionPerroActiva) {
      this.actualizarDireccionPerro();
    }

    const distanciaAlPerro = Math.abs(this.terry.x - X_PERRO);
    const estaCercaDelPerro = distanciaAlPerro <= DISTANCIA_REPETIR_PERRO;

    if (this.textoInteractuar) {
      this.textoInteractuar.setVisible(
        this.primeraInteraccionPerroRealizada &&
          !this.interaccionPerroActiva &&
          estaCercaDelPerro
      );
    }

    // Mientras Terry y el perro estan jugando, Terry queda bloqueado.
    if (this.interaccionPerroActiva) {
      return true;
    }

    // La primera vez se activa automaticamente al acercarse.
    if (
      !this.primeraInteraccionPerroRealizada &&
      this.terry.x >= X_PERRO - DISTANCIA_ACTIVACION_PERRO &&
      this.terry.x <= X_PERRO + 90
    ) {
      this.iniciarInteraccionPerro();
      return true;
    }

    // Despues se puede repetir INFINITAS veces con E sin necesidad de alejarse.
    if (
      this.primeraInteraccionPerroRealizada &&
      estaCercaDelPerro &&
      Phaser.Input.Keyboard.JustDown(this.teclaInteractuar)
    ) {
      this.iniciarInteraccionPerro();
      return true;
    }

    return false;
  }

  obtenerFlavio(): Phaser.GameObjects.Sprite {
    return this.flavio;
  }

  /**
   * Se usa EXCLUSIVAMENTE cuando Flavio golpea a Terry.
   * Si Terry realmente llevaba el chancho robado, lo pierde y el animal
   * vuelve a aparecer dentro del primer corral. Si no llevaba chancho,
   * no cambia absolutamente nada.
   */
  devolverChanchoAlCorralPorGolpeDeFlavio(): boolean {
    if (!this.chanchoRobado || !this.terry.tieneChancho()) {
      return false;
    }

    const perdioChancho = this.terry.perderChancho();
    if (!perdioChancho) {
      return false;
    }

    this.chanchoRobado = false;

    if (this.chancho) {
      this.chancho
        .setVisible(true)
        .setActive(true)
        .play("granja-animal-corral-1", true);
    }

    // resolverChanchoCorrecto() ahora pausa este tween en vez de detenerlo,
    // por eso basta con reanudarlo para que el chancho vuelva a caminar.
    this.tweenChancho?.resume();

    return true;
  }

  resolverChanchoCorrecto(alTerminar: () => void): void {
    if (this.chanchoRobado) {
      alTerminar();
      return;
    }

    this.chanchoRobado = true;
    this.terry.setVelocity(0, 0);
    this.terry.setFlipX(false);

    // Guardamos la Y REAL en la que Terry esta apoyado. No lo mandamos a
    // yTerrySuelo porque ese valor no coincide necesariamente con la posicion
    // final del collider sobre el piso y provocaba la caida al terminar.
    const yRobo = this.terry.y;
    desactivarFisicaTerry(this.terry);

    const xRobo = X_CORRAL_1 - 105;
    const distancia = Math.abs(xRobo - this.terry.x);
    const duracion = Phaser.Math.Clamp(distancia * 2.2, 160, 420);

    this.terry.reproducirCorrer();

    this.escena.tweens.add({
      targets: this.terry,
      x: xRobo,
      y: yRobo,
      duration: duracion,
      ease: "Linear",
      onComplete: () => {
        // Lo pausamos en lugar de destruirlo: si Flavio le pega a Terry
        // y le hace perder el chancho, podemos devolverlo al corral y
        // reanudar exactamente el mismo movimiento.
        this.tweenChancho?.pause();
        this.chancho?.setVisible(false).setActive(false);

        this.terry.setFlipX(false);
        // Robo = EXACTAMENTE frame 1 -> frame 2.
        // El 2 queda como pose quieta con el chancho bajo el brazo.
        // Los frames 3-6 NO participan del robo: son solo para correr.
        this.terry.reproducirRoboChancho();

        this.escena.time.delayedCall(440, () => {
          // Primero fijamos la pose quieta con el chancho (frame 2) y RECIEN
          // despues reactivamos/alineamos la fisica. No queda ningun loop de
          // carrera activo mientras Terry esta parado.
          this.terry.activarChancho();
          activarFisicaTerrySobreLinea(this.terry, xRobo, Y_SUELO);
          alTerminar();
        });
      },
    });
  }

  resolverChanchoIncorrecto(alTerminar: () => void): void {
    // El chancho no se toca: sigue caminando dentro del corral.
    this.terry.setVelocity(0, 0);
    this.terry.reproducirDanio();

    this.escena.time.delayedCall(650, () => {
      this.terry.clearTint();
      this.terry.reproducirIdle();
      asegurarFisicaTerry(this.terry, Y_SUELO);
      alTerminar();
    });
  }

  private crearCartelFundacion(): void {
    const cartel = this.escena.add.image(
      X_CARTEL_FUNDACION,
      Y_SUELO + 5,
      "granja-cartel-fundacion"
    );

    cartel
      .setOrigin(0.5, 1)
      .setDisplaySize(ANCHO_CARTEL, ALTO_CARTEL)
      .setDepth(4);
  }

  private crearCarpaFundacion(): void {
    const clave = "granja-carpa-fundacion";
    const carpa = this.escena.add.image(0, 0, clave).setDepth(3);

    // IMPORTANTE: no alineamos el borde inferior del PNG porque las sillas
    // llegan mas abajo que las anclas. La referencia visual correcta son los
    // dos apoyos metalicos laterales de la carpa.
    //
    // Con la escala final, la coordenada Y_ANCLAS_CARPA_EN_IMAGEN cae
    // exactamente en Y_SUELO. Asi las anclas quedan sobre la misma linea del
    // camino por la que caminan Terry y el perro.
    const escala = ANCHO_CARPA_FUNDACION / carpa.width;

    carpa
      .setOrigin(0.5, 0)
      .setScale(escala)
      .setPosition(
        X_CARPA_FUNDACION,
        Y_SUELO + AJUSTE_Y_CARPA_FUNDACION - Y_ANCLAS_CARPA_EN_IMAGEN * escala
      );
  }

  private crearPerro(): void {
    this.perro = this.escena.add.sprite(
      X_PERRO,
      Y_SUELO + 3,
      "granja-perro-idle-1"
    );

    this.perro
      .setOrigin(0.5, 1)
      .setScale(115 / this.perro.height)
      .setDepth(8)
      .play("granja-perro-idle");
  }

  private actualizarDireccionPerro(): void {
    // Los frames idle originales del Border Collie miran hacia la izquierda.
    // Terry a la izquierda  -> sprite original, sin flip.
    // Terry a la derecha    -> sprite espejado.
    const terryEstaALaDerecha = this.terry.x > this.perro.x;
    this.perro.setFlipX(terryEstaALaDerecha);
  }

  private crearIndicadorPerro(): void {
    this.textoInteractuar = this.escena.add
      .image(X_PERRO, Y_SUELO - 145, "ui-interact-tirar-rama")
      .setDisplaySize(175, 58)
      .setOrigin(0.5)
      .setDepth(30)
      .setVisible(false);
  }

  private crearCorrales(): void {
    const corralChancho = this.crearCorral({
      x: X_CORRAL_1,
      desplazamientoXAnimal: -35,
      texturaCorral: "granja-corral-1",
      texturaAnimal: "granja-animal-corral-1-1",
      animacionAnimal: "granja-animal-corral-1",
      altoCorral: 225,
      altoAnimal: 72,
      yAnimal: Y_SUELO - 66,
      rangoMovimiento: 55,
      inicioFrente: 0.64,
      duracionMovimiento: 2300,
    });

    this.chancho = corralChancho.animal;
    this.tweenChancho = corralChancho.tween;

    this.crearCorral({
      x: X_CORRAL_2,
      desplazamientoXAnimal: -18,
      texturaCorral: "granja-corral-2",
      texturaAnimal: "granja-animal-corral-2-1",
      animacionAnimal: "granja-animal-corral-2",
      altoCorral: 235,
      altoAnimal: 70,
      yAnimal: Y_SUELO - 74,
      rangoMovimiento: 52,
      inicioFrente: 0.63,
      duracionMovimiento: 2000,
    });

    this.crearCorral({
      x: X_CORRAL_3,
      desplazamientoXAnimal: 8,
      texturaCorral: "granja-corral-3",
      texturaAnimal: "granja-animal-corral-3-1",
      animacionAnimal: "granja-animal-corral-3",
      altoCorral: 215,
      altoAnimal: 68,
      yAnimal: Y_SUELO - 64,
      rangoMovimiento: 50,
      inicioFrente: 0.65,
      duracionMovimiento: 2500,
    });
  }

  private crearCorral(configuracion: {
    x: number;
    desplazamientoXAnimal: number;
    texturaCorral: string;
    texturaAnimal: string;
    animacionAnimal: string;
    altoCorral: number;
    altoAnimal: number;
    yAnimal: number;
    rangoMovimiento: number;
    inicioFrente: number;
    duracionMovimiento: number;
  }): { animal: Phaser.GameObjects.Sprite; tween: Phaser.Tweens.Tween } {
    const escalaCorralBase = this.escena.add.image(
      configuracion.x,
      Y_SUELO + 16 + DESPLAZAMIENTO_Y_CORRALES,
      configuracion.texturaCorral
    );

    const escalaCorral = configuracion.altoCorral / escalaCorralBase.height;

    // Capa trasera completa del corral.
    escalaCorralBase
      .setOrigin(0.5, 1)
      .setScale(escalaCorral)
      .setDepth(5);

    const centroAnimalX = configuracion.x + configuracion.desplazamientoXAnimal;

    // El animal va ENTRE dos capas del mismo corral.
    // La capa de fondo conserva la casita y las cercas traseras.
    // La capa frontal, recortada, tapa solo las patas y simula que
    // realmente camina dentro del recinto.
    const animal = this.escena.add.sprite(
      centroAnimalX,
      configuracion.yAnimal + DESPLAZAMIENTO_Y_CORRALES,
      configuracion.texturaAnimal
    );

    animal
      .setOrigin(0.5, 1)
      .setScale(configuracion.altoAnimal / animal.height)
      .setDepth(6)
      .play(configuracion.animacionAnimal);

    const frenteCorral = this.escena.add.image(
      configuracion.x,
      Y_SUELO + 16 + DESPLAZAMIENTO_Y_CORRALES,
      configuracion.texturaCorral
    );

    const inicioRecorteY = Math.floor(frenteCorral.height * configuracion.inicioFrente);

    frenteCorral
      .setOrigin(0.5, 1)
      .setScale(escalaCorral)
      .setCrop(
        0,
        inicioRecorteY,
        frenteCorral.width,
        frenteCorral.height - inicioRecorteY
      )
      .setDepth(7);

    const xMinimo = centroAnimalX - configuracion.rangoMovimiento;
    const xMaximo = centroAnimalX + configuracion.rangoMovimiento;

    animal.setX(xMinimo).setFlipX(false);

    const tween = this.escena.tweens.add({
      targets: animal,
      x: xMaximo,
      duration: configuracion.duracionMovimiento,
      ease: "Linear",
      yoyo: true,
      repeat: -1,
      onYoyo: () => animal.setFlipX(true),
      onRepeat: () => animal.setFlipX(false),
    });

    return { animal, tween };
  }

  private crearFlavio(): void {
    this.flavio = this.escena.add.sprite(
      X_FLAVIO,
      Y_SUELO + 4,
      "granja-flavio-idle-1"
    );

    this.flavio
      .setOrigin(0.5, 1)
      .setScale(185 / this.flavio.height)
      .setDepth(8)
      .play("granja-flavio-idle");

    this.flavio.setDataEnabled();
    this.flavio.setData("xBase", this.flavio.x);
    this.flavio.setData("yBase", this.flavio.y);
  }

  private crearRama(): void {
    const texturaInicial = this.obtenerTexturaRamaDisponible([
      "granja-rama-1",
      "granja-rama-2",
      "granja-rama-3",
    ]);

    this.sombraRama = this.escena.add
      .ellipse(0, 0, 78, 10, 0x000000, 0.28)
      .setDepth(49)
      .setVisible(false);

    this.rama = this.escena.add.sprite(0, 0, texturaInicial);
    this.rama
      .setOrigin(0.5)
      .setDepth(50)
      .setVisible(false)
      .setActive(false);

    this.ajustarRamaAAnchoTotal(this.rama, texturaInicial, ANCHO_RAMA_VOLANDO);

    // La rama tiene que existir visualmente en el piso incluso antes de la
    // primera tirada. Despues de cada viaje el perro la vuelve a dejar aca.
    const texturaPiso = this.obtenerTexturaRamaDisponible([
      "granja-rama-suelo",
      "granja-rama-1",
      "granja-rama-2",
      "granja-rama-3",
    ]);
    this.dejarRamaEnReposo(texturaPiso);
  }

  private crearAnimaciones(): void {
    this.crearAnimacion(
      "granja-animal-corral-1",
      [1, 2, 3, 4].map((i) => `granja-animal-corral-1-${i}`),
      4,
      -1,
      true
    );

    this.crearAnimacion(
      "granja-animal-corral-2",
      [1, 2, 3, 4].map((i) => `granja-animal-corral-2-${i}`),
      4,
      -1,
      true
    );

    this.crearAnimacion(
      "granja-animal-corral-3",
      [1, 2, 3, 4].map((i) => `granja-animal-corral-3-${i}`),
      4,
      -1,
      true
    );

    this.crearAnimacion(
      "granja-perro-idle",
      ["granja-perro-idle-1", "granja-perro-idle-2"],
      2,
      -1,
      true
    );

    this.crearAnimacion(
      "granja-perro-run",
      [1, 2, 3, 4].map((i) => `granja-perro-run-${i}`),
      10,
      -1
    );

    this.crearAnimacion(
      "granja-perro-rama",
      ["granja-perro-rama-1", "granja-perro-rama-2"],
      4,
      -1,
      true
    );

    this.crearAnimacion(
      "granja-flavio-idle",
      ["granja-flavio-idle-1", "granja-flavio-idle-2"],
      2,
      -1,
      true
    );

    if (
      this.escena.textures.exists("granja-flavio-patada-1") &&
      this.escena.textures.exists("granja-flavio-patada-2")
    ) {
      this.crearAnimacion(
        "granja-flavio-patada",
        ["granja-flavio-patada-1", "granja-flavio-patada-2"],
        7,
        0
      );
    }

    const framesRamaVuelo = [
      "granja-rama-1",
      "granja-rama-2",
      "granja-rama-3",
    ].filter(
      (clave) => this.escena.textures.exists(clave)
    );

    if (framesRamaVuelo.length >= 2) {
      this.crearAnimacion(
        "granja-rama-girando",
        framesRamaVuelo,
        12,
        -1
      );
    }
  }

  private crearAnimacion(
    clave: string,
    frames: string[],
    frameRate: number,
    repeat: number,
    yoyo = false
  ): void {
    if (this.escena.anims.exists(clave)) return;

    this.escena.anims.create({
      key: clave,
      frames: frames.map((key) => ({ key })),
      frameRate,
      repeat,
      yoyo,
    });
  }

  private iniciarInteraccionPerro(): void {
    if (this.interaccionPerroActiva) return;

    this.interaccionPerroActiva = true;
    this.primeraInteraccionPerroRealizada = true;
    this.textoInteractuar?.setVisible(false);

    this.terry.setVelocity(0, 0);
    this.terry.setFlipX(false);
    this.terry.reproducirLanzarRama();

    this.escena.time.delayedCall(250, () => {
      this.lanzarRama();
    });
  }

  private lanzarRama(): void {
    const xInicio = this.terry.x + 62;
    const yInicio = this.terry.y - 66;
    const xDestino = X_PERRO + DISTANCIA_LANZAMIENTO_RAMA;
    const yDestino = Y_SUELO - 10;

    const texturaVuelo = this.obtenerTexturaRamaDisponible([
      "granja-rama-1",
      "granja-rama-2",
      "granja-rama-3",
    ]);

    this.sombraRama.setVisible(false);

    this.rama
      .stop()
      .setTexture(texturaVuelo)
      .setOrigin(0.5, 0.5)
      .setActive(true)
      .setVisible(true)
      .setAlpha(1)
      .setDepth(50)
      .setPosition(xInicio, yInicio)
      .setAngle(0);

    this.ajustarRamaAAnchoTotal(
      this.rama,
      texturaVuelo,
      ANCHO_RAMA_VOLANDO
    );

    if (this.escena.anims.exists("granja-rama-girando")) {
      this.rama.play("granja-rama-girando", true);
    }

    const alturaArco = 155;

    this.escena.tweens.addCounter({
      from: 0,
      to: 1,
      duration: 900,
      ease: "Linear",
      onUpdate: (tween: Phaser.Tweens.Tween) => {
        const t = tween.getValue() ?? 0;
        const x = Phaser.Math.Linear(xInicio, xDestino, t);
        const yBase = Phaser.Math.Linear(yInicio, yDestino, t);
        const y = yBase - 4 * alturaArco * t * (1 - t);
        this.rama.setPosition(x, y);
      },
      onComplete: () => {
        // En el piso SIEMPRE usamos el asset nuevo rama-suelo.png.
        // Si por error falta el archivo, recien ahi hacemos fallback a uno
        // de los frames viejos para que la interaccion no se rompa.
        const texturaPiso = this.obtenerTexturaRamaDisponible([
          "granja-rama-suelo",
          "granja-rama-1",
          "granja-rama-2",
          "granja-rama-3",
        ]);

        this.rama.stop().setTexture(texturaPiso).setAngle(0);
        this.colocarRamaVisibleEnPiso(texturaPiso, xDestino);

        this.sombraRama
          .setPosition(xDestino, Y_SUELO - 2)
          .setDepth(49)
          .setVisible(true);

        // Apenas toca el piso, el perro sale a buscarla. Solo dejamos una pausa
        // minima para que se perciba el impacto, sin una espera artificial.
        this.escena.time.delayedCall(TIEMPO_RAMA_VISIBLE_EN_PISO, () => {
          this.perroBuscaRama(xDestino);
        });
      },
    });
  }

  private obtenerTexturaRamaDisponible(preferencias: string[]): string {
    const encontrada = preferencias.find((clave) =>
      this.escena.textures.exists(clave)
    );

    if (encontrada) return encontrada;

    console.warn(
      "[EtapaGranja] No se encontro la textura de rama solicitada. Se usa granja-rama-1."
    );
    return "granja-rama-1";
  }

  private colocarRamaVisibleEnPiso(textura: string, xCentro: number): void {
    this.rama.stop();
    this.rama.setTexture(textura);
    this.rama.setOrigin(0.5, 1);
    this.rama.setAngle(0);
    this.ajustarRamaAAnchoTotal(this.rama, textura, ANCHO_RAMA_PISO);
    this.rama
      .setPosition(xCentro, Y_SUELO - 3)
      .setDepth(50)
      .setAlpha(1)
      .setVisible(true)
      .setActive(true);
  }

  private dejarRamaEnReposo(textura?: string): void {
    const texturaPiso =
      textura ??
      this.obtenerTexturaRamaDisponible([
        "granja-rama-suelo",
        "granja-rama-1",
        "granja-rama-2",
        "granja-rama-3",
      ]);

    this.colocarRamaVisibleEnPiso(texturaPiso, X_RAMA_REPOSO);

    // La sombra tambien vuelve con la rama para que se lea claramente como
    // un objeto apoyado sobre el camino y no como algo flotando.
    this.sombraRama
      .setPosition(X_RAMA_REPOSO, Y_SUELO - 2)
      .setDepth(49)
      .setVisible(true);
  }

  private ajustarRamaAAnchoTotal(
    sprite: Phaser.GameObjects.Sprite,
    textura: string,
    anchoObjetivo: number
  ): void {
    const frame = this.escena.textures.getFrame(textura);
    const anchoFuente = frame?.realWidth || frame?.width || sprite.width || 1;
    const altoFuente = frame?.realHeight || frame?.height || sprite.height || 1;
    const proporcion = altoFuente / Math.max(1, anchoFuente);

    // setDisplaySize fija el ancho TOTAL real en pantalla. No usa el bbox de
    // pixels visibles, que era lo que agrandaba demasiado la rama al volar.
    sprite.setDisplaySize(anchoObjetivo, anchoObjetivo * proporcion);
  }

  private perroBuscaRama(xRama: number): void {
    // Los frames de correr miran originalmente hacia la derecha.
    this.perro.setFlipX(false).play("granja-perro-run", true);

    this.escena.tweens.add({
      targets: this.perro,
      x: xRama - 20,
      duration: 760,
      ease: "Linear",
      onComplete: () => {
        this.rama.setVisible(false).setActive(false);
        this.sombraRama.setVisible(false);

        // Los sprites border-collie-rama ya miran originalmente hacia
        // la izquierda. No se espejan para volver hacia Terry.
        this.perro.setFlipX(false).play("granja-perro-rama", true);

        this.escena.time.delayedCall(180, () => {
          this.perroVuelve();
        });
      },
    });
  }

  private perroVuelve(): void {
    this.escena.tweens.add({
      targets: this.perro,
      x: X_PERRO,
      duration: 900,
      ease: "Linear",
      onComplete: () => {
        this.perro.play("granja-perro-idle", true);

        // El perro vuelve con la rama en la boca y al llegar la deja otra vez
        // en el piso. Antes se ocultaba al recogerla y nunca se restauraba;
        // por eso desaparecia por completo cuando reaparecia "E - TIRAR RAMA".
        this.dejarRamaEnReposo();

        this.terry.reproducirIdle();
        this.interaccionPerroActiva = false;

        // Al terminar, vuelve a mirar inmediatamente hacia donde esta Terry.
        this.actualizarDireccionPerro();
      },
    });
  }
}
