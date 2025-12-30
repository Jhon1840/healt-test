"""Runner en Python que replica las verificaciones de disponibilidad con Playwright."""
import asyncio
import os
import re
from typing import Optional

from dotenv import load_dotenv
from playwright.async_api import TimeoutError as PlaywrightTimeoutError
from playwright.async_api import async_playwright, expect

from notify import notify_test_failure, notify_test_success

load_dotenv()

BASE_URL = os.getenv("LOGIN_URL") or os.getenv("BASE_URL") 
LOGIN_USERNAME = os.getenv("LOGIN_USERNAME", "")
LOGIN_PASSWORD = os.getenv("LOGIN_PASSWORD", "")


def _join_url(path: str) -> str:
    return BASE_URL.rstrip("/") + path


async def ensure_logged_in(page) -> str:
    response = await page.goto(_join_url("/login"), wait_until="domcontentloaded")
    last_url = response.url if response else page.url
    if response and response.status >= 400:
        raise AssertionError(f"La ruta /login devolvió {response.status}")

    username = page.locator("#username")
    try:
        # Si la sesión ya redirigió al dashboard, regresamos sin esperar el login
        if re.search("dashboard|home", page.url, re.IGNORECASE):
            return page.url

        await expect(username).to_be_visible(timeout=8_000)
        await username.fill(LOGIN_USERNAME)
        await page.get_by_placeholder(re.compile("contraseña", re.IGNORECASE)).fill(
            LOGIN_PASSWORD
        )
        await page.get_by_role("button", name=re.compile("ingresar", re.IGNORECASE)).click()
        last_url = page.url
        await expect(page).to_have_url(
            re.compile("dashboard|home", re.IGNORECASE), timeout=30_000
        )
        return last_url
    except PlaywrightTimeoutError:
        # Revisa si se redirigió al dashboard durante la espera
        if re.search("dashboard|home", page.url, re.IGNORECASE):
            return page.url
        html_preview = (await page.content())[:2000]
        raise AssertionError(
            "No se encontró #username ni redirección a dashboard/home tras cargar /login"
        ) from None


async def check_login(page) -> str:
    return await ensure_logged_in(page)


async def check_export_excel(page, last_url: str) -> str:
    last_url = await ensure_logged_in(page)

    resp_dash = await page.goto(_join_url("/dashboard"), wait_until="domcontentloaded")
    last_url = resp_dash.url if resp_dash else page.url

    modal_button = (
        page.locator('h2:has-text("Ranking")').locator("..").locator("button:has(i.pi-window-maximize)")
    )
    await expect(modal_button).to_be_visible(timeout=10_000)
    await modal_button.click()

    modal = page.locator('[role="dialog"]')
    await expect(modal).to_be_visible(timeout=10_000)

    export_button = modal.locator('button:has(i.fa-file-excel), button:has-text("Exportar")')
    await expect(export_button).to_be_visible(timeout=15_000)

    download_promise = page.wait_for_event("download", timeout=30_000)
    await export_button.click()
    download = await download_promise
    filename = download.suggested_filename
    if not re.search(r"\.(xlsx|xls)$", filename, re.IGNORECASE):
        raise AssertionError(f"El archivo descargado no parece Excel: {filename}")

    return last_url


async def run_checks() -> None:
    passed = 0
    last_url: Optional[str] = BASE_URL
    try:
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            context = await browser.new_context()
            page = await context.new_page()

            try:
                last_url = await check_login(page)
                passed += 1
                print("✅ [PASSED] 🛡️ Verificar disponibilidad del sistema")
            except Exception as exc:  # pylint: disable=broad-except
                current_url = page.url if page else "URL no disponible"
                await notify_test_failure(
                    "🛡️ Verificar disponibilidad del sistema",
                    str(exc),
                    current_url,
                    last_url,
                )
                raise

            try:
                last_url = await check_export_excel(page, last_url)
                passed += 1
                print("✅ [PASSED] 📦 Verificar exportación de Excel")
            except Exception as exc:  # pylint: disable=broad-except
                current_url = page.url if page else "URL no disponible"
                await notify_test_failure(
                    "📦 Verificar exportación de Excel",
                    str(exc),
                    current_url,
                    last_url,
                )
                raise

            await browser.close()
    except PlaywrightTimeoutError as exc:
        print(f"⏱️ Timeout detectado: {exc}")
        raise
    except Exception:
        # Ya se notificó en cada bloque de test
        raise

    if passed == 2:
        print("🎉 ¡Todos los tests pasaron correctamente!")
        await notify_test_success()


if __name__ == "__main__":
    asyncio.run(run_checks())
