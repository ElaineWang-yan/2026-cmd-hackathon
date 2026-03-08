from flask import Flask, request, jsonify, render_template, session
from werkzeug.security import generate_password_hash, check_password_hash
from pymongo import MongoClient
import sqlite3
import os
from datetime import datetime

app = Flask(__name__)
app.secret_key = "change_this_to_a_random_secret"
DB_PATH = "users.db"

MONGODB_URI = "mongodb+srv://yuyan06150723_db_user:UE2plhxIn4157xJq@cluster0.3vek23t.mongodb.net/medication_forum?appName=Cluster0"
_mongo_client = MongoClient(MONGODB_URI)
mongo_posts = _mongo_client["medication_forum"]["posts"]


def init_db():
    with sqlite3.connect(DB_PATH) as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL
            )
        """)
        conn.execute("""
            CREATE TABLE IF NOT EXISTS posts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                drug_name TEXT NOT NULL,
                gender TEXT,
                having_period INTEGER,
                was_pregnant INTEGER,
                dosage_amount REAL,
                dosage_unit TEXT,
                freq_count INTEGER,
                freq_per TEXT,
                duration_value INTEGER,
                duration_unit TEXT,
                expected_effect TEXT,
                unlisted_side_effects TEXT,
                description TEXT,
                long_term_meds TEXT,
                health_conditions TEXT,
                additional_notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        conn.execute("""
            CREATE TABLE IF NOT EXISTS comments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                post_id INTEGER NOT NULL,
                user_id INTEGER NOT NULL,
                content TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (post_id) REFERENCES posts(id),
                FOREIGN KEY (user_id) REFERENCES users(id)
            )
        """)
        conn.execute("""
            CREATE TABLE IF NOT EXISTS survey_votes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                post_id INTEGER NOT NULL,
                user_id INTEGER NOT NULL,
                answer INTEGER NOT NULL DEFAULT 1,
                UNIQUE(post_id, user_id),
                FOREIGN KEY (post_id) REFERENCES posts(id),
                FOREIGN KEY (user_id) REFERENCES users(id)
            )
        """)
        conn.commit()


# ── PAGE ROUTES ──────────────────────────────────────────

@app.route("/")
def index():
    return render_template("login.html")

@app.route("/login", methods=["GET"])
def login_page():
    return render_template("login.html")

@app.route("/home")
def home():
    return render_template("home.html")

@app.route("/feed")
def feed():
    return render_template("feed.html")

@app.route("/post")
def post_page():
    return render_template("post.html")

@app.route("/create-post")
def create_post():
    return render_template("create_post.html")

@app.route("/register", methods=["GET"])
def register_page():
    return render_template("register.html")


# ── AUTH ─────────────────────────────────────────────────

@app.route("/login", methods=["POST"])
def login():
    data = request.get_json()
    email = data.get("email", "").strip()
    password = data.get("password", "")

    if not email or not password:
        return jsonify({"message": "Email and password are required."}), 400

    with sqlite3.connect(DB_PATH) as conn:
        row = conn.execute(
            "SELECT id, password FROM users WHERE email = ?", (email,)
        ).fetchone()

    try:
        valid = row and check_password_hash(row[1], password)
    except Exception:
        valid = False
    if valid:
        session["user_id"] = row[0]
        session["email"] = email
        return jsonify({"message": "Login successful!"}), 200
    else:
        return jsonify({"message": "Invalid email or password."}), 401


@app.route("/register", methods=["POST"])
def register():
    data = request.get_json()
    email = data.get("email", "").strip()
    password = data.get("password", "")

    if not email or not password:
        return jsonify({"message": "Email and password are required."}), 400

    hashed = generate_password_hash(password, method='pbkdf2:sha256')
    try:
        with sqlite3.connect(DB_PATH) as conn:
            conn.execute(
                "INSERT INTO users (email, password) VALUES (?, ?)", (email, hashed)
            )
            conn.commit()
        return jsonify({"message": "User registered successfully!"}), 201
    except sqlite3.IntegrityError:
        return jsonify({"message": "Email already registered."}), 409


# ── POSTS API ─────────────────────────────────────────────

