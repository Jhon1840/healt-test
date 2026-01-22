import { test, expect } from "@playwright/test";
import { getContactId } from "./helpers/contact-data";

test.describe("Edición de Contactos - Teléfono", () => {
  test("04: Editar celular y verificar que es editable", async ({ page }) => {
    console.log("[TEST-04] 📱 Editando celular de contacto");

    // 1. Obtener ID del contacto seed
    const contactId = getContactId();

    // 2. Navegar a edición
    console.log("[TEST-04] 📍 Navegando a edición");
    await page.goto(`https://stage.mlx.bo/contacts/${contactId}/edit`);

    // 3. Localizar campo "Celular"
    console.log("[TEST-04] 🔍 Buscando campo Celular");
    const celularLabel = page
      .locator("label")
      .filter({ hasText: /^Celular$/i });
    await expect(celularLabel).toBeVisible({ timeout: 10000 });

    const celularContainer = celularLabel.locator("..");
    const celularField = celularContainer.locator("input").first();
    await expect(celularField).toBeVisible();

    // 4. Guardar valor actual
    const originalPhone = await celularField.inputValue();
    console.log("[TEST-04] 📖 Celular original:", originalPhone || "(vacío)");

    // 5. Ingresar nuevo celular con formato Bolivia
    const nuevoCelular = "+591 72345678";
    console.log("[TEST-04] ✍Nuevo celular:", nuevoCelular);
    await celularField.clear();
    await celularField.fill(nuevoCelular);

    // Verificar ingreso
    const valorIngresado = await celularField.inputValue();
    console.log("[TEST-04] 📖 Valor ingresado:", valorIngresado);
    // El sistema puede formatear automáticamente, así que verificamos que contiene los dígitos
    expect(valorIngresado).toContain("72345678");

    // 6.5. Asegurar que "Nombre a enseñar" no está vacío (campo obligatorio)
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
        console.log(
          "[TEST-04] ⚠'Nombre a enseñar' vacío, llenando con nombre genérico",
        );
        await displayNameField.fill("Contacto Test");
      }
    }

    // 7. Guardar cambios
    console.log("[TEST-04] 💾 Guardando cambios");
    const guardarButton = page
      .locator("button")
      .filter({ hasText: /^Guardar$/i })
      .first();
    await expect(guardarButton).toBeVisible();

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

    console.log("[TEST-04] Cambios enviados al servidor (sin errores)");

    // 8. VALIDAR PERSISTENCIA: Recargar página
    console.log("[TEST-04] 🔄 Recargando página para validar persistencia");
    await page.reload({ waitUntil: "domcontentloaded" });

    // 9. Re-localizar campo Celular y verificar que el nuevo valor persiste
    console.log(
      "[TEST-04] 🔍 Verificando que el celular persiste después de recarga",
    );
    const celularLabelAfter = page
      .locator("label")
      .filter({ hasText: /^Celular$/i });
    await expect(celularLabelAfter).toBeVisible({ timeout: 10000 });

    const celularContainerAfter = celularLabelAfter.locator("..");
    const celularFieldAfter = celularContainerAfter.locator("input").first();
    const valorActual = await celularFieldAfter.inputValue();

    console.log("[TEST-04] 📖 Celular después de recarga:", valorActual);
    // El sistema puede formatear automáticamente, así que verificamos que contiene los dígitos
    expect(valorActual).toContain("72345678");

    console.log(
      "[TEST-04] PERSISTENCIA VALIDADA: Celular se guardó correctamente",
    );
  });
});
