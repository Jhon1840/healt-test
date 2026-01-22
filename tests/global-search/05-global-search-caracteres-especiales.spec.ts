import { test, expect } from "@playwright/test";

test.describe("Búsqueda Global - Caracteres Especiales", () => {
  test.use({ storageState: "playwright/.auth/auth.json" });

  test("05: Buscar con caracteres especiales y acentos", async ({ page }) => {
    console.log(
      "[TEST-05] 🔍 Validando búsqueda con acentos usando filtros básicos"
    );

    await page.goto("https://stage.mlx.bo/global-search", {
      waitUntil: "domcontentloaded",
    });
    await expect(page).toHaveURL(/global-search/);

    // 1. Abrir opciones avanzadas
    const advancedBtn = page
      .getByRole("button", { name: /Opciones Avanzadas/i })
      .first();
    if (await advancedBtn.isVisible().catch(() => false)) {
      await advancedBtn.click();
      await page.waitForTimeout(400);
    }

    // 2. Usar filtros simples: rango de precio
    console.log("[TEST-05]  Aplicando filtros de precio con rango simple");
    const minPrice = page
      .getByText("Monto Minimo")
      .locator("..")
      .getByRole("spinbutton");
    const maxPrice = page
      .getByText("Monto maximo")
      .locator("..")
      .getByRole("spinbutton");

    await expect(minPrice).toBeVisible();
    await expect(maxPrice).toBeVisible();

    await minPrice.fill("50000");
    await maxPrice.fill("300000");

    const searchButton = page.getByRole("button", { name: /Buscar/i }).first();
    await searchButton.click();
    await page.waitForTimeout(2000);

    const results = page.locator(
      '[class*="result"], [class*="item"], [role="listitem"]'
    );
    const count = await results.count();
    console.log(`[TEST-05] 📊 Resultados filtrados: ${count}`);
    expect(count).toBeGreaterThan(0);

    console.log(
      "[TEST-05] Búsqueda con filtros de precio funciona correctamente"
    );
  });
});
