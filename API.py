# API.py
import os
import json
import time
import uuid
import hmac
import hashlib
import base64
from datetime import datetime, timedelta
from typing import List, Dict, Any
from functools import wraps

from flask import Flask, request, jsonify, send_from_directory, url_for, send_file
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager, login_user, logout_user, login_required, current_user, UserMixin
from werkzeug.utils import secure_filename
from werkzeug.security import generate_password_hash, check_password_hash

from fashion_analyzer import FashionAnalyzer
from weather_client import WeatherClient, infer_season

from flask_cors import CORS

# --- App Setup
app = Flask(__name__)
app.secret_key = os.environ.get("SESSION_SECRET", "dev-secret-key-change-in-production")
app.config['JWT_SECRET'] = os.environ.get("JWT_SECRET", app.secret_key)
app.config['JWT_EXPIRATION_DELTA'] = timedelta(days=7)

# Configure CORS
CORS(app, origins=['*'], supports_credentials=True)

# Flask-Login setup
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'

# --- Config
WARDROBE_FOLDER = os.path.join("uploads", "wardrobe")
ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "gif"}
MAX_PROMPT_WARDROBE = 60

app.config["UPLOAD_FOLDER"] = WARDROBE_FOLDER
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///fashion.db"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

db = SQLAlchemy(app)
os.makedirs(WARDROBE_FOLDER, exist_ok=True)

# --- Minimal self-contained JWT implementation (HS256)
class ExpiredSignatureError(Exception):
    pass

class InvalidTokenError(Exception):
    pass

def _b64url_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode("utf-8")

def _b64url_decode(data: str) -> bytes:
    # add required padding
    padding = '=' * (-len(data) % 4)
    return base64.urlsafe_b64decode(data + padding)

def encode_jwt(payload: Dict[str, Any], secret: str, algorithm: str = "HS256") -> str:
    """
    Simple HS256 JWT encoder. Returns token string.
    """
    if algorithm != "HS256":
        raise ValueError("Only HS256 is supported in this implementation.")
    header = {"alg": "HS256", "typ": "JWT"}
    header_b = json.dumps(header, separators=(',', ':')).encode("utf-8")
    payload_b = json.dumps(payload, separators=(',', ':')).encode("utf-8")
    header_b64 = _b64url_encode(header_b)
    payload_b64 = _b64url_encode(payload_b)
    signing_input = f"{header_b64}.{payload_b64}".encode("utf-8")
    signature = hmac.new(secret.encode("utf-8"), signing_input, hashlib.sha256).digest()
    signature_b64 = _b64url_encode(signature)
    return f"{header_b64}.{payload_b64}.{signature_b64}"

def decode_jwt(token: str, secret: str, algorithms: List[str] = ["HS256"], verify_exp: bool = True) -> Dict[str, Any]:
    """
    Decode and verify HS256 JWT. Returns payload dict or raises ExpiredSignatureError / InvalidTokenError.
    """
    try:
        parts = token.split(".")
        if len(parts) != 3:
            raise InvalidTokenError("Token must have exactly 3 parts")
        header_b64, payload_b64, sig_b64 = parts
        try:
            header_json = json.loads(_b64url_decode(header_b64))
        except Exception:
            raise InvalidTokenError("Invalid header encoding")
        alg = header_json.get("alg")
        if alg not in algorithms:
            raise InvalidTokenError("Algorithm not allowed")
        signing_input = f"{header_b64}.{payload_b64}".encode("utf-8")
        expected_sig = hmac.new(secret.encode("utf-8"), signing_input, hashlib.sha256).digest()
        try:
            sig = _b64url_decode(sig_b64)
        except Exception:
            raise InvalidTokenError("Invalid signature encoding")
        if not hmac.compare_digest(expected_sig, sig):
            raise InvalidTokenError("Signature verification failed")
        try:
            payload = json.loads(_b64url_decode(payload_b64))
        except Exception:
            raise InvalidTokenError("Invalid payload encoding")
        if verify_exp and "exp" in payload:
            now_ts = int(time.time())
            # payload's exp might be timestamp (int) or float
            try:
                exp_ts = int(payload["exp"])
            except Exception:
                raise InvalidTokenError("Invalid 'exp' claim")
            if now_ts > exp_ts:
                raise ExpiredSignatureError("Token has expired")
        return payload
    except ExpiredSignatureError:
        raise
    except InvalidTokenError:
        raise
    except Exception as e:
        # Generic failure
        raise InvalidTokenError(f"Invalid token: {e}")

