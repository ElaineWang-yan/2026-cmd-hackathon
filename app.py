from flask import Flask, request, jsonify, render_template, session
from werkzeug.security import generate_password_hash, check_password_hash
import sqlite3
import os

app = Flask(__name__)
app.secret_key = "change_this_to_a_random_secret"
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
                user_id INTEGER,
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
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id)
            )
        """)
        try:
            conn.execute("ALTER TABLE posts ADD COLUMN user_id INTEGER REFERENCES users(id)")
        except Exception:
            pass

        conn.execute("""
            CREATE TABLE IF NOT EXISTS comments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                post_id INTEGER NOT NULL,
                user_id INTEGER NOT NULL,
                parent_id INTEGER DEFAULT NULL,
                reply_to_email TEXT DEFAULT NULL,
                content TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (post_id) REFERENCES posts(id),
                FOREIGN KEY (user_id) REFERENCES users(id),
                FOREIGN KEY (parent_id) REFERENCES comments(id)
            )
        """)
        # Migrate existing comments table: add parent_id and reply_to_email if missing
        try:
            conn.execute("ALTER TABLE comments ADD COLUMN parent_id INTEGER DEFAULT NULL REFERENCES comments(id)")
        except Exception:
            pass
        try:
            conn.execute("ALTER TABLE comments ADD COLUMN reply_to_email TEXT DEFAULT NULL")
        except Exception:
            pass

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
        conn.execute("""
            CREATE TABLE IF NOT EXISTS inbox_read (
                user_id INTEGER PRIMARY KEY,
                last_read_at TIMESTAMP NOT NULL,
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

@app.route("/profile")
def profile_page():
    return render_template("profile.html")


# ── AUTH ─────────────────────────────────────────────────

@app.route("/login", methods=["POST"])
def login():
    data     = request.get_json()
    email    = data.get("email", "").strip()
    password = data.get("password", "")

    if not email or not password:
        return jsonify({"message": "Email and password are required."}), 400

    with sqlite3.connect(DB_PATH) as conn:
        row = conn.execute(
            "SELECT id, password FROM users WHERE email = ?", (email,)
        ).fetchone()

    if row and check_password_hash(row[1], password):
        session["user_id"] = row[0]
        session["email"]   = email
        return jsonify({"message": "Login successful!"}), 200
    else:
        return jsonify({"message": "Invalid email or password."}), 401


@app.route("/register", methods=["POST"])
def register():
    data     = request.get_json()
    email    = data.get("email", "").strip()
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


# ── POSTS API ─────────────────────────────────────────────

@app.route("/posts", methods=["POST"])
def save_post():
    data     = request.get_json()
    dosage   = data.get("dosage", {})
    duration = data.get("duration", {})
    user_id  = session.get("user_id")

    with sqlite3.connect(DB_PATH) as conn:
        conn.execute("""
            INSERT INTO posts (
                user_id,
                drug_name, gender, having_period, was_pregnant,
                dosage_amount, dosage_unit, freq_count, freq_per,
                duration_value, duration_unit,
                expected_effect, unlisted_side_effects, description,
                long_term_meds, health_conditions, additional_notes
            ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
        """, (
            user_id,
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
    medicine        = request.args.get("medicine", "").strip().lower()
    gender          = request.args.get("gender", "").strip().lower()
    expected_effect = request.args.get("expected_effect", "").strip().lower()
    unlisted        = request.args.get("unlisted_side_effects", "").strip().lower()
    duration_bucket = request.args.get("duration", "").strip().lower()

    query  = "SELECT * FROM posts WHERE LOWER(drug_name) = ?"
    params = [medicine]

    if gender:
        query += " AND LOWER(gender) = ?"
        params.append(gender)
    if expected_effect:
        query += " AND LOWER(expected_effect) = ?"
        params.append(expected_effect)
    if unlisted:
        query += " AND LOWER(unlisted_side_effects) = ?"
        params.append(unlisted)

    if duration_bucket == "short":
        query += """
            AND (
                (LOWER(duration_unit) IN ('day','days') AND duration_value < 7)
             OR (LOWER(duration_unit) IN ('hour','hours') AND duration_value < 168)
            )
        """
    elif duration_bucket == "medium":
        query += """
            AND (
                (LOWER(duration_unit) IN ('day','days') AND duration_value BETWEEN 7 AND 28)
             OR (LOWER(duration_unit) IN ('week','weeks') AND duration_value BETWEEN 1 AND 4)
            )
        """
    elif duration_bucket == "long":
        query += """
            AND (
                (LOWER(duration_unit) IN ('day','days') AND duration_value > 28)
             OR (LOWER(duration_unit) IN ('week','weeks') AND duration_value > 4)
             OR (LOWER(duration_unit) IN ('month','months'))
             OR (LOWER(duration_unit) IN ('year','years'))
            )
        """

    query += " ORDER BY created_at ASC"

    with sqlite3.connect(DB_PATH) as conn:
        conn.row_factory = sqlite3.Row
        rows = conn.execute(query, params).fetchall()

    return jsonify([dict(r) for r in rows])


@app.route("/api/posts/<int:post_id>")
def get_post(post_id):
    with sqlite3.connect(DB_PATH) as conn:
        conn.row_factory = sqlite3.Row
        row = conn.execute("SELECT * FROM posts WHERE id = ?", (post_id,)).fetchone()
    if not row:
        return jsonify({"error": "Post not found"}), 404
    return jsonify(dict(row))


# ── COMMENTS API ──────────────────────────────────────────

@app.route("/api/posts/<int:post_id>/comments", methods=["GET"])
def get_comments(post_id):
    with sqlite3.connect(DB_PATH) as conn:
        conn.row_factory = sqlite3.Row
        rows = conn.execute("""
            SELECT c.id, c.post_id, c.user_id, c.parent_id, c.reply_to_email,
                   c.content, c.created_at, u.email AS author_email
            FROM comments c
            JOIN users u ON c.user_id = u.id
            WHERE c.post_id = ?
            ORDER BY c.created_at ASC
        """, (post_id,)).fetchall()

    all_comments = [dict(r) for r in rows]

    # Build nested structure: top-level + replies grouped by parent_id
    top_level = [c for c in all_comments if c["parent_id"] is None]
    replies_by_parent = {}
    for c in all_comments:
        if c["parent_id"] is not None:
            replies_by_parent.setdefault(c["parent_id"], []).append(c)

    for c in top_level:
        c["replies"] = replies_by_parent.get(c["id"], [])

    return jsonify(top_level)


@app.route("/api/posts/<int:post_id>/comments", methods=["POST"])
def add_comment(post_id):
    user_id = session.get("user_id")
    if not user_id:
        return jsonify({"error": "Not logged in"}), 401

    data           = request.get_json()
    content        = data.get("content", "").strip()
    parent_id      = data.get("parent_id")       # None for top-level
    reply_to_email = data.get("reply_to_email")  # email of person being replied to

    if not content:
        return jsonify({"error": "Comment cannot be empty"}), 400

    with sqlite3.connect(DB_PATH) as conn:
        conn.execute(
            "INSERT INTO comments (post_id, user_id, parent_id, reply_to_email, content) VALUES (?, ?, ?, ?, ?)",
            (post_id, user_id, parent_id, reply_to_email, content)
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
            "SELECT COUNT(*) FROM survey_votes WHERE post_id = ? AND answer = 1", (post_id,)
        ).fetchone()[0]
        no_count = conn.execute(
            "SELECT COUNT(*) FROM survey_votes WHERE post_id = ? AND answer = 0", (post_id,)
        ).fetchone()[0]
        total     = yes_count + no_count
        user_vote = None
        if user_id:
            row = conn.execute(
                "SELECT answer FROM survey_votes WHERE post_id = ? AND user_id = ?",
                (post_id, user_id)
            ).fetchone()
            if row is not None:
                user_vote = "yes" if row[0] == 1 else "no"
    return jsonify({"yes_count": yes_count, "no_count": no_count, "total": total, "user_vote": user_vote})


@app.route("/api/posts/<int:post_id>/survey", methods=["POST"])
def vote_survey(post_id):
    user_id = session.get("user_id")
    if not user_id:
        return jsonify({"error": "Not logged in"}), 401

    data   = request.get_json()
    answer = data.get("answer")

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
            "SELECT COUNT(*) FROM survey_votes WHERE post_id = ? AND answer = 1", (post_id,)
        ).fetchone()[0]
        no_count = conn.execute(
            "SELECT COUNT(*) FROM survey_votes WHERE post_id = ? AND answer = 0", (post_id,)
        ).fetchone()[0]
        total     = yes_count + no_count
        user_vote = None
        row = conn.execute(
            "SELECT answer FROM survey_votes WHERE post_id = ? AND user_id = ?",
            (post_id, user_id)
        ).fetchone()
        if row is not None:
            user_vote = "yes" if row[0] == 1 else "no"

    return jsonify({"yes_count": yes_count, "no_count": no_count, "total": total, "user_vote": user_vote})


# ── ME ────────────────────────────────────────────────────

@app.route("/api/me")
def me():
    user_id = session.get("user_id")
    email   = session.get("email")
    if not user_id:
        return jsonify({"user_id": None, "email": None})
    return jsonify({"user_id": user_id, "email": email})


# ── PROFILE API ───────────────────────────────────────────

@app.route("/api/me/posts")
def my_posts():
    user_id = session.get("user_id")
    if not user_id:
        return jsonify({"error": "Not logged in"}), 401

    with sqlite3.connect(DB_PATH) as conn:
        conn.row_factory = sqlite3.Row
        rows = conn.execute(
            "SELECT * FROM posts WHERE user_id = ? ORDER BY created_at DESC",
            (user_id,)
        ).fetchall()
    return jsonify([dict(r) for r in rows])


@app.route("/api/me/inbox")
def my_inbox():
    user_id = session.get("user_id")
    if not user_id:
        return jsonify({"error": "Not logged in"}), 401

    with sqlite3.connect(DB_PATH) as conn:
        conn.row_factory = sqlite3.Row

        lr = conn.execute(
            "SELECT last_read_at FROM inbox_read WHERE user_id = ?", (user_id,)
        ).fetchone()
        last_read_at = lr["last_read_at"] if lr else None

        rows = conn.execute("""
            SELECT
                c.id         AS comment_id,
                c.content    AS comment_content,
                c.created_at AS created_at,
                c.user_id    AS commenter_id,
                u.email      AS commenter_email,
                p.id         AS post_id,
                p.drug_name  AS drug_name
            FROM comments c
            JOIN posts  p ON c.post_id = p.id
            JOIN users  u ON c.user_id = u.id
            WHERE p.user_id = ?
              AND c.user_id != ?
            ORDER BY c.created_at DESC
        """, (user_id, user_id)).fetchall()

    items = []
    for r in rows:
        d = dict(r)
        d["is_new"] = (last_read_at is None) or (d["created_at"] > last_read_at)
        items.append(d)

    unread_count = sum(1 for i in items if i["is_new"])
    return jsonify({"items": items, "unread_count": unread_count, "last_read_at": last_read_at})


@app.route("/api/me/inbox/read", methods=["POST"])
def mark_inbox_read():
    user_id = session.get("user_id")
    if not user_id:
        return jsonify({"error": "Not logged in"}), 401

    with sqlite3.connect(DB_PATH) as conn:
        conn.execute("""
            INSERT INTO inbox_read (user_id, last_read_at) VALUES (?, CURRENT_TIMESTAMP)
            ON CONFLICT(user_id) DO UPDATE SET last_read_at = CURRENT_TIMESTAMP
        """, (user_id,))
        conn.commit()
    return jsonify({"message": "Marked as read"})


# ── RUN ───────────────────────────────────────────────────

if __name__ == "__main__":
    init_db()
    app.run(host='0.0.0.0', port=int(os.environ.get('PORT', 8080)))