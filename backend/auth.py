
from pathlib import Path

from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError


# Locate files inside the backend folder
BASE_DIR = Path(__file__).resolve().parent

CREDENTIALS_FILE = BASE_DIR / "credential.json"
TOKEN_FILE = BASE_DIR / "token.json"

# Start with read-only Gmail permission
SCOPES = ["https://www.googleapis.com/auth/gmail.modify"]


def authenticate():
    credentials = None

    # Check whether we already have an authentication token
    if TOKEN_FILE.exists():
        credentials = Credentials.from_authorized_user_file(
            str(TOKEN_FILE), SCOPES
        )

    # Authenticate if necessary
    if not credentials or not credentials.valid:

        if credentials and credentials.expired and credentials.refresh_token:
            credentials.refresh(Request())

        else:
            flow = InstalledAppFlow.from_client_secrets_file(
                str(CREDENTIALS_FILE),
                SCOPES
            )

            credentials = flow.run_local_server(port=0)

        # Save the token for future use
        TOKEN_FILE.write_text(credentials.to_json())

    return credentials


def get_recent_emails(service, max_results=5):
    # Get the latest messages from the Inbox
    results = service.users().messages().list(
        userId="me",
        maxResults=max_results,
        q="in:inbox"
    ).execute()

    messages = results.get("messages", [])

    if not messages:
        print("\nNo emails found in your Inbox.")
        return

    print("\nYour 5 most recent Inbox emails:\n")

    for message in messages:

        # Retrieve email metadata
        email = service.users().messages().get(
            userId="me",
            id=message["id"],
            format="metadata",
            metadataHeaders=["From", "Subject", "Date"]
        ).execute()

        headers = email.get("payload", {}).get("headers", [])

        # Convert headers into a dictionary
        email_headers = {
            header["name"].lower(): header["value"]
            for header in headers
        }

        sender = email_headers.get("from", "Unknown sender")
        subject = email_headers.get("subject", "(No subject)")
        date = email_headers.get("date", "Unknown date")

        print("From:", sender)
        print("Subject:", subject)
        print("Date:", date)
        print("-" * 50)


def fetch_recent_emails(service, max_results=5):
    results = service.users().messages().list(
        userId="me",
        maxResults=max_results,
        q="in:inbox"
    ).execute()

    messages = results.get("messages", [])
    emails = []

    for message in messages:
        email = service.users().messages().get(
            userId="me",
            id=message["id"],
            format="metadata",
            metadataHeaders=["From", "Subject"]
        ).execute()

        headers = email.get("payload", {}).get("headers", [])

        email_headers = {
            header["name"].lower(): header["value"]
            for header in headers
        }

        emails.append({
            "id": message["id"],
            "sender": email_headers.get("from", ""),
            "subject": email_headers.get("subject", "")
        })

    return emails


def get_or_create_label(service, label_name):
    # Get existing Gmail labels
    results = service.users().labels().list(
        userId="me"
    ).execute()

    labels = results.get("labels", [])

    # Check whether the label already exists
    for label in labels:
        if label["name"] == label_name:
            return label["id"]

    # Create the label if it doesn't exist
    new_label = service.users().labels().create(
        userId="me",
        body={
            "name": label_name,
            "labelListVisibility": "labelShow",
            "messageListVisibility": "show"
        }
    ).execute()

    return new_label["id"]


def apply_gmail_label(service, message_id, label_name):
    label_id = get_or_create_label(service, label_name)

    service.users().messages().modify(
        userId="me",
        id=message_id,
        body={
            "addLabelIds": [label_id]
        }
    ).execute()

    return True

def main():
    try:
        credentials = authenticate()

        # Connect to Gmail API
        service = build("gmail", "v1", credentials=credentials)

        # Retrieve Gmail labels
        results = service.users().labels().list(
            userId="me"
        ).execute()

        labels = results.get("labels", [])

        print("\nSuccessfully connected to Gmail!")
        print("\nYour Gmail labels:")

        for label in labels:
            print("-", label["name"])

            
        get_recent_emails(service)
        emails = fetch_recent_emails(service)
        print("\nRetrieved email data:")
        print(emails)

    except FileNotFoundError as error:
        print("File not found:", error)

    except HttpError as error:
        print("Gmail API error:", error)

    except Exception as error:
        print("Authentication error:", error)


if __name__ == "__main__":
    main()
