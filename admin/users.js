// Users panel - list real users + inspect overlay (vanilla JS, beginner-simple)
// Reads cc_users (approved accounts only). Writes status back on block/delete.
(function () {
  var list = document.getElementById("userList");
  var empty = document.getElementById("userEmpty");
  var search = document.getElementById("userSearch");
  if (!list) return;

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

  function cap(s) {
    return (s || "").charAt(0).toUpperCase() + (s || "").slice(1);
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  // All users as a list, newest first by joined date
  function allUsers() {
    var users = load("cc_users", {});
    var rows = [];
    for (var email in users) {
      var u = users[email];
      u.email = email;
      rows.push(u);
    }
    rows.sort(function (a, b) {
      return (b.joined || "") < (a.joined || "") ? -1 : 1;
    });
    return rows;
  }

  // My own email (to mark "you" and protect self-delete)
  var me = "";
  try {
    me = (localStorage.getItem("cc_email") || "").toLowerCase();
  } catch (e) {}

  // Draw rows, filtered by search box
  function render() {
    var q = search ? search.value.trim().toLowerCase() : "";
    var rows = allUsers();
    var shown = [];
    for (var i = 0; i < rows.length; i++) {
      var u = rows[i];
      var hay = (u.name + " " + u.email + " " + u.uniqueId).toLowerCase();
      if (!q || hay.indexOf(q) !== -1) shown.push(u);
    }

    list.innerHTML = "";
    if (empty) empty.hidden = shown.length !== 0;
    for (var j = 0; j < shown.length; j++) {
      list.appendChild(userRow(shown[j]));
    }
  }

  // One user row: avatar + Name/ID/email + pills + Inspect on the right
  function userRow(u) {
    var row = document.createElement("div");
    row.className = "user-row";

    var av = document.createElement("div");
    av.className = "avatar";
    av.textContent = (u.name || u.email || "?").charAt(0).toUpperCase();

    var info = document.createElement("div");
    info.className = "req-info";
    var you = u.email === me ? " (you)" : "";
    info.innerHTML =
      "<strong>" + escapeHtml(u.name) + escapeHtml(you) + "</strong>" +
      "<small>" + escapeHtml(u.uniqueId) + " · " + escapeHtml(u.email) + "</small>";

    var pills = document.createElement("div");
    var rolePill = document.createElement("span");
    rolePill.className = "pill pill-" + u.role;
    rolePill.textContent = cap(u.role);
    var statusPill = document.createElement("span");
    statusPill.className = "pill " + (u.status === "blocked" ? "pill-blocked" : "pill-active");
    statusPill.textContent = u.status === "blocked" ? "Blocked" : "Active";
    pills.appendChild(rolePill);
    pills.appendChild(statusPill);

    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "inspect-btn";
    btn.textContent = "Inspect";
    btn.addEventListener("click", function () {
      openOverlay(u.email);
    });

    row.appendChild(av);
    row.appendChild(info);
    row.appendChild(pills);
    row.appendChild(btn);
    return row;
  }

  // INSPECT OVERLAY: full details + block + delete
  function openOverlay(email) {
    var users = load("cc_users", {});
    var u = users[email];
    if (!u) return;

    // Dark background
    var overlay = document.createElement("div");
    overlay.className = "overlay";

    // White panel
    var panel = document.createElement("div");
    panel.className = "overlay-panel";

    // Header: avatar + name + ID + close
    var head = document.createElement("div");
    head.className = "overlay-head";
    head.innerHTML =
      "<div class='avatar'>" + escapeHtml((u.name || "?").charAt(0).toUpperCase()) + "</div>" +
      "<div><strong>" + escapeHtml(u.name) + "</strong>" +
      "<small>" + escapeHtml(u.uniqueId) + " · " + cap(u.role) + "</small></div>";

    var close = document.createElement("button");
    close.type = "button";
    close.className = "overlay-close";
    close.textContent = "✕";
    close.setAttribute("aria-label", "Close");
    close.addEventListener("click", function () {
      document.body.removeChild(overlay);
    });
    head.appendChild(close);
    panel.appendChild(head);

    // Detail lines
    var rows = [
      ["Email", u.email],
      ["Phone", u.phone || "-"],
      ["Organization", u.org || "-"],
      ["Qualification", (u.qual || "-") + " in " + (u.qualField || "-") + " (" + (u.qualYear || "-") + ")"],
      ["Age", u.age],
      ["Sex", u.sex],
      ["Joined", u.joined],
      ["Status", u.status === "blocked" ? "Blocked" : "Active"]
    ];
    for (var i = 0; i < rows.length; i++) {
      var line = document.createElement("div");
      line.className = "detail-line";
      line.innerHTML =
        "<span>" + escapeHtml(rows[i][0]) + "</span><b>" + escapeHtml(rows[i][1]) + "</b>";
      panel.appendChild(line);
    }

    // Block / Unblock button
    var blockBtn = document.createElement("button");
    blockBtn.type = "button";
    blockBtn.className = "inspect-btn";
    blockBtn.style.width = "100%";
    blockBtn.style.marginTop = "12px";
    blockBtn.textContent = u.status === "blocked" ? "Unblock user" : "Block user";
    if (u.email === me) {
      blockBtn.disabled = true;
      blockBtn.textContent = "This is you";
    }
    blockBtn.addEventListener("click", function () {
      var all = load("cc_users", {});
      if (!all[email]) return;
      var wasBlocked = all[email].status === "blocked";
      all[email].status = wasBlocked ? "approved" : "blocked";
      save("cc_users", all);
      if (window.CCActivity) CCActivity.log((wasBlocked ? "Unblocked " : "Blocked ") + email);
      document.body.removeChild(overlay);
      render();
    });
    panel.appendChild(blockBtn);

    // Delete button: first click arms, second click deletes
    var delBtn = document.createElement("button");
    delBtn.type = "button";
    delBtn.className = "danger-btn";
    delBtn.textContent = "Delete user";
    if (u.email === me) {
      delBtn.disabled = true;
      delBtn.textContent = "You cannot delete your own account";
    }
    delBtn.addEventListener("click", function () {
      if (delBtn.textContent !== "Confirm delete?") {
        delBtn.textContent = "Confirm delete?";
        return;
      }
      var all = load("cc_users", {});
      delete all[email];
      save("cc_users", all);
      if (window.CCActivity) CCActivity.log("Deleted user " + email);
      document.body.removeChild(overlay);
      render();
    });
    panel.appendChild(delBtn);

    overlay.appendChild(panel);

    // Click dark area closes too
    overlay.addEventListener("click", function (e) {
      if (e.target === overlay) document.body.removeChild(overlay);
    });

    // ESC closes too
    document.addEventListener("keydown", function esc(e) {
      if (e.key === "Escape" && overlay.parentNode) {
        document.body.removeChild(overlay);
        document.removeEventListener("keydown", esc);
      }
    });

    document.body.appendChild(overlay);
  }

  if (search) {
    search.addEventListener("input", render);
  }

  render();
})();
