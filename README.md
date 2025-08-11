# MyOwnSkynet - Juego Runner

Un juego de plataformas runner con temática de Skynet donde controlas una IA que corre y dispara contra humanos.

## 🎮 Cómo Jugar

- **Teclado**: 
  - Flechas izquierda/derecha para moverse
  - Flecha arriba o espacio para saltar
  - Espacio o F para disparar
  - U para abrir panel de mejoras

- **Móvil**: 
  - Botones táctiles en pantalla
  - Tocar lado izquierdo para saltar
  - Tocar lado derecho para disparar

## 🚨 Solución de Problemas

### El juego no inicia

1. **Verificar consola del navegador**:
   - Abre las herramientas de desarrollador (F12)
   - Ve a la pestaña "Console"
   - Busca errores en rojo

2. **Usar el debug helper**:
   - Abre la consola del navegador
   - Escribe: `debugSkynet.debug()`
   - Esto mostrará el estado del juego

3. **Verificar archivos**:
   - Asegúrate de que todos los archivos estén en la misma carpeta
   - Los archivos necesarios son: `index.html`, `game.js`, `style.css`

4. **Problemas comunes**:
   - **Canvas no encontrado**: Verifica que el HTML tenga `<canvas id="game">`
   - **Contexto 2D no disponible**: El navegador no soporta canvas
   - **JavaScript bloqueado**: Verifica que JavaScript esté habilitado

### El juego se ve mal

1. **Problemas de CSS**:
   - Verifica que `style.css` se cargue correctamente
   - El canvas debe tener un tamaño mínimo de 220px de altura

2. **Problemas de responsive**:
   - El juego se adapta automáticamente al tamaño de pantalla
   - En móviles, usa los botones táctiles

### Los controles no funcionan

1. **Botones móviles**:
   - Verifica que los botones estén visibles en la parte inferior
   - Los botones deben ser circulares y semi-transparentes

2. **Teclado**:
   - Asegúrate de que la ventana del juego tenga el foco
   - Algunos navegadores bloquean eventos de teclado

## 🛠️ Archivos del Proyecto

- `index.html` - Página principal del juego
- `game.js` - Lógica del juego (canvas, física, controles)
- `style.css` - Estilos y diseño responsive
- `manifest.json` - Configuración PWA
- `service-worker.js` - Cache para funcionamiento offline
- `debug.js` - Herramientas de debug
- `test.html` - Página de prueba

## 🔧 Comandos de Debug

En la consola del navegador puedes usar:

```javascript
// Verificar estado del juego
debugSkynet.debug()

// Reiniciar el juego
debugSkynet.reset()

// Aplicar mejoras
debugSkynet.applyUpgrades()

// Acceder directamente al objeto del juego
window.MOS
```

## 📱 PWA (Progressive Web App)

El juego está configurado como PWA, lo que significa que:
- Se puede instalar en móviles
- Funciona offline
- Tiene iconos personalizados

## 🎯 Características

- ✅ Sistema de mejoras persistentes
- ✅ Controles táctiles y de teclado
- ✅ Diseño responsive
- ✅ Sistema de partículas
- ✅ Física de salto y gravedad
- ✅ Enemigos que aparecen dinámicamente
- ✅ Sistema de escudo temporal
- ✅ Multiplicador de créditos

## 👨‍💻 Autor

Creado por Jordan Blancas

---

**Si el problema persiste**, verifica que estés usando un navegador moderno (Chrome, Firefox, Safari, Edge) y que JavaScript esté habilitado. 