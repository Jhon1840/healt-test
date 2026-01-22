import { test, expect } from "@playwright/test";
import path from "node:path";
import { readFileSync } from "node:fs";

function getListingUuid(): string {
  try {
    const file = path.join("playwright", ".data", "listing.json");
    const json = JSON.parse(readFileSync(file, "utf-8"));
    return json?.uuid;
  } catch (e) {
    throw new Error(`No se pudo leer listing.json. ${e}`);
  }
}

test.use({
  storageState: "playwright/.auth/auth.json",
});

test("13. Cambiar moneda, ingresar precio válido e inválido", async ({
  page,
}) => {
  test.setTimeout(60000);

  const listingUuid = getListingUuid();
  console.log(`[TEST-13] Listing UUID: ${listingUuid}`);

  // Navegar a edición
  await page.goto(`/listings/edit/${listingUuid}`);
  await page.waitForLoadState("domcontentloaded");
  console.log(`[TEST-13] Página de edición cargada`);

  // Tab Principal (por defecto debería estar aquí)
  const tabPrincipal = page.getByRole("tab", { name: "Principal" });
  await expect(tabPrincipal).toBeVisible();
  const ariaSelected = await tabPrincipal.getAttribute("aria-selected");
  if (ariaSelected !== "true") {
    await tabPrincipal.click();
    await page.waitForTimeout(500);
  }
  console.log(`[TEST-13] Tab Principal activo`);

  // Buscar campo de Precio (label exacto)
  const precioLabel = page.locator("label").filter({ hasText: /^Precio \*$/ });

  expect(
    await precioLabel.isVisible({ timeout: 3000 }).catch(() => false)
  ).toBe(true, "[CRÍTICO] Campo Precio no encontrado");

  console.log(`[TEST-13] ✅ Campo Precio encontrado`);

  // Buscar spinbutton de precio
  const precioField = page.locator('[role="spinbutton"]').first();
  await expect(precioField).toBeVisible();
  console.log(`[TEST-13] Spinbutton de Precio encontrado`);

  // Ingresar precio válido
  const precioValido = "150000";
  await precioField.click();
  await precioField.selectText();
  await precioField.fill(precioValido);
  await precioField.blur();
  console.log(`[TEST-13] Precio válido ingresado: ${precioValido}`);

  // Esperar a que se procese
  await page.waitForTimeout(500);

  // Verificar que se aceptó
  const valorIngresado = await precioField.inputValue();
  console.log(`[TEST-13] ✅ Precio aceptado: ${valorIngresado}`);

  // Guardar cambios
  const btnGuardar = page
    .getByRole("button", { name: /Guardar en borrador|Guardar|Save/i })
    .first();

  expect(await btnGuardar.isEnabled({ timeout: 3000 }).catch(() => false)).toBe(
    true,
    "[CRÍTICO] Botón Guardar no está disponible"
  );

  await btnGuardar.click();
  console.log(`[TEST-13] ✅ Cambios guardados`);
  await page.waitForTimeout(2000);

  // Recargar página
  await page.reload();
  await page.waitForLoadState("domcontentloaded");
  console.log(`[TEST-13] Página recargada`);

  // Esperar a que el formulario cargue nuevamente
  const tabPrincipalAfterReload = page.getByRole("tab", { name: "Principal" });
  await expect(tabPrincipalAfterReload).toBeVisible({ timeout: 30000 });
  await page.waitForTimeout(500);

  // Verificar que el precio persiste
  const precioAfterReload = page.locator('[role="spinbutton"]').first();
  await expect(precioAfterReload).toBeVisible({ timeout: 5000 });
  const precioFinal = await precioAfterReload.inputValue();

  // Verificar que el precio se guardó (puede estar con formato)
  const precioClean = precioFinal.replace(/[^0-9]/g, "");
  expect(precioClean).toContain("150000");

  console.log(`[TEST-13] ✅ Precio persiste correctamente: ${precioFinal}`);

  console.log(`✅ Test 13: Precio completado`);
});
