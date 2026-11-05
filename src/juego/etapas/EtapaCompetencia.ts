import Phaser from "phaser";
import { CONFIGURACION_JUEGO, LIMITES_ETAPAS } from "../../configuracion/juego";
import { ElementosCompetencia } from "../tipos";
import { GestorPajaros } from "../sistemas/GestorPajaros";

const CARPETA_IMAGENES = "/recursos/imagenes/etapa-02-competencia/";
const CARPETA_EDIFICIOS_INICIO = "/recursos/imagenes/etapa-01-inicio/edificios/";

const X_INICIO_EDIFICIOS = 1020;
const ALTO_EDIFICIOS = 315;
const SEPARACION_EDIFICIOS = 32;

// La estructura de todos los edificios apoya exactamente sobre
// la misma linea donde comienza el suelo/camino de Terry.
const LINEA_APOYO_EDIFICIOS = CONFIGURACION_JUEGO.ySuperficieSuelo;

interface ConfiguracionEdificio {
  id: string;
  textura: string;
  alturaVisibleOriginal: number;
  puntoApoyoYOriginal: number;
  ajusteVertical: number;
}

const EDIFICIOS_RECORRIDO: ConfiguracionEdificio[] = [
  {
    id: "secretaria",
    textura: "edificio-secretaria-turismo",
    alturaVisibleOriginal: 971,
    puntoApoyoYOriginal: 760,
    ajusteVertical: -18,
  },
  {
    id: "terra",
    textura: "edificio-terra",
    alturaVisibleOriginal: 1049,
    puntoApoyoYOriginal: 1007,
    ajusteVertical: 8,
  },
  {
    id: "casino",
    textura: "edificio-casino",
    alturaVisibleOriginal: 659,
    puntoApoyoYOriginal: 629,
    ajusteVertical: 0,
  },
  {
    id: "galeria",
    textura: "edificio-galeria-del-sol",
    alturaVisibleOriginal: 850,
    puntoApoyoYOriginal: 854,
    ajusteVertical: 0,
  },
  {
    id: "juegos",
    textura: "edificio-juegos",
    alturaVisibleOriginal: 852,
    puntoApoyoYOriginal: 820,
    ajusteVertical: 0,
  },
  {
    id: "cruz",
    textura: "competencia-edificio-cruz",
    alturaVisibleOriginal: 1448,
    puntoApoyoYOriginal: 1318,
    ajusteVertical: 0,
  },
];

export class EtapaCompetencia {
  static precargar(escena: Phaser.Scene): void {
    escena.load.image(
      "edificio-secretaria-turismo",
      `${CARPETA_EDIFICIOS_INICIO}edificio-secretaria-turismo.png`
    );
    escena.load.image("edificio-terra", `${CARPETA_EDIFICIOS_INICIO}edificio-terra.png`);
    escena.load.image("edificio-casino", `${CARPETA_EDIFICIOS_INICIO}edificio-casino.png`);
    escena.load.image(
      "edificio-galeria-del-sol",
      `${CARPETA_EDIFICIOS_INICIO}edificio-galeria-del-sol.png`
    );
    escena.load.image("edificio-juegos", `${CARPETA_EDIFICIOS_INICIO}edificio-juegos.png`);
    escena.load.image(
      "competencia-edificio-cruz",
      `${CARPETA_IMAGENES}edificios/edificio-cruz.png`
    );

    escena.load.image("competencia-pajaro-1", `${CARPETA_IMAGENES}animales/pajaro-1.png`);
    escena.load.image("competencia-pajaro-2", `${CARPETA_IMAGENES}animales/pajaro-2.png`);

    for (let i = 1; i <= 3; i++) {
      escena.load.image(`competencia-nube-${i}`, `${CARPETA_IMAGENES}efectos/nube-${i}.png`);
    }

    for (const grupo of ["saludo", "golpeado", "ataque"] as const) {
      for (let i = 1; i <= 4; i++) {
        escena.load.image(
          `asesor-cruz-${grupo}-${i}`,
          `${CARPETA_IMAGENES}personajes/asesor-cruz-${grupo}-${i}.png`
        );
      }
    }

    for (let i = 1; i <= 2; i++) {
      escena.load.image(
        `asesor-cruz-caminar-${i}`,
        `${CARPETA_IMAGENES}personajes/asesor-cruz-caminar-${i}.png`
      );
    }
  }

