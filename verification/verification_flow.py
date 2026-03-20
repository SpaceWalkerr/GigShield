import cv2
import sys
sys.modules['tensorflow'] = None
import mediapipe as mp
import time
import requests
import geocoder
import os
import numpy as np
from fractions import Fraction
from PIL import Image

def get_gps_location():
    """Get GPS via IP geolocation (best for desktop without GPS receiver)."""
    try:
        g = geocoder.ip('me')
        if g.latlng:
            return g.latlng[0], g.latlng[1]
    except Exception as e:
        print(f"GPS error: {e}")
    return 0.0, 0.0

def get_weather(lat, lon):
    """Fetches exact current weather according to latitude and longitude."""
    # Primary: wttr.in for hyper-local accurate current conditions
    try:
        url = f"https://wttr.in/{lat},{lon}?format=j1"
        headers = {'User-Agent': 'curl/7.81.0'} # Required to prevent block from default Python agent
        response = requests.get(url, headers=headers, timeout=5).json()
        current = response["current_condition"][0]
        temp = current.get("temp_C", "N/A")
        wind = current.get("windspeedKmph", "N/A")
        return {"temp": temp, "wind": wind}
    except Exception as e:
        print(f"wttr.in error: {e}, falling back to Open-Meteo...")
        
    # Fallback: Open-Meteo with modernized V1 parameters
    try:
        url = f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&current=temperature_2m,wind_speed_10m&timezone=auto&models=best_match"
        response = requests.get(url, timeout=5).json()
        if "current" in response:
            current_data = response["current"]
            temp = current_data.get("temperature_2m", "N/A")
            wind = current_data.get("wind_speed_10m", "N/A")
            return {"temp": temp, "wind": wind}
    except Exception as e:
        print(f"Open-Meteo API error: {e}")
        
    return {"temp": "N/A", "wind": "N/A"}

def convert_to_degrees(value):
    """Helper to convert decimal coordinates to degrees, minutes, seconds for EXIF"""
    d = int(value)
    m = int((value - d) * 60)
    s = (value - d - m/60) * 3600.0
    return ((d, 1), (m, 1), (int(s*100), 100))

def embed_exif_gps(image_path, lat, lon):
    """Embeds GPS EXIF tags into a JPEG image."""
    try:
        import piexif
        exif_dict = {"GPS": {}}
        
        lat_deg = convert_to_degrees(abs(lat))
        lon_deg = convert_to_degrees(abs(lon))
        
        exif_dict["GPS"][piexif.GPSIFD.GPSLatitudeRef] = 'N' if lat >= 0 else 'S'
        exif_dict["GPS"][piexif.GPSIFD.GPSLatitude] = lat_deg
        exif_dict["GPS"][piexif.GPSIFD.GPSLongitudeRef] = 'E' if lon >= 0 else 'W'
        exif_dict["GPS"][piexif.GPSIFD.GPSLongitude] = lon_deg
        
        exif_bytes = piexif.dump(exif_dict)
        
        im = Image.open(image_path)
        im.save(image_path, "jpeg", exif=exif_bytes)
        print("✅ EXIF data embedded successfully.")
    except ImportError:
        print("⚠️  piexif not installed. Run 'pip install piexif' to enable EXIF embedding.")
    except Exception as e:
        print(f"⚠️  Failed to embed EXIF data: {e}")

