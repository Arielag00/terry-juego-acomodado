import Phaser from "phaser";
import { CONFIGURACION_JUEGO, LIMITES_ETAPAS } from "../../configuracion/juego";
import { GestorPajaros } from "../sistemas/GestorPajaros";

const CARPETA_IMAGENES = "/recursos/imagenes/etapa-01-inicio/";

// Distribucion del arranque. Todo queda antes de los edificios de competencia.
const X_ARBOL = 120;
const TAMANO_ARBOL = 285;
const DESPLAZAMIENTO_Y_ARBOL = 8;
const X_CARTEL = 590;
const ANCHO_CARTEL = 430;
const ALTO_CARTEL = 215;

export interface ElementosEtapaInicio {
  troncoCuerpo: Phaser.GameObjects.Rectangle;
}

export class EtapaInicio {
  // El tronco estaba demasiado lejos de la pregunta. Ahora queda justo despues
  // del cartel y antes del primer edificio.
  static readonly xTronco = 850;
  // El PNG del tronco mide visualmente 92 px de alto, pero la superficie
  // plana donde deben apoyar los pies NO esta en el borde superior del PNG:
  // arriba hay hojas/musgo que sobresalen. En pantalla esa tapa util queda
  // aproximadamente 29 px por debajo del borde superior del sprite.
  //
  // Base del sprite: ySuperficieSuelo + 29
  // Borde superior del sprite: base - 92 = ySuperficieSuelo - 63
  // Superficie de apoyo real: (-63 + 29) = ySuperficieSuelo - 34
  //
  // Usamos ESTA misma linea tanto para el collider como para las cinematicas,
  // asi Terry queda con los pies sobre la madera y no flotando sobre el musgo.
  static readonly ySuperiorTronco = CONFIGURACION_JUEGO.ySuperficieSuelo - 34;
  static readonly yBaseTronco = CONFIGURACION_JUEGO.ySuperficieSuelo + 29;

  static precargar(escena: Phaser.Scene): void {
    escena.load.image("vegetacion-inicio", `${CARPETA_IMAGENES}vegetacion/vegetacion-inicio.png`);
    escena.load.image("cartel-terra-inicio", `${CARPETA_IMAGENES}carteles/cartel-terra-inicio.png`);
    escena.load.image("tronco-obstaculo", `${CARPETA_IMAGENES}obstaculos/tronco-obstaculo.png`);
    escena.load.image("pajaro-inicio-1", `${CARPETA_IMAGENES}animales/pajaro-1.png`);
    escena.load.image("pajaro-inicio-2", `${CARPETA_IMAGENES}animales/pajaro-2.png`);

    for (let i = 1; i <= 3; i++) {
      escena.load.image(`nube-inicio-${i}`, `${CARPETA_IMAGENES}efectos/nube-${i}.png`);
    }

    for (let i = 1; i <= 2; i++) {
      escena.load.image(`impacto-polvo-${i}`, `${CARPETA_IMAGENES}efectos/impacto-polvo-${i}.png`);
      escena.load.image(`plumas-${i}`, `${CARPETA_IMAGENES}efectos/plumas-${i}.png`);
    }
  }

  static crear(escena: Phaser.Scene, pajaros: GestorPajaros): ElementosEtapaInicio {
    this.crearAnimacionPajaro(escena);
    this.crearNubes(escena);

    escena.add
      .image(
        X_ARBOL,
        CONFIGURACION_JUEGO.ySuperficieSuelo + DESPLAZAMIENTO_Y_ARBOL,
        "vegetacion-inicio"
      )
      .setOrigin(0.5, 1)
      .setDisplaySize(TAMANO_ARBOL, TAMANO_ARBOL)
      .setDepth(2);

    escena.add
      .image(
        X_CARTEL,
        CONFIGURACION_JUEGO.ySuperficieSuelo + 5,
        "cartel-terra-inicio"
      )
      .setOrigin(0.5, 1)
      .setDisplaySize(ANCHO_CARTEL, ALTO_CARTEL)
      .setDepth(3);

    escena.add
      .ellipse(
        this.xTronco,
        CONFIGURACION_JUEGO.ySuperficieSuelo,
        135,
        11,
        0x1b1009,
        0.15
      )
      .setDepth(5);

    escena.add
      .image(this.xTronco, this.yBaseTronco, "tronco-obstaculo")
      .setOrigin(0.5, 1)
      .setDisplaySize(142, 92)
      .setDepth(7);

    // La cara superior de este rectangulo coincide EXACTAMENTE con
    // ySuperiorTronco. Asi, al reactivar la fisica sobre esa linea, Arcade
    // Physics ya encuentra una superficie debajo de Terry en el siguiente tick.
    const ALTO_COLISION_TRONCO = 46;
    const troncoCuerpo = escena.add.rectangle(
      this.xTronco,
      this.ySuperiorTronco + ALTO_COLISION_TRONCO / 2,
      94,
      ALTO_COLISION_TRONCO,
      0xff0000,
      0
    );
    escena.physics.add.existing(troncoCuerpo, true);

    pajaros.crear({
      x: 590,
      y: 455,
      velocidad: 52,
      direccion: 1,
      tamano: 78,
      yMinimo: 410,
      yMaximo: 470,
      xMinimo: -80,
      xMaximo: LIMITES_ETAPAS.inicio.hasta + 40,
      texturaInicial: "pajaro-inicio-1",
      animacion: "pajaro-inicio-volando",
    });

    pajaros.crear({
      x: 1390,
      y: 355,
      velocidad: -40,
      direccion: -1,
      tamano: 72,
      yMinimo: 345,
      yMaximo: 380,
      xMinimo: -80,
      xMaximo: LIMITES_ETAPAS.inicio.hasta + 40,
      texturaInicial: "pajaro-inicio-1",
      animacion: "pajaro-inicio-volando",
    });

    return { troncoCuerpo };
  }

  private static crearAnimacionPajaro(escena: Phaser.Scene): void {
    if (escena.anims.exists("pajaro-inicio-volando")) return;

    escena.anims.create({
      key: "pajaro-inicio-volando",
      frames: [{ key: "pajaro-inicio-1" }, { key: "pajaro-inicio-2" }],
      frameRate: 5,
      repeat: -1,
      yoyo: true,
    });
  }

  private static crearNubes(escena: Phaser.Scene): void {
    const configuraciones = [
      { x: 330, y: 165, clave: "nube-inicio-1", ancho: 320, alto: 125, dx: 170, dy: 0, duracion: 18000 },
      { x: 820, y: 215, clave: "nube-inicio-2", ancho: 285, alto: 110, dx: -140, dy: 10, duracion: 22000 },
      { x: 1320, y: 150, clave: "nube-inicio-3", ancho: 250, alto: 100, dx: 150, dy: 0, duracion: 20000 },
    ];

    for (const config of configuraciones) {
      const nube = escena.add
        .image(config.x, config.y, config.clave)
        .setDisplaySize(config.ancho, config.alto)
        .setAlpha(0.9)
        .setDepth(-55);

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
