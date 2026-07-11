# Aplicación SocioUnido

Aplicación móvil de "SocioUnido".

📖 **[Ver la documentación online](https://trabajoprofesional-aggz.github.io/aplicacion/)**

**📱 [App en producción](https://aplicacion-ruddy.vercel.app/)**

# SocioUnido - Frontend (PWA) 📱

Este repositorio contiene la aplicación frontend para los socios del club SocioUnido. Está construida como una **Progressive Web App (PWA)** utilizando React y Vite, lo que permite su instalación en dispositivos móviles y su funcionamiento sin conexión a internet (ideal para la generación de tokens TOTP en la puerta del club).

## 🚀 Tecnologías Principales

*   **Framework:** React (con Vite)
*   **PWA:** `vite-plugin-pwa` (Generación de Service Worker y Manifest)
*   **Pagos:** Mercado Pago (Checkout Bricks)
*   **Despliegue:** Vercel

---

## ⚙️ Requisitos Previos

Asegúrate de tener instalado en tu máquina local:
*   [Node.js](https://nodejs.org/) (versión 18 o superior recomendada)
*   Git

---

## 🛠️ Instalación y Configuración Local

**1. Clonar el repositorio**
```bash
git clone [https://github.com/tu-usuario/TrabajoProfesional-AGGZ.git](https://github.com/tu-usuario/TrabajoProfesional-AGGZ.git)
cd TrabajoProfesional-AGGZ/aplicacion
```

**2. Instalar dependencias**
```bash
npm install
```

**3. Correr la aplicación en modo desarrollo**
```bash
npm run dev
```

## Cómo probar la PWA (modo offline)
Para probar cómo se comportaría la aplicación instalada en el celular de un socio y verificar el caché offline, necesitas compilar el proyecto y servirlo tal como lo haría producción:

**1. Compilar la aplicación**
```bash
npm run build
```
Esto generará la carpeta dist/ con todo el JavaScript minificado, el manifest.webmanifest y el sw.js (Service Worker).

**2. Servir la aplicación localmente**
```bash
npm run preview
```

**3. Simular el modo offline**
1. Abre esa URL en Google Chrome.
2. Presiona F12 para abrir las Herramientas de Desarrollador.
3. Ve a la pestaña Application (Aplicación) -> Service Workers.
4. Verifica que el Service Worker aparezca como "Activated and is running".
5. Marca la casilla que dice "Offline" (para simular que el dispositivo perdió conexión).
6. ¡Recarga la página (F5)! Si la PWA está bien configurada, la aplicación cargará instantáneamente desde el caché local en lugar de mostrar el dinosaurio de Chrome.

## Licencia ⚖️

Este proyecto está licenciado bajo la **PolyForm Noncommercial License 1.0.0**.

El código fuente está disponible para su revisión, estudio y modificación con fines estrictamente académicos o personales.

Queda totalmente prohibido su uso, distribución o modificación con cualquier tipo de fin comercial o de lucro sin el consentimiento expreso y por escrito de los autores.

Para más detalles, revisar el archivo `LICENSE` incluido en este repositorio.

## Página documental

Desarrollada con [Just the Docs](https://just-the-docs.com/).