  static crear(escena: Phaser.Scene, pajaros: GestorPajaros): ElementosCompetencia {
    const xInicio = LIMITES_ETAPAS.competencia.desde;
    const xFin = LIMITES_ETAPAS.competencia.hasta;
    const anchoZona = xFin - xInicio;
    const ySuelo = CONFIGURACION_JUEGO.ySuperficieSuelo;

    this.crearAnimaciones(escena);
    this.crearNubes(escena, xInicio, anchoZona);

    const edificios = this.crearEdificios(escena);
    const edificioCruz = edificios.get("cruz");

    if (!edificioCruz) {
      throw new Error("No se pudo crear el edificio de Cruz.");
    }

    const asesor = escena.add.sprite(
      edificioCruz.x - 10,
      ySuelo + 10,
      "asesor-cruz-saludo-1"
    );

    asesor
      .setOrigin(0.5, 1)
      .setScale(145 / asesor.height)
      .setDepth(10)
      .setFlipX(false);

    asesor.setDataEnabled();
    asesor.setData("xBase", asesor.x);
    asesor.setData("yBase", asesor.y);
    asesor.play("asesor-cruz-saludo");

    pajaros.crear({
      x: xInicio + 250,
      y: 430,
      velocidad: 48,
      direccion: 1,
      tamano: 76,
      yMinimo: 390,
      yMaximo: 455,
      xMinimo: xInicio - 80,
      xMaximo: xFin + 80,
      texturaInicial: "competencia-pajaro-1",
      animacion: "competencia-pajaro-volando",
    });

    pajaros.crear({
      x: xInicio + 1230,
      y: 350,
      velocidad: -40,
      direccion: -1,
      tamano: 70,
      yMinimo: 330,
      yMaximo: 390,
      xMinimo: xInicio - 80,
      xMaximo: xFin + 80,
      texturaInicial: "competencia-pajaro-1",
      animacion: "competencia-pajaro-volando",
    });

    return { edificio: edificioCruz, asesor };
  }

  private static crearEdificios(escena: Phaser.Scene): Map<string, Phaser.GameObjects.Image> {
    const edificios = new Map<string, Phaser.GameObjects.Image>();
    let xIzquierda = X_INICIO_EDIFICIOS;

    for (const configuracion of EDIFICIOS_RECORRIDO) {
      const edificio = escena.add.image(0, 0, configuracion.textura);
      const escala = ALTO_EDIFICIOS / configuracion.alturaVisibleOriginal;
      const anchoVisual = edificio.width * escala;
      const xCentro = xIzquierda + anchoVisual / 2;

      // El origen vertical se coloca en el punto real donde la estructura
      // toca el suelo. Asi no se alinea por carteles, plantas ni margenes
      // transparentes que puedan existir dentro del PNG.
      const origenY = configuracion.puntoApoyoYOriginal / edificio.height;

      edificio
        .setOrigin(0.5, origenY)
        .setScale(escala)
        .setPosition(xCentro, LINEA_APOYO_EDIFICIOS + configuracion.ajusteVertical)
        .setDepth(4);

      edificios.set(configuracion.id, edificio);
      xIzquierda += anchoVisual + SEPARACION_EDIFICIOS;
    }

    return edificios;
  }

  private static crearAnimaciones(escena: Phaser.Scene): void {
    const definiciones = [
      {
        clave: "asesor-cruz-saludo",
        prefijo: "asesor-cruz-saludo",
        frameRate: 5,
        repeat: -1,
        yoyo: true,
      },
      {
        clave: "asesor-cruz-golpeado",
        prefijo: "asesor-cruz-golpeado",
        frameRate: 8,
        repeat: 0,
        yoyo: false,
      },
      {
        clave: "asesor-cruz-ataque",
        prefijo: "asesor-cruz-ataque",
        frameRate: 9,
        repeat: 0,
        yoyo: false,
      },
    ];

    for (const definicion of definiciones) {
      if (escena.anims.exists(definicion.clave)) continue;

      escena.anims.create({
        key: definicion.clave,
        frames: [1, 2, 3, 4].map((i) => ({ key: `${definicion.prefijo}-${i}` })),
        frameRate: definicion.frameRate,
        repeat: definicion.repeat,
        yoyo: definicion.yoyo,
      });
    }

    if (!escena.anims.exists("asesor-cruz-caminar")) {
      escena.anims.create({
        key: "asesor-cruz-caminar",
        frames: [
          { key: "asesor-cruz-caminar-1" },
          { key: "asesor-cruz-caminar-2" },
        ],
        frameRate: 7,
        repeat: -1,
        yoyo: true,
      });
    }

    if (!escena.anims.exists("competencia-pajaro-volando")) {
      escena.anims.create({
        key: "competencia-pajaro-volando",
        frames: [{ key: "competencia-pajaro-1" }, { key: "competencia-pajaro-2" }],
        frameRate: 5,
        repeat: -1,
        yoyo: true,
      });
    }
  }

  private static crearNubes(
    escena: Phaser.Scene,
    xInicio: number,
    anchoZona: number
  ): void {
    const configuraciones = [
      {
        x: xInicio + 280,
        y: 150,
        clave: "competencia-nube-1",
        ancho: 285,
        alto: 110,
        dx: 150,
        dy: 0,
        duracion: 19000,
      },
      {
        x: xInicio + 760,
        y: 205,
        clave: "competencia-nube-2",
        ancho: 250,
        alto: 95,
        dx: -120,
        dy: 8,
        duracion: 23000,
      },
      {
        x: xInicio + anchoZona - 230,
        y: 145,
        clave: "competencia-nube-3",
        ancho: 270,
        alto: 105,
        dx: 120,
        dy: 0,
        duracion: 21000,
      },
    ];

    for (const config of configuraciones) {
      const nube = escena.add
        .image(config.x, config.y, config.clave)
        .setDisplaySize(config.ancho, config.alto)
        .setDepth(-55)
        .setAlpha(0.9);

      escena.tweens.add({
        targets: nube,
        x: nube.x + config.dx,
        y: nube.y + config.dy,
        duration: config.duracion,
        yoyo: true,
        repeat: -1,
        ease: "Sine.InOut",
      });
    }
  }
}
