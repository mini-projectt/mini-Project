import cv2
import numpy as np
from skimage.metrics import structural_similarity as ssim
import sys
import json
import os

def analyze_damage(before_path, after_path):
    """Combines SSIM with highly sensitive Absolute Difference for scratch detection."""
    if not os.path.exists(before_path) or not os.path.exists(after_path):
        return 0.0 # Return 0 if files are missing to trigger a fail-safe

    img1 = cv2.imread(before_path)
    img2 = cv2.imread(after_path)

    # Force both images to the exact same dimensions
    img1 = cv2.resize(img1, (600, 600))
    img2 = cv2.resize(img2, (600, 600))

    gray1 = cv2.cvtColor(img1, cv2.COLOR_BGR2GRAY)
    gray2 = cv2.cvtColor(img2, cv2.COLOR_BGR2GRAY)

    # --- Phase 1: Structural Similarity (Good for big dents/cracks) ---
    score, _ = ssim(gray1, gray2, full=True)
    base_score = score * 100

    # --- Phase 2: Absolute Difference (Hyper-sensitive to scratches) ---
    # 1. Blur slightly to remove microscopic camera noise/dust
    blur1 = cv2.GaussianBlur(gray1, (5, 5), 0)
    blur2 = cv2.GaussianBlur(gray2, (5, 5), 0)

    # 2. Subtract the images to find exact pixel changes
    diff = cv2.absdiff(blur1, blur2)

    # 3. Thresholding: Only care if the pixel changed color drastically
    _, thresh = cv2.threshold(diff, 25, 255, cv2.THRESH_BINARY)
    
    # 4. Dilate to connect broken pieces of a scratch into one solid line
    kernel = np.ones((3,3), np.uint8)
    thresh = cv2.dilate(thresh, kernel, iterations=1)

    # 5. Calculate exactly how many pixels belong to the scratch
    defects = cv2.countNonZero(thresh)
    total_pixels = 600 * 600
    defect_ratio = (defects / total_pixels) * 100

    # --- Phase 3: The Penalty Math ---
    penalty = defect_ratio * 8 
    final_score = base_score - penalty 
    
    # Ensure the score stays within 0 to 100
    return max(0.0, round(final_score, 2))

if __name__ == "__main__":
    # Similarity threshold: Anything below 90 is likely damaged.
    DAMAGE_THRESHOLD = 90.0 
    
    # MODE 1: Node.js API Mode (Express passes exactly 8 paths)
    if len(sys.argv) == 9:
        pairs = {
            "Front": (sys.argv[1], sys.argv[2]),
            "Back":  (sys.argv[3], sys.argv[4]),
            "Left":  (sys.argv[5], sys.argv[6]),
            "Right": (sys.argv[7], sys.argv[8])
        }
        
    # MODE 2: Local Testing Mode (You just ran 'python damage_detector.py' in the terminal)
    elif len(sys.argv) == 1:
        # We don't want this print statement breaking the JSON if Node catches it, 
        # but since this only runs locally, it's safe and helpful!
        print("[INFO] Running in Local Testing Mode...")
        pairs = {
            "Front": ("front_before.png", "front_after.png"),
            "Back":  ("back_before.png", "back_after.png"),
            "Left":  ("left_before.png", "left_after.png"),
            "Right": ("right_before.png", "right_after.png")
        }
        
        # Fail-safe: Check if you actually put the 8 images in the folder
        missing = False
        for side, (b, a) in pairs.items():
            if not os.path.exists(b) or not os.path.exists(a):
                print(f"[WARNING] Missing images for {side}. Expected '{b}' and '{a}'")
                missing = True
        if missing:
            print("\n[ERROR] Add the missing testing images to this folder and try again.")
            sys.exit(1)
            
    else:
        print(json.dumps({"error": "Invalid arguments. Provide exactly 8 paths for API or 0 for local test."}))
        sys.exit(1)

    # --- Run the Math ---
    scan_results = {}
    is_damaged = False
    damaged_sides = []

    for side, (before_img, after_img) in pairs.items():
        score = analyze_damage(before_img, after_img)
        scan_results[side] = score
        
        if score < DAMAGE_THRESHOLD:
            is_damaged = True
            damaged_sides.append(side)

    # --- Formatted Outputs ---
    # If Node.js called it, print strict JSON
    if len(sys.argv) == 9:
        final_report = {
            "damage_detected": is_damaged,
            "damaged_sides": damaged_sides,
            "scores": scan_results,
        }
        print(json.dumps(final_report))
        
    # If you called it locally, print a nice, readable terminal report
    else:
        print("\n=== 360 DAMAGE SCAN COMPLETE ===")
        print(f"Status: {'[WARNING] DAMAGE DETECTED' if is_damaged else '[OK] ALL SIDES CLEAN'}")
        if is_damaged:
            print(f"Damaged Sides: {', '.join(damaged_sides)}")
        print("\nSimilarity Scores:")
        for s, sc in scan_results.items():
            print(f" - {s}: {sc}%")
