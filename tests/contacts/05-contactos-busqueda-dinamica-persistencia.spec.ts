import { test, expect } from "@playwright/test";
import { getContactId } from "./helpers/contact-data";

test.describe("Búsqueda Dinámica", () => {
  test("TC-06.01 – Crear y persistir Búsqueda Dinámica", async ({ page }) => {
    test.setTimeout(120000);

    const contactId = getContactId();
    const criterio = `Apartamento 2D Zona Sur - ${Date.now()}`;

    /* =============================
       1. Navegar al contacto
    ============================= */
    await page.goto(`https://stage.mlx.bo/contacts/${contactId}/edit`, {
      waitUntil: "networkidle",
    });

    /* =============================
       2. Ir a Nueva Coincidencia
    ============================= */
    await page
      .getByRole("tab", { name: /Nueva Coincidencia de Comprador/i })
      .click();

    /* =============================
       3. Agregar Búsqueda Dinámica
    ============================= */
    await page
      .getByRole("button", { name: /Agregar Búsqueda Dinámica/i })
      .click();

    /* =============================
       4. Llenar nombre (FloatLabel)
    ============================= */
    const nombreBusqueda = page.locator("#name");
    await expect(nombreBusqueda).toBeVisible();
    await nombreBusqueda.fill(criterio);

    await expect(nombreBusqueda).toHaveValue(criterio);

    /* =============================
       5. Guardar (sin toast)
    ============================= */
    await page.getByRole("button", { name: /Guardar Busqueda/i }).click();

    /* =============================
       6. Reload para forzar persistencia
    ============================= */
    await page.reload({ waitUntil: "networkidle" });

    /* =============================
       7. Ir a Coincidencias de Comprador
    ============================= */
    await page
      .getByRole("tab", { name: /Coincidencias de Comprador/i })
      .click();

    /* =============================
       8. Validar que EXISTE LA CREADA
    ============================= */
    const lista = page.locator(".flex.gap-2.flex-col.my-8");
    await expect(lista).toBeVisible();

    const coincidencia = lista.locator("h2", {
      hasText: criterio,
    });

    await expect(coincidencia).toHaveCount(1);
    await expect(coincidencia.first()).toBeVisible();
  });
});
