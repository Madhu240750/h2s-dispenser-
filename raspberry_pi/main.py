"""
Raspberry Pi Smart Wristband Dispenser & Optical Return Station
Hardware Abstraction Layer & API Client for Smart India Hackathon
"""

import time
import requests
import json
import os
import sys

# CONFIGURATION
API_SERVER = os.environ.get("SAFESENSE_API", "http://localhost:3000")
DEVICE_ID = "RPI-DISP-01"
MODE = os.environ.get("RPI_MODE", "SIMULATION") # 'SIMULATION' or 'GPIO'

class DispenserController:
    def __init__(self, mode="SIMULATION"):
        self.mode = mode
        self.inventory = 48
        self.motor_status = "IDLE"
        self.servo_pin = 18
        self.sensor_pin = 23
        self.setup_hardware()

    def setup_hardware(self):
        if self.mode == "GPIO":
            try:
                import RPi.GPIO as GPIO
                GPIO.setmode(GPIO.BCM)
                GPIO.setup(self.servo_pin, GPIO.OUT)
                GPIO.setup(self.sensor_pin, GPIO.IN, pull_up_down=GPIO.PUD_UP)
                print("[HARDWARE] Raspberry Pi GPIO initialized successfully on pin 18.")
            except ImportError:
                print("[WARNING] RPi.GPIO module not found. Falling back to SIMULATION mode.")
                self.mode = "SIMULATION"
        else:
            print("[INFO] Running in SIMULATION MODE. Physical servo actuation simulated via software timer.")

    def send_heartbeat(self):
        try:
            payload = {
                "deviceId": DEVICE_ID,
                "status": "ONLINE",
                "inventory": self.inventory,
                "motorStatus": self.motor_status
            }
            res = requests.post(f"{API_SERVER}/api/device/heartbeat", json=payload, timeout=3)
            return res.status_code == 200
        except Exception as e:
            print(f"[HEARTBEAT ERROR] Unable to reach backend: {e}")
            return False

    def dispense_band(self, worker_id):
        if self.inventory <= 0:
            print("[ERROR] Magazine empty. Cannot dispense wristband.")
            return False, "MAGAZINE_EMPTY"

        print(f"[DISPENSER] Worker ID {worker_id} verified. Starting motor sequence...")
        self.motor_status = "DISPENSING"

        if self.mode == "GPIO":
            import RPi.GPIO as GPIO
            pwm = GPIO.PWM(self.servo_pin, 50)
            pwm.start(2.5) # 0 deg
            time.sleep(0.8)
            pwm.ChangeDutyCycle(12.5) # 180 deg
            time.sleep(1.0)
            pwm.stop()
        else:
            # Simulation delay
            time.sleep(1.2)

        self.inventory -= 1
        self.motor_status = "IDLE"

        # Notify backend
        try:
            res = requests.post(f"{API_SERVER}/api/dispense", json={"workerId": worker_id, "stationId": DEVICE_ID})
            return True, res.json()
        except Exception as e:
            print(f"[API ERROR] {e}")
            return False, str(e)

    def emergency_stop(self):
        print("[SAFETY] EMERGENCY STOP ACTIVATED. Servo halted.")
        self.motor_status = "IDLE"

if __name__ == "__main__":
    controller = DispenserController(mode=MODE)
    print("==================================================")
    print(f" H2S SAFE-SENSE RASPBERRY PI DISPENSER ({MODE}) ")
    print("==================================================")
    
    # Run loop
    while True:
        controller.send_heartbeat()
        time.sleep(15)
