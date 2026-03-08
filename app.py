from flask import Flask, request, jsonify, render_template
from werkzeug.security import generate_password_hash, check_password_hash
import sqlite3
import os

app = Flask(__name__)
DB_PATH = "users.db"


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
        conn.commit()


@app.route("/")
def index():
    return render_template("login.html")


@app.route("/login", methods=["GET"])
def login_page():
    return render_template("login.html")


@app.route("/login", methods=["POST"])
def login():
    data = request.get_json()
    email = data.get("email", "").strip()
    password = data.get("password", "")

    if not email or not password:
        return jsonify({"message": "Email and password are required."}), 400

    with sqlite3.connect(DB_PATH) as conn:
        row = conn.execute(
            "SELECT password FROM users WHERE email = ?", (email,)
        ).fetchone()

    if row and check_password_hash(row[0], password):
        return jsonify({"message": "Login successful!"}), 200
    else:
        return jsonify({"message": "Invalid email or password."}), 401


@app.route("/home")
def home():
    return render_template("home.html")


@app.route("/create-post")
def create_post():
    return render_template("create_post.html")


@app.route("/posts", methods=["POST"])
def save_post():
    data = request.get_json()
    dosage = data.get("dosage", {})
    duration = data.get("duration", {})
    with sqlite3.connect(DB_PATH) as conn:
        conn.execute("""
            INSERT INTO posts (
                drug_name, gender, having_period, was_pregnant,
                dosage_amount, dosage_unit, freq_count, freq_per,
                duration_value, duration_unit,
                expected_effect, unlisted_side_effects, description,
                long_term_meds, health_conditions, additional_notes
            ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
        """, (
            data.get("drugName"), data.get("gender"),
            int(data.get("havingPeriod", False)), int(data.get("wasPregnant", False)),
            dosage.get("amount"), dosage.get("unit"),
            dosage.get("frequency"), dosage.get("per"),
            duration.get("value"), duration.get("unit"),
            data.get("expectedEffect"), data.get("differentFromExpected"),
            data.get("description"),
            data.get("longTermMeds"), data.get("healthConditions"), data.get("additionalNotes")
        ))
        conn.commit()
    return jsonify({"message": "Post saved.", "drug": data.get("drugName")}), 201


@app.route("/api/posts")
def get_posts():
    medicine = request.args.get("medicine", "").strip().lower()
    with sqlite3.connect(DB_PATH) as conn:
        conn.row_factory = sqlite3.Row
        rows = conn.execute(
            "SELECT * FROM posts WHERE LOWER(drug_name) = ? ORDER BY created_at ASC",
            (medicine,)
        ).fetchall()
    return jsonify([dict(r) for r in rows])


@app.route("/feed")
def feed():
    return render_template("feed.html")


@app.route("/register", methods=["GET"])
def register_page():
    return render_template("register.html")


@app.route("/register", methods=["POST"])
def register():
    data = request.get_json()
    email = data.get("email", "").strip()
    password = data.get("password", "")

    if not email or not password:
        return jsonify({"message": "Email and password are required."}), 400

    hashed = generate_password_hash(password)
    try:
        with sqlite3.connect(DB_PATH) as conn:
            conn.execute(
                "INSERT INTO users (email, password) VALUES (?, ?)", (email, hashed)
            )
            conn.commit()
        return jsonify({"message": "User registered successfully!"}), 201
    except sqlite3.IntegrityError:
        return jsonify({"message": "Email already registered."}), 409


if __name__ == "__main__":
    init_db()
    app.run(debug=True, port=8080)