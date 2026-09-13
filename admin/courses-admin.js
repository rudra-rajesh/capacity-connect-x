// Admin courses - add, edit, delete (vanilla JS, beginner-simple)
// Writes cc_courses_custom. Empty array and reloads: courses-data.js
// re-reads storage on every page load, so all sections follow at once.
(function () {
  var list = document.getElementById("adminCourseList");
  var title = document.getElementById("courseCountTitle");
  var form = document.getElementById("addForm");
  var note = document.getElementById("addNote");
  var resetLink = document.getElementById("resetLink");
  var toggle = document.getElementById("addToggle");
  if (!list) return;

  // Side button opens/closes the Add form (hidden at first)
  if (toggle && form) {
    toggle.addEventListener("click", function () {
      form.hidden = !form.hidden;
      toggle.textContent = form.hidden ? "+ Add" : "− Close";
      if (!form.hidden) {
        var first = document.getElementById("newTitle");
        if (first) first.focus();
      }
    });
  }

  function loadCustom() {
    try {
      var v = JSON.parse(localStorage.getItem("cc_courses_custom"));
      return v && v.length !== undefined ? v : null;
    } catch (e) {
      return null;
    }
  }

  function saveCustom(arr) {
    try {
      localStorage.setItem("cc_courses_custom", JSON.stringify(arr));
    } catch (e) {}
  }

  // Current effective list (same rule as courses-data.js)
  function current() {
    var custom = loadCustom();
    if (custom) return custom;
    return window.CC_DEFAULT_COURSES ? window.CC_DEFAULT_COURSES.slice() : [];
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  // Auto id from title: "Monsoon Forecasting" -> "monsoon-forecasting-4821"
  function makeId(title, existing) {
    var slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "course";
    var used = {};
    for (var i = 0; i < existing.length; i++) used[existing[i].id] = true;
    var id = slug;
    while (used[id]) {
      id = slug + "-" + (1000 + Math.floor(Math.random() * 9000));
    }
    return id;
  }

  // Draw rows
  function render() {
    var courses = current();
    if (title) title.textContent = courses.length + (courses.length === 1 ? " course" : " courses");
    list.innerHTML = "";
    for (var i = 0; i < courses.length; i++) {
      list.appendChild(courseRow(courses[i]));
    }
    if (courses.length === 0) {
      var empty = document.createElement("div");
      empty.className = "empty-state";
      empty.textContent = "No courses. Add one above — counts show 0 everywhere until then.";
      list.appendChild(empty);
    }
  }

  // Parse resources textarea: one per line as Kind | Title | Detail
  function parseResources(text) {
    var kinds = { pdf: true, video: true, doc: true, link: true };
    var out = [];
    var lines = String(text || "").split("\n");
    for (var i = 0; i < lines.length; i++) {
      var parts = lines[i].split("|");
      if (parts.length < 3) continue;
      var kind = parts[0].trim().toLowerCase();
      var title = parts[1].trim();
      var meta = parts[2].trim();
      if (!kinds[kind] || !title) continue;
      out.push({ kind: kind, title: title, meta: meta });
    }
    return out;
  }

  function topicsText(course) {
    var topics = course.topics || [];
    return topics.length + (topics.length === 1 ? " topic" : " topics");
  }

  function resourcesText(course) {
    var resources = course.resources || [];
    return resources.length + (resources.length === 1 ? " resource" : " resources");
  }

  function courseRow(course) {
    var row = document.createElement("div");
    row.className = "req-row";

    var info = document.createElement("div");
    info.className = "req-info";
    info.innerHTML =
      "<strong>" + escapeHtml(course.title) + "</strong>" +
      "<small>" + escapeHtml(course.subject) + " · " + escapeHtml(course.level) + "</small>" +
      "<small>" + escapeHtml(course.weeks) + " weeks · " + escapeHtml(course.lessons) + " lessons · " + escapeHtml(course.id) + "</small>" +
      "<small>" + topicsText(course) + " · " + resourcesText(course) + "</small>";
    row.appendChild(info);

    var btns = document.createElement("div");
    btns.className = "req-btns";

    var edit = document.createElement("button");
    edit.type = "button";
    edit.className = "inspect-btn";
    edit.textContent = "Edit";
    edit.addEventListener("click", function () {
      openEditForm(row, course);
    });

    var del = document.createElement("button");
    del.type = "button";
    del.className = "danger-btn";
    del.style.width = "auto";
    del.style.marginTop = "0";
    del.textContent = "Delete";
    del.addEventListener("click", function () {
      if (del.textContent !== "Confirm?") {
        del.textContent = "Confirm?";
        return;
      }
      var courses = current();
      var kept = [];
      for (var i = 0; i < courses.length; i++) {
        if (courses[i].id !== course.id) kept.push(courses[i]);
      }
      saveCustom(kept);
      window.location.reload();
    });

    btns.appendChild(edit);
    btns.appendChild(del);
    row.appendChild(btns);
    return row;
  }

  // Inline edit form under the row
  function openEditForm(afterRow, course) {
    var old = document.querySelector(".change-form");
    if (old) old.parentNode.removeChild(old);

    var box = document.createElement("div");
    box.className = "change-form";

    var fields = [
      ["Title", "editTitle", course.title],
      ["Subject / Field", "editSubject", course.subject],
      ["Weeks", "editWeeks", course.weeks],
      ["Lessons", "editLessons", course.lessons]
    ];
    for (var i = 0; i < fields.length; i++) {
      var lab = document.createElement("label");
      lab.className = "field";
      lab.innerHTML = "<span>" + fields[i][0] + "</span>";
      var input = document.createElement("input");
      input.type = "text";
      input.id = fields[i][1];
      input.value = fields[i][2];
      lab.appendChild(input);
      box.appendChild(lab);
    }

    // Description box
    var dlab = document.createElement("label");
    dlab.className = "field";
    dlab.innerHTML = "<span>Description (1-2 lines)</span>";
    var dinput = document.createElement("textarea");
    dinput.rows = 2;
    dinput.id = "editDesc";
    dinput.value = course.desc || "";
    dlab.appendChild(dinput);
    box.appendChild(dlab);

    // Topics box (comma separated)
    var tlab = document.createElement("label");
    tlab.className = "field";
    tlab.innerHTML = "<span>Topics (comma separated)</span>";
    var tinput = document.createElement("input");
    tinput.type = "text";
    tinput.id = "editTopics";
    tinput.value = (course.topics || []).join(", ");
    tlab.appendChild(tinput);
    box.appendChild(tlab);

    // Resources box (one per line: Kind | Title | Detail)
    var rlab = document.createElement("label");
    rlab.className = "field";
    rlab.innerHTML = "<span>Resources (one per line: Kind | Title | Detail)</span>";
    var rinput = document.createElement("textarea");
    rinput.rows = 3;
    rinput.id = "editResources";
    var rlines = [];
    var existing = course.resources || [];
    for (var ri = 0; ri < existing.length; ri++) {
      rlines.push(existing[ri].kind + " | " + existing[ri].title + " | " + (existing[ri].meta || ""));
    }
    rinput.value = rlines.join("\n");
    rlab.appendChild(rinput);
    box.appendChild(rlab);

    var llab = document.createElement("label");
    llab.className = "field";
    llab.innerHTML = "<span>Level</span>";
    var sel = document.createElement("select");
    sel.id = "editLevel";
    var levels = ["Easy", "Normal", "Hard"];
    for (var l = 0; l < levels.length; l++) {
      var opt = document.createElement("option");
      opt.textContent = levels[l];
      if (levels[l] === course.level) opt.selected = true;
      sel.appendChild(opt);
    }
    llab.appendChild(sel);
    box.appendChild(llab);

    var saveBtn = document.createElement("button");
    saveBtn.type = "button";
    saveBtn.className = "save-btn";
    saveBtn.textContent = "Save changes";
    saveBtn.addEventListener("click", function () {
      var courses = current();
      for (var i = 0; i < courses.length; i++) {
        if (courses[i].id !== course.id) continue;
        courses[i].title = document.getElementById("editTitle").value.trim() || courses[i].title;
        courses[i].subject = document.getElementById("editSubject").value.trim() || courses[i].subject;
        courses[i].weeks = parseInt(document.getElementById("editWeeks").value, 10) || courses[i].weeks;
        courses[i].lessons = parseInt(document.getElementById("editLessons").value, 10) || courses[i].lessons;
        courses[i].level = document.getElementById("editLevel").value;
        courses[i].desc = document.getElementById("editDesc").value.trim();
        var tops = document.getElementById("editTopics").value.split(",");
        courses[i].topics = [];
        for (var t = 0; t < tops.length; t++) {
          if (tops[t].trim()) courses[i].topics.push(tops[t].trim());
        }
        courses[i].resources = parseResources(document.getElementById("editResources").value);
      }
      saveCustom(courses);
      window.location.reload();
    });
    box.appendChild(saveBtn);

    afterRow.parentNode.insertBefore(box, afterRow.nextSibling);
  }

  // Add form (description, topics and resources included)
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var t = document.getElementById("newTitle").value.trim();
      var s = document.getElementById("newSubject").value.trim();
      var lv = document.getElementById("newLevel").value;
      var w = parseInt(document.getElementById("newWeeks").value, 10);
      var ls = parseInt(document.getElementById("newLessons").value, 10);
      var d = document.getElementById("newDesc").value.trim();
      var tops = document.getElementById("newTopics").value.split(",");
      if (!t || !s || !lv || !w || !ls || !d) {
        if (note) {
          note.textContent = "Please fill title, subject, level, weeks, lessons and description.";
          note.className = "save-note no";
          note.hidden = false;
        }
        return;
      }
      var topicList = [];
      for (var i = 0; i < tops.length; i++) {
        if (tops[i].trim()) topicList.push(tops[i].trim());
      }
      var courses = current();
      courses.push({
        id: makeId(t, courses),
        title: t,
        subject: s,
        weeks: w,
        lessons: ls,
        level: lv,
        desc: d,
        topics: topicList,
        resources: parseResources(document.getElementById("newResources").value)
      });
      saveCustom(courses);
      window.location.reload();
    });
  }

  // Reset to defaults (clears the override)
  if (resetLink) {
    resetLink.addEventListener("click", function (e) {
      e.preventDefault();
      if (resetLink.textContent !== "Click again to confirm reset") {
        resetLink.textContent = "Click again to confirm reset";
        return;
      }
      try {
        localStorage.removeItem("cc_courses_custom");
      } catch (err) {}
      window.location.reload();
    });
  }

  render();
})();
