import { test, expect } from "@playwright/test";
import { getContactId } from "./helpers/contact-data";

test.describe("Edición de Contactos - Datos Básicos", () => {
  // Este test verifica que los campos son editables y el botón guardar responde
  test("02: Editar nombre y verificar que es editable", async ({ page }) => {
    console.log("[TEST-02]  Editando nombre de contacto");

    // 1. Obtener ID del contacto seed
    const contactId = getContactId();
    console.log("[TEST-02]  Contact ID:", contactId);

    // 2. Navegar a edición
    console.log("[TEST-02]  Navegando a /contacts/" + contactId + "/edit");
    await page.goto(`https://stage.mlx.bo/contacts/${contactId}/edit`, {
      waitUntil: "domcontentloaded",
    });

    // 3. Verificar que formulario cargó
    console.log("[TEST-02]  Formulario de edición cargado");
    const nombreLabel = page.locator("label").filter({ hasText: /^Nombre$/i });
    await expect(nombreLabel).toBeVisible({ timeout: 10000 });

    // 4. Localizar campo "Nombre"
    const nombreContainer = nombreLabel.locator("..");
    const nombreField = nombreContainer.locator("input").first();
    await expect(nombreField).toBeVisible();

    // 5. Guardar valor original
    const originalValue = await nombreField.inputValue();
    console.log("[TEST-02]  Valor original:", originalValue);

    // 6. Cambiar nombre
    const nuevoNombre = "Francisco Javier";
    console.log("[TEST-02]  Cambiando nombre a:", nuevoNombre);
    await nombreField.clear();
    await nombreField.fill(nuevoNombre);

    // Verificar que se ingresó correctamente
    const valorIngresado = await nombreField.inputValue();
    expect(valorIngresado).toBe(nuevoNombre);

    // 7. Asegurar que "Nombre a enseñar" no está vacío (campo obligatorio)
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
        console.log("[TEST-02]  'Nombre a enseñar' vacío, llenando");
        await displayNameField.fill(nuevoNombre);
      }
    }

    // 8. Guardar cambios
    console.log("[TEST-02]  Guardando cambios");
    const guardarButton = page
      .locator("button")
      .filter({ hasText: /^Guardar$/i })
      .first();
    await expect(guardarButton).toBeVisible();

    // Esperar respuesta del servidor
    const responsePromise = page
      .waitForResponse(
        (response) =>
          response.url().includes("/contacts") && response.status() === 200,
        { timeout: 10000 },
      )
      .catch(() => null);

    await guardarButton.click();
    await responsePromise;
    await page.waitForTimeout(1500);

    // Verificar que no aparece toast de error
    const errorToast = page
      .locator(".p-toast-message-content")
      .filter({ hasText: /obligatorio|requerido/i });
    const toastVisible = await errorToast.isVisible().catch(() => false);
    expect(toastVisible).toBe(false);

    console.log("[TEST-02]  Cambios enviados al servidor (sin errores)");

    // 9. VALIDAR PERSISTENCIA: Recargar página
    console.log("[TEST-02]  Recargando página para validar persistencia");
    await page.reload({ waitUntil: "domcontentloaded" });

    // 10. Re-localizar campo Nombre y verificar que el nuevo valor persiste
    console.log(
      "[TEST-02]  Verificando que el nombre persiste después de recarga",
    );
    const nombreLabelAfter = page
      .locator("label")
      .filter({ hasText: /^Nombre$/i });
    await expect(nombreLabelAfter).toBeVisible({ timeout: 10000 });

    const nombreContainerAfter = nombreLabelAfter.locator("..");
    const nombreFieldAfter = nombreContainerAfter.locator("input").first();
    const valorActual = await nombreFieldAfter.inputValue();

    console.log("[TEST-02]  Valor después de recarga:", valorActual);
    expect(valorActual).toBe(nuevoNombre);

    console.log(
      "[TEST-02]  PERSISTENCIA VALIDADA: Nombre se guardó correctamente",
    );
  });
});
