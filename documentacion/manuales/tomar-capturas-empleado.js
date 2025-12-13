/**
 * Script para tomar capturas de pantalla del manual de empleado
 * 
 * NOTA: Necesitas tener una cuenta de empleado creada.
 * Si no tienes una, créala desde la sección de Empleados primero.
 * 
 * Ejecutar con: node tomar-capturas-empleado.js
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:9002';
const OUTPUT_DIR = path.join(__dirname, 'imagenes');

// Asegurar que el directorio existe
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// IMPORTANTE: Reemplaza estos valores con las credenciales de un empleado real
const EMPLOYEE_EMAIL = 'empleado@ejemplo.com'; // ⚠️ CAMBIAR ESTO
const EMPLOYEE_PASSWORD = 'password123'; // ⚠️ CAMBIAR ESTO

async function tomarCapturasEmpleado() {
  console.log('⚠️  IMPORTANTE: Asegúrate de haber actualizado EMPLOYEE_EMAIL y EMPLOYEE_PASSWORD en el script');
  console.log('Iniciando navegador...');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  try {
    // 1. Pantalla de Login Empleado
    console.log('1. Tomando captura de login empleado...');
    await page.goto(BASE_URL);
    await page.waitForTimeout(3000);
    
    await page.waitForSelector('input[type="email"], input[type="text"]', { timeout: 10000 });
    
    const emailInput = page.locator('input[type="email"]').first();
    if (await emailInput.count() === 0) {
      await page.fill('input[type="text"]', EMPLOYEE_EMAIL);
    } else {
      await emailInput.fill(EMPLOYEE_EMAIL);
    }
    
    await page.fill('input[type="password"]', EMPLOYEE_PASSWORD);
    
    // Seleccionar tipo Empleado (primer radio button)
    const radioButtons = page.locator('input[type="radio"]');
    const radioCount = await radioButtons.count();
    if (radioCount > 0) {
      await radioButtons.first().click();
    }
    
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(OUTPUT_DIR, '01-login-empleado.png'), fullPage: true });
    
    // Hacer login
    await page.click('button:has-text("Iniciar"), button:has-text("Ingresar"), button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(3000);

    // 2. Mis Tareas - Vista General
    console.log('2. Tomando captura de Mis Tareas...');
    await page.goto(`${BASE_URL}/my-tasks`);
    await page.waitForTimeout(3000);
    await page.screenshot({ path: path.join(OUTPUT_DIR, '02-mis-tareas-vista-general.png'), fullPage: true });

    // 3. Tarjeta de Tarea Detallada (hacer zoom en una tarjeta)
    console.log('3. Tomando captura de tarjeta de tarea...');
    // La captura anterior ya debería mostrar las tarjetas, pero tomamos una más específica
    await page.screenshot({ path: path.join(OUTPUT_DIR, '03-tarjeta-tarea-detalle.png'), fullPage: false });

    // 4. Menú Cambiar Estado
    console.log('4. Tomando captura de menú cambiar estado...');
    const cambiarEstadoBtn = page.locator('button:has-text("Cambiar Estado")');
    if (await cambiarEstadoBtn.count() > 0) {
      await cambiarEstadoBtn.first().click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: path.join(OUTPUT_DIR, '04-menu-cambiar-estado.png'), fullPage: true });
      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);
    }

    // 5. Diálogo Detalles de Tarea
    console.log('5. Tomando captura de detalles de tarea...');
    // Hacer clic en una tarjeta de tarea
    const taskCard = page.locator('[role="article"], .card, [class*="Card"]').first();
    if (await taskCard.count() > 0) {
      await taskCard.click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: path.join(OUTPUT_DIR, '05-detalles-tarea.png'), fullPage: true });
      await page.keyboard.press('Escape');
      await page.waitForTimeout(1000);
    }

    // 6. Vista Calendario
    console.log('6. Tomando captura del calendario...');
    await page.goto(`${BASE_URL}/my-calendar`);
    await page.waitForTimeout(3000);
    await page.screenshot({ path: path.join(OUTPUT_DIR, '06-calendario-vista.png'), fullPage: true });

    // 7. Perfil de Usuario
    console.log('7. Tomando captura del perfil...');
    await page.goto(`${BASE_URL}/my-tasks`);
    await page.waitForTimeout(2000);
    // Hacer clic en el avatar/perfil
    const avatarBtn = page.locator('button[aria-label*="menu" i], [role="button"]:has([class*="avatar" i])').first();
    if (await avatarBtn.count() > 0) {
      await avatarBtn.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: path.join(OUTPUT_DIR, '07-perfil-usuario.png'), fullPage: true });
      await page.keyboard.press('Escape');
    }

    // 8. Notificaciones
    console.log('8. Tomando captura de notificaciones...');
    const notifBtn = page.locator('button:has([aria-label*="notification" i]), button[aria-label*="Notificacione" i]');
    if (await notifBtn.count() > 0) {
      await notifBtn.click();
      await page.waitForTimeout(1500);
      await page.screenshot({ path: path.join(OUTPUT_DIR, '08-notificaciones.png'), fullPage: true });
      await page.keyboard.press('Escape');
    }

    console.log('✅ Todas las capturas de empleado han sido tomadas exitosamente!');
    console.log(`📁 Imágenes guardadas en: ${OUTPUT_DIR}`);

  } catch (error) {
    console.error('❌ Error al tomar capturas:', error);
  } finally {
    await browser.close();
  }
}

// Ejecutar
tomarCapturasEmpleado().catch(console.error);

