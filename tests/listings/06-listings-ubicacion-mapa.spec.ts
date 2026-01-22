import { test, expect } from "@playwright/test";
import path from "node:path";
import { readFileSync } from "node:fs";

function getListingUuid(): string {
  const file = path.join("playwright", ".data", "listing.json");
  return JSON.parse(readFileSync(file, "utf-8")).uuid;
}

test.use({ storageState: "playwright/.auth/auth.json" });

test("11. Mover pin del mapa y validar que lat/lng se actualicen", async ({
  page,
}) => {
  const uuid = getListingUuid();

  await page.goto(`/listings/edit/${uuid}`, {
    waitUntil: "domcontentloaded",
  });

  console.log("[TEST-11] Página de edición cargada");

  const spinButtons = page.locator('input[role="spinbutton"]');
  await expect(spinButtons).toHaveCount(16, { timeout: 10_000 });

  const latInput = spinButtons.nth(14);
  const lngInput = spinButtons.nth(15);

  await expect(latInput).toBeVisible();
  await expect(lngInput).toBeVisible();

  console.log("[TEST-11] Inputs Lat/Lng localizados");

  // Leer coordenadas iniciales
  const latInicial = await latInput.inputValue();
  const lngInicial = await lngInput.inputValue();

  console.log(
    `[TEST-11] Coordenadas iniciales: LAT=${latInicial} LNG=${lngInicial}`,
  );

  // ==========================================================
  // Arrastrar el pin del mapa a una nueva posición
  // ==========================================================
  const mapMarker = page.locator(
    ".leaflet-marker-icon.leaflet-marker-draggable",
  );
  await expect(mapMarker).toBeVisible({ timeout: 5000 });

  console.log("[TEST-11] Arrastrando pin del mapa...");

  // Arrastrar el pin 100px a la derecha y 50px abajo
  const markerBox = await mapMarker.boundingBox();
  if (markerBox) {
    await page.mouse.move(
      markerBox.x + markerBox.width / 2,
      markerBox.y + markerBox.height / 2,
    );
    await page.mouse.down();
    await page.mouse.move(
      markerBox.x + markerBox.width / 2 + 100,
      markerBox.y + markerBox.height / 2 + 50,
      { steps: 10 },
    );
    await page.mouse.up();
  }

  console.log("[TEST-11] Pin arrastrado");

  // Esperar a que los inputs se actualicen
  await page.waitForTimeout(1500);

  // ==========================================================
  // Verificar que lat/lng cambiaron en los inputs
  // ==========================================================
  const latDespues = await latInput.inputValue();
  const lngDespues = await lngInput.inputValue();

  console.log(
    `[TEST-11] Coordenadas después de arrastrar: LAT=${latDespues} LNG=${lngDespues}`,
  );

  expect(latDespues).not.toBe(
    latInicial,
    "[CRÍTICO] Latitud no cambió al arrastrar el pin",
  );

  expect(lngDespues).not.toBe(
    lngInicial,
    "[CRÍTICO] Longitud no cambió al arrastrar el pin",
  );

  console.log("[TEST-11] ✅ Coordenadas actualizadas correctamente");

  // ==========================================================
  // Guardar
  // ==========================================================
  const saveButton = page.getByRole("button", {
    name: /Guardar en borrador/i,
  });
  await expect(saveButton).toBeEnabled();

  await Promise.all([
    page.waitForResponse((r) => r.status() === 200),
    saveButton.click(),
  ]);

  console.log("[TEST-11] Guardado confirmado");

  // ==========================================================
  // Recargar y validar persistencia
  // ==========================================================
  await page.reload({ waitUntil: "domcontentloaded" });

  await expect(latInput).toBeVisible();
  await expect(lngInput).toBeVisible();

  const latFinal = await latInput.inputValue();
  const lngFinal = await lngInput.inputValue();

  console.log(
    `[TEST-11] Coordenadas persistidas: LAT=${latFinal} LNG=${lngFinal}`,
  );

  expect(latFinal).toBe(latDespues);
  expect(lngFinal).toBe(lngDespues);

  console.log("[TEST-11] ✅ Coordenadas persisten correctamente");
});
