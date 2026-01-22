import { test, expect } from "@playwright/test";
import { getContactId } from "./helpers/contact-data";

test.describe("Creación de Tareas desde Contactos", () => {
  test("09: Crear tarea desde contacto y verificar creación", async ({
    page,
  }) => {
    console.log("[TEST-09]  Creando tarea desde contacto");

    const contactId = getContactId();

    await page.goto(`https://stage.mlx.bo/contacts/${contactId}/edit`, {
      waitUntil: "domcontentloaded",
    });

    // Abrir modal
    await page.getByRole("button", { name: "Tarea de contacto" }).click();

    // ===== MODAL =====
    const modal = page.locator(".p-dialog").last();
    await expect(modal).toBeVisible();

    // Asunto
    await modal.getByPlaceholder("Asunto").fill("Llamar al cliente");

    // Fechas
    await modal.getByPlaceholder("Fecha Tarea").fill("2026-01-21");
    await modal.getByPlaceholder("Reminder date").fill("2026-01-20");

    // Cerrar calendarios (MUY IMPORTANTE)
    await page.keyboard.press("Escape");
    await page.keyboard.press("Escape");

    // ===== Priority (DENTRO DEL MODAL) =====
    const prioritySelect = modal.locator(".p-select");
    await prioritySelect.click();

    // Overlay del select (portal)
    const priorityOverlay = page.locator(".p-select-overlay:visible");
    await expect(priorityOverlay).toBeVisible();

    await priorityOverlay.getByRole("option", { name: "High" }).click();

    // ===== Captación =====
    const captacionSelect = modal.locator(".multiselect-captaciones").first();
    await captacionSelect.click();

    const captacionOverlay = page.locator(".p-multiselect-panel:visible");
    await expect(captacionOverlay).toBeVisible();

    await captacionOverlay.getByRole("option").first().click();

    // Descripción
    await modal
      .getByPlaceholder("Descripción")
      .fill("Seguimiento inicial con el cliente");

    // Guardar
    await modal.getByRole("button", { name: "Guardar" }).click();

    console.log("[TEST-09] Tarea creada");
  });
});
