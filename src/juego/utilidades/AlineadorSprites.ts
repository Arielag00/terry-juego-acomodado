import Phaser from "phaser";

export class AlineadorSprites {
  private readonly escena: Phaser.Scene;
  private readonly cacheMargenes = new Map<string, number>();

  constructor(escena: Phaser.Scene) {
    this.escena = escena;
  }

  obtenerLineaInferior(sprite: Phaser.GameObjects.Sprite): number {
    const margen = this.obtenerMargenInferior(sprite.texture.key);
    const altoFrame = sprite.frame.realHeight || sprite.height;
    const altoVisible = Math.max(0, altoFrame - margen) * Math.abs(sprite.scaleY);
    const ySuperior = sprite.y - sprite.displayHeight * sprite.originY;
    return ySuperior + altoVisible;
  }

  colocarSobreLinea(
    sprite: Phaser.GameObjects.Sprite,
    textura: string,
    x: number,
    lineaSuelo: number
  ): void {
    sprite.stop();
    sprite.setTexture(textura);

    const margen = this.obtenerMargenInferior(textura);
    const altoFrame = sprite.frame.realHeight || sprite.height;
    const altoVisible = Math.max(0, altoFrame - margen) * Math.abs(sprite.scaleY);

    sprite.setOrigin(0.5, 0);
    sprite.setPosition(x, lineaSuelo - altoVisible);
  }

  obtenerMargenInferior(claveTextura: string): number {
    const guardado = this.cacheMargenes.get(claveTextura);
    if (guardado !== undefined) return guardado;
    if (!this.escena.textures.exists(claveTextura)) return 0;

    try {
      const fuente = this.escena.textures.get(claveTextura).getSourceImage() as HTMLImageElement | HTMLCanvasElement;
      const ancho = fuente instanceof HTMLImageElement ? fuente.naturalWidth : fuente.width;
      const alto = fuente instanceof HTMLImageElement ? fuente.naturalHeight : fuente.height;
      if (ancho <= 0 || alto <= 0) return 0;

      const canvas = document.createElement("canvas");
      canvas.width = ancho;
      canvas.height = alto;
      const contexto = canvas.getContext("2d", { willReadFrequently: true });
      if (!contexto) return 0;

      contexto.drawImage(fuente, 0, 0);
      const pixeles = contexto.getImageData(0, 0, ancho, alto).data;
      const minimoVisibles = Math.max(3, Math.floor(ancho * 0.005));
      let filasConsecutivas = 0;
      let ultimaFilaVisible = -1;

      for (let y = alto - 1; y >= 0; y--) {
        let visibles = 0;
        for (let x = 0; x < ancho; x++) {
          if (pixeles[(y * ancho + x) * 4 + 3] > 24 && ++visibles >= minimoVisibles) break;
        }

        if (visibles >= minimoVisibles) {
          filasConsecutivas++;
          if (filasConsecutivas >= 2) {
            ultimaFilaVisible = Math.min(alto - 1, y + 1);
            break;
          }
        } else {
          filasConsecutivas = 0;
        }
      }

      const margen = ultimaFilaVisible >= 0 ? alto - 1 - ultimaFilaVisible : 0;
      this.cacheMargenes.set(claveTextura, margen);
      return margen;
    } catch {
      return 0;
    }
  }
}
