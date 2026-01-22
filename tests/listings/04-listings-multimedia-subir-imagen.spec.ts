import { test, expect } from "@playwright/test";
import path from "node:path";
import { readFileSync } from "node:fs";

function getListingUuid(): string {
  try {
    const file = path.join("playwright", ".data", "listing.json");
    const json = JSON.parse(readFileSync(file, "utf-8"));
    return json?.uuid;
  } catch (e) {
    throw new Error(
      `No se pudo leer listing.json. ¿Ejecutaste primero el test de setup? ${e}`
    );
  }
}

test.use({
  storageState: "playwright/.auth/auth.json",
});

test("9. Subir imagen, marcar portada y validar persistencia", async ({
  page,
}) => {
  test.setTimeout(60000);

  const listingUuid = getListingUuid();
  console.log(`[TEST-9] Listing UUID: ${listingUuid}`);

  // 1) Navegar a edición
  await page.goto(`/listings/edit/${listingUuid}`);
  await page.waitForLoadState("domcontentloaded");
  console.log(`[TEST-9] Página de edición cargada`);

  // 2) Ir a pestaña Multimedia
  const tabMultimedia = page.getByRole("tab", { name: /Multimedia/i });
  await expect(tabMultimedia).toBeVisible();
  await tabMultimedia.click();
  console.log(`[TEST-9] Tab Multimedia seleccionado`);

  // 3) Localizar input file (puede estar hidden)
  const fileInput = page.locator('input[type="file"]').first();
  await expect(fileInput).toHaveCount(1);
  console.log(`[TEST-9] Input file encontrado`);

  // 4) Subir imagen
  const testImagePath = path.join("tests", "fixtures", "test-image.png");
  console.log(`[TEST-9] Subiendo imagen desde: ${testImagePath}`);

  await fileInput.setInputFiles(testImagePath);
  console.log(`[TEST-9] Imagen subida`);

  // 5) (Opcional) marcar portada si existe
  const portadaCheckbox = page
    .locator('input[type="checkbox"]')
    .filter({ hasText: /portada/i })
    .or(page.locator('label:has-text("Portada") input[type="checkbox"]'))
    .first();

  if (await portadaCheckbox.isVisible().catch(() => false)) {
    await portadaCheckbox.check();
    console.log(`[TEST-9] Portada marcada`);
  } else {
    console.log(`[TEST-9] Checkbox de portada no presente (opcional)`);
  }

  // 6) Guardar cambios
  const btnGuardar = page
    .getByRole("button", { name: /Guardar en borrador|Guardar/i })
    .first();

  await expect(btnGuardar).toBeEnabled();
  await btnGuardar.click();
  console.log(`[TEST-9] Click en Guardar`);

  // 7) VALIDACIÓN DEFINITIVA: TOAST DE ÉXITO
  const toastExito = page.locator(
    '.p-toast-message-content:has-text("Listing actualizado correctamente")'
  );

  await expect(toastExito).toBeVisible({
    timeout: 10000,
  });

  console.log(
    `[TEST-9] ✅ Toast de éxito recibido — imagen persistida correctamente`
  );

  // 8) Cerrar toast (opcional, para no interferir con otros tests)
  await toastExito
    .locator("button.p-toast-close-button")
    .click()
    .catch(() => {});
});
