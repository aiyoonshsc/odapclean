import cv2
import numpy as np
from fastapi import UploadFile

def order_points(pts):
    """
    Initializes a list of coordinates that will be ordered
    such that the first entry in the list is the top-left,
    the second entry is the top-right, the third is the
    bottom-right, and the fourth is the bottom-left
    """
    rect = np.zeros((4, 2), dtype="float32")

    # the top-left point will have the smallest sum, whereas
    # the bottom-right point will have the largest sum
    s = pts.sum(axis=1)
    rect[0] = pts[np.argmin(s)]
    rect[2] = pts[np.argmax(s)]

    # now, compute the difference between the points, the
    # top-right point will have the smallest difference,
    # whereas the bottom-left will have the largest difference
    diff = np.diff(pts, axis=1)
    rect[1] = pts[np.argmin(diff)]
    rect[3] = pts[np.argmax(diff)]

    return rect

def four_point_transform(image, pts):
    """
    Obtains a consistent order of the points and unpacks them
    individually
    """
    rect = order_points(pts)
    (tl, tr, br, bl) = rect

    # compute the width of the new image, which will be the
    # maximum distance between bottom-right and bottom-left
    # x-coordiates or the top-right and top-left x-coordinates
    widthA = np.sqrt(((br[0] - bl[0]) ** 2) + ((br[1] - bl[1]) ** 2))
    widthB = np.sqrt(((tr[0] - tl[0]) ** 2) + ((tr[1] - tl[1]) ** 2))
    maxWidth = max(int(widthA), int(widthB))

    # compute the height of the new image, which will be the
    # maximum distance between the top-right and bottom-right
    # y-coordinates or the top-left and bottom-left y-coordinates
    heightA = np.sqrt(((tr[0] - br[0]) ** 2) + ((tr[1] - br[1]) ** 2))
    heightB = np.sqrt(((tl[0] - bl[0]) ** 2) + ((tl[1] - bl[1]) ** 2))
    maxHeight = max(int(heightA), int(heightB))

    # now that we have the dimensions of the new image, construct
    # the set of destination points to obtain a "birds eye view",
    # (i.e. top-down view) of the image, again specifying points
    # in the top-left, top-right, bottom-right, and bottom-left
    # order
    dst = np.array([
        [0, 0],
        [maxWidth - 1, 0],
        [maxWidth - 1, maxHeight - 1],
        [0, maxHeight - 1]], dtype="float32")

    # compute the perspective transform matrix and then apply it
    M = cv2.getPerspectiveTransform(rect, dst)
    warped = cv2.warpPerspective(image, M, (maxWidth, maxHeight))

    # return the warped image
    return warped

async def auto_crop_image(file_data: bytes) -> bytes:
    """
    Detects the largest quadrilateral contour in the image and performs
    a perspective transform to crop it.
    """
    # Convert bytes to numpy array
    nparr = np.frombuffer(file_data, np.uint8)
    image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    
    if image is None:
        raise ValueError("Could not decode image")

    # Resize for faster processing (keep ratio)
    # We process on a smaller image but crop the original
    ratio = image.shape[0] / 500.0
    orig = image.copy()
    image_small = cv2.resize(image, (int(image.shape[1] / ratio), 500))

    # Convert to grayscale, blur, and find edges
    gray = cv2.cvtColor(image_small, cv2.COLOR_BGR2GRAY)
    gray = cv2.GaussianBlur(gray, (5, 5), 0)
    edged = cv2.Canny(gray, 75, 200)

    # Find contours
    cnts = cv2.findContours(edged.copy(), cv2.RETR_LIST, cv2.CHAIN_APPROX_SIMPLE)
    cnts = cnts[0] if len(cnts) == 2 else cnts[1]
    cnts = sorted(cnts, key=cv2.contourArea, reverse=True)[:5]

    screenCnt = None

    # Loop over the contours to find the document
    for c in cnts:
        # Approximate the contour
        peri = cv2.arcLength(c, True)
        approx = cv2.approxPolyDP(c, 0.02 * peri, True)

        # If our approximated contour has 4 points, then we can assume we found the screen
        if len(approx) == 4:
            screenCnt = approx
            break

    if screenCnt is None:
        # If no quadrilateral found, return original image (or maybe just Canny for debug?)
        # For now, return original to avoid breaking
        return file_data

    # Apply the four point transform to obtain a top-down view of the original image
    warped = four_point_transform(orig, screenCnt.reshape(4, 2) * ratio)

    # Convert to grayscale for "scanned" look (optional, maybe keep color for problems)
    # warped = cv2.cvtColor(warped, cv2.COLOR_BGR2GRAY)
    
    # Simple threshold to make it look like a scan (optional)
    # T = threshold_local(warped, 11, offset = 10, method = "gaussian")
    # warped = (warped > T).astype("uint8") * 255

    # Encode back to bytes
    success, encoded_image = cv2.imencode('.jpg', warped)
    if not success:
        raise ValueError("Could not encode processed image")
        
    return encoded_image.tobytes()

def detect_document_bounds(file_data: bytes) -> dict:
    """
    Detects the document in the image and returns the bounding box coordinates
    (x, y, width, height) relative to the original image size.
    """
    # Convert bytes to numpy array
    nparr = np.frombuffer(file_data, np.uint8)
    image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    
    if image is None:
        raise ValueError("Could not decode image")

    # Resize for faster processing
    ratio = image.shape[0] / 500.0
    image_small = cv2.resize(image, (int(image.shape[1] / ratio), 500))

    # Convert to grayscale, blur, and find edges
    gray = cv2.cvtColor(image_small, cv2.COLOR_BGR2GRAY)
    gray = cv2.GaussianBlur(gray, (5, 5), 0)
    edged = cv2.Canny(gray, 75, 200)

    # Find contours
    cnts = cv2.findContours(edged.copy(), cv2.RETR_LIST, cv2.CHAIN_APPROX_SIMPLE)
    cnts = cnts[0] if len(cnts) == 2 else cnts[1]
    cnts = sorted(cnts, key=cv2.contourArea, reverse=True)[:5]

    found_cnt = None

    # Loop over the contours to find the document
    for c in cnts:
        # Approximate the contour
        peri = cv2.arcLength(c, True)
        approx = cv2.approxPolyDP(c, 0.02 * peri, True)

        # Prefer 4 points, but take the largest significant contour if not
        if len(approx) == 4:
            found_cnt = approx
            break
            
    if found_cnt is None and len(cnts) > 0:
        # Fallback to largest contour
        found_cnt = cnts[0]

    if found_cnt is None:
        # Return full image bounds if nothing found
        return {
            "x": 0,
            "y": 0,
            "width": image.shape[1],
            "height": image.shape[0]
        }

    # Get bounding rect of the contour
    x, y, w, h = cv2.boundingRect(found_cnt)

    # Scale back to original size
    return {
        "x": int(x * ratio),
        "y": int(y * ratio),
        "width": int(w * ratio),
        "height": int(h * ratio)
    }
