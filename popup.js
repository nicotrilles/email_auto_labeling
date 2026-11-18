
const addRuleBtn = document.getElementById("addRuleBtn");
const ruleForm = document.getElementById("ruleForm");
const saveRuleBtn = document.getElementById("saveRuleBtn");
const rulesContainer = document.getElementById("rulesContainer");
const formTitle = document.getElementById("formTitle");

// Tracks which rule is being edited.
// null means we are creating a new rule.
let editingIndex = null;


// Show form for creating a rule
addRuleBtn.addEventListener("click", function() {
    editingIndex = null;

    formTitle.textContent = "New Rule";
    saveRuleBtn.textContent = "Save Rule";

    ruleForm.style.display = "block";
});


// Display saved rules
async function displayRules() {
    const result = await chrome.storage.local.get("rules");
    const rules = result.rules || [];

    rulesContainer.replaceChildren();

    rules.forEach(function(rule, index) {
        const ruleElement = document.createElement("div");

        const title = document.createElement("strong");
        title.textContent = rule.label;

        const sender = document.createElement("p");
        sender.textContent = "Sender: " + (rule.sender || "Any");

        const subject = document.createElement("p");
        subject.textContent = "Subject: " + (rule.subject || "Any");

        // Edit button
        const editBtn = document.createElement("button");
        editBtn.textContent = "Edit";

editBtn.addEventListener("click", function() {
    alert("Edit button clicked!");

    editingIndex = index;

    document.getElementById("sender").value = rule.sender;
    document.getElementById("subject").value = rule.subject;
    document.getElementById("label").value = rule.label;

    formTitle.textContent = "Edit Rule";
    saveRuleBtn.textContent = "Update Rule";

    ruleForm.style.display = "block";
});

        // Delete button
        const deleteBtn = document.createElement("button");
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

        ruleElement.append(
            title,
            sender,
            subject,
            editBtn,
            deleteBtn
        );

        rulesContainer.appendChild(ruleElement);
    });
}


// Save or update a rule
saveRuleBtn.addEventListener("click", async function() {
    const sender = document.getElementById("sender").value.trim();
    const subject = document.getElementById("subject").value.trim();
    const label = document.getElementById("label").value.trim();

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

    await chrome.storage.local.set({
        rules: rules
    });

    // Reset the form
    document.getElementById("sender").value = "";
    document.getElementById("subject").value = "";
    document.getElementById("label").value = "";

    editingIndex = null;

    formTitle.textContent = "New Rule";
    saveRuleBtn.textContent = "Save Rule";
    ruleForm.style.display = "none";

    await displayRules();
});


// Load rules when popup opens
displayRules();
