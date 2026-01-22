
import { test, expect } from "@playwright/test";
import { fillPrimeVueCurrency } from "../helpers/form.helpers";

test.describe("Búsqueda Global - Performance", () => {
  test.use({ storageState: "playwright/.auth/auth.json" });

  test("06: Validar performance con búsquedas consecutivas", async ({
    page,
  }) => {
    console.log(
      "[TEST-06] 🔍 Validando performance con búsquedas consecutivas usando filtros"
    );

    await page.goto("https://stage.mlx.bo/global-search", {
      waitUntil: "domcontentloaded",
    });
    await expect(page).toHaveURL(/global-search/);

    // Abrir opciones avanzadas una vez
    const advancedBtn = page
      .getByRole("button", { name: /Opciones Avanzadas/i })
      .first();
    if (await advancedBtn.isVisible().catch(() => false)) {
      await advancedBtn.click();
      await page.waitForTimeout(400);
    }

    const performanceMetrics: Array<{ run: number; duration: number }> = [];

    // Ejecutar 3 búsquedas consecutivas con diferentes rangos de precio
    const priceRanges = [
      { min: "50000", max: "150000" },
      { min: "150000", max: "350000" },
      { min: "350000", max: "800000" },
    ];

    for (let i = 0; i < priceRanges.length; i++) {
      const range = priceRanges[i];
      console.log(
        `[TEST-06] 📍 Búsqueda ${i + 1} de ${priceRanges.length}: Rango ${
          range.min
        }-${range.max}`
      );

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

      // Limpiar y llenar nuevos valores
      await fillPrimeVueCurrency(minPrice, range.min);
      await fillPrimeVueCurrency(maxPrice, range.max);

      const startTime = Date.now();
      const searchButton = page
        .getByRole("button", { name: /Buscar/i })
        .first();
      await searchButton.click();

      await page.waitForTimeout(2000);

      const endTime = Date.now();
      const duration = endTime - startTime;
      performanceMetrics.push({ run: i + 1, duration });

      console.log(`[TEST-06] ⏱️ Búsqueda ${i + 1} completada en ${duration}ms`);

      const results = page.locator(
        '[class*="result"], [class*="item"], [role="listitem"]'
      );
      const count = await results.count();
      expect(count).toBeGreaterThan(0);
    }

    // Verificar que los tiempos son razonables (no deben ser > 10 segundos)
    const maxDuration = Math.max(...performanceMetrics.map((m) => m.duration));
    expect(maxDuration).toBeLessThan(10000);

    console.log(
      "[TEST-06] ✅ Todas las búsquedas completadas sin timeout excesivo"
    );
  });
});
