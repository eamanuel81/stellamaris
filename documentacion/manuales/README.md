# Manuales de Usuario - Stella Maris Manager

Esta carpeta contiene los manuales de usuario del sistema **Stella Maris Manager**.

## Estructura de Documentación

```
documentacion/
└── manuales/
    ├── README.md (este archivo)
    ├── manual-usuario-empleado.md
    ├── manual-administrador.md
    └── imagenes/
        └── (capturas de pantalla - cuando estén disponibles)
```

## Manuales Disponibles

### 1. Manual de Usuario para Empleados
📄 **Archivo:** `manual-usuario-empleado.md`

**Descripción:** Guía completa para empleados que incluye:
- Acceso al sistema
- Visualización y gestión de tareas propias
- Cambio de estados de tareas
- Uso del calendario personal
- Gestión de perfil y notificaciones

**Audiencia:** Empleados de la guardería de lanchas

---

### 2. Manual de Administrador
📄 **Archivo:** `manual-administrador.md`

**Descripción:** Guía completa para administradores que incluye:
- Acceso y seguridad
- Dashboard y resumen general
- Gestión de tareas del día
- Asignación de tareas a empleados
- Gestión de tipos de tareas
- Gestión de empleados y clientes
- Configuración del sistema

**Audiencia:** Administradores del sistema

---

## Versión

**Versión del Manual:** 1.0  
**Fecha de Última Actualización:** Diciembre 2025  
**Versión del Sistema:** 1.0.4

---

## Actualizaciones Futuras

Los manuales se actualizarán cuando:
- Se agreguen nuevas funcionalidades
- Se modifiquen procesos existentes
- Se detecten mejoras en la documentación

---

## 📄 Versión HTML para Visualizar e Imprimir

¡Los manuales están disponibles en formato HTML para visualizar e imprimir fácilmente!

### Archivos HTML Generados

- **`index.html`** - Página principal para elegir entre manuales
- **`manual-administrador.html`** - Manual completo de administrador
- **`manual-empleado.html`** - Manual completo de empleado

### ⚠️ IMPORTANTE: Cómo Ver las Imágenes

Las imágenes pueden no mostrarse si abres el HTML directamente desde el sistema de archivos debido a restricciones de seguridad del navegador.

**SOLUCIÓN RECOMENDADA: Usar un servidor local**

1. **Opción A - Script Automático (Windows):**
   ```bash
   cd documentacion/manuales
   servir-manual.bat
   ```
   Luego abre: http://localhost:8000/index.html

2. **Opción B - Python (Windows/Mac/Linux):**
   ```bash
   cd documentacion/manuales
   python -m http.server 8000
   ```
   Luego abre: http://localhost:8000/index.html

3. **Opción C - Abrir directamente:**
   - Haz doble clic en `index.html`
   - Si las imágenes no se ven, usa las opciones A o B

### Cómo Usar

1. **Ver los manuales:**
   - Usa un servidor local (recomendado) o abre directamente `index.html`
   - Navega entre los manuales desde la página principal

2. **Imprimir:**
   - Haz clic en el botón "🖨️ Imprimir" en cualquier manual
   - O usa `Ctrl+P` (Windows/Linux) o `Cmd+P` (Mac)
   - Los estilos están optimizados para impresión

3. **Regenerar HTML:**
   Si actualizas los archivos `.md`, regenera los HTML con:
   ```bash
   cd documentacion/manuales
   node generar-html.js
   ```

### Características de los HTML

- ✅ Diseño responsive (se adapta a móviles y tablets)
- ✅ Estilos optimizados para impresión
- ✅ Navegación fácil con botones
- ✅ Imágenes incluidas automáticamente
- ✅ Tablas de contenido
- ✅ Tipografía clara y legible

---

## Estado de las Capturas de Pantalla

✅ **13 capturas de administrador** ya han sido tomadas automáticamente.

⏳ **Faltan:**
- 14-busqueda-embarcacion.png
- 15-conflicto-horarios.png (requiere crear un conflicto manualmente)
- 16-formulario-extras.png (si hay una tarea con extras disponibles)
- 18-crear-tipo-tarea.png
- 8 capturas de empleado (ver `tomar-capturas-empleado.js`)

### Scripts Automáticos Disponibles

1. **`tomar-capturas.js`** - Toma las capturas de administrador (ya ejecutado ✅)
2. **`tomar-capturas-empleado.js`** - Toma las capturas de empleado (requiere credenciales de empleado)

### Para Completar las Capturas Faltantes

1. Consulta **`INSTRUCCIONES-CAPTURAS.md`** para ver detalles específicos
2. Consulta **`README-CAPTURAS.md`** para instrucciones paso a paso
3. Usa los scripts o toma las capturas manualmente
4. Guárdalas en la carpeta `imagenes/` con los nombres exactos especificados
5. Las imágenes aparecerán automáticamente en los manuales

### Herramientas Recomendadas para Capturas

- **Windows:** Snipping Tool o Windows + Shift + S
- **macOS:** Cmd + Shift + 4
- **Navegador:** Extensiones de captura o F12 (DevTools) > Screenshot

## Notas

- Todos los manuales están escritos en **español**
- Las referencias a imágenes ya están agregadas en los manuales
- Consulta `INSTRUCCIONES-CAPTURAS.md` para la lista completa de capturas
- Para sugerencias o correcciones, contacta al equipo de desarrollo

---

**Última actualización:** Diciembre 2025

