# H₂S SAFE-SENSE: Passive Colorimetric Dosimeter Ecosystem

> **Smart India Hackathon Prototype**  
> Passive Colorimetric H₂S Exposure Dosimeter Wristband with AI-Based Quantitative Reading and Smart Raspberry Pi Dispenser.

---

## 🔬 CRITICAL SCIENTIFIC & SAFETY NOTICE

1. **The chemical strip responds to H₂S, not the camera.**  
   The dosimeter wristband incorporates a passive chemical reagent strip (e.g. lead acetate or organometallic indicator). When airborne Hydrogen Sulfide ($H_2S$) gas diffuses onto the patch, a chemical complexation reaction occurs, yielding a quantifiable optical color shift from pale ivory/tan toward dark brownish-black ($PbS$).
2. **The camera/software does NOT detect gas directly.**  
   The software performs spectrophotometric color analysis ($CIE\ L^*a^*b^*$ and $HSV$) on the captured image and maps the optical coordinates against calibrated laboratory reference curves to estimate cumulative exposure ($ppm\cdot h$).
3. **Prototype Research Disclaimer:**  
   This application is a proof-of-concept prototype for Hackathon demonstration and must **NOT** be presented as a certified industrial safety gas detector or a replacement for certified personal gas monitors ($PID$, electrochemical badges).

---

## 🏗️ ECOSYSTEM ARCHITECTURE

```
                  ┌─────────────────────┐
                  │   H₂S ENVIRONMENT   │
                  └──────────┬──────────┘
                             ↓
                  ┌─────────────────────┐
                  │ PASSIVE COLORIMETRIC│
                  │ H₂S WRISTBAND       │
                  └──────────┬──────────┘
                             ↓
                  ┌─────────────────────┐
                  │ WORKER SMARTPHONE   │
                  │ CAMERA SCANNER      │
                  └──────────┬──────────┘
                             ↓
                  ┌─────────────────────┐
                  │ BACKEND / API       │
                  │ FASTAPI / EXPRESS   │
                  └──────────┬──────────┘
                             ↓
                  ┌─────────────────────┐
                  │ OPENCV + AI/ML      │
                  │ COLOUR ANALYSIS     │
                  └──────────┬──────────┘
                             ↓
                  ┌─────────────────────┐
                  │ DATABASE            │
                  │ FIREBASE FIRESTORE  │
                  └──────────┬──────────┘
                             ↓
           ┌─────────────────┴─────────────────┐
           ↓                                   ↓
  ┌──────────────────┐              ┌────────────────────┐
  │ WORKER PWA       │              │ SAFETY SUPERVISOR  │
  │                  │              │ & ADMIN CONSOLE    │
  │ Exposure History │              │ Real-time Roster   │
  │ Band QR Token    │              │ Exposure Analytics │
  │ Camera Scanner   │              │ Emergency Alarms   │
  └──────────────────┘              └────────────────────┘
                       ↑
                       │
                ┌───────────────┐
                │ RASPBERRY PI  │
                │ DISPENSER     │
                └───────────────┘
```

---

## 👶 BEGINNER EXPLANATION: HOW THE FLOW WORKS

### Flow 1: Smartphone Color Analysis
1. **PHONE:** Worker opens the Web App on their smartphone browser (`/` with Worker Mobile view).
2. **FRONTEND:** React accesses the phone camera via WebRTC `navigator.mediaDevices.getUserMedia`.
3. **IMAGE CHECK:** The browser measures blur (gradient variance) and average luminance to verify adequate focus and lighting.
4. **API:** The image patch coordinates and RGB data are sent to the Backend via REST API (`POST /api/return-scan`).
5. **AI / OPENCV:** Color coordinates are converted to $CIE\ L^*a^*b^*$ and evaluated against the calibration regression model.
6. **DATABASE:** The computed exposure ($ppm\cdot h$) and risk level (`LOW`, `MODERATE`, `HIGH`) are stored in Firebase Firestore.
7. **DASHBOARDS:** Both the Worker App and the Host Supervisor Station immediately update via real-time events.

### Flow 2: Smart Raspberry Pi Dispenser
1. **WORKER ARRIVAL:** Worker taps their RFID badge or enters Worker ID (`W003`) at the kiosk.
2. **VERIFICATION:** Pi queries the Backend API (`POST /api/dispense`).
3. **INVENTORY CHECK:** Backend verifies magazine count and allocates a fresh band ID (`H2S-BAND-00482`).
4. **SERVO ACTUATION:** Raspberry Pi GPIO pin 18 signals the servo motor to rotate, dropping one wristband through the chute.
5. **ACTIVATION:** Database marks band as `ACTIVE` with current clock-in timestamp.

---

## 💻 HOW TO RUN EVERYTHING

### 1. Web Application (Frontend & Backend Server)
The full-stack application runs using Node.js / TypeScript:
```bash
# Install dependencies
npm install

# Start development server on port 3000
npm run dev
```

### 2. Python FastAPI Backend (Alternative Standalone)
Located in `backend/main.py`:
```bash
cd backend
pip install fastapi uvicorn pydantic numpy
python main.py
# Interactive Swagger docs available at http://localhost:8000/docs
```

### 3. Raspberry Pi Client Script
Located in `raspberry_pi/main.py`:
```bash
cd raspberry_pi
pip install requests RPi.GPIO opencv-python
python main.py
```
*(By default runs in `SIMULATION` mode so you can run it on your laptop without physical GPIO hardware! Set `RPI_MODE=GPIO` when running on a physical Raspberry Pi).*

---

## 🧪 STEP-BY-STEP COMPLETE DEMONSTRATION WORKFLOW

1. **Open the Kiosk:** Click **"Raspberry Pi Kiosk"** in the top navigation bar.
2. **Dispense a Wristband:** Select worker **"Vikram Singh (W005)"** and click **"Dispense Wristband"**. Watch the servo actuator progress bar.
3. **Switch to Worker App:** Click **"Worker Mobile App"**. Observe that Vikram Singh is now active on shift with assigned wristband ID.
4. **Perform a Scan:**
   - Tap **"Scan Strip Now"** on the Worker App or switch to **"Return Scanner"** on the Raspberry Pi Kiosk.
   - Choose the **"High Exposure"** reference patch (30 ppm·h).
   - Click **"Analyze Strip Colorimetry"**.
5. **Observe Instant Alert:**
   - A high-risk alarm banner appears.
   - The Web Audio industrial siren sounds.
   - A system browser notification is dispatched.
   - The **Safety Supervisor Portal** marks the worker with a **CRITICAL HAZARD ALERT** badge requiring immediate medical evaluation.
