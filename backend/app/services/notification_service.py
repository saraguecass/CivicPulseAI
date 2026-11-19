import json
from app.config import settings

def send_push_notification(subscription_info: dict, title: str, body: str, url: str = "/"):
    """
    Envía una notificación push mediante la Web Push API.
    Si no hay claves VAPID configuradas, muestra una traza en el log para desarrollo.
    """
    payload = json.dumps({
        "title": title,
        "body": body,
        "url": url,
        "icon": "/favicon.svg",
        "tag": "parking-alert"
    })

    if not settings.VAPID_PRIVATE_KEY or not settings.VAPID_PUBLIC_KEY:
        print(f"[PUSH SIMULADO] Dispositivo: {subscription_info.get('endpoint', 'anon')[:30]}...")
        print(f"[PUSH SIMULADO] Título: {title} | Mensaje: {body}")
        return True

    try:
        from pywebpush import webpush, WebPushException
        webpush(
            subscription_info=subscription_info,
            data=payload,
            vapid_private_key=settings.VAPID_PRIVATE_KEY,
            vapid_claims={"sub": settings.VAPID_CLAIM_EMAIL}
        )
        print(f"[PUSH ENVIADO] {title} -> {subscription_info.get('endpoint', '')[:30]}...")
        return True
    except Exception as e:
        print(f"[PUSH ERROR] Error enviando web push: {e}")
        return False
