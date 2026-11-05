import Phaser from "phaser";

export class EfectosJuego {
  constructor(
    private readonly escena: Phaser.Scene,
    private readonly registrarMundo: <T extends Phaser.GameObjects.GameObject>(objeto: T) => T
  ) {
    this.crearAnimaciones();
  }

  plumas(x: number, y: number): void {
    const sprite = this.registrarMundo(this.escena.add.sprite(x, y, "plumas-1"));
    sprite.setDisplaySize(105, 105).setDepth(20).play("efecto-plumas");
    this.escena.tweens.add({
      targets: sprite,
      y: y - 25,
      alpha: 0,
      duration: 650,
      ease: "Sine.Out",
      onComplete: () => sprite.destroy(),
    });
  }

  polvo(x: number, y: number): void {
    const sprite = this.registrarMundo(this.escena.add.sprite(x, y, "impacto-polvo-1"));
    sprite.setDisplaySize(110, 60).setDepth(20).play("impacto-polvo");
    this.escena.tweens.add({
      targets: sprite,
      alpha: 0,
      duration: 500,
      ease: "Sine.Out",
      onComplete: () => sprite.destroy(),
    });
  }

  private crearAnimaciones(): void {
    if (!this.escena.anims.exists("impacto-polvo")) {
      this.escena.anims.create({
        key: "impacto-polvo",
        frames: [{ key: "impacto-polvo-1" }, { key: "impacto-polvo-2" }],
        frameRate: 8,
        repeat: 0,
      });
    }

    if (!this.escena.anims.exists("efecto-plumas")) {
      this.escena.anims.create({
        key: "efecto-plumas",
        frames: [{ key: "plumas-1" }, { key: "plumas-2" }],
        frameRate: 7,
        repeat: 0,
      });
    }
  }
}
