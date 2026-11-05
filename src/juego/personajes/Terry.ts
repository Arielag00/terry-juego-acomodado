import Phaser from "phaser";
import { CONFIGURACION_JUEGO } from "../../configuracion/juego";

const CARPETA_TERRY = "/recursos/imagenes/comunes/personajes/terry/";

const FRAMES_TERRY = [
  "idle-1",
  "idle-2",
  "run-1",
  "run-2",
  "run-3",
  "run-4",
  "jump-1",
  "jump-2",
  "jump-3",
  "hurt-1",
  "hurt-2",
  "taunt-1",
  "taunt-2",
  "attack-1",
  "attack-2",
  "win-1",
  "win-2",
  "lose-1",
  "lose-2",
  "fall-1",
  "fall-2",
  "fall-3",
  "fall-4",
  "terry-golpeado-1",
  "terry-golpeado-2",
  "terry-golpeado-3",
  "terry-golpeado-4",
  "lanzar-rama-1",
  "lanzar-rama-2",
  "lanzar-rama-3",
] as const;

const FRAMES_PESCA = [1, 2, 3, 4, 5, 6] as const;
const FRAMES_CHANCHO = [1, 2, 3, 4, 5, 6] as const;
const FRAMES_CHANCHO_SALTO = [1, 2, 3, 4] as const;

// Claves versionadas: aunque Phaser conserve animaciones de una escena anterior,
// estas definiciones no pueden mezclarse con una version vieja del robo/carrera.
const ANIM_CHANCHO_ROBO = "terry-chancho-robo-v4";
const ANIM_CHANCHO_CORRER = "terry-chancho-correr-v4";
const ANIM_CHANCHO_SALTO = "terry-chancho-salto-v1";

interface DefinicionAnimacion {
  clave: string;
  frames: string[];
  frameRate: number;
  repeat: number;
  yoyo?: boolean;
}

type EstadoVisual =
  | "idle"
  | "run"
  | "jump"
  | "chancho-idle"
  | "chancho-run"
  | "chancho-jump"
  | "especial"
  | "";

const ANIMACIONES: DefinicionAnimacion[] = [
  {
    clave: "terry-idle",
    frames: ["idle-1", "idle-2"],
    frameRate: 2,
    repeat: -1,
    yoyo: true,
  },
  {
    clave: "terry-run",
    frames: ["run-1", "run-2", "run-3", "run-4"],
    frameRate: 10,
    repeat: -1,
  },
  {
    clave: "terry-jump",
    frames: ["jump-1", "jump-2", "jump-3"],
    frameRate: 7,
    repeat: 0,
  },
  {
    clave: "terry-hurt",
    frames: ["hurt-1", "hurt-2"],
    frameRate: 7,
    repeat: 1,
    yoyo: true,
  },
  {
    clave: "terry-taunt",
    frames: ["taunt-1", "taunt-2"],
    frameRate: 4,
    repeat: -1,
    yoyo: true,
  },
  {
    clave: "terry-attack",
    frames: ["attack-1", "attack-2"],
    frameRate: 8,
    repeat: 0,
  },
  {
    clave: "terry-win",
    frames: ["win-1", "win-2"],
    frameRate: 4,
    repeat: -1,
    yoyo: true,
  },
  {
    clave: "terry-lose",
    frames: ["lose-1", "lose-2"],
    frameRate: 2,
    repeat: 0,
  },
  {
    clave: "terry-fall",
    frames: ["fall-1", "fall-2", "fall-3", "fall-4"],
    frameRate: 7,
    repeat: 0,
  },
  {
    clave: "terry-golpeado",
    frames: [
      "terry-golpeado-1",
      "terry-golpeado-2",
      "terry-golpeado-3",
      "terry-golpeado-4",
    ],
    frameRate: 8,
    repeat: 0,
  },
  {
    clave: "terry-lanzar-rama",
    frames: ["lanzar-rama-1", "lanzar-rama-2", "lanzar-rama-3"],
    frameRate: 7,
    repeat: 0,
  },
];

export class Terry extends Phaser.Physics.Arcade.Sprite {
  private readonly cursores: Phaser.Types.Input.Keyboard.CursorKeys;
  private readonly teclaA: Phaser.Input.Keyboard.Key;
  private readonly teclaD: Phaser.Input.Keyboard.Key;
  private readonly teclaEspacio: Phaser.Input.Keyboard.Key;
  private readonly velocidad = 280;
  private readonly fuerzaSalto = 500;

