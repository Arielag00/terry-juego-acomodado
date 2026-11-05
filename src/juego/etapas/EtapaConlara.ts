import Phaser from "phaser";
import { CONFIGURACION_JUEGO } from "../../configuracion/juego";
import { Terry } from "../personajes/Terry";
import { asegurarFisicaTerry } from "../utilidades/FisicaTerry";

const CARPETAS_CONLARA = [
  {
    id: "conlara-a",
    ruta: "/recursos/imagenes/etapa-04-conlara/",
  },
  {
    id: "conlara-b",
    ruta: "/recursos/imagenes/etapa-04-laguna/",
  },
] as const;

// Orden visual:
// cartel -> portal -> Genaro -> laguna/pesca -> planta de agua -> meta.
// Ajustado segun lo pedido:
// - cartel y portal mas a la derecha
// - mas separacion entre cartel y portal
// - portal y planta mas apoyados en la linea del camino donde pisa Terry
const X_CARTEL_CONLARA = 8880;
const X_PORTAL_CONLARA = 9720;
const X_GENARO = 10320;
const X_LAGUNA = 10940;
const X_PUNTO_PESCA = 10610;
const X_BOYA_AGUA = 11040;
const X_PLANTA_AGUA = 11880;

const Y_SUELO = CONFIGURACION_JUEGO.ySuperficieSuelo;
const DISTANCIA_INTERACCION_PESCA = 190;
const DESPLAZAMIENTO_Y_LAGUNA = 48;

// Ajustes visuales finos.
const ANCHO_CARTEL = 430;
const ALTO_CARTEL = 215;
const ANCHO_PORTAL = 760;
const ANCHO_LAGUNA = 620;
const ANCHO_PLANTA_AGUA = 780;

const ANCHO_BOYA = 22;
const ALTO_BOYA = 27;
const ANCHO_PEZ = 42;
const ANCHO_BASURA = 34;

export class EtapaConlara {
  private genaro?: Phaser.GameObjects.Sprite;
  private boya?: Phaser.GameObjects.Image;
  private resultadoPesca?: Phaser.GameObjects.Image;
  private salpicadura?: Phaser.GameObjects.Image;
  private textoPescar?: Phaser.GameObjects.Image;
  private readonly teclaInteractuar: Phaser.Input.Keyboard.Key;

