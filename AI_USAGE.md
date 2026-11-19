# Registro de Uso de Inteligencia Artificial (AI_USAGE)

## 📌 Proyecto
**CivicPulseAI - SER Madrid 2026**  
Hackatón *2Campus1Code* (DAETSISI-DAETSIINF-ORANGE).

---

## 🤖 Herramientas de IA Utilizadas

### 1. Google Gemini / Antigravity Agent
* **Contribución a la Arquitectura:**
  * Evaluación y recomendación de la arquitectura de 3 capas (PWA + API/Cron + PostGIS).
  * Advertencia y propuesta de solución ante la limitación de geometrías directas en el dataset oficial `218228-1-ser-calles-csv` del Ayuntamiento de Madrid (cruce con callejero oficial).
  * Selección y comparativa de tecnologías (MapLibre GL JS + OpenFreeMap tiles, FastAPI, PostGIS y Web Push API).

* **Generación de Estructura de Código:**
  * Creación del backend modular en FastAPI con soporte para endpoints GeoJSON, búsqueda difusa de calles por nombre, gestión de estacionamientos y cron job de alertas.
  * Implementación del cliente frontend en React 18 con TypeScript, Vite, Tailwind CSS y MapLibre GL JS.
  * Configuración de Service Worker y Web Push API para los avisos en segundo plano 30 minutos antes del vencimiento.
  * Script ETL y dataset semilla con tramos reales de Madrid (distritos Salamanca, Chamberí, Retiro y Centro).

---

## 🛡️ Criterios y Validación Humana
* Todas las decisiones de stack (Python FastAPI, Docker Compose + PostGIS, TypeScript y MapLibre) fueron revisadas y validadas por el equipo antes de la ejecución.
* El código fuente se estructuró de forma desacoplada para permitir tanto el despliegue local rápido para evaluación como la integración continua.
