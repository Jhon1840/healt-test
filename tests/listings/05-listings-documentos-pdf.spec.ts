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

test("10. Subir PDF válido, seleccionar tipo y rechazar formatos inválidos", async ({
  page,
}) => {
  test.setTimeout(70000);

  const listingUuid = getListingUuid();
  console.log(`[TEST-10] Listing UUID: ${listingUuid}`);

  /* =====================================================
     1) Navegar a edición
     ===================================================== */
  await page.goto(`/listings/edit/${listingUuid}`);
  await page.waitForLoadState("domcontentloaded");
  console.log(`[TEST-10] Página de edición cargada`);

  /* =====================================================
     2) Tab Documentos
     ===================================================== */
  const tabDocumentos = page.getByRole("tab", { name: /Documentos/i });
  await expect(tabDocumentos).toBeVisible();
  await tabDocumentos.click();
  console.log(`[TEST-10] Tab Documentos seleccionado`);

  /* =====================================================
     Localizar INPUT REAL de documentos
     (NO hacer click en botones que abren el explorador)
     ===================================================== */
  const fileInput = page.locator('input[type="file"]').last();
  await expect(fileInput).toHaveCount(1);

  /* =====================================================
     CASO 1: PDF VÁLIDO
     ===================================================== */
  const pdfPath = path.join("tests", "fixtures", "test-document.pdf");
  console.log("[TEST-10] Inyectando PDF válido");
  await fileInput.setInputFiles(pdfPath);

  /* =====================================================
     Seleccionar TIPO (PrimeVue Select)
     ===================================================== */

  // 1) Abrir el combobox "Tipo" de la FILA del PDF recién subido
  const comboTipo = page
    .locator('tr:has-text("test-document.pdf")')
    .locator('[role="combobox"]');

  await expect(comboTipo).toBeVisible({ timeout: 5000 });
  await comboTipo.click();
  console.log("[TEST-10] Combobox Tipo abierto");

  // 2) Seleccionar opción EXACTA (sin regex)
  const opcionPlano = page.getByRole("option", {
    name: "Plano del lugar",
  });

  await expect(opcionPlano).toBeVisible({ timeout: 5000 });
  await opcionPlano.click();
  console.log("[TEST-10] Tipo seleccionado: Plano del lugar");

  /* =====================================================
     Guardar → dispara upload real
     ===================================================== */
  const btnGuardar = page
    .getByRole("button", { name: /Guardar en borrador|Guardar/i })
    .first();

  await expect(btnGuardar).toBeEnabled();
  await btnGuardar.click();
  console.log("[TEST-10] Guardar presionado");

  /* =====================================================
     Confirmación backend
     ===================================================== */
  const toastExito = page.locator(
    '.p-toast-message-content:has-text("Listing actualizado correctamente")',
  );

  await expect(toastExito).toBeVisible({ timeout: 10000 });
  console.log("[TEST-10] ✅ PDF válido guardado correctamente");

  await toastExito
    .locator("button.p-toast-close-button")
    .click()
    .catch(() => {});

  /* =====================================================
     CASO 2: ARCHIVO INVÁLIDO (TXT)
     ===================================================== */
  const txtPath = path.join("tests", "fixtures", "test-invalid.txt");
  console.log("[TEST-10] Inyectando TXT inválido");
  await fileInput.setInputFiles(txtPath);

  // Seleccionar tipo para el archivo inválido
  const comboTipoInvalido = page
    .locator('tr:has-text("test-invalid.txt")')
    .locator('[role="combobox"]');

  await expect(comboTipoInvalido).toBeVisible({ timeout: 5000 });
  await comboTipoInvalido.click();
  console.log("[TEST-10] Combobox Tipo (archivo inválido) abierto");

  const opcionCedula = page.getByRole("option", {
    name: "Avaluo",
  });

  await expect(opcionCedula).toBeVisible({ timeout: 5000 });
  await opcionCedula.click();
  console.log("[TEST-10] Tipo sepwdleccionado: Avaluo");

  const alertaError = page.locator("alert", {
    hasText: /Archivo inválido|Formato no permitido|Solo se permiten/i,
  });

  await btnGuardar.click();

  await expect(alertaError).toBeVisible({ timeout: 5000 });
  await expect(toastExito).toBeHidden({ timeout: 4000 });
  console.log("[TEST-10] ✅ TXT rechazado correctamente");
});
