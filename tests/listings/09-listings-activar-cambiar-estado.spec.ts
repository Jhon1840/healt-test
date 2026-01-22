import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import path from "node:path";
import { selectSmart } from "../helpers/form.helpers";

function getListingUuid(): string {
  const file = path.join("playwright", ".data", "listing.json");
  const json = JSON.parse(readFileSync(file, "utf-8"));
  return json.uuid;
}

test.use({ storageState: "playwright/.auth/auth.json" });

test("16: Activar listing - completar obligatorios y cambiar estado", async ({
  page,
}) => {
  test.setTimeout(180000);

  const listingUuid = getListingUuid();
  console.log(`[TEST-16] UUID: ${listingUuid}`);

  await page.goto(`/listings/edit/${listingUuid}`, {
    waitUntil: "networkidle",
  });
  await page.waitForTimeout(1000);

  console.log("[TEST-16] 📄 Página cargada, llenando formulario...");

  /* =================================================
     1) TÍTULO 
  ================================================= */
  console.log("[TEST-16] 1️⃣ Llenando TÍTULO");
  const tabDesc = page.getByRole("tab", { name: "Descripción" });
  if (await tabDesc.isVisible()) {
    await tabDesc.click();
    await page.waitForTimeout(500);

    const tituloField = page.getByPlaceholder("Título de la captación").first();
    if (await tituloField.isVisible().catch(() => false)) {
      await tituloField.fill(`Test ${Date.now()}`);
      console.log("[TEST-16] ✓ Título llenado");
    }

    // Volver a tab Principal
    await page.getByRole("tab", { name: "Principal" }).click();
    await page.waitForTimeout(500);
  }

  /* =================================================
     2) UBICACIÓN 
  ================================================= */
  console.log("[TEST-16] 2️⃣ Seteando UBICACIÓN");

  await selectSmart(page, "Departamento", "La Paz");
  console.log("[TEST-16] ✓ Departamento: La Paz");

  await selectSmart(page, "Provincia", "Murillo");
  console.log("[TEST-16] ✓ Provincia: Murillo");

  await selectSmart(page, "Ciudad", "La Paz");
  console.log("[TEST-16] ✓ Ciudad: La Paz");

  await selectSmart(page, "Zona", "Achumani");
  console.log("[TEST-16] ✓ Zona: Achumani");

  /* =================================================
     3) PROPIETARIO (Obligatorio)
  ================================================= */
  console.log("[TEST-16] 3️⃣ Agregando PROPIETARIO");

  // 1 Click en botón Propietario
  const btnPropietario = page.getByRole("button", { name: /^Propietario$/i });
  await expect(btnPropietario).toBeVisible();
  await btnPropietario.click();

  // 2 Esperar formulario
  const formPropietario = page.locator("div.grid.grid-cols-6", {
    hasText: "Nombre",
  });
  await expect(formPropietario).toBeVisible();

  // 3 Inputs (por LABEL, no por placeholder)
  const inputNombre = formPropietario
    .locator("div", { hasText: "Nombre" })
    .locator("input");

  const inputApellido = formPropietario
    .locator("div", { hasText: "Apellido" })
    .locator("input");

  const inputCorreo = formPropietario
    .locator("div", { hasText: "Correo" })
    .locator("input");

  const inputCelular = formPropietario
    .locator("div", { hasText: /Celular/i })
    .locator("input");

  // 4 Llenar datos
  await inputNombre.fill("Juan");
  await inputApellido.fill("Pérez");
  await inputCorreo.fill(`qa_${Date.now()}@test.com`);
  await inputCelular.fill("70000000");

  // 5 Confirmar (check verde)
  const btnConfirmar = formPropietario.locator("button.p-button-success");
  await expect(btnConfirmar).toBeVisible();
  await btnConfirmar.click();

  console.log("[TEST-16] ✓ Propietario agregado correctamente");

  /* =================================================
     4) CAMPOS ADICIONALES (Precio, Descripción, Área)
  ================================================= */
  console.log("[TEST-16] 4 Completando campos adicionales");

  // Precio
  const precioCampo = page
    .locator("input[type='text']")
    .filter({ has: page.locator("..") });
  const precioInput = page
    .locator("label")
    .filter({ hasText: /Precio/i })
    .locator("..")
    .locator("input")
    .first();
  if (await precioInput.isVisible().catch(() => false)) {
    await precioInput.fill("250000");
    console.log("[TEST-16] ✓ Precio: 250000");
  }

  // Área construcción
  const areaLabel = page.locator("label").filter({
    hasText: /Area Construcción|Construcción/i,
  });
  if (await areaLabel.isVisible().catch(() => false)) {
    const areaInput = areaLabel.locator("..").locator("input").first();
    await areaInput.fill("120");
    console.log("[TEST-16] ✓ Área: 120");
  }

  /* =================================================
     5) ESTADO → ACTIVA (Debe ser ÚLTIMO antes de guardar)
  ================================================= */
  console.log("[TEST-16] 5️⃣ Cambiando ESTADO a Activa");

  try {
    await selectSmart(page, "Estado", "Activa");
    console.log("[TEST-16] ✓ Estado: Activa");
  } catch (e) {
    console.warn("[TEST-16] ⚠️  Estado:", e.message);
  }

  /* =================================================
     6) GUARDAR
  ================================================= */
  console.log("[TEST-16] 6️⃣ Guardando...");

  const guardarBtn = page.locator('button[aria-label="Guardar"]');
  await guardarBtn.click();

  // Esperar respuesta del servidor
  await page
    .waitForResponse(
      (r) => r.url().includes("/listings") && r.status() === 200,
      { timeout: 30000 },
    )
    .catch(() => null);

  await page.waitForTimeout(2000);
  console.log("[TEST-16] ✓ Guardado");

  /* =================================================
     7) VALIDAR PERSISTENCIA - VERIFICACIÓN REAL
  ================================================= */
  console.log("[TEST-16] 7️⃣ Validando persistencia...");

  await page.reload({ waitUntil: "networkidle" });
  await page.waitForTimeout(1500);

  // Verificar que el estado se guardó como Activa
  const estadoFinal = page
    .locator("label")
    .filter({ hasText: /Estado/i })
    .locator("..")
    .getByRole("combobox")
    .first();

  const estadoValueFinal = await estadoFinal
    .getAttribute("aria-label")
    .catch(() => "");

  const estadoText = await estadoFinal
    .locator("..")
    .locator(".p-select-label")
    .innerText()
    .catch(() => "");

  console.log(`[TEST-16] Estado final (aria-label): ${estadoValueFinal}`);
  console.log(`[TEST-16] Estado final (innerText): ${estadoText}`);

  const esActiva =
    estadoValueFinal.toLowerCase().includes("activ") ||
    estadoText.toLowerCase().includes("activ");

  expect(
    esActiva,
    `[CRÍTICO] Estado final es "${estadoValueFinal || estadoText}"; se esperaba Activa.`,
  ).toBeTruthy();

  console.log("✅ [TEST-16] Listing ACTIVADO correctamente");
});
