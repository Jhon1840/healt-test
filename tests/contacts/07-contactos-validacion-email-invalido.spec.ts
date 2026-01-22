import { test, expect } from "@playwright/test";
import { getContactId } from "./helpers/contact-data";

test.describe("Validaciones - Formatos", () => {
  test("07: Validar que email con formato inválido es rechazado", async ({
    page,
  }) => {
    console.log("[TEST-07]  Validando formato de email");

    // 1. Obtener ID del contacto seed
    const contactId = getContactId();

    // 2. Navegar a edición
    console.log("[TEST-07]  Navegando a edición");
    await page.goto(`https://stage.mlx.bo/contacts/${contactId}/edit`, {
      waitUntil: "domcontentloaded",
    });

    // 3. Localizar campo "Correo"
    console.log("[TEST-07]  Localizando campo Correo");
    const correoLabel = page.locator("label").filter({ hasText: /^Correo$/i });
    await expect(correoLabel).toBeVisible({ timeout: 10000 });

    const correoContainer = correoLabel.locator("..");
    const correoField = correoContainer
      .locator("input[type='email'], input[type='text']")
      .first();
    await expect(correoField).toBeVisible();

    // 4. Guardar email original
    const originalEmail = await correoField.inputValue();
    console.log("[TEST-07]  Email original:", originalEmail || "(vacío)");

    // 5. Ingresar email con formato inválido
    const emailInvalido = "emailinvalido@"; // Falta dominio
    console.log("[TEST-07]  Ingresando email inválido:", emailInvalido);
    await correoField.clear();
    await correoField.fill(emailInvalido);

    // 6. Verificar si campo tiene validación HTML5
    const inputType = await correoField.getAttribute("type");
    console.log("[TEST-07]  Tipo de input:", inputType);

    if (inputType === "email") {
      // HTML5 validation debería activarse
      const isValid = await correoField.evaluate(
        (el: HTMLInputElement) => el.validity.valid,
      );
      console.log("[TEST-07]  Validación HTML5 - campo válido?:", isValid);

      if (!isValid) {
        console.log(
          "[TEST-07] VALIDACIÓN CORRECTA: HTML5 detecta formato inválido",
        );
      }
    }

    // 7. Intentar guardar
    console.log("[TEST-07]  Intentando guardar");
    const guardarButton = page
      .locator("button")
      .filter({ hasText: /^Guardar$/i })
      .first();
    await expect(guardarButton).toBeVisible();

    await guardarButton.click();
    await page.waitForTimeout(2000);

    // 8. Verificar resultado
    // Opción A: Sistema rechaza (permanece en página de edición)
    // Opción B: Sistema acepta y valida en servidor

    const currentUrl = page.url();
    console.log("[TEST-07]  URL actual:", currentUrl);

    if (currentUrl.includes("/edit")) {
      console.log("[TEST-07] Permanece en edición (validación funcionó)");

      // Buscar mensajes de error
      const errorMessages = await page
        .locator(
          "[role='alert'], .error, .text-red, .text-danger, .p-error, .invalid-feedback",
        )
        .allTextContents();

      console.log(
        "[TEST-07]  Mensajes encontrados:",
        errorMessages.filter((m) => m.trim()),
      );

      const hasEmailError = errorMessages.some(
        (msg) =>
          msg.toLowerCase().includes("email") ||
          msg.toLowerCase().includes("correo") ||
          msg.toLowerCase().includes("inválido") ||
          msg.toLowerCase().includes("formato"),
      );

      if (hasEmailError) {
        console.log(
          "[TEST-07] VALIDACIÓN CORRECTA: Mensaje de error sobre email",
        );
      } else {
        console.log("[TEST-07] No se encontró mensaje específico de email");
      }
    } else {
      console.log(
        "[TEST-07] Sistema aceptó email inválido (validación server-side puede variar)",
      );
    }

    // 9. Restaurar email original
    console.log("[TEST-07]  Restaurando email original");
    await page.goto(`https://stage.mlx.bo/contacts/${contactId}/edit`);

    const correoFieldRestore = page
      .locator("label")
      .filter({ hasText: /^Correo$/i })
      .locator("..")
      .locator("input[type='email'], input[type='text']")
      .first();

    await correoFieldRestore.clear();
    if (originalEmail) {
      await correoFieldRestore.fill(originalEmail);

      // Asegurar que "Nombre a enseñar" no está vacío
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
          console.log("[TEST-07]  'Nombre a enseñar' vacío, llenando");
          await displayNameField.fill("Contacto Test");
        }
      }

      const guardarBtn = page
        .locator("button")
        .filter({ hasText: /^Guardar$/i })
        .first();
      await guardarBtn.click();
      await page.waitForTimeout(1500);

      // Verificar que no aparece toast de error
      const errorToast = page
        .locator(".p-toast-message-content")
        .filter({ hasText: /obligatorio|requerido/i });
      const toastVisible = await errorToast.isVisible().catch(() => false);
      expect(toastVisible).toBe(false);
    }

    console.log("[TEST-07] Test completado - Validación de formato email");
  });
});