@app.route("/posts", methods=["POST"])
def save_post():
    data = request.get_json()
    dosage = data.get("dosage", {})
    duration = data.get("duration", {})
    doc = {
        "drugName": data.get("drugName"),
        "userInfo": {
            "gender": data.get("gender"),
            "menstrualPhase": bool(data.get("havingPeriod", False)),
        },
        "dosage": {
            "amount": dosage.get("amount"),
            "unit": dosage.get("unit"),
            "times": dosage.get("frequency"),
            "frequency": dosage.get("per"),
        },
        "duration": str(duration.get("value", "")) + " " + str(duration.get("unit", "")),
        "expectedEffect": data.get("expectedEffect") == "yes",
        "differentFromPackage": data.get("differentFromExpected") == "yes",
        "reactionDescription": data.get("description"),
        "additionalInfo": {
            "longTermUse": bool(data.get("longTermMeds")),
            "pregnant": bool(data.get("wasPregnant", False)),
            "notes": " | ".join(filter(None, [data.get("longTermMeds"), data.get("healthConditions"), data.get("additionalNotes")])),
        },
        "createdAt": datetime.utcnow(),
    }
    mongo_posts.insert_one(doc)
    return jsonify({"success": True, "message": "Post saved.", "drug": data.get("drugName")}), 201


@app.route("/api/posts")
def get_posts():
    from bson import ObjectId
    medicine        = request.args.get("medicine", "").strip()
    gender          = request.args.get("gender", "").strip().lower()
    expected_effect = request.args.get("expected_effect", "").strip().lower()
    unlisted        = request.args.get("unlisted_side_effects", "").strip().lower()
    duration_bucket = request.args.get("duration", "").strip().lower()

    query = {}

    if medicine:
        query["drugName"] = {"$regex": medicine, "$options": "i"}

    if gender:
        query["userInfo.gender"] = gender

    if expected_effect:
        query["expectedEffect"] = (expected_effect == "yes")

    if unlisted:
        query["differentFromPackage"] = (unlisted == "yes")

    if duration_bucket == "short":
        query["$or"] = [
            {"duration": {"$regex": r"^[1-6]\s*day", "$options": "i"}},
        ]
    elif duration_bucket == "medium":
        query["$or"] = [
            {"duration": {"$regex": r"^([7-9]|[12][0-9]|28)\s*day", "$options": "i"}},
            {"duration": {"$regex": r"^[1-4]\s*week", "$options": "i"}},
        ]
    elif duration_bucket == "long":
        query["$or"] = [
            {"duration": {"$regex": r"month|year", "$options": "i"}},
            {"duration": {"$regex": r"^(29|[3-9]\d|\d{3,})\s*day", "$options": "i"}},
            {"duration": {"$regex": r"^[5-9]\d*\s*week", "$options": "i"}},
        ]

    posts = list(mongo_posts.find(query).sort("createdAt", -1))
    for p in posts:
        p["_id"] = str(p["_id"])
    return jsonify(posts)


@app.route("/api/posts/<post_id>")
def get_post(post_id):
    from bson import ObjectId
    try:
        post = mongo_posts.find_one({"_id": ObjectId(post_id)})
    except Exception:
        return jsonify({"error": "Invalid post ID"}), 400
    if not post:
        return jsonify({"error": "Post not found"}), 404
    post["_id"] = str(post["_id"])
    return jsonify(post)


# ── COMMENTS API ──────────────────────────────────────────

@app.route("/api/posts/<int:post_id>/comments", methods=["GET"])
def get_comments(post_id):
    with sqlite3.connect(DB_PATH) as conn:
        conn.row_factory = sqlite3.Row
        rows = conn.execute(
            "SELECT * FROM comments WHERE post_id = ? ORDER BY created_at ASC",
            (post_id,)
        ).fetchall()
    return jsonify([dict(r) for r in rows])


@app.route("/api/posts/<int:post_id>/comments", methods=["POST"])
def add_comment(post_id):
    user_id = session.get("user_id")
    if not user_id:
        return jsonify({"error": "Not logged in"}), 401

    data = request.get_json()
    content = data.get("content", "").strip()
    if not content:
        return jsonify({"error": "Comment cannot be empty"}), 400

    with sqlite3.connect(DB_PATH) as conn:
        conn.execute(
            "INSERT INTO comments (post_id, user_id, content) VALUES (?, ?, ?)",
            (post_id, user_id, content)
        )
        conn.commit()
    return jsonify({"message": "Comment added"}), 201


