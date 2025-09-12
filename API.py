# app.py
import os
import json
import time
from datetime import datetime
from typing import List, Dict, Any

from flask import Flask, request, jsonify, send_from_directory, url_for
from flask_sqlalchemy import SQLAlchemy
from werkzeug.utils import secure_filename

from fashion_analyzer import FashionAnalyzer
from weather_client import WeatherClient, infer_season

from flask_cors import CORS

# --- App Setup
app = Flask(__name__)
CORS(app)  # Allow all origins

# --- Config
WARDROBE_FOLDER = os.path.join("uploads", "wardrobe")
ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "gif"}
MAX_PROMPT_WARDROBE = 60

app.config["UPLOAD_FOLDER"] = WARDROBE_FOLDER
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///fashion.db"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

db = SQLAlchemy(app)
os.makedirs(WARDROBE_FOLDER, exist_ok=True)

# --- Models
class WardrobeItem(db.Model):
    id = db.Column(db.Integer, primary_key=True)              # auto-increment primary key
    filename = db.Column(db.String(256), nullable=False)      # stored as "<id>.ext"
    description = db.Column(db.Text, nullable=True)           # AI generated description
    created_at = db.Column(db.Float, default=lambda: time.time())  # Unix timestamp

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
        "file_url": url_for("serve_wardrobe_image", item_id=item.id, _external=True),
        "description": item.description,
        "created_at": item.created_at
    }

# --- Wardrobe Endpoints

@app.route("/wardrobe", methods=["POST"])
def upload_wardrobe():
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
        temp_record = WardrobeItem(filename="", description="")
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
def list_wardrobe():
    items = WardrobeItem.query.order_by(WardrobeItem.created_at.desc()).all()
    return jsonify([wardrobe_item_to_dict(i) for i in items])


@app.route("/wardrobe/<int:item_id>", methods=["GET"])
def get_wardrobe_item(item_id):
    item = WardrobeItem.query.get_or_404(item_id)
    return jsonify(wardrobe_item_to_dict(item))


@app.route("/wardrobe/<int:item_id>", methods=["DELETE"])
def delete_wardrobe_item(item_id):
    item = WardrobeItem.query.get_or_404(item_id)
    path = os.path.join(WARDROBE_FOLDER, item.filename)
    if os.path.exists(path):
        os.remove(path)
    db.session.delete(item)
    db.session.commit()
    return jsonify({"message": "Deleted", "id": item_id})


@app.route("/wardrobe/<int:item_id>/file", methods=["GET"])
def serve_wardrobe_image(item_id):
    item = WardrobeItem.query.get_or_404(item_id)
    return send_from_directory(WARDROBE_FOLDER, item.filename)


# --- Outfit Suggestion Endpoint (unchanged except no parsed_json used)

@app.route("/outfit", methods=["POST"])
def upload_outfit_and_suggest():
    city = request.form.get("city")
    hemisphere = (request.form.get("hemisphere") or "north").lower()
    units = (request.form.get("units") or "metric").lower()
    date_str = request.form.get("date")
    lat = request.form.get("lat")
    lon = request.form.get("lon")

    # --- Handle multiple files ---
    files = request.files.getlist("files")
    if not files:
        single = request.files.get("file")
        if single:
            files = [single]
    if not files:
        return jsonify({"error": "No outfit files uploaded"}), 400

    # --- Analyze each uploaded outfit image ---
    outfit_descriptions: List[Dict[str, Any]] = []
    for idx, file in enumerate(files):
        if not (file and allowed_file(file.filename)):
            continue
        filename = secure_filename(file.filename)
        filepath = os.path.join(WARDROBE_FOLDER, filename)
        file.save(filepath)
        raw, _ = analyzer.analyze(filepath)
        outfit_descriptions.append({
            "filename": filename,
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
    wardrobe_items = WardrobeItem.query.order_by(WardrobeItem.created_at.desc()).limit(MAX_PROMPT_WARDROBE).all()
    wardrobe_digest_lines = [f"[{wi.id}] {wi.description}" for wi in wardrobe_items]

    # --- Outfit description block ---
    outfit_digest_lines = [
        f"Image {od['image_index']}: {od['description']}" for od in outfit_descriptions
    ]

    # --- Build prompt with multiple outfit images clearly labeled ---
    prompt = (
        "You are a personal stylist. I have a wardrobe (each item shows its SERIAL ID in brackets) "
        "and I'm wearing the following outfit today. Multiple images may be provided for different angles. "
        "Consider ALL outfit images together as one complete outfit. "
        "Consider the current date, season, and weather. "
        "Recommend 1-3 items from my wardrobe by SERIAL ID to pair with today's outfit. "
        "If an ideal item is missing, propose a textual suggestion instead. "
        "Return JSON with keys: 'recommendations': [ { 'wardrobe_id': <int or null>, 'reason': <string>, "
        "'fallback_text': <string or null> } ], and 'notes': <string>.\n\n"
        f"Date: {when.date().isoformat()}  |  Season: {season}  |  Weather: {weather_summary}\n\n"
        "WARDROBE (ID + description):\n"
        + "\n".join(wardrobe_digest_lines) + "\n\n"
        "TODAY'S OUTFIT (multiple images):\n"
        + "\n".join(outfit_digest_lines)
    )

    # --- Get AI suggestions ---
    suggestion_text = analyzer.suggest(prompt)
    try:
        suggestion_json = json.loads(suggestion_text)
    except Exception:
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


# --- Health Check
@app.route("/", methods=["GET"])
def health():
    return jsonify({"status": "ok", "time": datetime.utcnow().isoformat()})

if __name__ == "__main__":
    app.run(debug=True)
