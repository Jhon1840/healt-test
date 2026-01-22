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

test("8. Validar valores permitidos", async ({ page }) => {
  const listingUuid = getListingUuid();
  console.log(`[TEST-8] UUID leído: ${listingUuid}`);

  console.log("[TEST-8] Navegando a formulario...");
  await page.goto(`/listings/edit/${listingUuid}`);
  await page.waitForLoadState("domcontentloaded");

  // Esperar a que el formulario cargue
  const tabPrincipal = page.getByRole("tab", { name: "Principal" });
  await expect(tabPrincipal).toBeVisible({ timeout: 30000 });
  await tabPrincipal.click();
  await page.waitForTimeout(1000);
  console.log("[TEST-8] Tab Principal cargado");

  // VALIDAR CAMPO PRECIO: No debe aceptar valores negativos
  console.log(
    "\n[TEST-8] Validando que campo Precio rechace valores negativos...",
  );

  const precioLabel = page.locator("label").filter({ hasText: /^Precio \*$/ });

  expect(await precioLabel.isVisible()).toBe(
    true,
    "[CRÍTICO] Label Precio no encontrado",
  );

  // Buscar el spinbutton más cercano al label Precio
  const precioField = page.locator('[role="spinbutton"]').first();

  expect(await precioField.isVisible()).toBe(
    true,
    "[CRÍTICO] Campo Precio (spinbutton) no encontrado o no visible",
  );

  const valorOriginal = await precioField.inputValue();
  console.log(`[TEST-8] ✅ Campo Precio encontrado: ${valorOriginal}`);

  // Intentar ingresar valor negativo
  console.log(`[TEST-8] Intentando ingresar -100 en Precio...`);
  await precioField.scrollIntoViewIfNeeded();
  await precioField.click();
  await page.waitForTimeout(300);
  await precioField.fill("-100");
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
  console.log("[TEST-8] Intentando guardar con valor negativo...");
  await page.waitForTimeout(2000);

  const valorDespues = await precioField.inputValue();
  console.log(`[TEST-8] Valor después de intentar -100: "${valorDespues}"`);

  // Extraer número del valor (ej: "-100 Bs" → -100)
  const numValue = parseFloat(valorDespues.replace(/[^0-9.-]/g, ""));

  // FALLA si el número guardado es negativo
  expect(numValue).toBeGreaterThanOrEqual(
    0,
    `[CRÍTICO] Campo Precio guardó valor negativo: ${valorDespues}`,
  );

  console.log(`[TEST-8] ✅ Campo Precio rechazó valor negativo correctamente`);
});
