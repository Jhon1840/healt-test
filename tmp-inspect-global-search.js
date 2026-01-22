const { chromium } = require("playwright");
const path = require("path");

(async () => {
  const storageState = path.join(__dirname, "playwright", ".auth", "auth.json");
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ storageState });
  const page = await context.newPage();
  await page.goto("https://stage.mlx.bo/global-search", {
    waitUntil: "domcontentloaded",
  });
  await page.waitForTimeout(2000);

  const filterBtn = page
    .getByRole("button", { name: /filtro|filter/i })
    .first();
  if (await filterBtn.isVisible().catch(() => false)) {
    await filterBtn.click({ timeout: 2000 }).catch(() => {});
    await page.waitForTimeout(1000);
  }

  const advancedBtn = page
    .getByRole("button", { name: /opciones avanzadas/i })
    .first();
  if (await advancedBtn.isVisible().catch(() => false)) {
    await advancedBtn.click({ timeout: 2000 }).catch(() => {});
    await page.waitForTimeout(1000);
  }

  const inputs = await page.evaluate(() => {
    const els = Array.from(document.querySelectorAll("input"))
      .filter((el) => {
        const style = window.getComputedStyle(el);
        return (
          style.display !== "none" &&
          style.visibility !== "hidden" &&
          style.opacity !== "0"
        );
      })
      .map((el) => ({
        tag: el.tagName,
        type: el.type,
        name: el.name,
        placeholder: el.placeholder,
        aria: el.getAttribute("aria-label"),
        classes: el.className,
        dataset: {
          pcName: el.getAttribute("data-pc-name"),
          section: el.getAttribute("data-pc-section"),
        },
        id: el.id,
        value: el.value,
      }));
    return els.slice(0, 60);
  });

  const buttons = await page.evaluate(() => {
    const els = Array.from(document.querySelectorAll("button"))
      .filter((el) => {
        const style = window.getComputedStyle(el);
        return (
          style.display !== "none" &&
          style.visibility !== "hidden" &&
          style.opacity !== "0"
        );
      })
      .map((el) => ({
        text: el.innerText.trim().slice(0, 120),
        aria: el.getAttribute("aria-label"),
        classes: el.className,
        dataset: {
          pcName: el.getAttribute("data-pc-name"),
          section: el.getAttribute("data-pc-section"),
        },
        type: el.getAttribute("type"),
      }));
    return els.slice(0, 80);
  });

  const combos = await page.evaluate(() => {
    const nodes = Array.from(
      document.querySelectorAll(
        '[role="combobox"], select, [aria-label][role="listbox"]'
      )
    )
      .filter((el) => {
        const style = window.getComputedStyle(el);
        return (
          style.display !== "none" &&
          style.visibility !== "hidden" &&
          style.opacity !== "0"
        );
      })
      .map((el) => ({
        tag: el.tagName,
        role: el.getAttribute("role"),
        ariaLabel: el.getAttribute("aria-label"),
        placeholder: el.getAttribute("placeholder"),
        classes: el.className,
        text: el.textContent.trim().slice(0, 120),
      }));
    return nodes.slice(0, 80);
  });

  async function sampleOptions(label) {
    const combo = page.getByRole("combobox", { name: label }).first();
    if (!(await combo.isVisible().catch(() => false)))
      return { label, options: [] };
    await combo.click({ timeout: 2000 }).catch(() => {});
    await page.waitForTimeout(300);
    const opts = await page
      .getByRole("option")
      .allTextContents({ timeout: 2000 })
      .catch(() => []);
    await page.keyboard.press("Escape").catch(() => {});
    return { label, options: opts.slice(0, 8) };
  }

  const optionSamples = [];
  for (const label of [
    "Departamento",
    "Provincia",
    "Ciudad",
    "Selecciona una oficina",
    "Selecciona un tipo de contrato",
    "Estado de Mercado",
    "Selecciona un tipo de precio",
    "Categoria de la propiedad",
    "Piso",
    "Selecciona un estado de propiedad",
  ]) {
    optionSamples.push(await sampleOptions(label));
  }

  console.log(
    JSON.stringify({ inputs, buttons, combos, optionSamples }, null, 2)
  );
  await browser.close();
})();
