// Auth - one login for all three roles (vanilla JS)
// Login works only for admin-approved accounts (cc_users).
// New users register on register.html; admin approves on admin/approvals.html.
// NOTE: passwords are stored as plain text. Fine for a class prototype,
// never do this in a real site (real sites hash passwords on a server).
(function () {
  var selectedRole = "trainee"; // default top selection

  var roleBtns = document.querySelectorAll(".role-btn");
  var roleName = document.getElementById("roleName");
  var loginBtn = document.getElementById("loginBtn");
  var form = document.getElementById("loginForm");
  var msg = document.getElementById("authMsg");

  function cap(s) {
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  // ---- small storage helpers ----
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

  // ---- seed 3 approved judge accounts (merged, never overwriting) ----
  // Real approved accounts, so judges can log straight in.
  // Password for all three: demo1234
  // Merge (not skip): old browsers may hold a registry without these,
  // which used to block demo login with "No account found".
  function seed() {
    var now = new Date().toISOString().slice(0, 10);
    var demoAccounts = {
      "trainee@mail.com": { name: "Demo Trainee", age: 20, sex: "Other", role: "trainee", uniqueId: "CC-2026-1001", pass: "demo1234", status: "approved", joined: now, phone: "98765 43210", org: "Demo College", qual: "Bachelor's", qualField: "Computer Science", qualYear: 2025 },
      "trainer@mail.com": { name: "Demo Trainer", age: 32, sex: "Other", role: "trainer", uniqueId: "CC-2026-1002", pass: "demo1234", status: "approved", joined: now, phone: "98765 43211", org: "Demo Institute", qual: "Master's", qualField: "Education", qualYear: 2020 },
      "admin@mail.com": { name: "Demo Admin", age: 35, sex: "Other", role: "admin", uniqueId: "CC-2026-1003", pass: "demo1234", status: "approved", joined: now, phone: "98765 43212", org: "Capacity Connect", qual: "Master's", qualField: "Management", qualYear: 2019 }
    };
    var users = load("cc_users", {});
    var changed = false;
    for (var email in demoAccounts) {
      if (!users[email]) {
        // Missing demo account: add it whole
        users[email] = demoAccounts[email];
        changed = true;
      } else {
        // Present but from an old shape: backfill login-critical fields only
        var needs = false;
        if (!users[email].pass) { users[email].pass = "demo1234"; needs = true; }
        if (!users[email].status) { users[email].status = "approved"; needs = true; }
        if (!users[email].role) { users[email].role = demoAccounts[email].role; needs = true; }
        if (!users[email].uniqueId) { users[email].uniqueId = demoAccounts[email].uniqueId; needs = true; }
        if (needs) changed = true;
      }
    }
    if (changed || load("cc_users", null) === null) save("cc_users", users);
    // 2 pending demo requests, only when the inbox key is missing entirely
    // (never overwrite admin decisions)
    if (load("cc_requests", null) === null) {
      save("cc_requests", [
        { id: "REQ-1", kind: "registration", email: "aria@mail.com", name: "Aria Sharma", role: "trainee", age: 19, sex: "Female", phone: "98111 22334", org: "City College", qual: "Bachelor's", qualField: "Physics", qualYear: 2024, uniqueId: "CC-2026-1004", status: "pending", time: now },
        { id: "REQ-2", kind: "registration", email: "dev@mail.com", name: "Dev Patel", role: "trainer", age: 29, sex: "Male", phone: "98222 33445", org: "Tech Institute", qual: "Master's", qualField: "Mathematics", qualYear: 2021, uniqueId: "CC-2026-1005", status: "pending", time: now }
      ]);
    }
  }
  seed();

  // ---- message box helper (hidden until needed) ----
  function say(text, ok) {
    if (!msg) return;
    msg.hidden = false;
    msg.textContent = text;
    msg.className = "auth-msg " + (ok ? "ok" : "no");
  }

  // 1. Top role selection
  for (var i = 0; i < roleBtns.length; i++) {
    roleBtns[i].addEventListener("click", function () {
      for (var j = 0; j < roleBtns.length; j++) {
        roleBtns[j].classList.remove("active");
        roleBtns[j].setAttribute("aria-selected", "false");
      }
      this.classList.add("active");
      this.setAttribute("aria-selected", "true");
      selectedRole = this.getAttribute("data-role");
      if (roleName) roleName.textContent = cap(selectedRole);
      if (loginBtn) loginBtn.textContent = "Login as " + cap(selectedRole);
    });
  }

  // 1b. Demo button on the side of the card: fills demo email + password
  var demoBtn = document.getElementById("demoBtn");
  if (demoBtn) {
    demoBtn.addEventListener("click", function () {
      var demoMap = {
        trainee: { email: "trainee@mail.com", pass: "demo1234" },
        trainer: { email: "trainer@mail.com", pass: "demo1234" },
        admin: { email: "admin@mail.com", pass: "demo1234" }
      };
      var demo = demoMap[selectedRole] || demoMap.trainee;
      var emailInput = document.getElementById("email");
      var passInput = document.getElementById("password");
      if (emailInput) emailInput.value = demo.email;
      if (passInput) passInput.value = demo.pass;
      say("Demo details filled for " + cap(selectedRole) + " — press Login.", true);
    });
  }

  // Reset demo data: clears all prototype storage and reseeds.
  // Recovery path for corrupt or stale browser data.
  var resetLink = document.getElementById("resetDemo");
  if (resetLink) {
    resetLink.addEventListener("click", function (e) {
      e.preventDefault();
      var keys = ["cc_users", "cc_requests", "cc_role", "cc_email", "cc_enrolled", "cc_photos", "cc_courses_custom"];
      for (var i = 0; i < keys.length; i++) {
        try {
          localStorage.removeItem(keys[i]);
        } catch (err) {}
      }
      try {
        sessionStorage.removeItem("cc_reg_step1");
      } catch (err) {}
      window.location.reload();
    });
  }

  // 2 + 3. Gated login: only approved accounts can enter
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var email = document.getElementById("email").value.trim().toLowerCase();
      var pass = document.getElementById("password").value;
      if (!email) return;

      var accounts = load("cc_users", {});
      var account = accounts[email];
      if (!account) {
        var pending = load("cc_requests", []);
        for (var p = 0; p < pending.length; p++) {
          if (pending[p].email === email && pending[p].status === "pending") {
            return say("Awaiting admin approval. Please wait.", false);
          }
        }
        return say("No account found for this email. Press Demo or create one.", false);
      }
      if (account.status === "blocked") {
        return say("Account blocked. Contact admin.", false);
      }
      if (account.pass && account.pass !== pass) {
        return say("Wrong password. Try again.", false);
      }
      if (account.role !== selectedRole) {
        return say("This email is registered as " + cap(account.role) + ". Select that role on top.", false);
      }
      try {
        localStorage.setItem("cc_role", account.role);
        localStorage.setItem("cc_email", email);
      } catch (err) {}
      if (window.CCActivity) CCActivity.log("Logged in");
      window.location.href = "../" + account.role + "/index.html";
    });
  }
})();
