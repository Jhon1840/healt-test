import { test, expect } from "@playwright/test";
import { fillPrimeVueCurrency, selectSmart } from "../helpers/form.helpers";

test.describe("Búsqueda Global - Filtros", () => {
  test.use({ storageState: "playwright/.auth/auth.json" });

  test("04: Aplicar filtros por rango de precio (PrimeVue InputNumber)", async ({
    page,
  }) => {
    console.log("[TEST-04] 🔍 Validando filtros por precio");

    await page.goto("https://stage.mlx.bo/global-search", {
      waitUntil: "domcontentloaded",
    });

    await expect(page).toHaveURL(/global-search/);

    /* =============================
         OPCIONES AVANZADAS
      ============================= */
    const advancedBtn = page.getByRole("button", {
      name: /Opciones Avanzadas/i,
    });

    if (await advancedBtn.isVisible().catch(() => false)) {
      await advancedBtn.click();
    }

    /* =============================
         FILTROS DE UBICACIÓN
      ============================= */

    await selectSmart(page, "Departamento", "Potosi");
    await selectSmart(page, "Provincia", "Tomás Frías");
    await selectSmart(page, "Ciudad", "Potosí");

    console.log(
      "[TEST-04] 📍 Ubicación seleccionada: Potosi → Tomás Frías → Potosí",
    );

    /* =============================
         RANGO DE PRECIO 
      ============================= */
    const minPrice = page
      .getByText(/Monto Minimo/i)
      .locator("..")
      .getByRole("spinbutton");

    const maxPrice = page
      .getByText(/Monto maximo/i)
      .locator("..")
      .getByRole("spinbutton");

    await expect(minPrice).toBeVisible();
    await expect(maxPrice).toBeVisible();

    await fillPrimeVueCurrency(minPrice, "100");
    await fillPrimeVueCurrency(maxPrice, "BOB 1000000");

    await expect(minPrice).not.toHaveAttribute("aria-valuenow", "0");
    await expect(maxPrice).not.toHaveAttribute("aria-valuenow", "0");

    /* =============================
         BUSCAR
      ============================= */
    const searchButton = page.getByRole("button", { name: /Buscar/i });
    await expect(searchButton).toBeEnabled();
    await searchButton.click();

    await page.waitForLoadState("networkidle").catch(() => {});

    /* =============================
         VALIDAR RESULTADOS
      ============================= */
    const listings = page.locator('a[href*="/marketanalysis/show?listing="]');

    await expect(listings.first()).toBeVisible({ timeout: 15000 });

    const count = await listings.count();
    console.log(`[TEST-04] 📊 Listings encontrados: ${count}`);
    expect(count).toBeGreaterThan(0);

    /* =============================
         VALIDAR PRECIOS EN RANGO
      ============================= */
    const priceElements = page.locator("h2.font-bold.text-lg");
    const priceCount = await priceElements.count();

    console.log(
      `[TEST-04] 💰 Validando ${priceCount} precios en rango 100.000 - 5.000.000 BOB`,
    );

    for (let i = 0; i < Math.min(priceCount, 5); i++) {
      const priceText = await priceElements.nth(i).textContent();
      if (!priceText) continue;

      const priceValue = parseInt(priceText.replace(/[^\d]/g, ""), 10);

      console.log(
        `[TEST-04] Precio ${i + 1}: ${priceText} → ${priceValue} BOB`,
      );

      expect(priceValue).toBeGreaterThanOrEqual(100_000);
      expect(priceValue).toBeLessThanOrEqual(5_000_000);
    }

    console.log(
      "[TEST-04] ✅ Todos los precios están dentro del rango esperado",
    );

    /* =============================
         LIMPIAR FILTROS
      ============================= */
    const clearButton = page.getByRole("button", { name: /Limpiar/i });
    await expect(clearButton).toBeVisible();
    await clearButton.click();

    await expect(minPrice).toHaveAttribute("aria-valuenow", "0");
    await expect(maxPrice).toHaveAttribute("aria-valuenow", "0");

    console.log(
      "[TEST-04] ✅ Filtros aplicados, validados y limpiados correctamente",
    );
  });
});
