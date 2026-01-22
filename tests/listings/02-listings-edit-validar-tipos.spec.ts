import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import path from "node:path";

function getListingUuid(): string {
  try {
    const file = path.join("playwright", ".data", "listing.json");
    const json = JSON.parse(readFileSync(file, "utf-8"));
    return json?.uuid;
  } catch (e) {
    throw new Error(
      `No se pudo leer listing.json. ¿Ejecutaste primero el test de setup? ${e}`,
    );
  }
}

test.use({
  storageState: "playwright/.auth/auth.json",
});

test("7. Validar rechazos de tipos de datos inválidos", async ({ page }) => {
  const listingUuid = getListingUuid();
  console.log(`[TEST-7] UUID leído: ${listingUuid}`);

  await page.goto(`/listings/edit/${listingUuid}`);
  await page.waitForLoadState("domcontentloaded");

  // Esperar a que el formulario cargue
  const tabPrincipal = page.getByRole("tab", { name: "Principal" });
  await expect(tabPrincipal).toBeVisible({ timeout: 30000 });
  await tabPrincipal.click();
  await page.waitForTimeout(1000);
  console.log("[TEST-7] Tab Principal cargado");

  // VALIDAR CAMPO NUMÉRICO: Precio (spinbutton)
  console.log("\n[TEST-7] Validando campo Precio...");

  const precioLabel = page.locator("label").filter({ hasText: /^Precio \*$/ });

  expect(await precioLabel.isVisible()).toBe(
    true,
    "[CRÍTICO] Label Precio no encontrado",
  );

  // Buscar el spinbutton más cercano al label Precio
  const precioField = page.locator('[role="spinbutton"]').first();

  expect(await precioField.isVisible()).toBe(
    true,
    "[CRÍTICO] Campo Precio (spinbutton) no encontrado",
  );

  const valorOriginal = await precioField.inputValue();
  console.log(`[TEST-7] ✅ Campo Precio encontrado: ${valorOriginal}`);

  // Intentar ingresar letras en campo numérico
  console.log(`[TEST-7] Intentando ingresar 'abcdef' en Precio...`);
  await precioField.fill("abcdef");
  await precioField.blur();
  await page.waitForTimeout(300);

  // Dar clic en Guardar para disparar validaciones
  const btnGuardar = page
    .getByRole("button", { name: /Guardar en borrador|Guardar|Save/i })
    .first();

  expect(await btnGuardar.isEnabled({ timeout: 3000 }).catch(() => false)).toBe(
    true,
    "[CRÍTICO] Botón Guardar no está disponible",
  );

  await btnGuardar.click();
  console.log("[TEST-7] Intentando guardar con texto en campo numérico...");

  // Esperar respuesta del servidor
  await page.waitForTimeout(2000);

  // Verificar el valor en el input después de guardar
  const valueAfterSave = await precioField.inputValue();
  console.log(
    `[TEST-7] Valor después de guardar 'abcdef': "${valueAfterSave}"`,
  );

  // El valor NO debe contener "abcdef"
  expect(valueAfterSave).not.toContain(
    "abcdef",
    " Campo Precio guardó letras inválidas,",
  );

  console.log(`[TEST-7] ✅ Campo Precio rechazó correctamente las letras`);

  // VALIDAR CAMPO URL: YouTube link en tab Multimedia
  console.log("\n[TEST-7] Validando campo URL de YouTube...");

  const tabMultimedia = page.getByRole("tab", { name: /multimedia/i });

  expect(await tabMultimedia.isVisible()).toBe(
    true,
    "[CRÍTICO] Tab Multimedia no encontrado",
  );

  await tabMultimedia.click();
  await page.waitForTimeout(1000);
  console.log("[TEST-7] ✅ Tab Multimedia cargado");

  const youtubeField = page
    .locator('input[placeholder*="Youtobe" i], input[placeholder*="Youtube" i]')
    .first();

  expect(await youtubeField.isVisible()).toBe(
    true,
    "[CRÍTICO] Campo de URL de YouTube no encontrado",
  );

  const placeholder = await youtubeField.getAttribute("placeholder");
  console.log(`[TEST-7] ✅ Campo encontrado: "${placeholder}"`);

  // Intentar ingresar URL inválida
  console.log(`[TEST-7] Intentando ingresar URL inválida...`);
  await youtubeField.fill("esto-no-es-una-url-valida");
  await youtubeField.blur();
  await page.waitForTimeout(300);

  // Guardar para disparar validación server y toast de error
  const btnGuardarMultimedia = page
    .getByRole("button", { name: /Guardar en borrador|Guardar|Save/i })
    .first();

  await btnGuardarMultimedia.click();
  console.log("[TEST-7] Intentando guardar con URL inválida...");

  // Esperar el toast de error específico
  const toastUrlInvalida = page.locator(
    '.p-toast-message-content:has-text("Debe ingresar un enlace de YouTube válido.")',
  );

  await expect(toastUrlInvalida).toBeVisible({ timeout: 5000 });
  console.log("[TEST-7] ✅ Toast de URL inválida mostrado");

  // Cerrar toast para no interferir con otros pasos
  await toastUrlInvalida
    .locator("button.p-toast-close-button")
    .click()
    .catch(() => {});

  // Limpiar campo
  await youtubeField.fill("");

  console.log("\n[TEST-7] Validación de tipos completada");
});