  private llevaChancho = false;
  private estadoVisual: EstadoVisual = "";

  // El salto NO usa una animacion en loop. Se divide en fases fisicas:
  // Salto normal: 1 = preparacion en el piso, 2 = impulso/despegue,
  // 3 = Terry flexionado durante TODO el vuelo. Cerca de tocar el piso
  // vuelve a una postura recta normal. NO existe jump-4 para el salto comun.
  // El salto con chancho si usa sus 4 frames exclusivos.
  private saltoPreparando = false;
  private saltoEnCurso = false;
  private temporizadorSalto?: Phaser.Time.TimerEvent;

  // El collider queda en el MISMO lugar del mundo aunque cambie el PNG.
  // Antes el frame de golpeado/pesca/chancho cambiaba el tamano de la textura
  // y el body terminaba varios px mas abajo, por eso Terry se hundia.
  private anchoCuerpoMundo = 0;
  private altoCuerpoMundo = 0;
  private inferiorCuerpoDesdeCentro = 0;

  static precargar(escena: Phaser.Scene): void {
    for (const nombre of FRAMES_TERRY) {
      escena.load.image(`terry-${nombre}`, `${CARPETA_TERRY}${nombre}.png`);
    }

    for (const numero of FRAMES_PESCA) {
      escena.load.image(
        `terry-pesca-${numero}`,
        `${CARPETA_TERRY}terry-pesca-${numero}.png`
      );
    }

    for (const numero of FRAMES_CHANCHO) {
      escena.load.image(
        `terry-chancho-robo-${numero}`,
        `${CARPETA_TERRY}terry-chancho-robo-${numero}.png`
      );
    }

    for (const numero of FRAMES_CHANCHO_SALTO) {
      escena.load.image(
        `terry-chancho-salto-${numero}`,
        `${CARPETA_TERRY}terry-chancho-salto-${numero}.png`
      );
    }
  }

  constructor(escena: Phaser.Scene, x: number, y: number) {
    super(escena, x, y, "terry-idle-1");

    escena.add.existing(this);
    escena.physics.add.existing(this);

    this.setOrigin(0.5, 0.5);
    this.setScale(120 / this.height);
    this.setCollideWorldBounds(true);
    this.setBounce(0);
    this.setDepth(10);

    // Conservamos exactamente la caja que tenia Terry originalmente,
    // pero expresada en pixeles DE MUNDO para que no dependa del frame.
    this.anchoCuerpoMundo = this.displayWidth * 0.3;
    this.altoCuerpoMundo = this.displayHeight * 0.78;
    this.inferiorCuerpoDesdeCentro = this.displayHeight * 0.42;

    this.sincronizarCuerpoFisico();

    this.cursores = escena.input.keyboard!.createCursorKeys();
    this.teclaA = escena.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this.teclaD = escena.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D);
    this.teclaEspacio = escena.input.keyboard!.addKey(
      Phaser.Input.Keyboard.KeyCodes.SPACE
    );

    this.crearAnimaciones();

    // Cada frame de una animacion puede ser una imagen con canvas diferente.
    // Recalculamos SOLO el offset del body; su tamano real queda constante.
    this.on("animationstart", this.sincronizarCuerpoFisico, this);
    this.on("animationupdate", this.sincronizarCuerpoFisico, this);
    this.on("animationcomplete", this.sincronizarCuerpoFisico, this);

