import { test, expect } from "@playwright/test";
import { selectSmart } from "../helpers/form.helpers";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";

function getCreatedAgentName(): string {
  try {
    const file = path.join("playwright", ".data", "agent.json");
    const json = JSON.parse(readFileSync(file, "utf-8"));
    return json?.name || "Juan Perez";
  } catch {
    return "Juan Perez";
  }
}


test.describe("Smoke: Elegir suscripción en paymets", () => {
  test.use({
    storageState: "playwright/.auth/auth.json",
  });
  test("Elegir suscripción y llegar al checkout", async ({ page }) => {

    //navegar a perfil
    await page.goto("/profile");
    await page.waitForLoadState("domcontentloaded");

    // Click en botón "Elegir suscripción"
    const btnElegirSuscripcion = page.getByRole("button", {
      name: "Elegir suscripción",
    });
    await expect(btnElegirSuscripcion).toBeVisible();
    await btnElegirSuscripcion.click();
  });
});