# --- Models
class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    skin_tone = db.Column(db.String(50), nullable=True)  # fair, medium, olive, brown, dark
    gender = db.Column(db.String(20), nullable=True)     # male, female, non-binary, prefer-not-to-say
    created_at = db.Column(db.Float, default=lambda: time.time())
    
    # Relationship to wardrobe items
    wardrobe_items = db.relationship('WardrobeItem', backref='user', lazy=True, cascade='all, delete-orphan')
    
    def set_password(self, password):
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)
    
    def generate_token(self):
        # create payload with exp as unix timestamp (int)
        exp_ts = int(time.time() + app.config['JWT_EXPIRATION_DELTA'].total_seconds())
        payload = {
            'user_id': self.id,
            'exp': exp_ts
        }
        return encode_jwt(payload, app.config['JWT_SECRET'], algorithm='HS256')
    
    def to_dict(self):
        return {
            'id': self.id,
            'email': self.email,
            'name': self.name,
            'skin_tone': self.skin_tone,
            'gender': self.gender,
            'created_at': self.created_at
        }

class WardrobeItem(db.Model):
    id = db.Column(db.Integer, primary_key=True)              # auto-increment primary key
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)  # owner of the item
    filename = db.Column(db.String(256), nullable=False)      # stored as "<id>.ext"
    description = db.Column(db.Text, nullable=True)           # AI generated description
    created_at = db.Column(db.Float, default=lambda: time.time())  # Unix timestamp

# Flask-Login user loader
@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

# JWT token verification decorator
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        auth_header = request.headers.get('Authorization')
        
        if auth_header:
            try:
                token = auth_header.split(' ')[1]  # Bearer <token>
            except IndexError:
                return jsonify({'error': 'Invalid token format'}), 401
        
        if not token:
            return jsonify({'error': 'Token missing'}), 401
        
        try:
            payload = decode_jwt(token, app.config['JWT_SECRET'], algorithms=['HS256'], verify_exp=True)
            current_user_id = payload.get('user_id')
            user = User.query.get(current_user_id)
            if not user:
                return jsonify({'error': 'User not found'}), 401
        except ExpiredSignatureError:
            return jsonify({'error': 'Token expired'}), 401
        except InvalidTokenError as e:
            return jsonify({'error': f'Invalid token: {str(e)}'}), 401
        except Exception as e:
            return jsonify({'error': 'Invalid token'}), 401
        
        return f(user, *args, **kwargs)
    return decorated

with app.app_context():
    db.create_all()

analyzer = FashionAnalyzer()
weather_client = WeatherClient()

# --- Helpers
def allowed_file(filename: str) -> bool:
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS

def wardrobe_item_to_dict(item: WardrobeItem) -> Dict[str, Any]:
    return {
        "id": item.id,
        "filename": item.filename,
        "file_url": url_for("serve_wardrobe_image", item_id=item.id, _external=False),
        "description": item.description,
        "created_at": item.created_at,
        "user_id": item.user_id
    }

# --- Authentication Endpoints
@app.route("/auth/register", methods=["POST"])
def register():
    data = request.get_json()
    
    if not data or not all(k in data for k in ('email', 'password', 'name')):
        return jsonify({'error': 'Missing required fields: email, password, name'}), 400
    
    email = data['email'].lower().strip()
    
    if User.query.filter_by(email=email).first():
        return jsonify({'error': 'Email already registered'}), 400
    
    user = User(
        email=email,
        name=data['name'].strip(),
        skin_tone=data.get('skin_tone'),
        gender=data.get('gender')
    )
    user.set_password(data['password'])
    
    db.session.add(user)
    db.session.commit()
    
    token = user.generate_token()
    return jsonify({
        'message': 'User registered successfully',
        'token': token,
        'user': user.to_dict()
    }), 201

@app.route("/auth/login", methods=["POST"])
def login():
    data = request.get_json()
    
    if not data or not all(k in data for k in ('email', 'password')):
        return jsonify({'error': 'Missing email or password'}), 400
    
    email = data['email'].lower().strip()
    user = User.query.filter_by(email=email).first()
    
    if not user or not user.check_password(data['password']):
        return jsonify({'error': 'Invalid email or password'}), 401
    
    token = user.generate_token()
    return jsonify({
        'message': 'Login successful',
        'token': token,
        'user': user.to_dict()
    }), 200

