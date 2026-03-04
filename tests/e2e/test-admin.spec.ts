import { test, expect, Page } from '@playwright/test';

const BASE = 'http://localhost:9002';
const EMAIL = 'admin@nauticastellamaris.com.ar';
const PASS  = 'UgJ6CgW!c5X#';

async function login(page: Page) {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  await page.fill('input[type="email"]', EMAIL);
  await page.fill('input[type="password"]', PASS);
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard', { timeout: 15000 });
  await page.waitForLoadState('networkidle');
}

async function shot(page: Page, name: string) {
  await page.screenshot({ path: `tests/screenshots/${name}.png`, fullPage: false });
}

test.describe('Admin – smoke test completo', () => {

  test('01 – Login', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    await shot(page, '01-login');
    await page.fill('input[type="email"]', EMAIL);
    await page.fill('input[type="password"]', PASS);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 15000 });
    await shot(page, '02-dashboard');
    await expect(page).toHaveURL(/dashboard/);
  });

  test('02 – Dashboard carga', async ({ page }) => {
    await login(page);
    await shot(page, '03-dashboard-content');
    await expect(page.locator('h1.font-headline').first()).toContainText('Dashboard');
  });

  test('03 – Tareas del Día', async ({ page }) => {
    await login(page);
    await page.goto(`${BASE}/today-tasks`);
    await page.waitForLoadState('networkidle');
    await shot(page, '04-today-tasks');
    await expect(page.locator('h1.font-headline').first()).toContainText('Tareas del Día');
  });

  test('04 – Tipos de Tareas lista', async ({ page }) => {
    await login(page);
    await page.goto(`${BASE}/tasks`);
    await page.waitForLoadState('networkidle');
    await shot(page, '05-tasks');
    await expect(page.locator('h1.font-headline').first()).toContainText('Tipos de Tareas');
  });

  test('05 – Crear tipo de tarea', async ({ page }) => {
    await login(page);
    await page.goto(`${BASE}/tasks`);
    await page.waitForLoadState('networkidle');

    await page.click('button:has-text("Crear Tarea")');
    await page.waitForSelector('[role="dialog"]', { timeout: 5000 });
    await shot(page, '06-task-dialog');

    await page.fill('#title', 'TEST Limpieza Casco');
    await page.fill('#description', 'Test auto');
    await page.fill('#duration', '60');
    await page.fill('#type', 'Mantenimiento');
    await shot(page, '07-task-form');

    await page.locator('[role="dialog"] button[type="submit"]').click();
    await page.waitForTimeout(2000);
    await shot(page, '08-task-saved');
    await expect(page.locator('text=TEST Limpieza Casco')).toBeVisible({ timeout: 8000 });
  });

  test('06 – Empleados lista', async ({ page }) => {
    await login(page);
    await page.goto(`${BASE}/employees`);
    await page.waitForLoadState('networkidle');
    await shot(page, '09-employees');
    await expect(page.locator('h1.font-headline').first()).toContainText('Empleados');
  });

  test('07 – Empleados – abrir dialog crear', async ({ page }) => {
    await login(page);
    await page.goto(`${BASE}/employees`);
    await page.waitForLoadState('networkidle');
    await shot(page, '10-employees-list');

    const createBtn = page.locator('button:has-text("Agregar"), button:has-text("Nuevo"), button:has-text("Crear")').first();
    if (await createBtn.isVisible({ timeout: 3000 })) {
      await createBtn.click();
      await page.waitForSelector('[role="dialog"]', { timeout: 5000 });
      await shot(page, '11-employee-dialog');
    } else {
      await shot(page, '11-employee-no-btn');
    }
  });

  test('08 – Clientes lista', async ({ page }) => {
    await login(page);
    await page.goto(`${BASE}/clients`);
    await page.waitForLoadState('networkidle');
    await shot(page, '12-clients');
    await expect(page.locator('h1.font-headline').first()).toContainText('Clientes');
  });

  test('09 – Crear cliente', async ({ page }) => {
    await login(page);
    await page.goto(`${BASE}/clients`);
    await page.waitForLoadState('networkidle');

    await page.click('button:has-text("Agregar Cliente")');
    await page.waitForSelector('[role="dialog"]', { timeout: 8000 });
    await shot(page, '13-client-dialog');

    const dialog = page.locator('[role="dialog"]');
    await dialog.locator('input').nth(0).fill('Juan');
    await dialog.locator('input').nth(1).fill('Testonini');
    await dialog.locator('input').nth(2).fill('20111222');
    await dialog.locator('input').nth(3).fill('11223344');
    await dialog.locator('input').nth(4).fill('juan.test.auto@example.com');
    await shot(page, '14-client-form');

    const saveBtn = dialog.locator('button:has-text("Guardar"), button[type="submit"]').last();
    await saveBtn.click();
    await page.waitForTimeout(3000);
    await shot(page, '15-client-saved');
  });

  test('10 – Asignar Tareas carga', async ({ page }) => {
    await login(page);
    await page.goto(`${BASE}/schedule`);
    await page.waitForLoadState('networkidle');
    await shot(page, '16-schedule');
    await expect(page.locator('h1.font-headline').first()).toContainText('Asignar Tareas');
  });

  test('11 – Configuración carga y header correcto', async ({ page }) => {
    await login(page);
    await page.goto(`${BASE}/settings`);
    await page.waitForLoadState('networkidle');
    await shot(page, '17-settings');
    await expect(page.locator('h1.font-headline').first()).toContainText('Configuración');
    // El header del sidebar también debe mostrar "Configuración" (bug corregido)
    await expect(page.locator('header h1').first()).toContainText('Configuración');
  });

  test('12 – Logout', async ({ page }) => {
    await login(page);
    await page.locator('button:has-text("Cerrar Sesión")').first().click();
    await page.waitForURL(`${BASE}/`, { timeout: 10000 });
    await shot(page, '18-logout');
    await expect(page).toHaveURL(BASE + '/');
  });

});
