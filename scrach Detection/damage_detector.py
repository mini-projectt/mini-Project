import cv2
import numpy as np
import sys
import json
import os


# =========================================================
# Align both images to reduce small camera shifts
# =========================================================

def align_images(im1, im2):
    gray1 = cv2.cvtColor(im1, cv2.COLOR_BGR2GRAY)
    gray2 = cv2.cvtColor(im2, cv2.COLOR_BGR2GRAY)

    gray1 = gray1.astype(np.float32) / 255.0
    gray2 = gray2.astype(np.float32) / 255.0

    warp_matrix = np.eye(2, 3, dtype=np.float32)

    criteria = (
        cv2.TERM_CRITERIA_EPS | cv2.TERM_CRITERIA_COUNT,
        5000,
        1e-7
    )

    try:
        # Translation works better for slight handheld movement
        _, warp_matrix = cv2.findTransformECC(
            gray1,
            gray2,
            warp_matrix,
            cv2.MOTION_TRANSLATION,
            criteria
        )

        aligned = cv2.warpAffine(
            im2,
            warp_matrix,
            (im1.shape[1], im1.shape[0]),
            flags=cv2.INTER_LINEAR + cv2.WARP_INVERSE_MAP,
            borderMode=cv2.BORDER_REPLICATE
        )

        return aligned

    except:
        return im2


# =========================================================
# Extract the main object from the image
# =========================================================

def extract_object_mask(img, size=600):

    margin = int(size * 0.15)

    rect = (
        margin,
        margin,
        size - 2 * margin,
        size - 2 * margin
    )

    mask = np.zeros((size, size), np.uint8)

    bgd_model = np.zeros((1, 65), np.float64)
    fgd_model = np.zeros((1, 65), np.float64)

    try:
        cv2.grabCut(
            img,
            mask,
            rect,
            bgd_model,
            fgd_model,
            5,
            cv2.GC_INIT_WITH_RECT
        )

    except:
        # Fallback mask if grabCut fails
        fallback = np.zeros((size, size), np.uint8)

        cv2.rectangle(
            fallback,
            (margin, margin),
            (size - margin, size - margin),
            255,
            -1
        )

        return fallback

    object_mask = np.where(
        (mask == cv2.GC_FGD) |
        (mask == cv2.GC_PR_FGD),
        255,
        0
    ).astype(np.uint8)

    # Remove small noisy regions
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (15, 15))

    object_mask = cv2.morphologyEx(
        object_mask,
        cv2.MORPH_CLOSE,
        kernel,
        iterations=3
    )

    # Keep only the biggest detected region
    num_labels, labels, stats, _ = cv2.connectedComponentsWithStats(
        object_mask,
        connectivity=8
    )

    if num_labels > 1:
        largest_label = 1 + np.argmax(stats[1:, cv2.CC_STAT_AREA])

        object_mask = np.where(
            labels == largest_label,
            255,
            0
        ).astype(np.uint8)

    # Ignore masks that are too small
    if np.count_nonzero(object_mask) / (size * size) < 0.05:
        fallback = np.zeros((size, size), np.uint8)

        cv2.rectangle(
            fallback,
            (margin, margin),
            (size - margin, size - margin),
            255,
            -1
        )

        return fallback

    return object_mask


# =========================================================
# Compare before and after images
# =========================================================

def analyze_damage(before_path, after_path):

    if not os.path.exists(before_path) or not os.path.exists(after_path):
        return 0.0

    img1 = cv2.imread(before_path)
    img2 = cv2.imread(after_path)

    if img1 is None or img2 is None:
        return 0.0

    SIZE = 600

    img1 = cv2.resize(img1, (SIZE, SIZE))
    img2 = cv2.resize(img2, (SIZE, SIZE))

    aligned_img2 = align_images(img1, img2)

    object_mask = extract_object_mask(img1, SIZE)

    # Shrink edges to avoid false detections near borders
    erode_kernel = np.ones((30, 30), np.uint8)

    object_mask = cv2.erode(
        object_mask,
        erode_kernel,
        iterations=1
    )

    gray1 = cv2.cvtColor(img1, cv2.COLOR_BGR2GRAY)
    gray2 = cv2.cvtColor(aligned_img2, cv2.COLOR_BGR2GRAY)

    # Improve contrast before comparison
    clahe = cv2.createCLAHE(
        clipLimit=2.0,
        tileGridSize=(8, 8)
    )

    cl1 = clahe.apply(gray1)
    cl2 = clahe.apply(gray2)

    # Smooth texture and lighting variations
    blur1 = cv2.GaussianBlur(cl1, (25, 25), 0)
    blur2 = cv2.GaussianBlur(cl2, (25, 25), 0)

    diff = cv2.absdiff(blur1, blur2)

    # Ignore tiny brightness differences
    _, thresh = cv2.threshold(
        diff,
        50,
        255,
        cv2.THRESH_BINARY
    )

    kernel = np.ones((5, 5), np.uint8)

    thresh = cv2.morphologyEx(
        thresh,
        cv2.MORPH_OPEN,
        kernel
    )

    thresh = cv2.morphologyEx(
        thresh,
        cv2.MORPH_CLOSE,
        kernel
    )

    thresh_masked = cv2.bitwise_and(
        thresh,
        object_mask
    )

    object_pixels = cv2.countNonZero(object_mask)

    if object_pixels == 0:
        return 100.0

    defect_pixels = cv2.countNonZero(thresh_masked)

    defect_ratio = (
        defect_pixels / object_pixels
    ) * 100

    # Convert defect percentage into similarity score
    penalty = defect_ratio * 2.5

    final_score = 100.0 - penalty

    final_score = max(
        0.0,
        min(100.0, round(final_score, 2))
    )

    return final_score


# =========================================================
# Main execution
# =========================================================

if __name__ == "__main__":

    DAMAGE_THRESHOLD = 75.0

    if len(sys.argv) == 9:

        pairs = {
            "Front": (sys.argv[1], sys.argv[2]),
            "Back":  (sys.argv[3], sys.argv[4]),
            "Left":  (sys.argv[5], sys.argv[6]),
            "Right": (sys.argv[7], sys.argv[8])
        }

    elif len(sys.argv) == 1:

        print("[INFO] Running 360 Damage Detector...")

        pairs = {
            "Front": ("before_front.png", "after_front.png"),
            "Back":  ("before_back.png", "after_back.png"),
            "Left":  ("before_left.png", "after_left.png"),
            "Right": ("before_right.png", "after_right.png")
        }

    else:
        print(json.dumps({
            "error": "Invalid arguments"
        }))

        sys.exit(1)

    scan_results = {}
    is_damaged = False
    damaged_sides = []

    # Run damage check for all sides
    for side, (before_img, after_img) in pairs.items():

        score = analyze_damage(
            before_img,
            after_img
        )

        scan_results[side] = score

        if score < DAMAGE_THRESHOLD:
            is_damaged = True
            damaged_sides.append(side)

    # JSON output mode
    if len(sys.argv) == 9:

        final_report = {
            "damage_detected": is_damaged,
            "damaged_sides": damaged_sides,
            "scores": scan_results
        }

        print(json.dumps(final_report))

    # Console output mode
    else:

        print("\n=== 360 DAMAGE SCAN COMPLETE ===")

        print(
            f"Status: {'[WARNING] DAMAGE DETECTED' if is_damaged else '[OK] ALL SIDES CLEAN'}"
        )

        if is_damaged:
            print(
                f"Damaged Sides: {', '.join(damaged_sides)}"
            )

        print("\nSimilarity Scores:")

        for side, score in scan_results.items():
            print(f" - {side}: {score}%")