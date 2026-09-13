// Register step 2 - basic details + qualification (vanilla JS)
// Reads step 1 from sessionStorage. Sends the full request to admin.
// Redirects back to step 1 if opened directly.
(function () {
  var form = document.getElementById("detailsForm");
  var msg = document.getElementById("authMsg");
  var sub = document.getElementById("detailsSub");
  if (!form) return;

  function load(key, fallback) {
    try {
      var v = JSON.parse(localStorage.getItem(key));
      return v === null || v === undefined ? fallback : v;
    } catch (e) {
      return fallback;
    }
  }

  function save(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {}
  }

  function say(text, ok) {
    if (!msg) return;
    msg.hidden = false;
    msg.textContent = text;
    msg.className = "auth-msg " + (ok ? "ok" : "no");
  }

  function cap(s) {
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  // Step 1 must exist, else go back to step 1
  var step1 = null;
  try {
    step1 = JSON.parse(sessionStorage.getItem("cc_reg_step1"));
  } catch (e) {}
  if (!step1 || !step1.email) {
    window.location.href = "register.html";
    return;
  }

  // Show what step 1 saved
  if (sub) {
    sub.textContent = "Step 2 of 2 · " + step1.email + " as " + cap(step1.role);
  }

  // Auto unique ID: CC-2026-XXXX, no repeats
  function makeId() {
    var users = load("cc_users", {});
    var reqs = load("cc_requests", []);
    var used = {};
    for (var e in users) used[users[e].uniqueId] = true;
    for (var r = 0; r < reqs.length; r++) used[reqs[r].uniqueId] = true;
    var id;
    do {
      id = "CC-2026-" + (1000 + Math.floor(Math.random() * 9000));
    } while (used[id]);
    return id;
  }

  // Submit: full request goes to the admin inbox
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var name = document.getElementById("regName").value.trim();
    var age = parseInt(document.getElementById("regAge").value, 10);
    var sex = document.getElementById("regGen").value;
    var phone = document.getElementById("regPhone").value.trim();
    var org = document.getElementById("regOrg").value.trim();
    var qual = document.getElementById("regQual").value;
    var field = document.getElementById("regField").value.trim();
    var year = parseInt(document.getElementById("regYear").value, 10);
    var agree = document.getElementById("regAgree").checked;

    if (!name) return say("Please enter your full name.", false);
    if (!age || age < 5 || age > 120) return say("Please enter a valid age.", false);
    if (!sex) return say("Please select Sex.", false);
    if (!phone) return say("Please enter your phone number.", false);
    if (!org) return say("Please enter your organization or college.", false);
    if (!qual) return say("Please select your highest qualification.", false);
    if (!field) return say("Please enter your field of study.", false);
    if (!year || year < 1980 || year > 2035) return say("Please enter a valid passing year.", false);
    if (!agree) return say("Please tick the declaration box.", false);

    var email = step1.email;
    var users = load("cc_users", {});
    var reqs = load("cc_requests", []);
    if (users[email]) return say("This email already has an account. Please login.", false);
    for (var i = 0; i < reqs.length; i++) {
      if (reqs[i].email === email && reqs[i].status === "pending") {
        return say("Request already sent. Waiting for admin approval.", false);
      }
    }

    var id = makeId();
    reqs.push({
      id: "REQ-" + Date.now(),
      kind: "registration",
      email: email,
      name: name,
      role: step1.role,
      age: age,
      sex: sex,
      phone: phone,
      org: org,
      qual: qual,
      qualField: field,
      qualYear: year,
      uniqueId: id,
      pass: step1.pass,
      status: "pending",
      time: new Date().toISOString().slice(0, 10)
    });
    save("cc_requests", reqs);
    if (window.CCActivity && window.CCActivity.logFor) CCActivity.logFor(email, "Registration request sent (ID " + id + ")");

    // Clear step 1 so a refresh does not resend
    try {
      sessionStorage.removeItem("cc_reg_step1");
    } catch (err) {}

    say("Sent to admin for approval. Your ID is " + id + ". You can log in after approval.", true);
    form.reset();
  });
})();
