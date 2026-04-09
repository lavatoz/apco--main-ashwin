import sys
import face_recognition
import json
import os

def find_matches(selfie_path, gallery_paths):
    try:
        # Load the selfie
        if not os.path.exists(selfie_path):
            return {"error": f"Selfie file not found: {selfie_path}"}
            
        selfie_image = face_recognition.load_image_file(selfie_path)
        selfie_encodings = face_recognition.face_encodings(selfie_image)
        
        if len(selfie_encodings) == 0:
            return {"error": "No face detected in selfie. Please try another photo."}
        
        selfie_encoding = selfie_encodings[0]
        matches = []
        
        for img_path in gallery_paths:
            if not os.path.exists(img_path):
                continue
                
            try:
                gallery_image = face_recognition.load_image_file(img_path)
                gallery_encodings = face_recognition.face_encodings(gallery_image)
                
                for gen_encoding in gallery_encodings:
                    results = face_recognition.compare_faces([selfie_encoding], gen_encoding, tolerance=0.6)
                    if results[0]:
                        matches.append(img_path)
                        break # Found a match in this image, move to next image
            except Exception as e:
                # Skip images that can't be processed (e.g. not an image, corrupted)
                continue
                
        return {"matches": matches}
    except Exception as e:
        return {"error": str(e)}

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Usage: python face_match.py <selfie_path> [img1_path] [img2_path] ..."}))
        sys.exit(1)
        
    selfie_path = sys.argv[1]
    gallery_paths = sys.argv[2:]
    
    result = find_matches(selfie_path, gallery_paths)
    print(json.dumps(result))
