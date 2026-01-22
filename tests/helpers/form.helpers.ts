import { Page, expect } from "@playwright/test";

import { Locator } from "@playwright/test";


/* =============================
   PRIMEVUE INPUTNUMBER (CURRENCY)
============================= */

export async function fillPrimeVueCurrency(input: Locator, value: string) {
  await input.scrollIntoViewIfNeeded();
  await input.click({ force: true });

  // Limpiar correctamente (PrimeVue-friendly)
  await input.press("Control+A");
  await input.press("Backspace");

  // Escribir como humano (dispara eventos reales)
  await input.type(value, { delay: 50 });

  // Forzar commit del valor (blur)
  await input.press("Tab");


}
/* =============================
   SELECT (native + PrimeVue)
============================= */
export async function selectSmart(
  page: Page,
  label: string,
  optionText: string
) {
  // Esperar a que las animaciones de modales terminen
  await page.waitForTimeout(300);

  // Intentar buscar en estructura .field (usada en formularios principales)
  const field = page.locator(".field").filter({ hasText: label });
  const fieldExists = (await field.count()) > 0;

  // Si no existe .field, buscar combobox directamente por aria-label o por label asociado
  let combo;
  if (fieldExists) {
    await expect(field).toBeVisible();

    // Buscar select nativo primero
    const nativeSelect = field.locator("select");
    if (await nativeSelect.count()) {
      await nativeSelect.selectOption({ label: optionText });
      return;
    }

    combo = field.locator('[role="combobox"]').first();
  } else {
    // Mapeo de labels a IDs específicos para evitar ambigüedades
    const labelToId: Record<string, string> = {
      Oficina: "office_id",
      Agente: "agent_id",
      "Tipo de Propiedad": "subtype_property_id",
      "Selecciona tipo de propiedad": "subtype_property_id",
    };

    const comboId = labelToId[label];

    // Si existe un ID mapeado, buscar primero dentro del modal visible por ID
    if (comboId) {
      const modalComboById = page
        .locator('.p-dialog-content:visible, [role="dialog"]:visible')
        .locator(`#${comboId}[role="combobox"]`)
        .first();

      if ((await modalComboById.count()) > 0) {
        combo = modalComboById;
      }
    }

    // Si no se encontró por ID, buscar por aria-label dentro del modal
    if (!combo || (await combo.count()) === 0) {
      const modalCombo = page
        .locator('.p-dialog-content:visible, [role="dialog"]:visible')
        .locator(`[role="combobox"][aria-label*="${label}"]`)
        .first();

      if ((await modalCombo.count()) > 0) {
        combo = modalCombo;
      } else {
        combo = page
          .locator(`[role="combobox"][aria-label*="${label}"]`)
          .first();
      }
    }

    // Si no existe, buscar por label asociado
    if ((await combo.count()) === 0) {
      combo = page
        .locator(`label:has-text("${label}")`)
        .locator("..")
        .locator('[role="combobox"]')
        .first();
    }
  }

  await expect(combo).toBeVisible();

  const currentValue = (await combo.innerText()).trim();
  if (currentValue === optionText) return;

  // Obtener el ID del listbox ANTES de hacer click
  const listboxId = await combo.getAttribute("aria-controls");
  if (!listboxId) throw new Error(`Combobox sin aria-controls: ${label}`);

  // Scroll el combobox hacia el centro si es necesario (para dar espacio al dropdown)
  await combo.scrollIntoViewIfNeeded();
  await page.waitForTimeout(200);

  // Click en el ícono dropdown o directamente en el combobox
  // Primero intentar clickear el dropdown icon si existe
  const dropdownIcon = combo
    .locator("+ .p-select-dropdown, ~ .p-select-dropdown")
    .first();
  const clickTarget = (await dropdownIcon.count()) > 0 ? dropdownIcon : combo;

  // Hacer múltiples intentos si es necesario
  let listboxVisible = false;
  for (let i = 0; i < 3; i++) {
    await clickTarget.click({ force: true });

    // Pequeña pausa entre intentos
    await page.waitForTimeout(100);

    // Verificar si el listbox es visible EN CUALQUIER LUGAR de la página
    // (puede estar arriba, abajo, o incluso fuera del viewport pero en el DOM)
    const listbox = page.locator(`#${listboxId}`);
    const isInDOM = (await listbox.count()) > 0;

    if (isInDOM) {
      // El listbox existe en el DOM, intentar hacerlo visible
      await listbox.scrollIntoViewIfNeeded().catch(() => {});
      await page.waitForTimeout(100);

      listboxVisible = true;
      break;
    }
  }

  if (!listboxVisible) {
    throw new Error(`No se pudo abrir el combobox ${label} (ID: ${listboxId})`);
  }

  // Pequeña pausa para que las opciones se carguen
  await page.waitForTimeout(300);

  const listbox = page.locator(`#${listboxId}`);

  // Primero intentar búsqueda exacta
  let option = listbox.getByRole("option", { name: optionText, exact: true });

  // Si no hay coincidencia exacta, usar búsqueda parcial
  if ((await option.count()) === 0) {
    option = listbox.getByRole("option", { name: optionText }).first();
  } else if ((await option.count()) > 1) {
    // Si hay múltiples coincidencias, tomar la primera
    option = option.first();
  }

  // Scroll la opción a la vista si es necesario
  await option.scrollIntoViewIfNeeded().catch(() => {});

  await expect(option).toBeVisible({ timeout: 5000 });
  await option.click();

  // Esperar a que la opción se seleccione
  await page.waitForTimeout(100);
}

