
import { test, expect } from "@playwright/test";
import { saveContactData } from "./helpers/contact-data";

test.describe("Creación de Contactos - SEED", () => {
  test("01-SEED: Crear contacto básico para tests posteriores", async ({
    page,
  }) => {
    test.setTimeout(90000);

    console.log("[SEED-01] Iniciando creación de contacto seed");

    // 1. Navegar a /contacts
    await page.goto("https://stage.mlx.bo/contacts", {
      waitUntil: "domcontentloaded",
    });

    // 2. Click en "Agregar un nuevo contacto"
    
    const addButton = page
      .locator("button")
      .filter({ hasText: /Agregar un nuevo contacto/i });

    await expect(addButton).toBeVisible({ timeout: 10000 });
    await addButton.click();

    // 3. Completar Nombre
    const nombreField = page
      .locator("label")
      .filter({ hasText: /^Nombre$/i })
      .locator("..")
      .locator("input")
      .first();

    await expect(nombreField).toBeVisible({ timeout: 5000 });
    await nombreField.fill("Juan Carlos");

    // 4. Completar Apellidos
    const apellidosField = page
      .locator("label")
      .filter({ hasText: /^Apellidos$/i })
      .locator("..")
      .locator("input")
      .first();

    await expect(apellidosField).toBeVisible({ timeout: 5000 });
    await apellidosField.fill("Pérez López");

    // 5. Seleccionar perfil de contacto (RADIO OBLIGATORIO)
    console.log("[SEED-01] Seleccionando perfil Comprador o inquilino");

    const compradorRadio = page
      .locator("label")
      .filter({ hasText: /^Comprador o inquilino$/i })
      .locator("..")
      .locator("input[type='radio']")
      .first();

    await expect(compradorRadio).toBeVisible({ timeout: 5000 });
    await compradorRadio.check();

    // 6. Email (opcional)
    const emailField = page
      .locator("label")
      .filter({ hasText: /^Correo$/i })
      .locator("..")
      .locator("input")
      .first();

    if (await emailField.isVisible().catch(() => false)) {
      await emailField.fill("juan.perez@mlxtest.com");
    }

    // 7. Celular (opcional)
    const celularField = page
      .locator("label")
      .filter({ hasText: /^Celular$/i })
      .locator("..")
      .locator("input")
      .first();

    if (await celularField.isVisible().catch(() => false)) {
      await celularField.fill("71234567");
    }

    // 8. Click Aceptar + capturar respuesta real del backend
    const aceptarButton = page
      .locator("button")
      .filter({ hasText: /^Aceptar$/i })
      .first();

    await expect(aceptarButton).toBeVisible({ timeout: 5000 });
    await expect(aceptarButton).toBeEnabled({ timeout: 5000 });
    const [createResponse] = await Promise.all([
      page.waitForResponse((response) => {
        return (
          response.url().includes("/contacts") &&
          (response.status() === 200 || response.status() === 201)
        );
      }),
      aceptarButton.click(),
    ]);

    // 9. Validar status HTTP
    expect(createResponse.status()).toBeGreaterThanOrEqual(200);
    expect(createResponse.status()).toBeLessThan(300);

    // 10. Extraer ID desde data.url (MLX pattern)
    const json = await createResponse.json();

    const contactUrl = json?.data?.url || json?.url || json?.redirect || null;

    if (!contactUrl) {
      throw new Error(
        `Respuesta backend no contiene URL del contacto: ${JSON.stringify(
          json
        )}`
      );
    }

    const match = contactUrl.match(/\/contacts\/(\d+)/);

    if (!match) {
      throw new Error(
        `No se pudo extraer ID desde la URL devuelta: ${contactUrl}`
      );
    }

    const contactId = match[1];
    console.log("[SEED-01] Contact ID creado:", contactId);

    // 11. Navegar directamente al detalle
    const detailUrl = `https://stage.mlx.bo/contacts/${contactId}/edit`;
    await page.goto(detailUrl, { waitUntil: "domcontentloaded" });

    // 12. Verificar formulario accesible
    const nombreCheck = page.locator("label").filter({ hasText: /^Nombre$/i });

    await expect(nombreCheck).toBeVisible({ timeout: 10000 });
    console.log("[SEED-01] Formulario de edición accesible");

    // 13. Guardar datos del contacto
    saveContactData({
      id: contactId,
      name: "Juan Carlos",
      lastName: "Pérez López",
      email: "juan.perez@mlxtest.com",
      phone: "+591 71234567",
      createdAt: new Date().toISOString(),
    });

    console.log("[SEED-01] SEED completado correctamente");
    console.log("[SEED-01] URL contacto:", detailUrl);
  });
});
