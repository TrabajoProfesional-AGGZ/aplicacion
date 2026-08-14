---
layout: default
title: Justificación tecnológica
nav_order: 3
---

# 🛠️ Justificación tecnológica

En esta sección documentamos las decisiones técnicas tomadas para la construcción de la PWA de los socios, asegurando que cada herramienta elegida garantice una experiencia de usuario fluida, adaptable y escalable.

## Lenguajes, Frameworks y Herramientas

Para el frontend de la plataforma, la prioridad absoluta fue la velocidad de carga, la experiencia *mobile-first* y la facilidad para tematizar la aplicación:

* **React + Vite:** Utilizamos React por su ecosistema maduro basado en componentes (JSX), lo que nos permite reutilizar elementos de la interfaz (botones, modales, tarjetas) de manera modular[cite: 8]. Optamos por **Vite** en lugar de Webpack o Create React App debido a su velocidad de compilación ultrarrápida y recarga en caliente (HMR), agilizando drásticamente el ciclo de desarrollo[cite: 8].
* **JavaScript y CSS Modular:** Se decidió mantener JavaScript puro para agilizar la codificación, combinándolo con CSS tradicional (manejado mediante variables y tokens en `tokens.css` y `socio-theme.css`) para facilitar la personalización de "marca blanca" que requieren los distintos clubes[cite: 8].
* **Progressive Web App (PWA):** La aplicación está configurada para funcionar como una PWA nativa, incluyendo su `manifest`, íconos para la pantalla de inicio (`pwa-192x192.png`, `pwa-512x512.png`) y soporte para instalación directa sin pasar por las tiendas de aplicaciones tradicionales[cite: 8].
* **Firebase Cloud Messaging:** Implementado a través de `firebase-messaging-sw.js` para proveer notificaciones push en tiempo real a los dispositivos de los socios[cite: 8].
* **Mercado Pago (Brick):** Integración nativa a nivel cliente (`mercadopago.js`) para capturar tokens de tarjetas de forma segura antes de enviar los cobros al backend[cite: 8].

## Calidad y Testing

* **Jest:** Nuestro entorno principal de pruebas unitarias (`jest.config.cjs` y archivos `*.test.js` en los componentes) asegura el correcto renderizado y la lógica de validación de los formularios y flujos de la interfaz[cite: 8].
* **ESLint:** Configurado (`eslint.config.js`) para mantener un estándar de codificación limpio, previniendo errores de sintaxis y patrones problemáticos a nivel de todo el equipo[cite: 8].

## Integración y Despliegue (CI/CD)

* **Vercel:** La plataforma elegida para el despliegue automático de la aplicación frontend (`vercel.json`). Ofrece una red de distribución de contenido (CDN) global, optimización de caché inmediata y un flujo de trabajo que despliega una previsualización por cada Pull Request fusionado[cite: 8].
* **GitHub Actions:** Contamos con flujos automatizados (`frontend-tests.yml`) para asegurar que el código subido pase siempre las pruebas establecidas antes de llegar a la rama principal[cite: 8].