  private pescaActiva = false;
  private disponible = false;
  private pescaDisponible = false;
  private prefijoRecursos = "";

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
      "ui-interact-pescar",
      "/interfaz/interacciones/interact-pescar.png"
    );

    for (const carpeta of CARPETAS_CONLARA) {
      const key = (nombre: string) => `${carpeta.id}-${nombre}`;
      const ruta = carpeta.ruta;

      escena.load.image(
        key("cartel"),
        `${ruta}carteles/cartel-estacion-conlara.png`
      );
      escena.load.image(
        key("portal"),
        `${ruta}edificios/portal-estacion-conlara.png`
      );
      escena.load.image(key("laguna"), `${ruta}edificios/laguna.png`);
      escena.load.image(
        key("planta-agua"),
        `${ruta}edificios/planta-agua-potable.png`
      );

      escena.load.image(key("boya"), `${ruta}objetos/boya-1.png`);
      escena.load.image(key("pez"), `${ruta}objetos/pez-1.png`);
      escena.load.image(key("basura"), `${ruta}objetos/basura-1.png`);
      escena.load.image(
        key("salpicadura"),
        `${ruta}efectos/salpicadura-1.png`
      );

      escena.load.image(
        key("genaro-idle-1"),
        `${ruta}personajes/genaro-idle-1.png`
      );
      escena.load.image(
        key("genaro-idle-2"),
        `${ruta}personajes/genaro-idle-2.png`
      );
      escena.load.image(
        key("genaro-golpe-1"),
        `${ruta}personajes/genaro-golpe-1.png`
      );
      escena.load.image(
        key("genaro-golpe-2"),
        `${ruta}personajes/genaro-golpe-2.png`
      );

      for (let i = 1; i <= 3; i++) {
        escena.load.image(
          key(`genaro-golpeado-${i}`),
          `${ruta}personajes/genaro-golpeado-${i}.png`
        );
      }
    }
  }

  crear(): boolean {
    const carpetaActiva = CARPETAS_CONLARA.find((carpeta) =>
      ["cartel", "portal", "laguna", "planta-agua", "genaro-idle-1"].every(
        (nombre) => this.escena.textures.exists(`${carpeta.id}-${nombre}`)
      )
    );

    if (!carpetaActiva) {
      console.error(
        "No se encontraron los assets de Estacion Conlara. La carpeta debe llamarse etapa-04-conlara o etapa-04-laguna."
      );
      return false;
    }

    this.prefijoRecursos = carpetaActiva.id;
    this.disponible = true;

    this.pescaDisponible = ["boya", "pez", "basura", "salpicadura"].every(
      (nombre) => this.escena.textures.exists(this.textura(nombre))
    );

    this.crearAnimaciones();
    this.crearCartel();
    this.crearPortal();
    this.crearGenaro();
    this.crearLaguna();
    this.crearPlantaAgua();

    if (this.pescaDisponible) {
      this.crearElementosPesca();
    } else {
      console.warn(
        "Estacion Conlara se creo, pero faltan uno o mas objetos de pesca."
      );
    }

    return true;
  }

  actualizar(): boolean {
    if (!this.disponible || !this.pescaDisponible) return false;

    const distancia = Math.abs(this.terry.x - X_PUNTO_PESCA);
    const puedePescar = distancia <= DISTANCIA_INTERACCION_PESCA;

    this.textoPescar?.setVisible(puedePescar && !this.pescaActiva);

    if (this.pescaActiva) return true;

    if (
      puedePescar &&
      Phaser.Input.Keyboard.JustDown(this.teclaInteractuar)
    ) {
      this.iniciarPesca();
      return true;
    }

    return false;
  }

  obtenerGenaro(): Phaser.GameObjects.Sprite | undefined {
    return this.genaro;
  }

  private textura(nombre: string): string {
    return `${this.prefijoRecursos}-${nombre}`;
  }

  private crearCartel(): void {
    this.escena.add
      .image(X_CARTEL_CONLARA, Y_SUELO + 5, this.textura("cartel"))
      .setOrigin(0.5, 1)
      .setDisplaySize(ANCHO_CARTEL, ALTO_CARTEL)
      .setDepth(4);
  }

  private crearPortal(): void {
    const portal = this.escena.add.image(
      X_PORTAL_CONLARA,
      Y_SUELO + 46,
      this.textura("portal")
    );

    portal
      .setOrigin(0.5, 1)
      .setScale(ANCHO_PORTAL / portal.width)
      .setDepth(4);
  }

  private crearGenaro(): void {
    this.genaro = this.escena.add.sprite(
      X_GENARO,
      Y_SUELO + 4,
      this.textura("genaro-idle-1")
    );

    this.genaro
      .setOrigin(0.5, 1)
      .setScale(165 / this.genaro.height)
      .setDepth(9)
      .play("conlara-genaro-idle");

    this.genaro.setDataEnabled();
    this.genaro.setData("xBase", this.genaro.x);
    this.genaro.setData("yBase", this.genaro.y);
  }

  private crearLaguna(): void {
    const laguna = this.escena.add.image(
      X_LAGUNA,
      Y_SUELO + 7 + DESPLAZAMIENTO_Y_LAGUNA,
      this.textura("laguna")
    );

    laguna
      .setOrigin(0.5, 1)
      .setScale(ANCHO_LAGUNA / laguna.width)
      .setDepth(3);
  }

  private crearPlantaAgua(): void {
    const planta = this.escena.add.image(
      X_PLANTA_AGUA,
      Y_SUELO + 30,
      this.textura("planta-agua")
    );

    planta
      .setOrigin(0.5, 1)
      .setScale(ANCHO_PLANTA_AGUA / planta.width)
      .setDepth(4);
  }

  private crearElementosPesca(): void {
    this.boya = this.escena.add
      .image(0, 0, this.textura("boya"))
      .setDisplaySize(ANCHO_BOYA, ALTO_BOYA)
      .setDepth(12)
      .setVisible(false);

    this.resultadoPesca = this.escena.add
      .image(0, 0, this.textura("pez"))
      .setDepth(14)
      .setVisible(false);

    this.salpicadura = this.escena.add
      .image(0, 0, this.textura("salpicadura"))
      .setDisplaySize(48, 48)
      .setDepth(11)
      .setVisible(false);

    this.textoPescar = this.escena.add
      .image(X_PUNTO_PESCA, Y_SUELO - 150, "ui-interact-pescar")
      .setDisplaySize(165, 55)
      .setOrigin(0.5)
      .setDepth(30)
      .setVisible(false);
  }

  private crearAnimaciones(): void {
    this.crearAnimacion(
      "conlara-genaro-idle",
      [this.textura("genaro-idle-1"), this.textura("genaro-idle-2")],
      2,
      -1,
      true
    );

    if (
      this.escena.textures.exists(this.textura("genaro-golpe-1")) &&
      this.escena.textures.exists(this.textura("genaro-golpe-2"))
    ) {
      this.crearAnimacion(
        "conlara-genaro-golpe",
        [this.textura("genaro-golpe-1"), this.textura("genaro-golpe-2")],
        7,
        0
      );
    }

    const golpeados = [1, 2, 3]
      .map((i) => this.textura(`genaro-golpeado-${i}`))
      .filter((key) => this.escena.textures.exists(key));

    if (golpeados.length > 0) {
      this.crearAnimacion(
        "conlara-genaro-golpeado",
        golpeados,
        7,
        0
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

  private iniciarPesca(): void {
    if (
      this.pescaActiva ||
      !this.boya ||
      !this.resultadoPesca ||
      !this.salpicadura ||
      !this.textoPescar
    ) {
      return;
    }

    this.pescaActiva = true;
    this.textoPescar.setVisible(false);

    this.terry.setVelocity(0, 0);
    this.terry.setFlipX(false);
    this.terry.reproducirPescaLanzar();

    this.escena.time.delayedCall(520, () => {
      this.lanzarBoya();
    });
  }

  private lanzarBoya(): void {
    if (!this.boya) return;

    const xInicio = this.terry.x + 55;
    const yInicio = this.terry.y - 70;
    const yAgua = Y_SUELO - 118 + DESPLAZAMIENTO_Y_LAGUNA;

    this.boya
      .setPosition(xInicio, yInicio)
      .setVisible(true)
      .setAlpha(1);

    this.escena.tweens.add({
      targets: this.boya,
      x: X_BOYA_AGUA,
      y: yAgua,
      duration: 480,
      ease: "Quad.Out",
      onComplete: () => {
        this.mostrarSalpicadura(X_BOYA_AGUA, yAgua + 7);
        this.terry.reproducirPescaEspera();

        this.escena.time.delayedCall(1050, () => {
          this.resolverPesca();
        });
      },
    });
  }

  private resolverPesca(): void {
    if (!this.boya || !this.resultadoPesca) return;

    const sacoPez = Phaser.Math.Between(0, 1) === 0;
    const textura = sacoPez ? this.textura("pez") : this.textura("basura");
    const anchoObjetivo = sacoPez ? ANCHO_PEZ : ANCHO_BASURA;

    const fuente = this.escena.textures
      .get(textura)
      .getSourceImage() as HTMLImageElement;

    const proporcion = fuente.width > 0 ? fuente.height / fuente.width : 1;
    const altoObjetivo = anchoObjetivo * proporcion;

    this.mostrarSalpicadura(this.boya.x, this.boya.y + 6);
    this.boya.setVisible(false);

    if (sacoPez) {
      this.terry.reproducirPescaSacarPez();
    } else {
      this.terry.reproducirPescaSacarBasura();
    }

    this.resultadoPesca
      .setTexture(textura)
      .setDisplaySize(anchoObjetivo, altoObjetivo)
      .setPosition(
        X_BOYA_AGUA,
        Y_SUELO - 120 + DESPLAZAMIENTO_Y_LAGUNA
      )
      .setVisible(true)
      .setAlpha(1);

    this.escena.tweens.add({
      targets: this.resultadoPesca,
      x: this.terry.x + 46,
      y: this.terry.y - 84,
      duration: 520,
      ease: "Quad.Out",
      onComplete: () => {
        this.escena.time.delayedCall(850, () => {
          this.resultadoPesca?.setVisible(false);
          this.terry.reproducirIdle();
          asegurarFisicaTerry(this.terry, Y_SUELO);
          this.pescaActiva = false;
        });
      },
    });
  }

  private mostrarSalpicadura(x: number, y: number): void {
    if (!this.salpicadura) return;

    this.salpicadura
      .setPosition(x, y)
      .setScale(0.5)
      .setAlpha(1)
      .setVisible(true);

    this.escena.tweens.add({
      targets: this.salpicadura,
      scale: 0.85,
      alpha: 0,
      duration: 340,
      ease: "Quad.Out",
      onComplete: () => {
        this.salpicadura?.setVisible(false).setAlpha(1);
      },
    });
  }
}
