# DolphinPulse PWA

Progressive Web App en **React + TypeScript + Vite** que se conecta al Flipper Zero (app `dolphin_pulse`) por **Web Bluetooth** y muestra en tiempo real las tramas **Proteco** recibidas a 433.92 MHz.

Sitio desplegado: [https://uracilo.github.io/DolphinPulse-pwa/](https://uracilo.github.io/DolphinPulse-pwa/)

## Ajustes sobre el deploy existente

El repo solo tenía un workflow de GitHub Pages que subía el **root del repositorio** (`.`) como estático. Eso dejaba la URL en 404 y no servía para una app Vite.

Cambios aplicados:

| Antes | Ahora |
|-------|--------|
| Upload de `.` sin build | `npm ci` → `npm run build` → upload de `dist/` |
| Sin `base` de proyecto | `base: /DolphinPulse-pwa/` en producción |
| Sin PWA real | `vite-plugin-pwa` (manifest + service worker + iconos) |
| Sin app | React + Web Bluetooth + panel en vivo |

El entorno `github-pages` y el trigger `push` a `main` se mantienen, así que el redeploy sigue siendo el mismo flujo de Actions.

## Desarrollo local

```bash
cd DolphinPulse-pwa
npm install
npm run dev
```

Abre `http://localhost:5173/`.

**Web Bluetooth exige contexto seguro:** localhost o HTTPS. En Safari / iOS no está disponible; usa Chrome o Edge.

### Probar la UI sin Flipper

Pulsa **Simular pulso** para inyectar un evento Proteco sintético y validar historial, copiar y animación.

### Probar con Flipper

1. Compila y lanza la FAP (`ufbt launch` en `DolphinPulse-flipper`).
2. En la PWA: **Conectar Flipper** → elige el dispositivo.
3. Pulsa un mando Proteco cerca del Flipper.

## Build de producción

```bash
# Base path de GitHub Pages (por defecto en CI)
VITE_BASE_PATH=/DolphinPulse-pwa/ npm run build

# Servir el resultado
npm run preview
```

## Redeploy

```bash
git add -A
git commit -m "feat: DolphinPulse PWA with Web Bluetooth and vite-plugin-pwa"
git push origin main
```

Actions construye y publica automáticamente. También puedes lanzar el workflow a mano desde la pestaña **Actions**.

## Stack

- React 19 + TypeScript + Vite 6
- `vite-plugin-pwa` → `manifest.webmanifest` + Workbox SW
- Web Bluetooth → servicio Serial del Flipper  
  - Service `19ed82ae-ed21-4c9d-4145-228e60fe0000`  
  - RX notify `19ed82ae-ed21-4c9d-4145-228e61fe0000`

## Payload esperado

```json
{"app":"DolphinPulse","protocol":"Proteco","code":"0x1A2B3C","btn":"A","freq":433920000}
```
