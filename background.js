
const BACKEND_URL = "http://127.0.0.1:5000";
const ALARM_NAME = "process-gmail";

// Send saved rules to Flask
async function syncRules() {
    const result = await chrome.storage.local.get("rules");
    const rules = result.rules || [];

    const response = await fetch(`${BACKEND_URL}/api/rules`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ rules })
    });

    if (!response.ok) {
        throw new Error(`Rule sync failed: ${response.status}`);
    }

    return response.json();
}

// Ask Flask to process Gmail messages
async function processEmails() {
    await syncRules();

    const response = await fetch(`${BACKEND_URL}/api/process`, {
        method: "POST"
    });

    if (!response.ok) {
        throw new Error(`Email processing failed: ${response.status}`);
    }

    const data = await response.json();

    console.log("Gmail processing result:", data);
}

// Create a recurring alarm
async function setupAlarm() {
    const existingAlarm = await chrome.alarms.get(ALARM_NAME);

    if (!existingAlarm) {
        await chrome.alarms.create(ALARM_NAME, {
            periodInMinutes: 5
        });
    }
}

// Set up the alarm when the extension is installed or updated
chrome.runtime.onInstalled.addListener(setupAlarm);

// Set it up when Edge starts
chrome.runtime.onStartup.addListener(setupAlarm);

// Also ensure the alarm exists when the service worker starts
setupAlarm();

// Process Gmail whenever the alarm fires
chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === ALARM_NAME) {
        processEmails().catch((error) => {
            console.error("Automatic Gmail processing failed:", error);
        });
    }
});

// Synchronize rules whenever they change
chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === "local" && changes.rules) {
        syncRules().catch((error) => {
            console.error("Automatic rule synchronization failed:", error);
        });
    }
});
