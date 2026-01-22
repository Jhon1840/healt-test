import { test, expect } from "@playwright/test";
import { selectSmart } from "../helpers/form.helpers";
import { writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";

test.use({
  storageState: "playwright/.auth/auth.json",
});

test("1. setup: crear nueva captación hasta formulario de edición", async ({
  page,
}) => {
  test.setTimeout(60000);

  console.log("[SEED] 1. Navegando a /listings...");
  // 1. Ir a la página de listings
  await page.goto("/listings");
  await page.waitForLoadState("domcontentloaded");
  console.log("[SEED] Página cargada");

  console.log("[SEED] 2. Buscando botón Nueva Captación...");
  // 2. Click en botón "Nueva Captación"
  const btnNuevaCaptacion = page.getByRole("button", {
    name: "Nueva Captación",
  });
  await expect(btnNuevaCaptacion).toBeVisible();
  console.log("[SEED] Botón encontrado, haciendo click...");
  await btnNuevaCaptacion.click();

  console.log("[SEED] 3. Esperando modal...");
  // 3. Esperar que se abra el modal
  const dialog = page.getByRole("dialog", { name: "Nueva Captación" });
  await expect(dialog).toBeVisible();
  console.log("[SEED] Modal abierto");

  // Esperar a que el contenido del modal cargue completamente
  await page.waitForTimeout(1000);

  console.log("[SEED] 4. Llenando formulario del modal...");
  // 4. Llenar el formulario del modal
  // Seleccionar Segmento del mercado: COM está seleccionado por defecto
  // Si quieres RES, puedes hacer:
  // await page.getByLabel("RES").check();

  // Seleccionar Tipo de transacción (por defecto está "Alquiler")
  console.log("[SEED] Seleccionando Venta...");
  await page.getByLabel("Venta", { exact: true }).check();

  console.log("[SEED] Seleccionando Tipo de Propiedad: Casa...");
  // Seleccionar Tipo de Propiedad
  await selectSmart(page, "Tipo de Propiedad", "Casa");

  console.log("[SEED] 5. Haciendo click en Siguiente...");
  // 5. Click en botón "Siguiente"
  const btnSiguiente = page.getByRole("button", { name: "Siguiente" });
  await expect(btnSiguiente).toBeEnabled();
  await btnSiguiente.click();
  console.log("[SEED] Click en Siguiente, esperando navegación...");

  // Esperar navegación a /listings/edit/:uuid
  await page.waitForURL(/\/listings\/edit\/[0-9a-fA-F-]{36}$/, {
    timeout: 15000,
  });
  console.log(`[SEED] Navegado a: ${page.url()}`);

  console.log("[SEED] 6. Verificando tab Principal...");
  // 6. Verificar que el tab Principal está visible (esto confirma que el form cargó)
  const tabPrincipal = page.getByRole("tab", { name: "Principal" });
  await expect(tabPrincipal).toBeVisible({ timeout: 30000 });
  await expect(tabPrincipal).toHaveAttribute("aria-selected", "true");

  // 7. Guardar UUID del listing para reutilizar en otros tests
  const currentUrl = page.url();
  const uuidMatch = currentUrl.match(/\/listings\/edit\/([a-f0-9-]+)/);
  if (uuidMatch) {
    const listingUuid = uuidMatch[1];
    const dataDir = path.join("playwright", ".data");
    try {
      mkdirSync(dataDir, { recursive: true });
      writeFileSync(
        path.join(dataDir, "listing.json"),
        JSON.stringify({ uuid: listingUuid, url: currentUrl }, null, 2),
        "utf-8"
      );
      console.log(`✅ Listing UUID guardado: ${listingUuid}`);
    } catch (e) {
      console.warn("No se pudo guardar listing.json:", e);
    }
  }
});
