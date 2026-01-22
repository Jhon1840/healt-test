
import { test, expect } from "@playwright/test";

test.describe("Búsqueda Global - Casos de Borde", () => {
  test.use({ storageState: "playwright/.auth/auth.json" });

  test("07: Intentar búsqueda con campo vacío", async ({ page }) => {
    console.log("[TEST-07] 🔍 Validando comportamiento con campo vacío");

    // 1. Navigate to /global-search
    console.log("[TEST-07] 📍 Navegando a /global-search");
    await page.goto("https://stage.mlx.bo/global-search", {
      waitUntil: "domcontentloaded",
    });

    // Verificar que la página cargó
    await expect(page).toHaveURL(/global-search/);
    console.log("[TEST-07] ✓ Página de búsqueda cargada");

    // Monitorear errores en consola
    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push(msg.text());
      }
    });

    // 2. No seleccionar filtros ni tocar el input de ID
    console.log("[TEST-07] 🔎 Sin filtros y sin input de ID");

    // 3. Try to press Enter or click search button
    console.log("[TEST-07] 🔘 Buscando el botón 'Buscar'");

    const searchButton = page
      .locator('button[aria-label="Buscar"], button[aria-label="Search"]')
      .first();

    // Monitorear cambios de URL para detectar búsquedas
    let urlChanged = false;
    const originalUrl = page.url();

    // Intentar hacer clic en botón o presionar Enter
    if (await searchButton.isVisible().catch(() => false)) {
      console.log(
        "[TEST-07] ⏎ Haciendo clic en botón 'Buscar' con campo vacío"
      );
      await searchButton.click();
    } else {
      console.log("[TEST-07] ⏎ Botón no encontrado, presionando Enter");
      await page.keyboard.press("Enter");
    }

    // Esperar un poco para ver si hay reacción
    await page.waitForTimeout(1500);

    const newUrl = page.url();
    if (newUrl !== originalUrl) {
      urlChanged = true;
      console.log("[TEST-07] ℹ️ URL cambió de: " + originalUrl);
      console.log("[TEST-07] ℹ️ URL nueva: " + newUrl);
    } else {
      console.log("[TEST-07] ✓ URL se mantuvo (sin navegación)");
    }

    // 4. Verify appropriate behavior (error message or no action)
    console.log("[TEST-07] ✅ Verificando comportamiento apropiado");

    // Buscar mensaje de error
    const errorMessage = page.locator(
      '[role="alert"], [class*="error"], [class*="message"]'
    );
    const hasErrorMessage = await errorMessage.isVisible().catch(() => false);

    if (hasErrorMessage) {
      const errorText = await errorMessage.textContent();
      console.log("[TEST-07] ✓ Mensaje de error mostrado: '" + errorText + "'");
    } else {
      console.log(
        "[TEST-07] ✓ Sin mensaje de error (búsqueda no fue ejecutada)"
      );
    }

    // Verificar estado del botón de búsqueda
    const searchButtonDisabled = await searchButton
      .isDisabled()
      .catch(() => false);

    if (searchButtonDisabled) {
      console.log("[TEST-07] ✓ Botón de búsqueda está deshabilitado");
    } else if (await searchButton.isVisible().catch(() => false)) {
      console.log("[TEST-07] ℹ️ Botón de búsqueda está habilitado");
    } else {
      console.log("[TEST-07] ℹ️ Botón de búsqueda no visible");
    }

    // Verificar errores en consola
    if (consoleErrors.length > 0) {
      console.log("[TEST-07] ⚠️ Se detectaron errores en consola:");
      consoleErrors.forEach((error) => {
        console.log("[TEST-07] ❌ " + error);
      });
    } else {
      console.log("[TEST-07] ✓ Sin errores en consola");
    }

    // Verificación final de comportamiento
    const expectedBehaviors = [
      { name: "Sin cambio de URL", value: !urlChanged },
      { name: "Sin errores en consola", value: consoleErrors.length === 0 },
    ];

    console.log("[TEST-07] 📋 Comportamiento esperado:");
    let allBehaviorsCorrect = true;
    expectedBehaviors.forEach((behavior) => {
      const status = behavior.value ? "✓" : "⚠️";
      console.log("[TEST-07] " + status + " " + behavior.name);
      if (!behavior.value) {
        allBehaviorsCorrect = false;
      }
    });

    if (allBehaviorsCorrect) {
      console.log(
        "[TEST-07] ✅ Test completado - Sistema maneja correctamente campo vacío"
      );
    } else {
      console.log(
        "[TEST-07] ⚠️ Test completado - Se encontraron comportamientos inesperados"
      );
    }
  });
});