@app.route("/api/comments/<int:comment_id>", methods=["DELETE"])
def delete_comment(comment_id):
    user_id = session.get("user_id")
    if not user_id:
        return jsonify({"error": "Not logged in"}), 401

    with sqlite3.connect(DB_PATH) as conn:
        row = conn.execute(
            "SELECT user_id FROM comments WHERE id = ?", (comment_id,)
        ).fetchone()

        if not row:
            return jsonify({"error": "Comment not found"}), 404
        if row[0] != user_id:
            return jsonify({"error": "Not your comment"}), 403

        conn.execute("DELETE FROM comments WHERE id = ?", (comment_id,))
        conn.commit()
    return jsonify({"message": "Deleted"}), 200


# ── SURVEY API ────────────────────────────────────────────

@app.route("/api/posts/<int:post_id>/survey", methods=["GET"])
def get_survey(post_id):
    user_id = session.get("user_id")
    with sqlite3.connect(DB_PATH) as conn:
        yes_count = conn.execute(
            "SELECT COUNT(*) FROM survey_votes WHERE post_id = ? AND answer = 1",
            (post_id,)
        ).fetchone()[0]
        no_count = conn.execute(
            "SELECT COUNT(*) FROM survey_votes WHERE post_id = ? AND answer = 0",
            (post_id,)
        ).fetchone()[0]
        total = yes_count + no_count

        user_vote = None
        if user_id:
            row = conn.execute(
                "SELECT answer FROM survey_votes WHERE post_id = ? AND user_id = ?",
                (post_id, user_id)
            ).fetchone()
            if row is not None:
                user_vote = "yes" if row[0] == 1 else "no"

    return jsonify({
        "yes_count": yes_count,
        "no_count": no_count,
        "total": total,
        "user_vote": user_vote
    })


@app.route("/api/posts/<int:post_id>/survey", methods=["POST"])
def vote_survey(post_id):
    user_id = session.get("user_id")
    if not user_id:
        return jsonify({"error": "Not logged in"}), 401

    data = request.get_json()
    answer = data.get("answer")  # "yes", "no", or None

    with sqlite3.connect(DB_PATH) as conn:
        if answer is None:
            conn.execute(
                "DELETE FROM survey_votes WHERE post_id = ? AND user_id = ?",
                (post_id, user_id)
            )
        else:
            answer_int = 1 if answer == "yes" else 0
            conn.execute(
                "INSERT INTO survey_votes (post_id, user_id, answer) VALUES (?, ?, ?) "
                "ON CONFLICT(post_id, user_id) DO UPDATE SET answer = ?",
                (post_id, user_id, answer_int, answer_int)
            )
        conn.commit()

        yes_count = conn.execute(
            "SELECT COUNT(*) FROM survey_votes WHERE post_id = ? AND answer = 1",
            (post_id,)
        ).fetchone()[0]
        no_count = conn.execute(
            "SELECT COUNT(*) FROM survey_votes WHERE post_id = ? AND answer = 0",
            (post_id,)
        ).fetchone()[0]
        total = yes_count + no_count

        user_vote = None
        row = conn.execute(
            "SELECT answer FROM survey_votes WHERE post_id = ? AND user_id = ?",
            (post_id, user_id)
        ).fetchone()
        if row is not None:
            user_vote = "yes" if row[0] == 1 else "no"

    return jsonify({
        "yes_count": yes_count,
        "no_count": no_count,
        "total": total,
        "user_vote": user_vote
    })


# ── ME ────────────────────────────────────────────────────

@app.route("/api/me")
def me():
    user_id = session.get("user_id")
    email   = session.get("email")
    if not user_id:
        return jsonify({"user_id": None, "email": None})
    return jsonify({"user_id": user_id, "email": email})


# ── RUN ───────────────────────────────────────────────────

init_db()

if __name__ == "__main__":
    app.run(host='0.0.0.0', debug=True, port=8080)