import { test, expect } from "@playwright/test";
import { getContactId } from "./helpers/contact-data";

test.describe("Validaciones - Campos Requeridos", () => {
  test("06: Intentar guardar sin nombre (campo obligatorio)", async ({
    page,
  }) => {
    console.log("[TEST-06] Validando campo Nombre obligatorio");

    // 1. Obtener ID del contacto seed
    const contactId = getContactId();

    // 2. Navegar a edición
    console.log("[TEST-06]  Navegando a edición");
    await page.goto(`https://stage.mlx.bo/contacts/${contactId}/edit`, {
      waitUntil: "domcontentloaded",
    });

    // 3. Localizar campo "Nombre"
    console.log("[TEST-06]  Localizando campo Nombre");
    const nombreLabel = page.locator("label").filter({ hasText: /^Nombre$/i });
    await expect(nombreLabel).toBeVisible({ timeout: 10000 });

    const nombreContainer = nombreLabel.locator("..");
    const nombreField = nombreContainer.locator("input").first();
    await expect(nombreField).toBeVisible();

    // 4. Guardar valor original
    const originalNombre = await nombreField.inputValue();
    console.log("[TEST-06]  Nombre original:", originalNombre);

    // 5. Limpiar campo Nombre (dejar vacío)
    console.log("[TEST-06]  Limpiando campo Nombre");
    await nombreField.clear();
    await nombreField.fill(""); // Asegurar que está vacío

    // Verificar que está vacío
    const nombreVacio = await nombreField.inputValue();
    expect(nombreVacio).toBe("");
    console.log("[TEST-06] Campo Nombre está vacío");

    // 6. Intentar guardar
    console.log("[TEST-06]  Intentando guardar sin Nombre");
    const guardarButton = page
      .locator("button")
      .filter({ hasText: /^Guardar$/i })
      .first();
    await expect(guardarButton).toBeVisible();

    // Verificar si botón está deshabilitado
    const isDisabled = await guardarButton.isDisabled().catch(() => false);

    if (isDisabled) {
      console.log(
        "[TEST-06] VALIDACIÓN CORRECTA: Botón Guardar está deshabilitado",
      );
      console.log("[TEST-06] Sistema previene guardado sin nombre");
    } else {
      console.log(
        "[TEST-06] Botón habilitado, intentando click para verificar validación server-side",
      );

      // Click y esperar validación
      await guardarButton.click();
      await page.waitForTimeout(2000);

      // Buscar mensajes de error
      const errorMessages = await page
        .locator("[role='alert'], .error, .text-red, .text-danger, .p-error")
        .allTextContents();

      console.log("[TEST-06]  Mensajes de error encontrados:", errorMessages);

      // Verificar que hay al menos un mensaje de error
      const hasError = errorMessages.some(
        (msg) =>
          msg.toLowerCase().includes("requerido") ||
          msg.toLowerCase().includes("obligatorio") ||
          msg.toLowerCase().includes("required") ||
          msg.toLowerCase().includes("nombre"),
      );

      if (hasError) {
        console.log(
          "[TEST-06] VALIDACIÓN CORRECTA: Mensaje de error mostrado",
        );
      } else {
        console.log("[TEST-06] No se encontró mensaje de error específico");
        console.log(
          "[TEST-06] Verificando que la página no navegó (permanece en /edit)",
        );
        expect(page.url()).toContain("/edit");
      }
    }

    // 7. Restaurar nombre original para no afectar otros tests
    console.log("[TEST-06]  Restaurando nombre original");
    await nombreField.fill(originalNombre);

    // Asegurar que "Nombre a enseñar" no está vacío antes de guardar
    const displayNameLabel = page
      .locator("label")
      .filter({ hasText: /Nombre a enseñar/i });
    if (await displayNameLabel.isVisible().catch(() => false)) {
      const displayNameField = displayNameLabel
        .locator("..")
        .locator("input")
        .first();
      const displayNameValue = await displayNameField
        .inputValue()
        .catch(() => "");
      if (!displayNameValue || displayNameValue.trim() === "") {
        console.log("[TEST-06]  'Nombre a enseñar' vacío, llenando");
        await displayNameField.fill("Contacto Test");
      }
    }

    // Guardar para restaurar
    await guardarButton.click();
    await page.waitForTimeout(1500);

    // Verificar que no aparece toast de error obligatorio
    const errorToast = page
      .locator(".p-toast-message-content")
      .filter({ hasText: /obligatorio|requerido/i });
    const toastVisible = await errorToast.isVisible().catch(() => false);
    expect(toastVisible).toBe(false);

    console.log(
      "[TEST-06] Test completado - Validación de campo obligatorio funciona (sin errores al restaurar)",
    );
  });
});