/* =============================
   PRIMEVUE DATEPICKER
   (readonly y editable)
============================= */
export async function fillPrimeVueDatePicker(
  page: Page,
  label: string,
  value: string
) {
  const field = page.locator(".field").filter({ hasText: label });
  await expect(field).toBeVisible();

  const input = field.locator('input[role="combobox"]');
  const button = field.locator('button[aria-label="Choose Date"]');

  await expect(input).toBeVisible();
  await expect(button).toBeVisible();

  const id = await input.getAttribute("id");
  if (!id) throw new Error(`DatePicker sin id: ${label}`);

  await button.click();

  await page.evaluate(
    ({ id, value }) => {
      const el = document.getElementById(id) as HTMLInputElement | null;
      if (!el) throw new Error("DatePicker input no encontrado");
      el.value = value;
      el.dispatchEvent(new Event("input", { bubbles: true }));
      el.dispatchEvent(new Event("change", { bubbles: true }));
      el.dispatchEvent(new Event("blur", { bubbles: true }));
    },
    { id, value }
  );

  const expanded = await input.getAttribute("aria-expanded");
  if (expanded === "true") {
    await page.keyboard.press("Escape");
  }

  await expect(input).toHaveValue(value);
}

/* =============================
   TOGGLE SWITCH (PrimeVue real)
============================= */
export async function toggleSwitch(page: Page, label: string, enabled = true) {
  const item = page
    .locator(".chat-item")
    .filter({ has: page.locator("label", { hasText: label }) })
    .first();

  await expect(item).toBeVisible();

  const sw = item.locator('input[type="checkbox"][aria-checked]');
  await expect(sw).toHaveCount(1);

  const checked = (await sw.getAttribute("aria-checked")) === "true";
  if (checked !== enabled) {
    await sw.click();
  }

  await expect(sw).toHaveAttribute("aria-checked", enabled ? "true" : "false");
}

/* =============================
   PRIMEVUE RADIO GROUP
============================= */
export async function selectRadioOption(
  page: Page,
  groupLabel: string,
  optionLabel: string
) {
  // Busca el grupo como el hermano inmediato del label visible
  const group = page.locator(
    `label:has-text("${groupLabel}") + .p-radiobutton-group`
  );

  await expect(group).toBeVisible();

  // Dentro del grupo, selecciona por el label del radio (COM, RES, etc.)
  const radio = group.getByLabel(optionLabel, { exact: true });
  await radio.check();
  await expect(radio).toBeChecked();
}

/* =============================
   READONLY CALCULATED FIELD
============================= */
export async function expectReadonlyFilled(page: Page, label: string) {
  const field = page.locator(".field").filter({ hasText: label });
  const input = field.locator("input[readonly]");
  await expect(input).toHaveValue(/.+/);
}

/* =============================
   TEXT FIELD - Generic helper
============================= */
export async function fillTextField(
  page: Page,
  selector: string,
  value: string
) {
  const field = page.locator(selector);
  await expect(field).toBeVisible();
  await field.fill(value);
}

/* =============================
   GET FIELD VALUE - Generic helper
============================= */
export async function getFieldValue(
  page: Page,
  selector: string
): Promise<string | null> {
  return page.locator(selector).inputValue();
}

/* =============================
   EXPECT FIELD ERROR - Validar errores
============================= */
export async function expectFieldError(
  page: Page,
  fieldLabel: string,
  errorPattern: RegExp
) {
  const field = page.locator(".field").filter({ hasText: fieldLabel });
  const errorEl = field.locator(".p-error, [class*='error'], .invalid");
  await expect(errorEl).toBeVisible();
  await expect(errorEl).toContainText(errorPattern);
}

/* =============================
   SETUP HELPERS - Rellenar secciones completas
============================= */
export async function fillPersonalSection(page: Page) {
  await page.locator("#firt_name").fill("Juan");
  await page.locator("#last_name").fill("Perez");
  await page.locator("#ci").fill("1234567 SC");
  await selectSmart(page, "Sexo", "Masculino");
  await fillPrimeVueDatePicker(page, "Fecha de Nacimiento", "10/12/2000");
  await page.locator("#username").fill("juan.agent");
  await page.locator("#password").fill("Password123!");
}

export async function fillContactoSection(page: Page) {
  await page.locator("#address").fill("Av Siempre Viva 742");
  await page.locator("#landline_phone").fill("2222222");
  await page.locator("#email").fill("juan@test.com");
  await page.locator("#phone_number").fill("70123456");
}

export async function fillAgenteSection(page: Page) {
  await selectSmart(page, "Idioma Preferido", "Spanish - Bolivia");
  await page
    .locator('.field:has-text("Nº RE/MAX Internacional") input')
    .fill("7626916");
  await fillPrimeVueDatePicker(page, "Fecha de Inicio en Remax", "19/12/2025");
  await page
    .locator('.field:has-text("ID del Agente Empresarial") input')
    .fill("AG-001");
  await selectSmart(page, "Region", "RE/MAX Bolivia");
  await selectSmart(page, "Oficina", "RE/MAX Action Group");
  await selectSmart(page, "Estatus del Equipo", "Individual");
  await selectSmart(page, "Título Actual en Remax", "Agente Asociado");
  await selectSmart(page, "Título a Enseñar", "Agente en Entrenamiento");
  await selectSmart(page, "Rol del usuario", "Agente");
  await selectSmart(page, "Estado del Agente", "Activo");
}

export async function fillSwitchesSection(page: Page) {
  await toggleSwitch(page, "MLX", true);
  await toggleSwitch(page, "Notificaciones", true);
  await toggleSwitch(page, "Ranking", false);
}
