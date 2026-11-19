
def matches_rule(email, rule):
    sender = email.get("sender", "").lower()
    subject = email.get("subject", "").lower()

    sender_condition = rule.get("sender", "").strip().lower()
    subject_condition = rule.get("subject", "").strip().lower()

    # At least one condition must exist
    if not sender_condition and not subject_condition:
        return False

    # Check sender if specified
    if sender_condition and sender_condition not in sender:
        return False

    # Check subject if specified
    if subject_condition and subject_condition not in subject:
        return False

    return True


if __name__ == "__main__":
    email = {
        "sender": "notifications@github.com",
        "subject": "Your new assignment is ready"
    }

    rules = [
        {
            "sender": "github.com",
            "subject": "assignment",
            "label": "School"
        },
        {
            "sender": "google.com",
            "subject": "",
            "label": "Google"
        },
        {
            "sender": "",
            "subject": "assignment",
            "label": "Tasks"
        }
    ]

    for rule in rules:
        if matches_rule(email, rule):
            print("Matched label:", rule["label"])