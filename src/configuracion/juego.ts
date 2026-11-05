export const CONFIGURACION_JUEGO = {
  anchoMundo: 13200,
  altoMundo: 720,
  posicionMeta: 12800,
  yTerrySuelo: 580,
  ySuperficieSuelo: 655,
  vidasIniciales: 3,
  puntosRespuestaCorrecta: 100,
  puntosPajaro: 50,
  bonusMeta: 300,
  bonusPorVida: 100,
} as const;

export const LIMITES_ETAPAS = {
  inicio: { desde: 0, hasta: 1650 },
  competencia: { desde: 1650, hasta: 4900 },
  granja: { desde: 4900, hasta: 8450 },
  conlara: { desde: 8450, hasta: 12250 },
  provisional: { desde: 12250, hasta: 13200 },
} as const;
