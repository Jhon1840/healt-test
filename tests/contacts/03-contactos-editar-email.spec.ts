import { test, expect } from "@playwright/test";
import { getContactId } from "./helpers/contact-data";

test.describe("Edición de Contactos - Datos de Contacto", () => {
  test("03: Editar email y verificar que es editable", async ({ page }) => {
    console.log("[TEST-03] 📧 Editando email de contacto");

    // 1. Obtener ID del contacto seed
    const contactId = getContactId();

    // 2. Navegar a edición
    console.log("[TEST-03]  Navegando a edición");
    await page.goto(`https://stage.mlx.bo/contacts/${contactId}/edit`);

    // 3. Localizar campo "Correo"
    console.log("[TEST-03] 🔍 Buscando campo Correo");
    const correoLabel = page.locator("label").filter({ hasText: /^Correo$/i });
    await expect(correoLabel).toBeVisible({ timeout: 10000 });

    const correoContainer = correoLabel.locator("..");
    const correoField = correoContainer
      .locator("input[type='email'], input[type='text']")
      .first();
    await expect(correoField).toBeVisible();

    // 4. Guardar valor actual
    const originalEmail = await correoField.inputValue();
    console.log("[TEST-03] 📖 Email original:", originalEmail || "(vacío)");

    // 5. Ingresar nuevo email
    const nuevoEmail = `updated.contact.${Date.now()}@mlxtest.com`;
    console.log("[TEST-03]  Nuevo email:", nuevoEmail);
    await correoField.clear();
    await correoField.fill(nuevoEmail);

    // Verificar ingreso
    expect(await correoField.inputValue()).toBe(nuevoEmail);

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
          "[TEST-03]  'Nombre a enseñar' vacío, llenando con nombre genérico",
        );
        await displayNameField.fill("Contacto Test");
      }
    }

    // 7. Guardar cambios
    console.log("[TEST-03] 💾 Guardando cambios");
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

    console.log("[TEST-03] Cambios enviados al servidor (sin errores)");

    // 8. VALIDAR PERSISTENCIA: Recargar página
    console.log("[TEST-03] Recargando página para validar persistencia");
    await page.reload({ waitUntil: "domcontentloaded" });

    // 9. Re-localizar campo Correo y verificar que el nuevo valor persiste
    console.log(
      "[TEST-03]  Verificando que el email persiste después de recarga",
    );
    const correoLabelAfter = page
      .locator("label")
      .filter({ hasText: /^Correo$/i });
    await expect(correoLabelAfter).toBeVisible({ timeout: 10000 });

    const correoContainerAfter = correoLabelAfter.locator("..");
    const correoFieldAfter = correoContainerAfter
      .locator("input[type='email'], input[type='text']")
      .first();
    const valorActual = await correoFieldAfter.inputValue();

    console.log("[TEST-03] 📖 Email después de recarga:", valorActual);
    expect(valorActual).toBe(nuevoEmail);

    console.log(
      "[TEST-03] PERSISTENCIA VALIDADA: Email se guardó correctamente",
    );
  });
});
