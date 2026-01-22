import { test, expect } from "@playwright/test";

test.describe("Búsqueda Global - Filtro por Mapa (polígonos)", () => {
  test.use({ storageState: "playwright/.auth/auth.json" });

  test("Polígono pequeño devuelve menos listings que uno grande", async ({
    page,
  }) => {
    console.log("[TEST-MAP] 🗺️ Validando filtro por área");

    await page.goto("https://stage.mlx.bo/global-search", {
      waitUntil: "domcontentloaded",
    });

    /* =============================
       ACTIVAR MODO "DIBUJAR EN MAPA"
       (OPCIÓN 1: click directo al input)
    ============================= */
    const drawOnMapRadio = page.locator(
      'input[type="radio"][name="map"][value="1"]',
    );

    await drawOnMapRadio.check({ force: true });
    await expect(drawOnMapRadio).toBeChecked();

    /* =============================
       ACTIVAR HERRAMIENTA POLÍGONO
    ============================= */
    await page.locator(".leaflet-draw-draw-polygon").click();

    const map = page.locator("#leafletMap");
    await expect(map).toBeVisible();

    const box = await map.boundingBox();
    if (!box) throw new Error("Mapa sin bounding box");

    const cx = box.x + box.width / 2;
    const cy = box.y + box.height / 2;

    /* =============================
       POLÍGONO GRANDE
    ============================= */
    await page.mouse.click(cx - 120, cy - 120);
    await page.mouse.click(cx + 120, cy - 120);
    await page.mouse.click(cx + 120, cy + 120);
    await page.mouse.click(cx - 120, cy + 120);
    await page.mouse.dblclick(cx - 120, cy - 120);

    await page.waitForTimeout(600);

    await page.getByRole("button", { name: /Buscar/i }).click();
    await page.waitForTimeout(15000);

    const listings = page.locator('a[href*="/marketanalysis/show?listing="]');

    const countGrande = await listings.count();
    console.log(`📊 Polígono GRANDE: ${countGrande} listings`);
    expect(countGrande).toBeGreaterThan(0);

    /* =============================
       RESET LIMPIO
    ============================= */
    await page.reload({ waitUntil: "domcontentloaded" });

    /* =============================
       REACTIVAR MODO MAPA
    ============================= */
    const drawOnMapRadio2 = page.locator(
      'input[type="radio"][name="map"][value="1"]',
    );

    await drawOnMapRadio2.check({ force: true });
    await expect(drawOnMapRadio2).toBeChecked();

    await page.locator(".leaflet-draw-draw-polygon").click();

    const map2 = page.locator("#leafletMap");
    await expect(map2).toBeVisible();

    const box2 = await map2.boundingBox();
    if (!box2) throw new Error("Mapa sin bounding box");

    const cx2 = box2.x + box2.width / 2;
    const cy2 = box2.y + box2.height / 2;

    /* =============================
       POLÍGONO PEQUEÑO
    ============================= */
    await page.mouse.click(cx2 - 40, cy2 - 40);
    await page.mouse.click(cx2 + 40, cy2 - 40);
    await page.mouse.click(cx2 + 40, cy2 + 40);
    await page.mouse.click(cx2 - 40, cy2 + 40);
    await page.mouse.dblclick(cx2 - 40, cy2 - 40);

    await page.waitForTimeout(600);

    await page.getByRole("button", { name: /Buscar/i }).click();
    await page.waitForTimeout(15000);

    const countPequeno = await listings.count();
    console.log(`📉 Polígono PEQUEÑO: ${countPequeno} listings`);

    /* =============================
       ASSERT FINAL
    ============================= */
    expect(countPequeno).toBeLessThan(countGrande);

    console.log("✅ Polígono pequeño devuelve menos listings que el grande");
  });
});
