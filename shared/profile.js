// Profile page - photo + locked rows + bio (vanilla JS, beginner-simple)
// Shared by trainee, trainer and admin profile.html.
// Locked rows (name, ID, email, age) change only through admin approval.
// Qualification is display-only. Bio saves instantly.
(function () {
  // ---- who is looking? ----
  var email = null;
  try {
    email = (localStorage.getItem("cc_email") || "").toLowerCase();
  } catch (e) {}

  // Guests see a login note; the user-card overlay (guest.js) also applies here
  if (!email) {
    var guestNote = document.getElementById("guestNote");
    if (guestNote) guestNote.hidden = false;
    return;
  }

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

  function setText(id, value) {
    var el = document.getElementById(id);
    if (el) el.textContent = value;
  }

  var users = load("cc_users", {});
  var me = users[email];
  if (!me) return;

  // ================= PHOTO (browse files, else first letter) =================
  var photoBox = document.getElementById("profilePhoto");
  var photoInput = document.getElementById("photoInput");
  var photoNote = document.getElementById("photoNote");

  function drawPhoto() {
    var photos = load("cc_photos", {});
    var src = photos[email];
    if (!photoBox) return;
    photoBox.innerHTML = "";
    if (src) {
      var img = document.createElement("img");
      img.src = src;
      img.alt = "profile photo";
      photoBox.appendChild(img);
    } else {
      // Default: first letter, uppercase
      photoBox.textContent = (me.name || email).charAt(0).toUpperCase();
    }
  }
  drawPhoto();

  if (photoInput) {
    photoInput.addEventListener("change", function () {
      var file = photoInput.files[0];
      if (!file) return;
      var reader = new FileReader();
      reader.onload = function () {
        var photos = load("cc_photos", {});
        photos[email] = reader.result;
        try {
          save("cc_photos", photos);
          if (window.CCActivity) CCActivity.log("Updated profile photo");
          if (photoNote) {
            photoNote.textContent = "Photo saved.";
            photoNote.className = "save-note ok";
            photoNote.hidden = false;
          }
        } catch (err) {
          // Browser storage full: keep the letter avatar
          if (photoNote) {
            photoNote.textContent = "Photo too large, letter kept.";
            photoNote.className = "save-note no";
            photoNote.hidden = false;
          }
          return;
        }
        drawPhoto();
      };
      reader.readAsDataURL(file);
    });
  }

  // Fill header: name + ID
  setText("profileName", me.name);
  setText("profileId", me.uniqueId + " · " + cap(me.role));

  // ================= EDIT FORM (change all, one Update button) =================
  // Locked rows go to admin as profile-change requests (one per changed
  // field, same timestamp). Bio saves instantly. Photo is instant too.
  var editList = document.getElementById("editList");
  var bioInput = document.getElementById("proBio");
  var reasonInput = document.getElementById("changeReason");
  var updateBtn = document.getElementById("updateProfile");
  var updateNote = document.getElementById("updateNote");
  if (bioInput) bioInput.value = me.bio || "";

  // Editable locked rows: storage field + label + input type
  var editFields = [
    { field: "name", label: "Name", type: "text" },
    { field: "uniqueId", label: "Unique ID", type: "text" },
    { field: "email", label: "Email", type: "email" },
    { field: "age", label: "Age", type: "number" }
  ];

  // Qualification triple (degree + field + year)
  var qualDefs = [
    { field: "qual", label: "Degree", type: "text", value: me.qual || "" },
    { field: "qualField", label: "Field of study", type: "text", value: me.qualField || "" },
    { field: "qualYear", label: "Year of passing", type: "number", value: me.qualYear || "" }
  ];

  if (editList) {
    for (var f = 0; f < editFields.length; f++) {
      editList.appendChild(editRow(editFields[f], fieldValue(editFields[f].field)));
    }
    var qTitle = document.createElement("p");
    qTitle.className = "hint-line";
    qTitle.textContent = "Qualification";
    editList.appendChild(qTitle);
    for (var q = 0; q < qualDefs.length; q++) {
      editList.appendChild(editRow(qualDefs[q], qualDefs[q].value));
    }
  }

  function fieldValue(field) {
    if (field === "email") return email;
    if (me[field] === undefined || me[field] === null) return "";
    return me[field];
  }

  function hasPending(field) {
    var reqs = load("cc_requests", []);
    for (var i = 0; i < reqs.length; i++) {
      if (reqs[i].kind === "profile-change" && reqs[i].email === email &&
          reqs[i].field === field && reqs[i].status === "pending") {
        return true;
      }
    }
    return false;
  }

  // One editable row: label + input, or a badge while waiting for admin
  function editRow(def, current) {
    var row = document.createElement("div");
    row.className = "locked-row";

    var left = document.createElement("div");
    left.style.flex = "1";
    var lab = document.createElement("span");
    lab.textContent = def.label;
    left.appendChild(lab);
    var input = document.createElement("input");
    input.type = def.type;
    input.value = current;
    input.id = "edit_" + def.field;
    input.className = "row-input";
    left.appendChild(input);
    row.appendChild(left);

    if (hasPending(def.field)) {
      input.disabled = true;
      var badge = document.createElement("span");
      badge.className = "pending-badge";
      badge.textContent = "Pending approval";
      row.appendChild(badge);
    }
    return row;
  }

  function sayUpdate(text, ok) {
    if (!updateNote) return;
    updateNote.textContent = text;
    updateNote.className = "save-note " + (ok ? "ok" : "no");
    updateNote.hidden = false;
  }

  // SINGLE UPDATE: bio now, locked changes to admin
  if (updateBtn) {
    updateBtn.addEventListener("click", function () {
      var all = load("cc_users", {});
      if (!all[email]) return;
      var reason = reasonInput ? reasonInput.value.trim() : "";
      var defs = editFields.concat(qualDefs);
      var changed = [];

      for (var i = 0; i < defs.length; i++) {
        var input = document.getElementById("edit_" + defs[i].field);
        if (!input || input.disabled) continue;
        var val = input.value.trim();
        var old = String(fieldValue(defs[i].field));
        if (val && val !== old) changed.push({ def: defs[i], oldVal: old, newVal: val });
      }

      // Simple checks on changed rows only
      for (var j = 0; j < changed.length; j++) {
        var c = changed[j];
        if (c.def.field === "age" && (parseInt(c.newVal, 10) < 5 || parseInt(c.newVal, 10) > 120)) {
          return sayUpdate("Age must be between 5 and 120.", false);
        }
        if (c.def.field === "email" && c.newVal.indexOf("@") === -1) {
          return sayUpdate("Email does not look valid.", false);
        }
        if (c.def.field === "qualYear" && (parseInt(c.newVal, 10) < 1980 || parseInt(c.newVal, 10) > 2035)) {
          return sayUpdate("Passing year must be between 1980 and 2035.", false);
        }
      }

      if (changed.length > 0 && !reason) {
        return sayUpdate("Add a reason for admin (locked rows changed).", false);
      }

      // Bio always saves at once
      all[email].bio = bioInput ? bioInput.value.trim() : all[email].bio;

      // One request per changed locked row, same timestamp
      var reqs = load("cc_requests", []);
      var stamp = Date.now();
      var today = new Date().toISOString().slice(0, 10);
      for (var k = 0; k < changed.length; k++) {
        reqs.push({
          id: "REQ-" + stamp + "-" + k,
          kind: "profile-change",
          email: email,
          name: all[email].name,
          role: all[email].role,
          field: changed[k].def.field,
          oldVal: changed[k].oldVal,
          newVal: changed[k].newVal,
          reason: reason,
          status: "pending",
          time: today
        });
      }
      save("cc_requests", reqs);
      save("cc_users", all);
      if (window.CCActivity) {
        if (changed.length === 0) CCActivity.log("Updated profile details");
        else CCActivity.log("Requested change to " + changed.map(function (c) { return c.def.label; }).join(", "));
      }

      if (changed.length === 0) {
        sayUpdate("Bio saved.", true);
        return;
      }
      sayUpdate("Bio saved. " + changed.length + " change(s) sent to admin.", true);
      setTimeout(function () {
        window.location.reload();
      }, 1200);
    });
  }
})();
