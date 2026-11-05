import Phaser from "phaser";
import { Terry } from "../personajes/Terry";

export interface ConfiguracionPajaro {
  x: number;
  y: number;
  velocidad: number;
  direccion: 1 | -1;
  tamano: number;
  yMinimo: number;
  yMaximo: number;
  xMinimo: number;
  xMaximo: number;
  texturaInicial: string;
  animacion: string;
}

export class GestorPajaros {
  private readonly pajaros: Phaser.GameObjects.Sprite[] = [];

  constructor(
    private readonly escena: Phaser.Scene,
    private readonly terry: Terry,
    private readonly alRecoger: (x: number, y: number) => void
  ) {}

  crear(configuracion: ConfiguracionPajaro): Phaser.GameObjects.Sprite {
    const pajaro = this.escena.add.sprite(configuracion.x, configuracion.y, configuracion.texturaInicial);
    pajaro.setDisplaySize(configuracion.tamano, configuracion.tamano);
    pajaro.setDepth(9);
    pajaro.setFlipX(configuracion.direccion < 0);
    pajaro.setDataEnabled();
    pajaro.setData("velocidad", configuracion.velocidad);
    pajaro.setData("direccion", configuracion.direccion);
    pajaro.setData("yMinimo", configuracion.yMinimo);
    pajaro.setData("yMaximo", configuracion.yMaximo);
    pajaro.setData("xMinimo", configuracion.xMinimo);
    pajaro.setData("xMaximo", configuracion.xMaximo);
    pajaro.setData("animacion", configuracion.animacion);
    pajaro.play(configuracion.animacion);
    this.pajaros.push(pajaro);
    return pajaro;
  }

  actualizar(delta: number, bloqueado: boolean): void {
    const segundos = delta / 1000;

    for (const pajaro of this.pajaros) {
      if (!pajaro.active || !pajaro.visible) continue;

      const velocidad = Number(pajaro.getData("velocidad"));
      const direccion = Number(pajaro.getData("direccion"));
      const yMinimo = Number(pajaro.getData("yMinimo"));
      const yMaximo = Number(pajaro.getData("yMaximo"));
      const xMinimo = Number(pajaro.getData("xMinimo"));
      const xMaximo = Number(pajaro.getData("xMaximo"));

      pajaro.x += velocidad * segundos;

      if (direccion > 0 && pajaro.x > xMaximo) {
        pajaro.x = xMinimo;
        pajaro.y = Phaser.Math.Between(yMinimo, yMaximo);
      } else if (direccion < 0 && pajaro.x < xMinimo) {
        pajaro.x = xMaximo;
        pajaro.y = Phaser.Math.Between(yMinimo, yMaximo);
      }

      if (!bloqueado) this.comprobarColision(pajaro);
    }
  }

  private comprobarColision(pajaro: Phaser.GameObjects.Sprite): void {
    const cuerpoTerry = this.terry.body as Phaser.Physics.Arcade.Body;
    if (cuerpoTerry.blocked.down) return;

    const toca = Phaser.Geom.Intersects.RectangleToRectangle(this.terry.getBounds(), pajaro.getBounds());
    if (!toca) return;

    this.recoger(pajaro);
  }

  private recoger(pajaro: Phaser.GameObjects.Sprite): void {
    if (!pajaro.active) return;

    const x = pajaro.x;
    const y = pajaro.y;
    const direccion = Number(pajaro.getData("direccion"));
    const yMinimo = Number(pajaro.getData("yMinimo"));
    const yMaximo = Number(pajaro.getData("yMaximo"));
    const xMinimo = Number(pajaro.getData("xMinimo"));
    const xMaximo = Number(pajaro.getData("xMaximo"));
    const animacion = String(pajaro.getData("animacion"));

    pajaro.setActive(false).setVisible(false);
    pajaro.anims.stop();
    this.alRecoger(x, y);

    this.escena.time.delayedCall(5000, () => {
      if (!pajaro.scene) return;
      pajaro.x = direccion > 0 ? xMinimo : xMaximo;
      pajaro.y = Phaser.Math.Between(yMinimo, yMaximo);
      pajaro.setActive(true).setVisible(true).setFlipX(direccion < 0);
      pajaro.play(animacion, true);
    });
  }
}