@app.route("/auth/profile", methods=["GET"])
@token_required
def get_profile(current_user):
    return jsonify({'user': current_user.to_dict()}), 200

@app.route("/auth/profile", methods=["PUT"])
@token_required
def update_profile(current_user):
    data = request.get_json() or {}
    
    if 'name' in data:
        current_user.name = data['name'].strip()
    if 'skin_tone' in data:
        current_user.skin_tone = data['skin_tone']
    if 'gender' in data:
        current_user.gender = data['gender']
    
    db.session.commit()
    
    return jsonify({
        'message': 'Profile updated successfully',
        'user': current_user.to_dict()
    }), 200

# --- Wardrobe Endpoints

@app.route("/wardrobe", methods=["POST"])
@token_required
def upload_wardrobe(current_user):
    files = request.files.getlist("files")
    if not files:
        single = request.files.get("file")
        if single:
            files = [single]
    if not files:
        return jsonify({"error": "No files uploaded"}), 400

    results = []
    for file in files:
        if not (file and allowed_file(file.filename)):
            continue

        # Step 1: create a blank DB record to get the ID first
        temp_record = WardrobeItem(filename="", description="", user_id=current_user.id)
        db.session.add(temp_record)
        db.session.flush()  # generate ID without commit

        # Step 2: rename file to <id>.<ext>
        ext = file.filename.rsplit(".", 1)[1].lower()
        new_filename = f"{temp_record.id}.{ext}"
        filepath = os.path.join(WARDROBE_FOLDER, new_filename)
        file.save(filepath)

        # Step 3: get description from AI
        raw_description, _ = analyzer.analyze(filepath)

        # Step 4: update record with proper data
        temp_record.filename = new_filename
        temp_record.description = raw_description
        db.session.commit()

        results.append(wardrobe_item_to_dict(temp_record))

    return jsonify({"uploaded": results}), 201


@app.route("/wardrobe", methods=["GET"])
@token_required
def list_wardrobe(current_user):
    items = WardrobeItem.query.filter_by(user_id=current_user.id).order_by(WardrobeItem.created_at.desc()).all()
    return jsonify([wardrobe_item_to_dict(i) for i in items])


@app.route("/wardrobe/<int:item_id>", methods=["GET"])
@token_required
def get_wardrobe_item(current_user, item_id):
    item = WardrobeItem.query.filter_by(id=item_id, user_id=current_user.id).first_or_404()
    return jsonify(wardrobe_item_to_dict(item))


@app.route("/wardrobe/<int:item_id>", methods=["DELETE"])
@token_required
def delete_wardrobe_item(current_user, item_id):
    item = WardrobeItem.query.filter_by(id=item_id, user_id=current_user.id).first_or_404()
    path = os.path.join(WARDROBE_FOLDER, item.filename)
    if os.path.exists(path):
        os.remove(path)
    db.session.delete(item)
    db.session.commit()
    return jsonify({"message": "Deleted", "id": item_id})


@app.route("/wardrobe/<int:item_id>/file", methods=["GET"])
@token_required
def serve_wardrobe_image(current_user, item_id):
    item = WardrobeItem.query.filter_by(id=item_id, user_id=current_user.id).first_or_404()
    return send_from_directory(WARDROBE_FOLDER, item.filename)


# --- Outfit Suggestion Endpoint (unchanged except no parsed_json used)

