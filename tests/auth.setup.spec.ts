import { test, expect } from "@playwright/test";

const loginUrl = process.env.LOGIN_URL ?? "https://stage.mlx.bo/login";
const loginUser = process.env.LOGIN_USERNAME ?? "";
const loginPassword = process.env.LOGIN_PASSWORD ?? "";

// Login y guardar sesión en playwright/.auth/auth.json
// Ajusta LOGIN_URL, LOGIN_USERNAME y LOGIN_PASSWORD vía variables de entorno si lo necesitas.

test("login y guardar sesión", async ({ page }) => {
  await page.goto(loginUrl);

  await page.locator("#username").fill(loginUser!);
  await page.getByPlaceholder("Ingrese su contraseña").fill(loginPassword!);
  await page.getByRole("button", { name: "Ingresar" }).click();

  await expect(page).toHaveURL(/dashboard|home/i);

  await page.context().storageState({ path: "playwright/.auth/auth.json" });
});
