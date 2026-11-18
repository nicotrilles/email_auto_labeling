
const addRuleBtn = document.getElementById("addRuleBtn");
const ruleForm = document.getElementById("ruleForm");
const saveRuleBtn = document.getElementById("saveRuleBtn");
const rulesContainer = document.getElementById("rulesContainer");
const formTitle = document.getElementById("formTitle");
const cancelBtn = document.getElementById("cancelBtn");

let editingIndex = null;


// Reset the form
function resetForm() {
    document.getElementById("sender").value = "";
    document.getElementById("subject").value = "";
    document.getElementById("label").value = "";

    editingIndex = null;

    formTitle.textContent = "New Rule";
    saveRuleBtn.textContent = "Save Rule";

    ruleForm.style.display = "none";
}


// Open form for creating a rule
addRuleBtn.addEventListener("click", function() {
    resetForm();

    formTitle.textContent = "New Rule";
    ruleForm.style.display = "block";
});


// Cancel editing or creating
cancelBtn.addEventListener("click", function() {
    resetForm();
});


// Display saved rules
async function displayRules() {
    const result = await chrome.storage.local.get("rules");
    const rules = result.rules || [];

    rulesContainer.replaceChildren();

    if (rules.length === 0) {
        const emptyMessage = document.createElement("div");

        emptyMessage.className = "empty-state";
        emptyMessage.textContent =
            "No rules yet. Create your first rule!";

        rulesContainer.appendChild(emptyMessage);
        return;
    }

    rules.forEach(function(rule, index) {

        const ruleCard = document.createElement("div");
        ruleCard.className = "rule-card";

        // Rule title
        const title = document.createElement("div");
        title.className = "rule-title";
        title.textContent = rule.label;

        // Rule details
        const details = document.createElement("div");
        details.className = "rule-details";

        const sender = document.createElement("div");
        sender.textContent = "Sender: " + (rule.sender || "Any");

        const subject = document.createElement("div");
        subject.textContent = "Subject: " + (rule.subject || "Any");

        details.append(sender, subject);

        // Action buttons
        const actions = document.createElement("div");
        actions.className = "rule-actions";

        // Edit button
        const editBtn = document.createElement("button");

        editBtn.className = "edit-btn";
        editBtn.textContent = "Edit";

        editBtn.addEventListener("click", function() {
            editingIndex = index;

            document.getElementById("sender").value =
                rule.sender || "";

            document.getElementById("subject").value =
                rule.subject || "";

            document.getElementById("label").value =
                rule.label || "";

            formTitle.textContent = "Edit Rule";
            saveRuleBtn.textContent = "Update Rule";

            ruleForm.style.display = "block";
        });

        // Delete button
        const deleteBtn = document.createElement("button");

        deleteBtn.className = "delete-btn";
        deleteBtn.textContent = "Delete";

        deleteBtn.addEventListener("click", async function() {
            const result = await chrome.storage.local.get("rules");
            const currentRules = result.rules || [];

            currentRules.splice(index, 1);

            await chrome.storage.local.set({
                rules: currentRules
            });

            await displayRules();
        });

        actions.append(editBtn, deleteBtn);

        ruleCard.append(title, details, actions);

        rulesContainer.appendChild(ruleCard);
    });
}


// Save or update a rule
saveRuleBtn.addEventListener("click", async function() {

    const sender = document.getElementById("sender").value.trim();
    const subject = document.getElementById("subject").value.trim();
    const label = document.getElementById("label").value.trim();

    // Validate inputs
    if (!label || (!sender && !subject)) {
        alert("Enter a label and at least one matching condition.");
        return;
    }

    const result = await chrome.storage.local.get("rules");
    const rules = result.rules || [];

    const ruleData = {
        sender: sender,
        subject: subject,
        label: label
    };

    if (editingIndex === null) {
        // Create a new rule
        rules.push(ruleData);
    } else {
        // Update an existing rule
        rules[editingIndex] = ruleData;
    }

    // Save to Edge storage
    await chrome.storage.local.set({
        rules: rules
    });

    // Close and reset form
    resetForm();

    // Refresh displayed rules
    await displayRules();
});


// Load saved rules when popup opens
displayRules();
