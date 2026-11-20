# 🚗 CivicPulseAI - SER Madrid 2026

[![Hackatón 2Campus1Code](https://img.shields.io/badge/Hackatón-2Campus1Code_DAETSISI--DAETSIINF--ORANGE-orange)](https://github.com)
[![Status](https://img.shields.io/badge/Status-MVP_Ready-green)]()

Aplicación web progresiva (PWA) de 3 capas para la visualización en tiempo real del Servicio de Estacionamiento Regulado (SER) del Ayuntamiento de Madrid con datos abiertos 2026, filtrado inteligente de zonas verde/azul, búsqueda predictiva de calles con plazas y sistema de avisos 30 minutos antes del vencimiento.

---

## 🎯 Funcionalidades Cubiertas

1. 🗺️ **Visualización de Mapa SER:** Renderizado vectorial con **MapLibre GL JS** y teselas gratuitas de **OpenFreeMap**, pintando zonas **Verdes** (residentes) y **Azules** (rotación).
2. 🔍 **Filtrado por Zona:** Control interactivo para conmutar tramos verdes/azules y filtrar por distrito (Salamanca, Chamberí, Retiro, Centro, etc.).
3. 🔎 **Búsqueda por Calle:** Autocompletado que informa del tipo de plaza (Verde, Azul o Mixta), número de plazas disponibles y centrado automático en el mapa.
4. 📍 **Crear Estacionamiento ("Aparcar aquí"):** Registro de ubicación GPS, referencia de calle, tipo de plaza y cálculo de horario de finalización.
5. ⏰ **Aviso 30 minutos antes:** Cron en backend que monitoriza los estacionamientos y dispara notificaciones **Web Push** nativas, alerta visual con cuenta atrás y botón de respaldo para **Google Calendar**.

---

## 🏗️ Arquitectura de 3 Capas

```
[ Capa 1: Frontend (PWA) ]  <--->  [ Capa 2: Backend API + Cron ]  <--->  [ Capa 3: Base de Datos ]
 React 18 + TS + MapLibre             FastAPI + APScheduler + Push          PostgreSQL + PostGIS
```

---

## 🚀 Puesta en Marcha Rápida

### Opción 1: Con Docker Compose (Recomendado)
Levanta la base de datos PostGIS y la API en un solo comando:
```bash
docker-compose up --build -d
```

### Opción 2: Ejecución Local

#### 1. Backend (FastAPI + Python 3.11+)
```bash
cd backend
python -m venv venv
# Windows:
.\venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```
> La API estará disponible en `http://localhost:8000` y la documentación interactiva Swagger en `http://localhost:8000/docs`.  
> *Nota:* Si no se conecta a PostgreSQL, el backend incluye fallback automático a base de datos SQLite y carga de datos iniciales.

#### 2. Frontend (React + Vite)
```bash
cd frontend
npm install
npm run dev
```
> Abre tu navegador en `http://localhost:5173`.

---

## 🚀 Despliegue en Render

Despliega el backend y el frontend como servicios separados:

1. **Backend:** crea un servicio Web con runtime Docker y directorio raíz `backend`. Render usará el `Dockerfile` y el backend escuchará en el puerto asignado por Render.
2. **Base de datos:** crea una base PostgreSQL en Render y configura `DATABASE_URL` en el backend con su URL interna. El backend acepta URLs `postgres://` y `postgresql://`.
3. **Frontend:** crea un Static Site con directorio raíz `frontend`, comando de build `npm ci && npm run build` y directorio publicado `dist`.
4. En las variables de entorno de build del frontend, configura `VITE_API_URL` con la URL pública base del backend (por ejemplo, `https://civicpulse-api.onrender.com`, sin `/api` al final) y vuelve a desplegar el frontend.

La URL `VITE_API_URL` se incorpora durante la compilación. Si no se configura, la aplicación usa `http://localhost:8000`, destinado al desarrollo local. El backend permite CORS para todos los orígenes.

---

## 📊 Fuentes de Datos Abiertos Utilizadas

- **Dataset SER Calles 2026:** [Portal de Datos Abiertos del Ayuntamiento de Madrid (218228-0-ser-calles)](https://datos.madrid.es/dataset/218228-0-ser-calles/resource/218228-1-ser-calles-csv)
- **Teselas Vectoriales:** [OpenFreeMap](https://openfreemap.org/)

---

## 📄 AI Usage
Consulta el archivo [AI_USAGE.md](file:///c:/Users/cbyll/Monica/Hackaton/CivicPulseAI/AI_USAGE.md) para detalles del uso de Inteligencia Artificial en el diseño y desarrollo del proyecto.
