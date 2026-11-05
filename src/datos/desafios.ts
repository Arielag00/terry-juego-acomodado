import { Desafio } from "../juego/tipos";

export function crearDesafios(): Desafio[] {
  return [
    {
      id: 1,
      tipo: "tronco",
      preguntaIndice: 0,
      // El tronco esta en x=850. La pregunta salta a solo 80 px del obstaculo,
      // asi Terry no tiene que recorrer ni teletransportarse despues de responder.
      triggerX: 770,
      resuelto: false,
    },
    {
      id: 2,
      tipo: "rival",
      preguntaIndice: 1,
      triggerX: 4380,
      resuelto: false,
    },
    {
      id: 5,
      tipo: "chancho",
      preguntaIndice: 6,
      // El primer corral esta en x=6400. La pregunta aparece apenas antes,
      // para que Terry ya este realmente frente al chancho.
      triggerX: 6240,
      resuelto: false,
    },
    {
      id: 4,
      tipo: "rival",
      preguntaIndice: 2,
      triggerX: 8040,
      resuelto: false,
    },
    {
      id: 3,
      tipo: "rival",
      preguntaIndice: 3,
      triggerX: 10170,
      resuelto: false,
    },
  ];
}