def main():
    print("Initializing Hand Tracker...")
    mp_hands = mp.solutions.hands
    hands = mp_hands.Hands(min_detection_confidence=0.7, min_tracking_confidence=0.5)
    mp_draw = mp.solutions.drawing_utils

    print("Opening Camera...")
    cap = cv2.VideoCapture(0)
    
    if not cap.isOpened():
        print("Error: Could not open camera.")
        return

    print("================================")
    print("📸 Show your hand to the camera to trigger capture.")
    print("Hold it for 3 seconds...")
    print("Press ESC to exit.")
    print("================================")
    
    capture_triggered = False
    trigger_start_time = 0
    trigger_duration = 3  # seconds to hold gesture
    
    captured_frame = None

    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            print("Failed to grab frame.")
            break
            
        # Flip the frame horizontally for a selfie-view display
        frame = cv2.flip(frame, 1)    
        frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = hands.process(frame_rgb)
        
        if results.multi_hand_landmarks:
            for hand_landmarks in results.multi_hand_landmarks:
                mp_draw.draw_landmarks(frame, hand_landmarks, mp_hands.HAND_CONNECTIONS)
            
            if not capture_triggered:
                if trigger_start_time == 0:
                    trigger_start_time = time.time()
                elif time.time() - trigger_start_time >= trigger_duration:
                    capture_triggered = True
                    captured_frame = frame.copy()
                    break
                else:
                    countdown = trigger_duration - int(time.time() - trigger_start_time)
                    text = f"Capturing in {countdown}..."
                    (tw, th), _ = cv2.getTextSize(text, cv2.FONT_HERSHEY_DUPLEX, 1, 2)
                    cv2.rectangle(frame, (40, 50 - th - 10), (40 + tw + 20, 50 + 10), (0, 0, 0), -1)
                    cv2.putText(frame, text, (50, 50), cv2.FONT_HERSHEY_DUPLEX, 1, (0, 255, 0), 2)
        else:
            trigger_start_time = 0
            
        cv2.imshow('Camera - Hand Gesture Trigger', frame)
        if cv2.waitKey(1) & 0xFF == 27: # Esc key
            break
            
        if capture_triggered:
            break
            
    cap.release()
    cv2.destroyAllWindows()
    
    if not capture_triggered or captured_frame is None:
        print("❌ No capture made.")
        return
        
    print("\n✅ Image captured via hand gesture!")
    
    # ---------------------------------------------------------
    # 2. Get GPS
    # ---------------------------------------------------------
    print("🛰️ Fetching GPS Location...")
    lat, lon = get_gps_location()
    print(f"📍 Location: Lat {lat:.4f}, Lon {lon:.4f}")
    
    # ---------------------------------------------------------
    # 3. Save Image & Geotag
    # ---------------------------------------------------------
    base_dir = os.path.dirname(os.path.abspath(__file__))
    save_path = os.path.join(base_dir, "captured_verification.jpg")
    cv2.imwrite(save_path, captured_frame)
    print(f"💾 Image saved to {save_path}")
    
    embed_exif_gps(save_path, lat, lon)
        
    # ---------------------------------------------------------
    # 4. Call Weather API
    # ---------------------------------------------------------
    print("🌤️ Fetching Weather Data...")
    weather_info = get_weather(lat, lon)
    temp = weather_info["temp"]
    wind = weather_info["wind"]
    print(f"🌡️ Weather - Temp: {temp} C, Wind: {wind} km/h")
    
    # ---------------------------------------------------------
    # 5. Show Result
    # ---------------------------------------------------------
    result_img = captured_frame.copy()
    h, w, c = result_img.shape
    
    # Create a modern dashboard at the bottom
    dashboard_h = 140
    dashboard = np.zeros((dashboard_h, w, c), dtype=np.uint8)
    dashboard[:] = (35, 30, 30)  # Dark grayish BGR background

    # Top border for dashboard
    cv2.line(dashboard, (0, 0), (w, 0), (255, 200, 100), 3)

    font = cv2.FONT_HERSHEY_DUPLEX
    
    # --- Location Panel ---
    cv2.putText(dashboard, "LOCATION DATA", (30, 35), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (150, 150, 150), 1)
    cv2.putText(dashboard, f"LAT : {lat:.5f}", (30, 75), font, 0.7, (255, 220, 180), 1)
    cv2.putText(dashboard, f"LON : {lon:.5f}", (30, 115), font, 0.7, (255, 220, 180), 1)
    
    # --- Separator Line ---
    center_x = w // 2 - 20
    cv2.line(dashboard, (center_x, 20), (center_x, dashboard_h - 20), (100, 100, 100), 1)
    
    # --- Weather Panel ---
    cv2.putText(dashboard, "CURRENT ENVIRONMENT", (center_x + 30, 35), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (150, 150, 150), 1)
    
    temp_text = f"TEMP : {temp} C" if temp != "N/A" else "TEMP : N/A"
    wind_text = f"WIND : {wind} km/h" if wind != "N/A" else "WIND : N/A"
    
    cv2.putText(dashboard, temp_text, (center_x + 30, 75), font, 0.7, (100, 230, 255), 1)  # Yellow/Blueish
    cv2.putText(dashboard, wind_text, (center_x + 30, 115), font, 0.7, (150, 255, 150), 1) # Greenish
    
    # Combine image and dashboard
    final_ui = np.vstack((result_img, dashboard))
    
    print("\n🖥️ Showing Final Result Window. Close the window to exit.")
    cv2.imshow('Verification Result (Location + Weather + Image)', final_ui)
    cv2.waitKey(0)
    cv2.destroyAllWindows()

if __name__ == "__main__":
    main()
