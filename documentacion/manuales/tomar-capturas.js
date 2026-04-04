/**
 * Script para tomar capturas de pantalla del sistema Stella Maris Manager
 *
 * Credenciales: definí DEV_ADMIN_EMAIL y DEV_ADMIN_PASSWORD en el .env de la raíz del proyecto.
 *
 * Ejecutar con: node tomar-capturas.js
 *
 * Requiere: npm install playwright
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

const BASE_URL = 'http://localhost:9002';
const OUTPUT_DIR = path.join(__dirname, 'imagenes');
const ADMIN_EMAIL = process.env.DEV_ADMIN_EMAIL || '';
const ADMIN_PASSWORD = process.env.DEV_ADMIN_PASSWORD || '';

// Asegurar que el directorio existe
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function tomarCapturas() {
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    console.error(
      'Faltan DEV_ADMIN_EMAIL y/o DEV_ADMIN_PASSWORD en .env (raíz del proyecto). Ver .env.example.'
    );
    process.exit(1);
  }

  console.log('Iniciando navegador...');
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  try {
    // 1. Pantalla de Login Administrador
    console.log('1. Tomando captura de login administrador...');
    await page.goto(BASE_URL);
    await page.waitForTimeout(3000);
    
    // Esperar a que los campos estén visibles
    await page.waitForSelector('input[type="email"], input[type="text"]', { timeout: 10000 });
    
    // Llenar email
    const emailInput = page.locator('input[type="email"]').first();
    if (await emailInput.count() === 0) {
      // Intentar con input type text si no hay email
      await page.fill('input[type="text"]', ADMIN_EMAIL);
    } else {
      await emailInput.fill(ADMIN_EMAIL);
    }
    
    // Llenar password
    await page.fill('input[type="password"]', ADMIN_PASSWORD);
    
    // Seleccionar tipo Administrador si hay radio buttons
    const radioButtons = page.locator('input[type="radio"]');
    const radioCount = await radioButtons.count();
    if (radioCount > 0) {
      // Buscar el radio button de administrador (generalmente el segundo)
      await radioButtons.nth(1).click();
    }
    
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(OUTPUT_DIR, '09-login-admin.png'), fullPage: true });
    
    // Hacer login
    await page.click('button:has-text("Iniciar"), button:has-text("Ingresar"), button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(3000);

    // 2. Dashboard
    console.log('2. Tomando captura del dashboard...');
    await page.goto(`${BASE_URL}/dashboard`);
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(OUTPUT_DIR, '10-dashboard.png'), fullPage: true });

    // 3. Tareas del Día
    console.log('3. Tomando captura de Tareas del Día...');
    await page.goto(`${BASE_URL}/today-tasks`);
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(OUTPUT_DIR, '11-tareas-dia-vista.png'), fullPage: true });

    // 4. Formulario Asignar Tarea
    console.log('4. Tomando captura del formulario de asignar tarea...');
    await page.goto(`${BASE_URL}/today-tasks`);
    await page.waitForTimeout(3000);
    const asignarButton = page.locator('button:has-text("Asignar"), button:has-text("Asignar Tarea")');
    const buttonCount = await asignarButton.count();
    if (buttonCount > 0) {
      await asignarButton.first().click();
      await page.waitForTimeout(3000);
      // Esperar a que el diálogo esté visible
      await page.waitForSelector('[role="dialog"]', { timeout: 10000 }).catch(() => {});
      await page.screenshot({ path: path.join(OUTPUT_DIR, '12-formulario-asignar-general.png'), fullPage: true });
      
      // Tomar captura de búsqueda de cliente
      try {
        const buscarClienteBtn = page.locator('button:has-text("Buscar cliente"), button[aria-label*="cliente" i]');
        if (await buscarClienteBtn.count() > 0) {
          await buscarClienteBtn.first().click();
          await page.waitForTimeout(2000);
          // Escribir algo para mostrar resultados
          const clienteInput = page.locator('input[placeholder*="cliente" i], input[type="text"]').last();
          if (await clienteInput.count() > 0) {
            await clienteInput.fill('a');
            await page.waitForTimeout(1000);
          }
          await page.screenshot({ path: path.join(OUTPUT_DIR, '13-busqueda-cliente.png'), fullPage: true });
          await page.keyboard.press('Escape'); // Cerrar búsqueda
          await page.waitForTimeout(500);
        }
      } catch (e) {
        console.log('No se pudo tomar captura de búsqueda de cliente:', e.message);
      }
      
      // Intentar tomar captura de extras si la tarea tiene
      try {
        const extrasTab = page.locator('button[role="tab"]:has-text("Extras")');
        if (await extrasTab.count() > 0) {
          await extrasTab.click();
          await page.waitForTimeout(1000);
          await page.screenshot({ path: path.join(OUTPUT_DIR, '16-formulario-extras.png'), fullPage: true });
        }
      } catch (e) {
        console.log('No hay pestaña de extras disponible');
      }
      
      await page.keyboard.press('Escape'); // Cerrar formulario
      await page.waitForTimeout(1000);
    }

    // 5. Tipos de Tareas
    console.log('5. Tomando captura de Tipos de Tareas...');
    await page.goto(`${BASE_URL}/tasks`);
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(OUTPUT_DIR, '17-tipos-tareas-tabla.png'), fullPage: true });

    // 6. Formulario Crear Tipo de Tarea
    console.log('6. Tomando captura del formulario crear tipo de tarea...');
    await page.goto(`${BASE_URL}/tasks`);
    await page.waitForTimeout(2000);
    const agregarTareaButton = page.locator('button:has-text("Agregar"), button:has-text("Agregar Tarea")');
    if (await agregarTareaButton.count() > 0) {
      await agregarTareaButton.first().click();
      await page.waitForTimeout(2000);
      await page.waitForSelector('[role="dialog"]', { timeout: 5000 }).catch(() => {});
      await page.screenshot({ path: path.join(OUTPUT_DIR, '18-crear-tipo-tarea.png'), fullPage: true });
      await page.keyboard.press('Escape');
      await page.waitForTimeout(1000);
    }

    // 7. Empleados
    console.log('7. Tomando captura de Empleados...');
    await page.goto(`${BASE_URL}/employees`);
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(OUTPUT_DIR, '19-empleados-tabla.png'), fullPage: true });

    // 8. Formulario Crear Empleado
    console.log('8. Tomando captura del formulario crear empleado...');
    const agregarEmpleadoButton = page.locator('button:has-text("Agregar Empleado")');
    if (await agregarEmpleadoButton.count() > 0) {
      await agregarEmpleadoButton.click();
      await page.waitForTimeout(1500);
      await page.screenshot({ path: path.join(OUTPUT_DIR, '20-crear-empleado.png'), fullPage: true });
      await page.keyboard.press('Escape');
    }

    // 9. Clientes
    console.log('9. Tomando captura de Clientes...');
    await page.goto(`${BASE_URL}/clients`);
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(OUTPUT_DIR, '21-clientes-tabla.png'), fullPage: true });

    // 10. Formulario Crear Cliente
    console.log('10. Tomando captura del formulario crear cliente...');
    const agregarClienteButton = page.locator('button:has-text("Agregar Cliente")');
    if (await agregarClienteButton.count() > 0) {
      await agregarClienteButton.click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: path.join(OUTPUT_DIR, '22-crear-cliente-datos.png'), fullPage: true });
      // Scroll para ver embarcaciones
      await page.evaluate(() => window.scrollTo(0, 400));
      await page.waitForTimeout(500);
      await page.screenshot({ path: path.join(OUTPUT_DIR, '23-crear-cliente-embarcaciones.png'), fullPage: true });
      // Scroll para ver responsables
      await page.evaluate(() => window.scrollTo(0, 800));
      await page.waitForTimeout(500);
      await page.screenshot({ path: path.join(OUTPUT_DIR, '24-crear-cliente-responsables.png'), fullPage: true });
      await page.keyboard.press('Escape');
    }

    // 11. Calendario Asignar Tareas
    console.log('11. Tomando captura del calendario de asignar tareas...');
    await page.goto(`${BASE_URL}/schedule`);
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(OUTPUT_DIR, '25-calendario-asignar.png'), fullPage: true });

    // Capturas adicionales que requieren interacción específica
    console.log('12. Tomando captura de búsqueda de embarcación...');
    await page.goto(`${BASE_URL}/today-tasks`);
    await page.waitForTimeout(2000);
    const asignarBtn2 = page.locator('button:has-text("Asignar"), button:has-text("Asignar Tarea")');
    if (await asignarBtn2.count() > 0) {
      await asignarBtn2.first().click();
      await page.waitForTimeout(3000);
      // Seleccionar un cliente primero
      try {
        const clienteBtn = page.locator('button:has-text("Buscar cliente")');
        if (await clienteBtn.count() > 0) {
          await clienteBtn.first().click();
          await page.waitForTimeout(1000);
          // Seleccionar el primer cliente disponible
          const primerCliente = page.locator('div[role="option"], div:has-text("manuel")').first();
          if (await primerCliente.count() > 0) {
            await primerCliente.click();
            await page.waitForTimeout(1500);
            // Ahora buscar embarcación
            const buscarEmbarcacionBtn = page.locator('button:has-text("Buscar embarcación")');
            if (await buscarEmbarcacionBtn.count() > 0) {
              await buscarEmbarcacionBtn.first().click();
              await page.waitForTimeout(1500);
              await page.screenshot({ path: path.join(OUTPUT_DIR, '14-busqueda-embarcacion.png'), fullPage: true });
            }
          }
        }
      } catch (e) {
        console.log('No se pudo tomar captura de búsqueda de embarcación:', e.message);
      }
      await page.keyboard.press('Escape');
      await page.waitForTimeout(1000);
    }

    console.log('✅ Todas las capturas han sido tomadas exitosamente!');
    console.log(`📁 Imágenes guardadas en: ${OUTPUT_DIR}`);

  } catch (error) {
    console.error('❌ Error al tomar capturas:', error);
  } finally {
    await browser.close();
  }
}

// Ejecutar
tomarCapturas().catch(console.error);

