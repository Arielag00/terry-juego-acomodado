import Phaser from "phaser";
import { Terry } from "../personajes/Terry";
import { BarreraJuego, Desafio, ElementosCompetencia } from "../tipos";
import { EfectosJuego } from "./EfectosJuego";
import { CinematicasObstaculos } from "./CinematicasObstaculos";
import { CinematicasRivales } from "./CinematicasRivales";

interface DependenciasCinematicas {
  escena: Phaser.Scene;
  terry: Terry;
  competencia: ElementosCompetencia;
  rivales: Map<number, Phaser.GameObjects.Container | Phaser.GameObjects.Sprite>;
  barreras: Map<number, BarreraJuego>;
  efectos: EfectosJuego;
  mostrarMensaje: (texto: string) => void;
  alTerminarAccion: () => void;
  alGameOver: () => void;
  alGolpeFlavio: () => void;
}

export class CinematicasDesafios {
  private readonly obstaculos: CinematicasObstaculos;
  private readonly rivales: CinematicasRivales;

  constructor(dependencias: DependenciasCinematicas) {
    this.obstaculos = new CinematicasObstaculos({
      escena: dependencias.escena,
      terry: dependencias.terry,
      barreras: dependencias.barreras,
      efectos: dependencias.efectos,
      alTerminarAccion: dependencias.alTerminarAccion,
      alGameOver: dependencias.alGameOver,
    });

    this.rivales = new CinematicasRivales({
      escena: dependencias.escena,
      terry: dependencias.terry,
      competencia: dependencias.competencia,
      rivales: dependencias.rivales,
      mostrarMensaje: dependencias.mostrarMensaje,
      alTerminarAccion: dependencias.alTerminarAccion,
      alGameOver: dependencias.alGameOver,
      alGolpeFlavio: dependencias.alGolpeFlavio,
    });
  }

  resolverCorrecta(desafio: Desafio): void {
    if (desafio.tipo === "tronco") {
      this.obstaculos.troncoCorrecto();
      return;
    }

    if (desafio.tipo === "pozo") {
      this.obstaculos.pozoCorrecto();
      return;
    }

    if (desafio.tipo === "rival") {
      this.rivales.rivalCorrecto(desafio);
      return;
    }

    this.obstaculos.barreraCorrecta(desafio);
  }

  resolverIncorrecta(desafio: Desafio, sinVidas: boolean): void {
    if (desafio.tipo === "tronco") {
      this.obstaculos.troncoIncorrecto(sinVidas);
      return;
    }

    if (desafio.tipo === "pozo") {
      this.obstaculos.pozoIncorrecto(sinVidas);
      return;
    }

    if (desafio.tipo === "rival") {
      this.rivales.rivalIncorrecto(desafio, sinVidas);
      return;
    }

    this.obstaculos.barreraIncorrecta(desafio, sinVidas);
  }
}
