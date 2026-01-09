"""Helpers para enviar notificaciones de disponibilidad vía WhatsApp."""
import os
import re
from datetime import datetime, timedelta, timezone
from typing import Iterable, Optional

import httpx


def format_bolivia_time() -> str:
    now_utc = datetime.now(timezone.utc)
    la_paz = now_utc - timedelta(hours=4)  
    return la_paz.strftime("%Y-%m-%d %H:%M:%S")


def clean_message_text(text: Optional[str]) -> str:
    if not text:
        return ""
    return (
        re.sub(r"[\x1B\x9B][\[\]()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]", "", text)
        .replace("\n", " ")
        .replace("\r", " ")
        .replace("\t", " ")
        .strip()
    )[:300]


def is_system_offline(error_msg: str) -> bool:
    pattern = r"ECONNREFUSED|net::ERR|Navigation failed|404|502|503|504|not\s+found|waiting for locator\('#username'\)"
    return bool(re.search(pattern, error_msg or "", re.IGNORECASE))


def _get_numbers() -> Iterable[str]:
    numbers_string = os.getenv("ALERT_PHONES", "+59168376785")
    return [n.strip() for n in numbers_string.split(",") if n.strip()]


def _get_base_url() -> str:
    env = os.getenv("AVAILABILITY_ENV", "").lower()
    if env == "produccion":
        return os.getenv("AVAILABILITY_URL", "")
    return os.getenv("LOGIN_URL", "")


def _build_error_message(test_title: str, error_message: str, current_url: str, context_url: Optional[str], project_name: str = "Intramax", base_url: Optional[str] = None) -> str:
    raw_error = error_message or "No se detectó mensaje de error"
    error_msg = clean_message_text(raw_error)
    offline = is_system_offline(raw_error)

    tipo_falla = "🛑 *SISTEMA NO DISPONIBLE*" if offline else "⚠️ *FALLA FUNCIONAL DETECTADA*"
    descripcion = (
        f"🚨 El sistema {project_name} está *caído o inalcanzable*. No respondió correctamente a una petición de rutas."
        if offline
        else f"⚠️ El sistema {project_name} está *en línea*, pero falló la exportación de Excel."
    )

    base = base_url or _get_base_url() or "PRODUCCION"
    url_info = [f"🔎 URL: {current_url}"]

    return "\n".join(
        [
            tipo_falla,
            descripcion,
            "",
            f"📌 Proyecto: *{project_name}*",
            f"🌐 Entorno: *{base}*",
            f"🧪 Prueba: *{test_title}*",
            f"💥 Error detectado: {error_msg}",
            *url_info,
            "",
            f"🕒 Hora (Bolivia): {format_bolivia_time()}",
        ]
    )


def _build_success_message(project_name: str = "Intramax", base_url: Optional[str] = None) -> str:
    base = base_url or _get_base_url() or "PRODUCCION"
    return "\n".join(
        [
            "✅ *SISTEMA FUNCIONANDO CORRECTAMENTE*",
            "",
            f"📌 Proyecto: *{project_name}*",
            f"🌐 Entorno: *{base}*",
            f"🕒 Hora (Bolivia): {format_bolivia_time()}",
        ]
    )


def _print_env_warning(kind: str) -> None:
    print(f"[notify] WHATSAPP_TOKEN/WHATSAPP_INSTANCE_ID no configurados; se omite alerta de {kind}.")


def _get_common_env():
    base_url = os.getenv("WHATSAPP_URL", "https://wharex.intramax.bo")
    token = os.getenv("WHATSAPP_TOKEN")
    instance_id = os.getenv("WHATSAPP_INSTANCE_ID")
    return base_url, token, instance_id


ASYNC_CLIENT_TIMEOUT = httpx.Timeout(15.0, connect=10.0)


def _should_send(token: Optional[str], instance_id: Optional[str]) -> bool:
    return bool(token and instance_id)


async def _send_message(message: str) -> None:
    base_url, token, instance_id = _get_common_env()
    if not _should_send(token, instance_id):
        _print_env_warning("éxito" if "FUNCIONANDO" in message else "falla")
        return

    numbers = list(_get_numbers())
    if not numbers:
        print("[notify] ALERT_PHONES está vacío; no se envía notificación.")
        return

    async with httpx.AsyncClient(timeout=ASYNC_CLIENT_TIMEOUT) as client:
        for number in numbers:
            try:
                res = await client.post(
                    f"{base_url}/send-message",
                    json={
                        "token": token,
                        "instance_id": instance_id,
                        "number": number,
                        "message": message,
                    },
                )
                if res.status_code < 200 or res.status_code >= 300:
                    print(
                        f"[notify] Error enviando a {number}: {res.status_code} {res.text[:200]}"
                    )
                else:
                    print(
                        f"[notify] Mensaje enviado a {number} OK ({res.status_code})."
                    )
            except Exception as exc:  # pylint: disable=broad-except
                print(f"[notify] Excepción enviando a {number}: {exc}")


async def notify_test_failure(
    test_title: str,
    error_message: str,
    current_url: str,
    context_url: Optional[str] = None,
    project_name: str = "Intramax",
    base_url: Optional[str] = None,
) -> None:
    message = _build_error_message(test_title, error_message, current_url, context_url, project_name, base_url)
    await _send_message(message)


async def notify_test_success(project_name: str = "Intramax", base_url: Optional[str] = None) -> None:
    message = _build_success_message(project_name, base_url)
    await _send_message(message)
