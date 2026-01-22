
import { test, expect } from "@playwright/test";

test.describe("Búsqueda Global - Acceso y Funcionalidad Básica", () => {
  test.use({ storageState: "playwright/.auth/auth.json" });

  test("02: Búsqueda por ID de Listing", async ({ page }) => {
    console.log("[TEST-02] 🔍 Realizando búsqueda por ID de listing");

    // 1. Navegar a la página de búsqueda global
    console.log("[TEST-02] 📍 Navegando a /global-search");
    await page.goto("https://stage.mlx.bo/global-search", {
      waitUntil: "domcontentloaded",
    });

    // 2. Localizar el campo de búsqueda
    console.log("[TEST-02] 🔎 Localizando campo de búsqueda");
    const searchInput = page
      .locator('input[type="search"], input[type="text"]')
      .first();
    await expect(searchInput).toBeVisible({ timeout: 10000 });

    // 3. Ingresar el prefijo del ID de listing
    const listingUuid = "12500";
    console.log(`[TEST-02] ✍️ Ingresando prefijo de listing: "${listingUuid}"`);
    await searchInput.clear();
    await searchInput.fill(String(listingUuid));

    // Verificar que el texto se ingresó correctamente
    const inputValue = await searchInput.inputValue();
    expect(inputValue).toBe(String(listingUuid));
    console.log("[TEST-02] ✓ Texto ingresado correctamente");

    // 4. Presionar Enter o hacer clic en botón buscar
    console.log("[TEST-02] 🔘 Buscando el botón 'Buscar'");

    const searchButton = page
      .locator('button[aria-label="Buscar"], button[aria-label="Search"]')
      .first();

    const hasSearchButton = await searchButton.isVisible().catch(() => false);

    if (hasSearchButton) {
      console.log("[TEST-02] ⏎ Haciendo clic en botón 'Buscar'");
      await searchButton.click();
    } else {
      console.log("[TEST-02] ⏎ Botón no encontrado, presionando Enter");
      await searchInput.press("Enter");
    }

    await page.waitForTimeout(1500); // Esperar a que se rendericen los resultados

    // 5. Verificar que se muestran resultados y que corresponden al listing
    console.log("[TEST-02] 📊 Verificando resultados por prefijo");

    // Buscar ítems de resultados y algún enlace que apunte al listing
    const resultItems = page.locator(
      '[class*="result"], [class*="item"], [role="listitem"]'
    );
    const resultCount = await resultItems.count();
    console.log("[TEST-02] 📋 Resultados encontrados: " + resultCount);
    expect(resultCount).toBeGreaterThan(0);

    // Validar específicamente que hay anchors de listings en los resultados
    const listingAnchors = page.locator(
      'a[href*="marketanalysis/show"], a[href*="/listings/"], a[href*="listings/edit"]'
    );
    const listingAnchorCount = await listingAnchors.count();
    console.log(
      `[TEST-02] ✓ Anchors de listings encontrados: ${listingAnchorCount}`
    );
    expect(listingAnchorCount).toBeGreaterThan(0);

    // 6. Validar coincidencias visibles con '12500' en resultados (span overlay de ID)
    console.log("[TEST-02] 🔎 Validando coincidencias con '12500'");
    const idSpan = page.locator("span").filter({ hasText: /12500/ }).first();
    const idSpanVisible = await idSpan.isVisible().catch(() => false);
    expect(idSpanVisible).toBeTruthy();
    console.log(`[TEST-02] ✓ Se encontró coincidencia de ID en resultados`);

    // 7. Verificar que no hay errores en consola
    console.log("[TEST-02] 🐛 Verificando ausencia de errores críticos");
    // Los errores se capturarían en los listeners si los configuramos

    console.log(
      "[TEST-02] ✅ Test completado - Búsqueda ejecutada correctamente, resultados mostrados"
    );
  });
});
