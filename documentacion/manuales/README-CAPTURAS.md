# Guía para Tomar Capturas de Pantalla

## Opción 1: Script Automático (Recomendado)

He creado un script Node.js que toma todas las capturas automáticamente.

### Requisitos

1. Instalar Playwright:
```bash
npm install playwright
npx playwright install chromium
```

2. Asegúrate de que el servidor esté corriendo:
```bash
npm run dev
```

3. Ejecutar el script:
```bash
cd documentacion/manuales
node tomar-capturas.js
```

El script automáticamente:
- Abrirá el navegador
- Hará login como administrador
- Navegará por todas las secciones
- Tomará las capturas y las guardará en `imagenes/`

---

## Opción 2: Capturas Manuales

Si prefieres tomar las capturas manualmente, sigue estas instrucciones:

### Credenciales de Administrador

Definí en el `.env` de la raíz del proyecto (no commitear):

- `DEV_ADMIN_EMAIL`
- `DEV_ADMIN_PASSWORD`

Mismos valores que uses para `POST /api/seed` en desarrollo. Ver `.env.example`.

### Lista de Capturas Necesarias

#### Para Administrador (17 capturas)

1. **09-login-admin.png**
   - URL: http://localhost:9002
   - Login con el admin configurado en `.env`
   - Tipo: Administrador seleccionado

2. **10-dashboard.png**
   - URL: http://localhost:9002/dashboard
   - Esperar a que cargue completamente

3. **11-tareas-dia-vista.png**
   - URL: http://localhost:9002/today-tasks
   - Mostrar lista de tareas, búsqueda, filtros

4. **12-formulario-asignar-general.png**
   - Desde Tareas del Día, clic en "Asignar Tarea"
   - Formulario completo abierto, pestaña "General"

5. **13-busqueda-cliente.png**
   - En el formulario de asignar, campo "Buscar cliente"
   - Mostrar lista desplegada con resultados

6. **14-busqueda-embarcacion.png**
   - En el formulario de asignar, campo "Buscar embarcación"
   - Con un cliente seleccionado

7. **15-conflicto-horarios.png**
   - Intentar asignar una tarea con conflicto de horario
   - Diálogo de advertencia visible

8. **16-formulario-extras.png**
   - En el formulario de asignar, pestaña "Extras"
   - Si la tarea tiene extras disponibles

9. **17-tipos-tareas-tabla.png**
   - URL: http://localhost:9002/tasks
   - Tabla completa con tipos de tareas

10. **18-crear-tipo-tarea.png**
    - Desde Tipos de Tareas, clic en "Agregar Tarea"
    - Formulario completo abierto

11. **19-empleados-tabla.png**
    - URL: http://localhost:9002/employees
    - Tabla completa de empleados

12. **20-crear-empleado.png**
    - Desde Empleados, clic en "Agregar Empleado"
    - Formulario completo abierto

13. **21-clientes-tabla.png**
    - URL: http://localhost:9002/clients
    - Tabla completa de clientes

14. **22-crear-cliente-datos.png**
    - Desde Clientes, clic en "Agregar Cliente"
    - Sección "Datos del Cliente" visible

15. **23-crear-cliente-embarcaciones.png**
    - Mismo formulario, sección "Embarcaciones" visible
    - Scroll hacia abajo si es necesario

16. **24-crear-cliente-responsables.png**
    - Mismo formulario, sección "Otro Responsable" visible
    - Scroll hacia abajo si es necesario

17. **25-calendario-asignar.png**
    - URL: http://localhost:9002/schedule
    - Calendario semanal con tareas visibles

#### Para Empleado (8 capturas)

Para estas capturas, necesitarás una cuenta de empleado. Si no tienes una, crea una desde la sección de Empleados primero.

1. **01-login-empleado.png**
   - URL: http://localhost:9002
   - Tipo: Empleado seleccionado

2. **02-mis-tareas-vista-general.png**
   - URL: http://localhost:9002/my-tasks
   - Lista de tarjetas de tareas

3. **03-tarjeta-tarea-detalle.png**
   - Una tarjeta de tarea ampliada/visible

4. **04-menu-cambiar-estado.png**
   - Menú "Cambiar Estado" desplegado

5. **05-detalles-tarea.png**
   - Diálogo de detalles de tarea abierto

6. **06-calendario-vista.png**
   - URL: http://localhost:9002/my-calendar
   - Calendario mensual

7. **07-perfil-usuario.png**
   - Panel de perfil abierto

8. **08-notificaciones.png**
   - Panel de notificaciones abierto

### Consejos para Capturas Manuales

1. **Herramientas recomendadas:**
   - Windows: `Windows + Shift + S` (Snipping Tool)
   - Mac: `Cmd + Shift + 4`
   - Navegador: Extensiones como "Awesome Screenshot"

2. **Mejores prácticas:**
   - Espera a que la página cargue completamente
   - Recorta solo el área relevante
   - Asegúrate de que el texto sea legible
   - Usa una resolución mínima de 1280x720

3. **Nombres de archivo:**
   - Usa EXACTAMENTE los nombres especificados
   - Guarda en formato PNG
   - Coloca todas las imágenes en `documentacion/manuales/imagenes/`

---

## Verificación

Después de tomar las capturas, verifica que:

- ✅ Todas las imágenes estén en la carpeta `imagenes/`
- ✅ Los nombres sean exactamente como se especificó
- ✅ Las imágenes se vean bien en los manuales

Para verificar, abre los archivos `.md` en un visor de Markdown o conviértelos a PDF.

---

**Última actualización:** Diciembre 2025

