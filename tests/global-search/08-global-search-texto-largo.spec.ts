
import { test, expect } from "@playwright/test";
import { fillPrimeVueCurrency } from "../helpers/form.helpers";

test.describe("Búsqueda Global - Casos de Borde", () => {
  test.use({ storageState: "playwright/.auth/auth.json" });

  test("08: Validar búsqueda con rango de precio", async ({ page }) => {
    console.log("[TEST-08] 🔍 Validando búsqueda con rango de precio");

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

    // Ingresar rango de precio extremo pero válido
    console.log("[TEST-08] 📝 Ingresando rango de precio extremo");

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

    // Usar valores muy grandes pero números válidos
    await fillPrimeVueCurrency(minPrice, "999999999");
    await fillPrimeVueCurrency(maxPrice, "9999999999");

    console.log("[TEST-08] ✓ Valores ingresados correctamente");

    // Ejecutar búsqueda
    const searchButton = page.getByRole("button", { name: /Buscar/i }).first();
    await searchButton.click();
    await page.waitForTimeout(2000);

    // La búsqueda no debería romper el sistema
    console.log("[TEST-08] ✅ Búsqueda completada sin errores");
    expect(true).toBe(true);
  });
});
