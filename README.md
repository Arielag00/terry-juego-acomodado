# Terry - juego reorganizado

Esta version reorganiza el proyecto para que cada parte tenga una responsabilidad clara y para evitar que toda la logica quede concentrada en `Juego.ts`.

## Estructura del codigo

```text
src/
├── configuracion/
│   └── juego.ts
├── datos/
│   ├── desafios.ts
│   └── preguntas.ts
└── juego/
    ├── escenas/
    │   ├── Intro.ts
    │   └── Juego.ts
    ├── etapas/
    │   ├── EtapaInicio.ts
    │   ├── EtapaCompetencia.ts
    │   └── EtapaProvisoria.ts
    ├── personajes/
    │   └── Terry.ts
    ├── sistemas/
    │   ├── CinematicasDesafios.ts
    │   ├── CinematicasObstaculos.ts
    │   ├── CinematicasRivales.ts
    │   ├── EfectosJuego.ts
    │   ├── FondoMundo.ts
    │   ├── GestorPajaros.ts
    │   └── InterfazJuego.ts
    ├── utilidades/
    │   ├── AlineadorSprites.ts
    │   └── FisicaTerry.ts
    └── tipos.ts
```

`Juego.ts` queda como coordinador de la partida. Las etapas construyen sus elementos, los sistemas resuelven mecanicas concretas y las utilidades concentran codigo reutilizable.

## Estructura de recursos

```text
public/recursos/
├── fondos/
│   ├── etapa-01-inicio/
│   ├── etapa-02-competencia/
│   └── etapa-03-granja/
├── imagenes/
│   ├── comunes/
│   │   └── personajes/terry/
│   ├── etapa-01-inicio/
│   │   ├── animales/
│   │   ├── carteles/
│   │   ├── edificios/
│   │   ├── efectos/
│   │   ├── obstaculos/
│   │   ├── personajes/
│   │   └── vegetacion/
│   ├── etapa-02-competencia/
│   │   └── mismas categorias
│   └── etapa-03-granja/
│       └── mismas categorias
└── sonidos/
```

## Etapas actuales

1. `EtapaInicio`: inicio, cartel Terra, vegetacion, tronco y pajaros.
2. `EtapaCompetencia`: oficina Cruz, asesor, vegetacion, nubes y pajaros.
3. `EtapaProvisoria`: conserva los elementos temporales que ya existian despues de la oficina (pozo, rival, barreras y meta).

Los recursos de granja quedaron ordenados dentro de `etapa-03-granja`, pero no se fuerza una implementacion que todavia no estaba conectada al juego original.

## Limpieza realizada

- Se eliminaron las referencias a las carpetas viejas de recursos.
- Se dejo de cargar contenido que no participa actualmente en la partida.
- La alineacion de sprites por margen transparente se centralizo en una unica utilidad reutilizable.
- La activacion y desactivacion de la fisica de Terry se centralizo en una utilidad.
- Las cinematicas se separaron entre obstaculos y rivales/asesor.
- El piso de las primeras etapas usa un unico cuerpo fisico para evitar enganches en la union entre tramos.
- Se mantuvieron las preguntas, desafios, puntajes, vidas y flujo existente sin inventar mecanicas nuevas.

## Instalacion y ejecucion

`node_modules` no se incluye en el proyecto. Es una carpeta generada y debe reconstruirse en cada PC a partir de `package.json` y `package-lock.json`.

```bash
npm install
npm run dev
```

Para validar la compilacion de produccion:

```bash
npm run build
```
