import { test, expect } from "@playwright/test";
import path from "node:path";
import { readFileSync } from "node:fs";

function getListingUuid(): string {
  const file = path.join("playwright", ".data", "listing.json");
  const json = JSON.parse(readFileSync(file, "utf-8"));
  return json.uuid;
}

test.use({
  storageState: "playwright/.auth/auth.json",
});

test("12. Persistencia de amenidades CORE (Características Principales)", async ({
  page,
}) => {
  test.setTimeout(60000);

  const listingUuid = getListingUuid();
  console.log(`[TEST-12] Listing UUID: ${listingUuid}`);

  // 1. Navegar a edición
  await page.goto(`/listings/edit/${listingUuid}`);
  await page.waitForLoadState("domcontentloaded");

  // 2. Asegurar que estamos en el tab Principal
  const tabPrincipal = page.getByRole("tab", { name: /^Principal$/i });
  await expect(tabPrincipal).toHaveAttribute("aria-selected", "true");

  // 3. Localizar el bloque "Caracteristica Principales"
  const caracteristicasPrincipales = page
    .locator('label:has-text("Caracteristica Principales")')
    .locator("..");

  await expect(caracteristicasPrincipales).toBeVisible();

  // 4. Amenidades CORE a testear (IDs reales)
  const amenidades = [
    { id: "feature-2", nombre: "Terraza" },
    { id: "feature-3", nombre: "Balcon" },
    { id: "feature-5", nombre: "Piscina" },
  ];

  // 5. Marcar amenidades
  for (const amenidad of amenidades) {
    const checkbox = caracteristicasPrincipales.locator(`input#${amenidad.id}`);

    await expect(checkbox).toBeVisible();

    if (!(await checkbox.isChecked())) {
      await checkbox.check();
      console.log(`[TEST-12] Marcada: ${amenidad.nombre}`);
    }
  }

  // 6. Guardar
  const btnGuardar = page.getByRole("button", {
    name: /^Guardar$/,
  });

  await expect(btnGuardar).toBeEnabled();
  await btnGuardar.click();

  // Esperar guardado (backend + UI)
  await page.waitForTimeout(1500);

  // 7. Recargar página
  await page.reload();
  await page.waitForLoadState("domcontentloaded");

  // 8. Revalidar tab Principal
  await expect(tabPrincipal).toHaveAttribute("aria-selected", "true");

  // 9. Revalidar bloque
  await expect(caracteristicasPrincipales).toBeVisible();

  // 10. Verificar persistencia
  for (const amenidad of amenidades) {
    const checkbox = caracteristicasPrincipales.locator(`input#${amenidad.id}`);

    await expect(
      checkbox,
      `[CRÍTICO] Amenidad no persistió: ${amenidad.nombre}`
    ).toBeChecked();

    console.log(`[TEST-12] ✅ Persistió correctamente: ${amenidad.nombre}`);
  }

  console.log("✅ Test 12 completado: Amenidades CORE persistentes");
});
