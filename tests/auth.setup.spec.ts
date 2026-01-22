  import { test, expect } from "@playwright/test";

  
// Base URL (sin /login en el secret)
const baseUrl = process.env.LOGIN_URL ?? "https://stage.mlx.bo";
const loginUser = process.env.LOGIN_EMAIL;
const loginPassword = process.env.LOGIN_PASSWORD;

if (!loginUser || !loginPassword) {
  throw new Error(
    "❌ Variables de entorno faltantes: LOGIN_EMAIL o LOGIN_PASSWORD"
  );
}
  test("login y guardar sesión", async ({ page }) => {
    await page.goto(`${baseUrl}/login`);

    await page.locator("#username").fill(loginUser!);
    await page.getByPlaceholder("Ingrese su contraseña").fill(loginPassword!);
    await page.getByRole("button", { name: "Ingresar" }).click();

    await expect(page).toHaveURL(/dashboard|home/i);

    await page.context().storageState({ path: "playwright/.auth/auth.json" });
  });
