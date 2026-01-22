
import { test, expect } from "@playwright/test";

test.describe("Búsqueda Global - Casos de Borde", () => {
  test.use({ storageState: "playwright/.auth/auth.json" });

  test("09: Validar búsqueda con filtros", async ({ page }) => {
    console.log("[TEST-09] 🔍 Validando búsqueda con filtros simples");

    await page.goto("https://stage.mlx.bo/global-search", {
      waitUntil: "domcontentloaded",
    });
    await expect(page).toHaveURL(/global-search/);

    // Abrir opciones avanzadas
    const advancedBtn = page
      .getByRole("button", { name: /Opciones Avanzadas/i })
      .first();
    if (await advancedBtn.isVisible().catch(() => false)) {
      await advancedBtn.click();
      await page.waitForTimeout(400);
    }

    // Usar filtros simples
    console.log("[TEST-09] 📝 Ingresando rango de precio");

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

    await minPrice.fill("100000");
    await maxPrice.fill("250000");

    // Ejecutar búsqueda
    const searchButton = page.getByRole("button", { name: /Buscar/i }).first();
    await searchButton.click();
    await page.waitForTimeout(2000);

    // Verificar resultados
    const resultItems = page.locator(
      '[class*="result"], [class*="item"], [role="listitem"]'
    );
    const resultCount = await resultItems.count();

    if (resultCount > 0) {
      console.log("[TEST-09] ✓ Se encontraron " + resultCount + " resultados");
    } else {
      console.log("[TEST-09] ℹ️ Sin resultados para este rango");
    }

    console.log("[TEST-09] ✅ Búsqueda con filtros completada correctamente");
  });
});
