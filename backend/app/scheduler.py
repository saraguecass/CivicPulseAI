import json
from datetime import datetime
from apscheduler.schedulers.background import BackgroundScheduler
from app.database import SessionLocal
from app.models import ActiveParking
from app.services.notification_service import send_push_notification

scheduler = BackgroundScheduler()

def check_pending_parking_alerts():
    """
    Tarea periódica (cada minuto):
    Busca estacionamientos activos cuyo tiempo actual haya alcanzado o superado alert_time
    (30 minutos antes de fin) y aún no hayan recibido la notificación.
    """
    db = SessionLocal()
    try:
        now = datetime.utcnow()
        # Estacionamientos donde ya es hora del aviso y aún no ha finalizado
        pending = db.query(ActiveParking).filter(
            ActiveParking.alert_time <= now,
            ActiveParking.end_time > now,
            ActiveParking.notification_sent == False
        ).all()

        for parking in pending:
            minutos = max(1, int((parking.end_time - now).total_seconds() / 60))
            title = "⚠️ Aviso de Estacionamiento SER"
            body = f"¡Te quedan ~{minutos} minutos de estacionamiento en {parking.calle or 'tu ubicación'}!"
            
            sub_dict = None
            if parking.push_subscription:
                try:
                    sub_dict = json.loads(parking.push_subscription)
                except Exception:
                    pass

            if sub_dict:
                send_push_notification(sub_dict, title, body, url="/")
            else:
                print(f"[Scheduler] Aviso pendiente sin suscripción push para estacionamiento #{parking.id}: {body}")

            parking.notification_sent = True
            db.commit()

    except Exception as e:
        print(f"[Scheduler Error] Error en revisión de avisos: {e}")
    finally:
        db.close()

def start_scheduler():
    if not scheduler.running:
        scheduler.add_job(
            check_pending_parking_alerts,
            "interval",
            seconds=60,
            id="check_parking_alerts",
            replace_existing=True
        )
        scheduler.start()
        print("[Scheduler] Programador de avisos de 30 min iniciado (intervalo: 60s).")

def stop_scheduler():
    if scheduler.running:
        scheduler.shutdown(wait=False)
        print("[Scheduler] Programador de avisos detenido.")
