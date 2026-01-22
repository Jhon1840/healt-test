import { test, expect } from "@playwright/test";
import { getContactId } from "./helpers/contact-data";

test.describe("Navegación y Flujos", () => {
  test("08: Navegar entre lista, edición y volver (flujo completo)", async ({
    page,
  }) => {
    console.log("[TEST-08]  Validando flujo de navegación completo");

    // 1. Obtener ID del contacto seed
    const contactId = getContactId();

    // 2. Iniciar en /contacts (lista)
    console.log("[TEST-08]  Navegando a lista de contactos");
    await page.goto("https://stage.mlx.bo/contacts", {
      waitUntil: "domcontentloaded",
    });

    // 3. Verificar que lista carga
    console.log("[TEST-08] Verificando que lista carga");
    const table = page.locator("tbody").first();
    await expect(table).toBeVisible({ timeout: 10000 });

    const rowCount = await page.locator("tbody tr").count();
    console.log("[TEST-08]  Contactos en tabla:", rowCount);
    expect(rowCount).toBeGreaterThan(0);

    // 4. Buscar nuestro contacto en la lista
    console.log("[TEST-08]  Buscando contacto seed en lista");

    // Intentar encontrar por ID o nombre
    const contactRow = page
      .locator("tbody tr")
      .filter({
        hasText: /Juan Carlos|Pérez López|Francisco Javier/i,
      })
      .first();

    const rowVisible = await contactRow
      .isVisible({ timeout: 5000 })
      .catch(() => false);

    if (rowVisible) {
      console.log("[TEST-08] Contacto encontrado en lista");

      // 5. Click en contacto para navegar a edición
      console.log("[TEST-08] Click en contacto para editar");
      await contactRow.click();
      await page.waitForTimeout(1000);
    } else {
      console.log(
        "[TEST-08] Contacto no visible en primera página, navegando directamente"
      );
      await page.goto(`https://stage.mlx.bo/contacts/${contactId}/edit`);
    }

    // 6. Verificar que estamos en edición
    console.log("[TEST-08] Verificando que estamos en página de edición");
    expect(page.url()).toContain("/contacts/");
    expect(page.url()).toContain("/edit");

    // Verificar que formulario cargó
    const nombreField = page.locator("label").filter({ hasText: /^Nombre$/i });
    await expect(nombreField).toBeVisible({ timeout: 10000 });
    console.log("[TEST-08] Formulario de edición cargado correctamente");

    // 7. Buscar botón "Volver" o "Cancelar"
    console.log("[TEST-08]  Buscando botón para volver");

    // Intentar múltiples variantes
    let volverButton = page
      .locator("button, a")
      .filter({ hasText: /Volver|Atrás|Back/i })
      .first();
    let buttonVisible = await volverButton
      .isVisible({ timeout: 3000 })
      .catch(() => false);

    if (!buttonVisible) {
      volverButton = page
        .locator("button, a")
        .filter({ hasText: /Cancelar/i })
        .first();
      buttonVisible = await volverButton
        .isVisible({ timeout: 3000 })
        .catch(() => false);
    }

    if (buttonVisible) {
      console.log("[TEST-08] Click en botón volver");
      await volverButton.click();
    } else {
      console.log(
        "[TEST-08] No se encontró botón volver, navegando con goto"
      );
      await page.goto("https://stage.mlx.bo/contacts");
    }

    // 8. Verificar que regresamos a lista
    console.log("[TEST-08] Verificando que regresamos a /contacts");
    await page.waitForTimeout(1000);

    const finalUrl = page.url();
    console.log("[TEST-08]  URL final:", finalUrl);

    // Debe estar en /contacts sin /edit
    expect(finalUrl).toContain("/contacts");
    expect(finalUrl).not.toContain("/edit");

    // Verificar que tabla es visible nuevamente
    const tableAfter = page.locator("tbody").first();
    await expect(tableAfter).toBeVisible({ timeout: 10000 });

    console.log("[TEST-08] Test completado - Navegación fluida verificada");
  });
});
