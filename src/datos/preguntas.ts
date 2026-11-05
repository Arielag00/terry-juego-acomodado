export interface PreguntaJuego {
  id: number;
  producto: string;
  pregunta: string;
  opciones: string[];
  correcta: number;
}

export const preguntas: PreguntaJuego[] = [
  {
    id: 1,
    producto: "Estacion Conlara",
    pregunta: "Pregunta de prueba: \u00bfque producto estamos usando actualmente?",
    opciones: ["Estacion Conlara", "Merlo Village", "Estacion del Valle", "Otro proyecto"],
    correcta: 0,
  },
  {
    id: 2,
    producto: "Estacion Conlara",
    pregunta: "Segunda pregunta de prueba: \u00bfque proyecto aparece seleccionado actualmente?",
    opciones: ["Merlo Village", "Estacion del Valle", "Estacion Conlara", "Ninguno"],
    correcta: 2,
  },
  {
    id: 3,
    producto: "Estacion Conlara",
    pregunta: "Pregunta provisoria: \u00bfcon cuantas vidas comienza Terry?",
    opciones: ["1 vida", "2 vidas", "3 vidas", "5 vidas"],
    correcta: 2,
  },
  {
    id: 4,
    producto: "Estacion Conlara",
    pregunta: "Pregunta provisoria: \u00bfque sucede cuando respondes incorrectamente?",
    opciones: ["Ganas puntos", "Perdes una vida", "Terminas el nivel", "No pasa nada"],
    correcta: 1,
  },
  {
    id: 5,
    producto: "Estacion Conlara",
    pregunta: "Pregunta provisoria: \u00bfque accion suma puntos durante el recorrido?",
    opciones: ["Volver hacia atras", "Quedarse quieto", "Responder correctamente", "Saltar sin motivo"],
    correcta: 2,
  },
  {
    id: 6,
    producto: "Estacion Conlara",
    pregunta: "Pregunta provisoria: \u00bfcuál es el objetivo principal del nivel?",
    opciones: ["Llegar a la meta", "Volver al inicio", "Perder las tres vidas", "Evitar todas las preguntas"],
    correcta: 0,
  },
  {
    id: 7,
    producto: "Granja Terra",
    pregunta: "\u00bfQue animal esta en el primer corral?",
    opciones: ["Una oveja", "Un chancho", "Una gallina", "Un perro"],
    correcta: 1,
  },
];
