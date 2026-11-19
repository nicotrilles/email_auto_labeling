from auth import authenticate, fetch_recent_emails, apply_gmail_label
from rule_engine import matches_rule
from googleapiclient.discovery import build
from flask import Flask, jsonify
from flask_cors import CORS

app = Flask(__name__)
saved_rules = []

# Allow requests from our Edge extension
CORS(
    app,
    resources={
        r"/api/*": {
            "origins": [
                "chrome-extension://mmphoknpdelfapoibnabadoaikdcnbbj"
            ]
        }
    }
)


@app.route("/api/health", methods=["GET"])
def health_check():
    return jsonify({
        "status": "online",
        "message": "Gmail Auto-Labeler backend is running!"
    })


@app.route("/api/rules", methods=["POST"])
def receive_rules():
    global saved_rules

    from flask import request

    data = request.get_json()

    saved_rules = data.get("rules", [])

    print("\nReceived rules from Edge:")
    print(saved_rules)

    return jsonify({
        "status": "success",
        "message": "Rules received successfully!",
        "count": len(saved_rules)
    })



@app.route("/api/process", methods=["POST"])
def process_emails():
    credentials = authenticate()
    service = build("gmail", "v1", credentials=credentials)

    emails = fetch_recent_emails(service)

    applied = []

    for email in emails:
        for rule in saved_rules:
            if matches_rule(email, rule):
                apply_gmail_label(
                    service,
                    email["id"],
                    rule["label"]
                )

                applied.append({
                    "subject": email["subject"],
                    "label": rule["label"]
                })

    return jsonify({
        "status": "success",
        "processed": len(emails),
        "matched": len(applied),
        "applied": applied
    })

print(app.url_map)
if __name__ == "__main__":
    app.run(
        host="127.0.0.1",
        port=5000,
        debug=False
    )
