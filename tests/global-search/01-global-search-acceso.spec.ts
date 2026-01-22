
import { test, expect } from "@playwright/test";

test.describe("Búsqueda Global - Acceso y Funcionalidad Básica", () => {
  test.use({ storageState: "playwright/.auth/auth.json" });

  test("01: Verificar acceso y carga de página de búsqueda", async ({
    page,
  }) => {
    console.log("[TEST-01] 🔍 Verificando acceso a búsqueda global");

    // 1. Navegar a la página de búsqueda global
    console.log("[TEST-01] 📍 Navegando a /global-search");
    await page.goto("https://stage.mlx.bo/global-search", {
      waitUntil: "domcontentloaded",
    });

    // 2. Verificar que la página carga correctamente
    console.log("[TEST-01] ✅ Verificando carga de página");
    await expect(page).toHaveURL(/global-search/);
    console.log("[TEST-01] ✓ URL correcta: /global-search");

    // 3. Verificar presencia del campo de búsqueda principal
    console.log(
      "[TEST-01] 🔎 Verificando presencia del campo de búsqueda principal"
    );

    // Buscar campo de búsqueda usando diferentes selectores posibles
    const searchInput = page
      .locator('input[type="search"], input[type="text"]')
      .first();

    await expect(searchInput).toBeVisible({ timeout: 10000 });
    console.log("[TEST-01] ✓ Campo de búsqueda visible");

    // 4. Verificar que el campo está activo (habilitado)
    await expect(searchInput).toBeEnabled();
    console.log("[TEST-01] ✓ Campo de búsqueda activo y habilitado");

    // 5. Verificar que se puede hacer focus en el campo
    await searchInput.focus();
    await expect(searchInput).toBeFocused();
    console.log("[TEST-01] ✓ Campo de búsqueda acepta focus");

    console.log(
      "[TEST-01] ✅ Test completado - Página carga correctamente y campo de búsqueda está disponible"
    );
  });
});
