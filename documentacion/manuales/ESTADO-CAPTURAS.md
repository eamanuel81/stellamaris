# Estado de las Capturas de Pantalla

**Última actualización:** Diciembre 2025

## ✅ Capturas Tomadas (13/25)

### Administrador (13/17)

- ✅ 09-login-admin.png
- ✅ 10-dashboard.png
- ✅ 11-tareas-dia-vista.png
- ✅ 12-formulario-asignar-general.png
- ✅ 13-busqueda-cliente.png
- ✅ 17-tipos-tareas-tabla.png
- ✅ 19-empleados-tabla.png
- ✅ 20-crear-empleado.png
- ✅ 21-clientes-tabla.png
- ✅ 22-crear-cliente-datos.png
- ✅ 23-crear-cliente-embarcaciones.png
- ✅ 24-crear-cliente-responsables.png
- ✅ 25-calendario-asignar.png

### Empleado (0/8)

- ⏳ 01-login-empleado.png
- ⏳ 02-mis-tareas-vista-general.png
- ⏳ 03-tarjeta-tarea-detalle.png
- ⏳ 04-menu-cambiar-estado.png
- ⏳ 05-detalles-tarea.png
- ⏳ 06-calendario-vista.png
- ⏳ 07-perfil-usuario.png
- ⏳ 08-notificaciones.png

## ⏳ Capturas Faltantes (12/25)

### Administrador (4 faltantes)

1. **14-busqueda-embarcacion.png**
   - **Cómo tomar:** 
     - Ir a Asignar Tarea
     - Seleccionar un cliente primero
     - Abrir búsqueda de embarcación
     - Mostrar lista de embarcaciones del cliente

2. **15-conflicto-horarios.png**
   - **Cómo tomar:**
     - Asignar una tarea a un empleado que ya tiene una tarea en el mismo horario
     - El diálogo de conflicto aparecerá automáticamente

3. **16-formulario-extras.png**
   - **Cómo tomar:**
     - Ir a Asignar Tarea
     - Seleccionar una tarea que tenga extras disponibles
     - Ir a la pestaña "Extras"
     - Mostrar lista de extras con cantidades

4. **18-crear-tipo-tarea.png**
   - **Cómo tomar:**
     - Ir a Tipos de Tareas
     - Clic en "Agregar Tarea"
     - Formulario completo abierto

### Empleado (8 faltantes)

Para tomar las capturas de empleado:

1. **Necesitas credenciales de empleado:**
   - Crea un empleado desde la sección de Empleados si no tienes uno
   - O usa una cuenta de empleado existente

2. **Usa el script:**
   ```bash
   cd documentacion/manuales
   # Edita tomar-capturas-empleado.js y agrega las credenciales
   node tomar-capturas-empleado.js
   ```

3. **O toma manualmente:**
   - Inicia sesión como empleado
   - Navega por las secciones según `INSTRUCCIONES-CAPTURAS.md`
   - Toma las capturas con los nombres especificados

## 📊 Progreso

- **Total:** 25 capturas
- **Completadas:** 13 capturas (52%)
- **Faltantes:** 12 capturas (48%)
  - 4 de administrador
  - 8 de empleado

## 🔧 Scripts Disponibles

### tomar-capturas.js
- **Estado:** ✅ Funcional
- **Ejecutado:** Sí
- **Resultado:** 13 capturas de administrador

### tomar-capturas-empleado.js
- **Estado:** ⏳ Pendiente de ejecución
- **Requisito:** Credenciales de empleado
- **Resultado esperado:** 8 capturas de empleado

## 📝 Notas

- Todas las referencias a imágenes ya están en los manuales
- Las imágenes aparecerán automáticamente cuando se agreguen
- Las capturas están en formato PNG
- Resolución: 1920x1080 (fullPage cuando aplica)

---

**Para actualizar este estado:** Ejecuta los scripts y actualiza este documento.