    this.reproducirIdle();
  }

  actualizar(): void {
    this.corregirHundimiento();

    const cuerpo = this.body as Phaser.Physics.Arcade.Body;
    const izquierda = this.cursores.left.isDown || this.teclaA.isDown;
    const derecha = this.cursores.right.isDown || this.teclaD.isDown;

    if (izquierda) {
      this.setVelocityX(-this.velocidad);
      this.setFlipX(true);
    } else if (derecha) {
      this.setVelocityX(this.velocidad);
      this.setFlipX(false);
    } else {
      this.setVelocityX(0);
    }

    const quiereSaltar =
      Phaser.Input.Keyboard.JustDown(this.cursores.up) ||
      Phaser.Input.Keyboard.JustDown(this.teclaEspacio);

    const estaApoyado = this.estaApoyado();

    if (quiereSaltar && estaApoyado && !this.saltoPreparando) {
      this.iniciarSaltoPorFases();
      return;
    }

    // Durante estos pocos milisegundos Terry esta agachado preparando el salto.
    // No permitimos que idle/run pisen el frame de preparacion.
    if (this.saltoPreparando) return;

    // Una vez que despego, el frame se decide por la velocidad vertical real.
    // No hay play() ni repeat: por eso la flexion no se repite en el aire.
    const realmenteEnAire =
      !estaApoyado || (this.saltoEnCurso && Math.abs(cuerpo.velocity.y) > 1);

    if (realmenteEnAire) {
      this.saltoEnCurso = true;
      this.actualizarFrameSaltoPorVelocidad(cuerpo.velocity.y);
      return;
    }

    // Aterrizo: habilitamos nuevamente idle/run.
    if (this.saltoEnCurso) {
      this.saltoEnCurso = false;
      this.estadoVisual = "";
    }

    if (izquierda || derecha) {
      this.reproducirCorrer();
      return;
    }

    this.reproducirIdle();
  }

  estaApoyado(): boolean {
    const cuerpo = this.body as Phaser.Physics.Arcade.Body;
    if (!cuerpo.enable) return true;

    if (cuerpo.onFloor() || cuerpo.blocked.down || cuerpo.touching.down) {
      return true;
    }

    const distanciaAlPiso =
      CONFIGURACION_JUEGO.ySuperficieSuelo - cuerpo.bottom;

    return (
      Math.abs(distanciaAlPiso) <= 5 &&
      cuerpo.velocity.y >= -8 &&
      cuerpo.velocity.y <= 45
    );
  }

  /**
   * Caja fisica estable para TODOS los PNG de Terry.
   * El frame puede medir lo que sea; el collider conserva el mismo ancho,
   * alto y distancia al centro del personaje.
   */
  sincronizarCuerpoFisico(): void {
    const cuerpo = this.body as Phaser.Physics.Arcade.Body | null;
    if (!cuerpo || this.anchoCuerpoMundo <= 0 || this.altoCuerpoMundo <= 0) {
      return;
    }

    const escalaX = Math.max(0.0001, Math.abs(this.scaleX));
    const escalaY = Math.max(0.0001, Math.abs(this.scaleY));
    const anchoFrame = this.frame?.realWidth || this.width;
    const altoFrame = this.frame?.realHeight || this.height;

    const anchoFuente = this.anchoCuerpoMundo / escalaX;
    const altoFuente = this.altoCuerpoMundo / escalaY;

    const superiorDesdeCentroMundo =
      this.inferiorCuerpoDesdeCentro - this.altoCuerpoMundo;

    const offsetX = anchoFrame * 0.5 - anchoFuente * 0.5;
    const offsetY =
      altoFrame * 0.5 + superiorDesdeCentroMundo / escalaY;

    cuerpo.setSize(anchoFuente, altoFuente, false);
    cuerpo.setOffset(offsetX, offsetY);
  }

  /**
   * Cinturon de seguridad global. Si por una cinematica o un cambio de frame
   * el body llega a penetrar el piso, lo saca inmediatamente. No actua durante
   * saltos ni cuando el body esta deshabilitado.
   */
  corregirHundimiento(): void {
    const cuerpo = this.body as Phaser.Physics.Arcade.Body;
    if (!cuerpo?.enable) return;

    const exceso = cuerpo.bottom - CONFIGURACION_JUEGO.ySuperficieSuelo;
    if (exceso <= 2 || cuerpo.velocity.y < -20) return;

    this.alinearCuerpoConLinea(CONFIGURACION_JUEGO.ySuperficieSuelo);
  }

  /**
   * Alinea el borde inferior REAL del collider con una linea de apoyo.
   * Sirve tanto para el suelo general como para apoyos mas altos, por ejemplo
   * el tronco. No depende del alto ni de los margenes transparentes del PNG.
   */
  alinearCuerpoConLinea(lineaY: number): void {
    const cuerpo = this.body as Phaser.Physics.Arcade.Body;
    if (!cuerpo) return;

    this.sincronizarCuerpoFisico();

    const diferencia = lineaY - cuerpo.bottom;
    if (Math.abs(diferencia) > 0.01) {
      this.y += diferencia;
    }

    cuerpo.reset(this.x, this.y);
    cuerpo.setVelocityY(0);
  }

  reproducirIdle(): void {
    this.setOrigin(0.5, 0.5);

    if (this.llevaChancho) {
      // FRAME 2 = Terry ya saco el chancho y lo tiene bajo el brazo.
      // Quieto SIEMPRE queda en este frame. No se reproduce ningun loop.
      this.mostrarFrameFijo("chancho-idle", "terry-chancho-robo-2");
      return;
    }

    this.reproducirAnimacionMovimiento("idle", "terry-idle");
  }

  reproducirCorrer(): void {
    this.setOrigin(0.5, 0.5);

    if (this.llevaChancho) {
      // Frames 3,4,5,6 = EXCLUSIVAMENTE correr con el chancho.
      this.reproducirAnimacionMovimiento("chancho-run", ANIM_CHANCHO_CORRER);
      return;
    }

    this.reproducirAnimacionMovimiento("run", "terry-run");
  }

  reproducirSalto(): void {
    const cuerpo = this.body as Phaser.Physics.Arcade.Body;

    // Este metodo puede ser llamado desde otras cinematicas/estados.
    // Nunca arranca una animacion temporizada: solo muestra la fase que
    // corresponde a la velocidad vertical actual.
    this.saltoEnCurso = true;

    if (this.estaApoyado() && Math.abs(cuerpo.velocity.y) <= 1) {
      this.mostrarFrameSalto(1);
      return;
    }

    this.actualizarFrameSaltoPorVelocidad(cuerpo.velocity.y);
  }

  reproducirDanio(): void {
    this.detenerYReproducir("terry-hurt");
  }

  reproducirGolpeado(): void {
    this.detenerYReproducir("terry-golpeado");
  }

  reproducirTaunt(): void {
    if (this.llevaChancho) {
      this.setVelocity(0, 0);
      this.mostrarFrameFijo("chancho-idle", "terry-chancho-robo-2");
      return;
    }

    this.detenerYReproducir("terry-taunt", true);
  }

  reproducirAtaque(): void {
    this.detenerYReproducir("terry-attack", true);
  }

  reproducirVictoria(): void {
    if (this.llevaChancho) {
      this.setVelocity(0, 0);
      this.mostrarFrameFijo("chancho-idle", "terry-chancho-robo-2");
      return;
    }

    this.detenerYReproducir("terry-win", true);
  }

  reproducirVictoriaEnMovimiento(): void {
    if (this.llevaChancho) {
      this.mostrarFrameFijo("chancho-idle", "terry-chancho-robo-2");
      return;
    }

    this.detenerYReproducir("terry-win");
  }

  /**
   * Festejo exclusivo de la META. A diferencia de reproducirVictoria(),
   * este metodo SIEMPRE usa los frames win aunque Terry llegue cargando
   * el chancho. Al terminar el nivel ya no vuelve al estado de movimiento,
   * asi que no necesitamos alterar el estado interno del chancho.
   */
  reproducirVictoriaFinal(): void {
    this.detenerYReproducir("terry-win", true);
  }

  reproducirDerrota(): void {
    this.detenerYReproducir("terry-lose", true);
  }

  reproducirCaida(): void {
    this.detenerYReproducir("terry-fall");
  }

  reproducirLanzarRama(): void {
    this.detenerYReproducir("terry-lanzar-rama", true);
  }

  reproducirRoboChancho(): void {
    this.llevaChancho = false;
    this.detenerYReproducir(ANIM_CHANCHO_ROBO, true);
  }

  activarChancho(): void {
    this.cancelarPreparacionSalto();
    this.saltoEnCurso = false;
    this.llevaChancho = true;
    this.setVelocity(0, 0);
    this.estadoVisual = "";
    this.anims.stop();
    this.mostrarFrameFijo("chancho-idle", "terry-chancho-robo-2");
  }

  tieneChancho(): boolean {
    return this.llevaChancho;
  }

  perderChancho(): boolean {
    if (!this.llevaChancho) return false;

    this.llevaChancho = false;
    this.estadoVisual = "";
    this.anims.stop();

    if (this.estaApoyado()) {
      this.reproducirIdle();
    } else {
      this.reproducirSalto();
    }

    return true;
  }

  reproducirPescaLanzar(): void {
    this.detenerYReproducir("terry-pesca-lanzar", true);
  }

  reproducirPescaEspera(): void {
    this.cancelarPreparacionSalto();
    this.saltoEnCurso = false;
    this.setVelocity(0, 0);
    this.estadoVisual = "especial";
    this.anims.stop();
    this.setOrigin(0.5, 0.5);
    this.setTexture("terry-pesca-4");
    this.sincronizarCuerpoFisico();
  }

  reproducirPescaSacarPez(): void {
    this.detenerYReproducir("terry-pesca-sacar-pez", true);
  }

  reproducirPescaSacarBasura(): void {
    this.cancelarPreparacionSalto();
    this.saltoEnCurso = false;
    this.setVelocity(0, 0);
    this.estadoVisual = "especial";
    this.anims.stop();
    this.setOrigin(0.5, 0.5);
    this.setTexture("terry-pesca-5");
    this.sincronizarCuerpoFisico();
  }

  private iniciarSaltoPorFases(): void {
    if (this.saltoPreparando) return;

    this.cancelarPreparacionSalto();
    this.saltoPreparando = true;
    this.saltoEnCurso = true;

    // FASE 1: Terry flexiona las rodillas EN EL PISO.
    this.setVelocityY(0);
    this.mostrarFrameSalto(1);

    // Dejamos visible la preparacion un instante. Luego recien aplica el impulso.
    this.temporizadorSalto = this.scene.time.delayedCall(85, () => {
      this.temporizadorSalto = undefined;
      this.saltoPreparando = false;

      const cuerpo = this.body as Phaser.Physics.Arcade.Body | null;
      if (!this.active || !cuerpo?.enable) {
        this.saltoEnCurso = false;
        return;
      }

      // FASE 2: impulso/despegue.
      this.setVelocityY(-this.fuerzaSalto);
      this.mostrarFrameSalto(2);
    });
  }

  private actualizarFrameSaltoPorVelocidad(velocidadY: number): void {
    const cuerpo = this.body as Phaser.Physics.Arcade.Body;

    // El salto con chancho tiene 4 frames propios y SI usa una fase de caida.
    if (this.llevaChancho) {
      if (velocidadY < -260) {
        this.mostrarFrameSaltoChancho(2);
        return;
      }

      if (velocidadY < 70) {
        this.mostrarFrameSaltoChancho(3);
        return;
      }

      this.mostrarFrameSaltoChancho(4);
      return;
    }

    // SALTO NORMAL: solo existen jump-1, jump-2 y jump-3.
    // jump-1 = agachado antes de despegar.
    // jump-2 = impulso/despegue.
    // jump-3 = Terry flexionado durante la subida, apex y casi toda la bajada.
    if (velocidadY < -260) {
      this.mostrarFrameSaltoNormal(2);
      return;
    }

    const distanciaAlPiso =
      CONFIGURACION_JUEGO.ySuperficieSuelo - cuerpo.bottom;

    // Solo cuando YA esta bajando y le faltan muy pocos pixeles para apoyar
    // los pies vuelve a verse recto. No inventamos un jump-4.
    if (velocidadY > 0 && distanciaAlPiso >= 0 && distanciaAlPiso <= 26) {
      this.mostrarFrameFijo("jump", "terry-idle-1");
      return;
    }

    this.mostrarFrameSaltoNormal(3);
  }

  private mostrarFrameSalto(fase: 1 | 2): void {
    if (this.llevaChancho) {
      this.mostrarFrameSaltoChancho(fase);
      return;
    }

    this.mostrarFrameSaltoNormal(fase);
  }

  private mostrarFrameSaltoNormal(fase: 1 | 2 | 3): void {
    this.mostrarFrameFijo("jump", `terry-jump-${fase}`);
  }

  private mostrarFrameSaltoChancho(fase: 1 | 2 | 3 | 4): void {
    this.mostrarFrameFijo(
      "chancho-jump",
      `terry-chancho-salto-${fase}`
    );
  }

  private cancelarPreparacionSalto(): void {
    if (this.temporizadorSalto) {
      this.temporizadorSalto.remove(false);
      this.temporizadorSalto = undefined;
    }
    this.saltoPreparando = false;
  }

  private crearAnimaciones(): void {
    for (const definicion of ANIMACIONES) {
      if (this.scene.anims.exists(definicion.clave)) continue;

      this.scene.anims.create({
        key: definicion.clave,
        frames: definicion.frames.map((frame) => ({ key: `terry-${frame}` })),
        frameRate: definicion.frameRate,
        repeat: definicion.repeat,
        yoyo: definicion.yoyo ?? false,
      });
    }

    if (!this.scene.anims.exists("terry-pesca-lanzar")) {
      this.scene.anims.create({
        key: "terry-pesca-lanzar",
        frames: [1, 2, 3].map((i) => ({ key: `terry-pesca-${i}` })),
        frameRate: 6,
        repeat: 0,
      });
    }

    if (!this.scene.anims.exists("terry-pesca-sacar-pez")) {
      this.scene.anims.create({
        key: "terry-pesca-sacar-pez",
        frames: [5, 6].map((i) => ({ key: `terry-pesca-${i}` })),
        frameRate: 5,
        repeat: 0,
      });
    }

    // Robo: EXACTAMENTE 1 -> 2.
    if (!this.scene.anims.exists(ANIM_CHANCHO_ROBO)) {
      this.scene.anims.create({
        key: ANIM_CHANCHO_ROBO,
        frames: [1, 2].map((i) => ({ key: `terry-chancho-robo-${i}` })),
        frameRate: 5,
        repeat: 0,
      });
    }

    // Carrera: EXACTAMENTE 3 -> 4 -> 5 -> 6 y solo mientras hay A/D/flechas.
    if (!this.scene.anims.exists(ANIM_CHANCHO_CORRER)) {
      this.scene.anims.create({
        key: ANIM_CHANCHO_CORRER,
        frames: [3, 4, 5, 6].map((i) => ({ key: `terry-chancho-robo-${i}` })),
        frameRate: 10,
        repeat: -1,
        yoyo: false,
      });
    }

    // Salto con chancho: 1 -> 2 -> 3 -> 4, UNA sola vez.
    if (!this.scene.anims.exists(ANIM_CHANCHO_SALTO)) {
      this.scene.anims.create({
        key: ANIM_CHANCHO_SALTO,
        frames: [1, 2, 3, 4].map((i) => ({ key: `terry-chancho-salto-${i}` })),
        frameRate: 8,
        repeat: 0,
        yoyo: false,
      });
    }
  }

  private reproducirAnimacionMovimiento(
    estado: EstadoVisual,
    claveAnimacion: string
  ): void {
    if (
      this.estadoVisual === estado &&
      this.anims.isPlaying &&
      this.anims.currentAnim?.key === claveAnimacion
    ) {
      return;
    }

    this.estadoVisual = estado;
    this.setOrigin(0.5, 0.5);
    this.play(claveAnimacion, true);
    this.sincronizarCuerpoFisico();
  }

  private reproducirAnimacionUnaVez(
    estado: EstadoVisual,
    claveAnimacion: string
  ): void {
    // Si ya estamos en este salto, NO lo reiniciamos aunque la animacion
    // haya terminado. De esa forma el ultimo frame queda fijo hasta aterrizar.
    if (this.estadoVisual === estado) return;

    this.estadoVisual = estado;
    this.setOrigin(0.5, 0.5);
    this.anims.stop();

    if (this.scene.anims.exists(claveAnimacion)) {
      this.play(claveAnimacion, true);
      this.sincronizarCuerpoFisico();
    }
  }

  private mostrarFrameFijo(estado: EstadoVisual, textura: string): void {
    if (
      this.estadoVisual === estado &&
      !this.anims.isPlaying &&
      this.texture.key === textura
    ) {
      return;
    }

    this.estadoVisual = estado;
    this.anims.stop();
    this.setOrigin(0.5, 0.5);

    if (this.texture.key !== textura) {
      this.setTexture(textura);
    }

    this.sincronizarCuerpoFisico();
  }

  private detenerYReproducir(clave: string, frenar = false): void {
    this.cancelarPreparacionSalto();
    this.saltoEnCurso = false;
    if (frenar) this.setVelocity(0, 0);

    this.estadoVisual = "especial";
    this.anims.stop();
    this.setOrigin(0.5, 0.5);

    if (this.scene.anims.exists(clave)) {
      this.play(clave, true);
      this.sincronizarCuerpoFisico();
    }
  }
}