@app.route("/outfit", methods=["POST"])
@token_required
def upload_outfit_and_suggest(current_user):
    city = request.form.get("city")
    hemisphere = (request.form.get("hemisphere") or "north").lower()
    units = (request.form.get("units") or "metric").lower()
    date_str = request.form.get("date")
    lat = request.form.get("lat")
    lon = request.form.get("lon")
    gender = request.form.get("gender")
    skin_tone = request.form.get("skin_tone")

    # --- Handle multiple files ---
    files = request.files.getlist("files")
    if not files:
        single = request.files.get("file")
        if single:
            files = [single]
    
    # Filter out empty files
    files = [f for f in files if f and f.filename and f.filename != '']

    # Create temporary folder for outfit analysis (separate from wardrobe)
    OUTFIT_TEMP_FOLDER = os.path.join("uploads", "outfit_temp")
    os.makedirs(OUTFIT_TEMP_FOLDER, exist_ok=True)

    # --- Analyze each uploaded outfit image ---
    outfit_descriptions: List[Dict[str, Any]] = []
    temp_files_to_cleanup = []
    
    try:
        # Only analyze files if they were uploaded
        if files:
            for idx, file in enumerate(files):
                if not (file and allowed_file(file.filename)):
                    continue
                
                # Generate unique filename to avoid collisions
                ext = file.filename.rsplit(".", 1)[1].lower() if "." in file.filename else "jpg"
                unique_filename = f"outfit_{uuid.uuid4().hex[:8]}.{ext}"
                filepath = os.path.join(OUTFIT_TEMP_FOLDER, unique_filename)
                
                file.save(filepath)
                temp_files_to_cleanup.append(filepath)
                
                raw, _ = analyzer.analyze(filepath)
                outfit_descriptions.append({
                    "filename": unique_filename,
                    "description": raw,
                    "image_index": idx + 1
                })

        # --- Handle date / season ---
        if date_str:
            try:
                when = datetime.fromisoformat(date_str)
            except Exception:
                when = datetime.utcnow()
        else:
            when = datetime.utcnow()

        season = infer_season(when, hemisphere=hemisphere)

        # --- Get weather data (city OR lat/lon) ---
        weather_json = None
        if city:
            weather_json = weather_client.current_by_city(city=city, units=units)
        elif lat and lon:
            try:
                weather_json = weather_client.current_by_coords(lat=float(lat), lon=float(lon), units=units)
            except Exception:
                weather_json = None

        weather_summary = "unknown"
        if weather_json:
            main = weather_json.get("weather", [{}])[0].get("main")
            desc = weather_json.get("weather", [{}])[0].get("description")
            temp = weather_json.get("main", {}).get("temp")
            weather_summary = f"{main} ({desc}), temp={temp} {('°C' if units=='metric' else '°F')}"

        # --- Wardrobe summary for prompt ---
        wardrobe_items = WardrobeItem.query.filter_by(user_id=current_user.id).order_by(WardrobeItem.created_at.desc()).limit(MAX_PROMPT_WARDROBE).all()
        wardrobe_digest_lines = [f"[{wi.id}] {wi.description}" for wi in wardrobe_items]

        # --- Outfit description block ---
        outfit_digest_lines = [
            f"Image {od['image_index']}: {od['description']}" for od in outfit_descriptions
        ]
        
        # Handle case with no uploaded files - provide general suggestions
        if not outfit_descriptions:
            outfit_digest_lines = ["No specific outfit uploaded. Provide general style suggestions based on weather and current wardrobe."]

        # --- Build prompt with multiple outfit images clearly labeled ---
        prompt = (
            "You are a professional AI personal stylist and fashion consultant. "
            "Analyze the wardrobe and current outfit to provide styling recommendations that are practical, fashionable, and cohesive. "
            "Your goal is to always suggest a COMPLETE OUTFIT from head to toe, including:\n"
            "- Top (shirt, t-shirt, blouse, kurta, kurti, sherwani, etc.) — pick according to style, season, and occasion.\n"
            "- Bottom (pants, jeans, trousers, skirts, palazzos, churidar, dhoti pants, salwar, lungi, etc.) — suggest what best fits the look.\n"
            "- One-piece options (dress, saree, lehenga, anarkali, jumpsuit, etc.) if suitable for the event.\n"
            "- Footwear (shoes, sneakers, boots, heels, sandals, juttis, kolhapuris, mojaris, etc.) — match the vibe of the outfit.\n"
            "- Outerwear (jacket, coat, shrug, dupatta, stole, shawl — use when appropriate for season/weather).\n"
            "- Accessories (watch, belt, hat, sunglasses, jewelry, bangles, bindi, kada, earrings, bags, clutches — keep tasteful and minimal).\n"
            "- Optional Layering (scarf, cardigan, overshirt, ethnic vest/nehru jacket — only when weather or style calls for it).\n\n"
            "STRICT INSTRUCTIONS:\n"
            "- Return ONLY a properly formatted JSON response with this exact structure:\n"
            "{\n"
            '  \"recommendations\": [\n'
            '    {\n'
            '      \"wardrobe_id\": 123,\n'
            '      \"reason\": \"Clear reason why this item complements the outfit\",\n'
            '      \"fallback_text\": null\n'
            '    },\n'
            '    {\n'
            '      \"wardrobe_id\": null,\n'
            '      \"reason\": \"Reason for this suggestion\",\n'
            '      \"fallback_text\": \"Specific item suggestion if not in wardrobe\"\n'
            '    }\n'
            '  ],\n'
            '  \"notes\": \"Brief overall styling advice (color matching, fit, occasion suitability)\",\n'
            '  \"weather_considerations\": \"How weather affects the recommendations (e.g., layering, breathable fabrics, waterproof shoes)\"\n'
            "}\n\n"
            "CONTEXT:\n"
            f"Date: {when.date().isoformat()}\n"
            f"Season: {season}\n"
            f"Weather: {weather_summary}\n"
            + (f"Gender: {gender}\n" if gender else "")
            + (f"Skin Tone: {skin_tone}\n" if skin_tone else "")
            + "\n"
            "AVAILABLE WARDROBE ITEMS (use the ID numbers):\n"
            + "\n".join(wardrobe_digest_lines) + "\n\n"
            "CURRENT OUTFIT TO STYLE:\n"
            + "\n".join(outfit_digest_lines) + "\n\n"
            "GUIDELINES:\n"
            "- Prioritize using the current outfit over everything else. Suggest alternatives only if the current outfit is inappropriate for the occasion, season, or does not match well with other items.\n"
            "- Prioritize using available wardrobe items (use wardrobe_id) to complete the outfit.\n"
            "- Suggest buying new items (wardrobe_id=null + fallback_text) ONLY if that category is missing.\n"
            "- Avoid recommending duplicate items of the same type if one is already in the outfit.\n"
            "- Ensure outfit is appropriate for season, occasion, cultural setting, and weather.\n"
            "- Mix colors, fabrics, and styles tastefully (avoid clashing colors unless intentional).\n"
            "- For Indian outfits, match dupattas/shawls with the set, coordinate jewelry (simple for casual, heavier for festive events).\n"
            "- Accessories should enhance the look but not overpower it.\n"
            "- Keep suggestions inclusive, gender-neutral, and adaptable to any style preference.\n\n"
            "Return ONLY the JSON object with no additional formatting or text."
        )



        # --- Get AI suggestions ---
        suggestion_text = analyzer.suggest(prompt)
        try:
            # Handle markdown code blocks and clean the JSON
            clean_text = suggestion_text.strip()
            if clean_text.startswith("```json"):
                clean_text = clean_text[7:]  # Remove ```json
            if clean_text.startswith("```"):
                clean_text = clean_text[3:]   # Remove ```
            if clean_text.endswith("```"):
                clean_text = clean_text[:-3]  # Remove ```
            clean_text = clean_text.strip()
            
            suggestion_json = json.loads(clean_text)
        except Exception as e:
            print(f"JSON parsing failed: {e}")
            suggestion_json = {"recommendations": [], "notes": suggestion_text}

        out_recs = []
        for rec in suggestion_json.get("recommendations", []):
            wid = rec.get("wardrobe_id")
            reason = rec.get("reason")
            fallback = rec.get("fallback_text")
            resolved = {"wardrobe_id": wid, "reason": reason, "fallback_text": fallback}
            if wid is not None:
                item = WardrobeItem.query.get(wid)
                resolved["item"] = wardrobe_item_to_dict(item) if item else None
            out_recs.append(resolved)

        return jsonify({
            "outfit_descriptions": outfit_descriptions,
            "season": season,
            "weather": weather_json,
            "suggestions_raw": suggestion_text,
            "suggestions": out_recs,
            "notes": suggestion_json.get("notes")
        })

    finally:
        # Cleanup temporary outfit files after analysis
        for temp_file in temp_files_to_cleanup:
            try:
                if os.path.exists(temp_file):
                    os.remove(temp_file)
            except Exception as e:
                print(f"Warning: Could not cleanup temp file {temp_file}: {e}")


# --- Health Check
@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "time": datetime.utcnow().isoformat()})

# --- Frontend Static Files (for production deployment)
@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def serve_frontend(path):
    """Serve the React frontend static files"""
    static_dir = os.path.join(os.path.dirname(__file__), "static")
    
    # If static directory exists (production), serve frontend
    if os.path.exists(static_dir):
        if path and os.path.exists(os.path.join(static_dir, path)):
            return send_from_directory(static_dir, path)
        else:
            # For client-side routing, return index.html
            return send_from_directory(static_dir, "index.html")
    else:
        # Development mode - return health check
        return jsonify({"status": "ok", "time": datetime.utcnow().isoformat(), "mode": "development"})

if __name__ == "__main__":
    # Always use port 8080 for backend in development to avoid conflict with frontend on port 5000
    port = 8080
    debug_mode = True  # Enable debug mode for development
    app.run(host="127.0.0.1", port=port, debug=debug_mode)
