"""Test de disponibilidad para verificar acceso a MLX."""
import asyncio
import os
from typing import Optional

from dotenv import load_dotenv
from playwright.async_api import TimeoutError as PlaywrightTimeoutError
from playwright.async_api import async_playwright

from notify import notify_test_failure, notify_test_success

load_dotenv()

BASE_URL = "https://mlx.bo"
PROJECT_NAME = "MLX"


async def check_home() -> None:
    """Verifica que la página principal esté disponible."""
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context()
        page = await context.new_page()
        
        try:
            response = await page.goto(BASE_URL, wait_until="domcontentloaded", timeout=15_000)
            
            if not response:
                raise AssertionError(f"No se obtuvo respuesta de {BASE_URL}")
            
            if response.status >= 400:
                raise AssertionError(f"{BASE_URL} devolvió código {response.status}")
            
            print(f"✅ [PASSED] 🌐 {BASE_URL} está disponible (status: {response.status})")
            
        finally:
            await browser.close()


async def check_login() -> None:
    """Verifica que la página de login esté accesible."""
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context()
        page = await context.new_page()
        
        try:
            login_url = f"{BASE_URL}/login"
            response = await page.goto(login_url, wait_until="domcontentloaded", timeout=15_000)
            
            if not response:
                raise AssertionError(f"No se obtuvo respuesta de {login_url}")
            
            if response.status >= 400:
                raise AssertionError(f"{login_url} devolvió código {response.status}")
            
            print(f"✅ [PASSED] 🔐 {login_url} está accesible (status: {response.status})")
            
        finally:
            await browser.close()


async def run_checks() -> None:
    """Ejecuta todas las verificaciones de disponibilidad."""
    passed = 0
    last_url: Optional[str] = BASE_URL
    
    try:
        # Test 1: Verificar página principal
        try:
            await check_home()
            passed += 1
        except Exception as exc:
            await notify_test_failure(
                f"🌐 Verificar disponibilidad de {PROJECT_NAME} (página principal)",
                str(exc),
                BASE_URL,
                None,
                PROJECT_NAME,
                BASE_URL
            )
            raise
        
        # Test 2: Verificar página de login
        try:
            await check_login()
            passed += 1
            last_url = f"{BASE_URL}/login"
        except Exception as exc:
            await notify_test_failure(
                f"🔐 Verificar acceso a página de login {PROJECT_NAME}",
                str(exc),
                f"{BASE_URL}/login",
                last_url,
                PROJECT_NAME,
                BASE_URL
            )
            raise
            
    except PlaywrightTimeoutError as exc:
        print(f"⏱️ Timeout detectado: {exc}")
        raise
    except Exception:
        raise
    
    if passed == 2:
        print(f"🎉 ¡Todos los tests de {PROJECT_NAME} pasaron correctamente!")
        await notify_test_success(PROJECT_NAME, BASE_URL)


if __name__ == "__main__":
    asyncio.run(run_checks())
