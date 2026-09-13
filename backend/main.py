"""
Passive Colorimetric H2S Dosimeter - FastAPI Backend Hub
Smart India Hackathon Prototype Architecture
"""

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
import numpy as np

app = FastAPI(
    title="H2S Safe-Sense Industrial Dosimeter API",
    description="Quantitative CIE L*a*b* optical colorimetric calibration & dispenser management",
    version="3.4.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- PYDANTIC SCHEMAS ---

class DispenseRequest(BaseModel):
    workerId: str
    stationId: str = "RPI-DISPENSER-01"

class ReturnScanRequest(BaseModel):
    workerId: str
    bandId: str
    exposure: float
    risk: str
    stationId: str = "RPI-KIOSK-01"
    rgb: Optional[Dict[str, int]] = None
    lab: Optional[Dict[str, str]] = None

class HeartbeatRequest(BaseModel):
    deviceId: str
    status: str
    inventory: int
    motorStatus: str

class CalibrationSampleInput(BaseModel):
    ppmH: float
    l: float
    a: float
    b: float
    sampleName: str
    notes: Optional[str] = None

# --- IN-MEMORY REPOSITORY (FIREBASE FIRESTORE SYNC READY) ---

WORKERS_DB = {
    "W001": {"id": "W001", "name": "Amit Sharma", "dept": "Crude Distillation (CDU-2)", "role": "Process Operator", "status": "ACTIVE_SHIFT", "bandId": "H2S-BAND-1092", "lastExposure": 2.5, "lastRisk": "LOW"},
    "W002": {"id": "W002", "name": "Priya Patel", "dept": "Sulfur Recovery Unit (SRU-3)", "role": "Field Chemist", "status": "ACTIVE_SHIFT", "bandId": "H2S-BAND-1144", "lastExposure": 14.8, "lastRisk": "MODERATE"},
    "W003": {"id": "W003", "name": "Rahul Kumar", "dept": "Refinery - Sector 4 Tank Farm", "role": "Process Operator", "status": "ACTIVE_SHIFT", "bandId": "H2S-BAND-00482", "lastExposure": 3.0, "lastRisk": "LOW"},
    "W004": {"id": "W004", "name": "Suresh Reddy", "dept": "Wastewater Stripping Facility", "role": "Maintenance Lead", "status": "COMPLETED_SHIFT", "bandId": "H2S-BAND-0988", "lastExposure": 38.5, "lastRisk": "HIGH"},
}

DISPENSERS_DB = {
    "RPI-DISP-01": {"deviceId": "RPI-DISP-01", "status": "ONLINE", "inventory": 48, "motorStatus": "IDLE", "lastHeartbeat": str(datetime.now())}
}

# --- REST ENDPOINTS ---

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "H2S Dosimeter FastAPI Hub",
        "timestamp": datetime.utcnow().isoformat(),
        "disclaimer": "The passive chemical sensing strip responds to H2S; camera analyzes colour response against calibrated data."
    }

@app.get("/api/workers")
def get_workers():
    return {"workers": list(WORKERS_DB.values())}

@app.post("/api/device/heartbeat")
def device_heartbeat(data: HeartbeatRequest):
    DISPENSERS_DB[data.deviceId] = {
        "deviceId": data.deviceId,
        "status": data.status,
        "inventory": data.inventory,
        "motorStatus": data.motorStatus,
        "lastHeartbeat": str(datetime.now())
    }
    return {"status": "ACK", "deviceId": data.deviceId}

@app.post("/api/dispenser/dispense")
def dispense_band(payload: DispenseRequest):
    worker = WORKERS_DB.get(payload.workerId)
    if not worker:
        raise HTTPException(status_code=404, detail="Worker ID not recognized in database")
    
    new_band_id = f"H2S-BAND-{np.random.randint(1000, 9999)}"
    now_str = datetime.now().strftime("%I:%M %p")
    worker["bandId"] = new_band_id
    worker["status"] = "ACTIVE_SHIFT"
    worker["checkInTime"] = now_str
    
    return {
        "success": True,
        "worker": worker,
        "bandId": new_band_id,
        "timestamp": now_str,
        "message": f"Band {new_band_id} dispensed for worker {worker['name']}"
    }

@app.post("/api/dispenser/return")
def return_band(payload: ReturnScanRequest):
    worker = WORKERS_DB.get(payload.workerId)
    if not worker:
        raise HTTPException(status_code=404, detail="Worker not found")
    
    now_str = datetime.now().strftime("%I:%M %p")
    worker["status"] = "COMPLETED_SHIFT"
    worker["lastExposure"] = payload.exposure
    worker["lastRisk"] = payload.risk
    worker["returnTime"] = now_str

    is_high_risk = payload.risk == "HIGH" or payload.exposure >= 20.0

    return {
        "success": True,
        "worker": worker,
        "exposure": payload.exposure,
        "risk": payload.risk,
        "requiresEmergencyAlert": is_high_risk
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
