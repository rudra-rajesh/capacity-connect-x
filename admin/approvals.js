// Approvals inbox - approve or reject requests (vanilla JS, beginner-simple)
// Reads cc_requests, writes cc_users. Same keys as auth.js.
(function () {
  var regList = document.getElementById("regList");
  var changeList = document.getElementById("changeList");
  var regEmpty = document.getElementById("regEmpty");
  var changeEmpty = document.getElementById("changeEmpty");
  var navBadge = document.getElementById("navBadge");
  if (!regList || !changeList) return;

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

  // Draw both lists from storage
  function render() {
    var reqs = load("cc_requests", []);
    var pending = [];
    for (var i = 0; i < reqs.length; i++) {
      if (reqs[i].status === "pending") pending.push(reqs[i]);
    }

    // Sidebar count badge = pending notifications for admin
    if (navBadge) {
      navBadge.hidden = pending.length === 0;
      navBadge.textContent = pending.length;
    }

    // Split by kind
    var regs = [];
    var changes = [];
    for (var j = 0; j < pending.length; j++) {
      if (pending[j].kind === "profile-change") changes.push(pending[j]);
      else regs.push(pending[j]);
    }

    drawRegs(regs);
    drawChanges(changes);
  }

  // One registration row
  function drawRegs(regs) {
    regList.innerHTML = "";
    if (regEmpty) regEmpty.hidden = regs.length !== 0;
    for (var i = 0; i < regs.length; i++) {
      regList.appendChild(regRow(regs[i]));
    }
  }

  function regRow(r) {
    var box = document.createElement("div");
    box.className = "req-row";

    var info = document.createElement("div");
    info.className = "req-info";
    info.innerHTML =
      "<strong>" + escapeHtml(r.name) + "</strong>" +
      "<small>" + escapeHtml(r.uniqueId) + " · " + escapeHtml(r.email) + "</small>" +
      "<small>" + cap(r.role) + " · Age " + escapeHtml(String(r.age)) + " · " + escapeHtml(r.sex) + " · " + escapeHtml(r.time) + "</small>" +
      "<small>Phone: " + escapeHtml(r.phone || "-") + " · " + escapeHtml(r.org || "-") + "</small>" +
      "<small>" + escapeHtml(r.qual || "-") + " in " + escapeHtml(r.qualField || "-") + " (" + escapeHtml(String(r.qualYear || "-")) + ")</small>";

    var btns = document.createElement("div");
    btns.className = "req-btns";

    var ok = document.createElement("button");
    ok.type = "button";
    ok.className = "approve-btn";
    ok.textContent = "Approve";
    ok.addEventListener("click", function () {
      decide(r.id, true);
    });

    var no = document.createElement("button");
    no.type = "button";
    no.className = "reject-btn";
    no.textContent = "Reject";
    no.addEventListener("click", function () {
      decide(r.id, false);
    });

    btns.appendChild(ok);
    btns.appendChild(no);
    box.appendChild(info);
    box.appendChild(btns);
    return box;
  }

  // One profile-change row
  function drawChanges(changes) {
    changeList.innerHTML = "";
    if (changeEmpty) changeEmpty.hidden = changes.length !== 0;
    for (var i = 0; i < changes.length; i++) {
      changeList.appendChild(changeRow(changes[i]));
    }
  }

  function changeRow(r) {
    var box = document.createElement("div");
    box.className = "req-row";

    var info = document.createElement("div");
    info.className = "req-info";
    info.innerHTML =
      "<strong>" + escapeHtml(r.name) + " <span class='mini-badge'>" + escapeHtml(r.field) + "</span></strong>" +
      "<small>" + escapeHtml(r.email) + " · " + escapeHtml(r.time) + "</small>" +
      "<small>Old: " + escapeHtml(r.oldVal) + " → New: " + escapeHtml(r.newVal) + "</small>" +
      "<small>Reason: " + escapeHtml(r.reason || "-") + "</small>";

    var btns = document.createElement("div");
    btns.className = "req-btns";

    var ok = document.createElement("button");
    ok.type = "button";
    ok.className = "approve-btn";
    ok.textContent = "Approve";
    ok.addEventListener("click", function () {
      decide(r.id, true);
    });

    var no = document.createElement("button");
    no.type = "button";
    no.className = "reject-btn";
    no.textContent = "Reject";
    no.addEventListener("click", function () {
      decide(r.id, false);
    });

    btns.appendChild(ok);
    btns.appendChild(no);
    box.appendChild(info);
    box.appendChild(btns);
    return box;
  }

  // Approve = apply to cc_users. Reject = mark rejected.
  function decide(id, approve) {
    var reqs = load("cc_requests", []);
    var users = load("cc_users", {});
    for (var i = 0; i < reqs.length; i++) {
      if (reqs[i].id !== id) continue;
      var r = reqs[i];
      if (approve) {
        if (r.kind === "profile-change") {
          // Apply new value to the approved account
          if (users[r.email]) {
            if (r.field === "email") {
              // Email is the account key: move the whole account over
              var moved = users[r.email];
              delete users[r.email];
              moved.email = r.newVal.toLowerCase();
              users[moved.email] = moved;
            } else {
              users[r.email][r.field] = r.newVal;
            }
          }
        } else {
          // New account: move to approved users, lessons unlock
          users[r.email] = {
            name: r.name,
            age: r.age,
            sex: r.sex,
            role: r.role,
            uniqueId: r.uniqueId,
            pass: r.pass || "",
            status: "approved",
            joined: r.time
          };
        }
        r.status = "approved";
      } else {
        r.status = "rejected";
      }
    }
    save("cc_requests", reqs);
    save("cc_users", users);
    if (window.CCActivity) {
      var acted = null;
      for (var a = 0; a < reqs.length; a++) {
        if (reqs[a].id === id) { acted = reqs[a]; break; }
      }
      if (acted) CCActivity.log((approve ? "Approved " : "Rejected ") + acted.name + " (" + acted.email + ")");
    }
    render();
  }

  // Small helper: keep names safe in HTML
  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  render();
})();
