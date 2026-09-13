// Course detail page - full info + topics + resources (vanilla JS)
// Reads ?id=, looks up shared/courses-data.js. Unknown id shows empty state.
// Enroll follows the same approval gate as the courses page.
(function () {
  var box = document.getElementById("detailBox");
  var emptyBox = document.getElementById("detailEmpty");
  if (!box) return;

  // Which course? link looks like course-detail.html?id=weather-basics
  var id = null;
  try {
    id = new URLSearchParams(window.location.search).get("id");
  } catch (e) {}
  var course = id && window.CC_COURSE_BY_ID ? window.CC_COURSE_BY_ID(id) : null;
  if (!course) {
    box.hidden = true;
    if (emptyBox) emptyBox.hidden = false;
    return;
  }
  box.hidden = false;

  // Log that this course was visited (shows in Recent Activity with a Go button)
  if (window.CCActivity) CCActivity.log("Visited " + course.title, course.id);

  function setText(tag, value) {
    var el = document.getElementById(tag);
    if (el) el.textContent = value;
  }

  // Header: badge + title + subject/weeks/lessons + description
  var badge = document.getElementById("detailLevel");
  if (badge) {
    badge.textContent = course.level;
    badge.className = "level level-" + String(course.level).toLowerCase();
  }
  setText("detailTitle", course.title);
  setText("detailMeta", course.subject + " · " + course.weeks + " weeks · " + course.lessons + " lessons");
  setText("detailDesc", course.desc || "");

  // Topics: what you learn
  var topicsBox = document.getElementById("topicsList");
  var topics = course.topics || [];
  if (topicsBox) {
    for (var t = 0; t < topics.length; t++) {
      var li = document.createElement("li");
      li.textContent = topics[t];
      topicsBox.appendChild(li);
    }
  }

  // Resources grouped by kind: pdf, video, doc, link
  var icons = { pdf: "pdf.svg", video: "video.svg", doc: "doc.svg", link: "link.svg" };
  var names = { pdf: "PDFs", video: "Videos", doc: "Word Docs", link: "Useful Links" };
  var resBox = document.getElementById("detailResources");
  var resources = course.resources || [];
  if (resBox) {
    var order = ["pdf", "video", "doc", "link"];
    for (var g = 0; g < order.length; g++) {
      var items = [];
      for (var r = 0; r < resources.length; r++) {
        if (resources[r].kind === order[g]) items.push(resources[r]);
      }
      if (items.length === 0) continue;

      var head = document.createElement("div");
      head.className = "res-head";
      var icon = document.createElement("span");
      icon.className = "res-icon";
      var img = document.createElement("img");
      img.src = "../svgs/" + icons[order[g]];
      img.alt = names[order[g]] + " icon";
      icon.appendChild(img);
      head.appendChild(icon);
      var h = document.createElement("h2");
      h.textContent = names[order[g]];
      head.appendChild(h);
      var count = document.createElement("small");
      count.className = "res-count";
      count.textContent = items.length + (items.length === 1 ? " file" : " files");
      head.appendChild(count);
      resBox.appendChild(head);

      for (var k = 0; k < items.length; k++) {
        var row = document.createElement("div");
        row.className = "res-row";
        var info = document.createElement("div");
        info.className = "req-info";
        var title = document.createElement("strong");
        title.textContent = items[k].title;
        info.appendChild(title);
        var meta = document.createElement("small");
        meta.textContent = items[k].meta || "";
        info.appendChild(meta);
        row.appendChild(info);
        resBox.appendChild(row);
      }
    }
    if (resources.length === 0) {
      var none = document.createElement("p");
      none.className = "hint";
      none.textContent = "No resources yet for this course.";
      resBox.appendChild(none);
    }
  }

  // Actions: enrolled shows Start Quiz link, else Enroll with gate
  var enrolled = {};
  try {
    enrolled = JSON.parse(localStorage.getItem("cc_enrolled") || "{}");
  } catch (e) {}

  var enrollBtn = document.getElementById("detailEnroll");
  var quizLink = document.getElementById("detailQuiz");
  if (quizLink) quizLink.href = "assessments.html?course=" + course.id;

  function refreshActions() {
    if (enrolled[course.id]) {
      if (enrollBtn) {
        enrollBtn.textContent = "Enrolled ✓";
        enrollBtn.disabled = true;
      }
      if (quizLink) quizLink.hidden = false;
    }
  }
  refreshActions();

  if (enrollBtn) {
    enrollBtn.addEventListener("click", function () {
      if (!canLearn()) return;
      enrolled[course.id] = true;
      try {
        localStorage.setItem("cc_enrolled", JSON.stringify(enrolled));
      } catch (e) {}
      refreshActions();
      if (window.CCActivity) CCActivity.log("Enrolled in " + course.title, course.id);
    });
  }

  // Quiz link also counts as visiting that course
  if (quizLink) {
    quizLink.addEventListener("click", function () {
      if (window.CCActivity) CCActivity.log("Opened quiz for " + course.title, course.id);
    });
  }

  // GATE: same rule as courses page (approved trainee only, browse free)
  function canLearn() {
    var note = document.getElementById("gateNote");
    var email = null;
    var users = {};
    try {
      email = (localStorage.getItem("cc_email") || "").toLowerCase();
      users = JSON.parse(localStorage.getItem("cc_users") || "{}");
    } catch (e) {}
    var account = email ? users[email] : null;
    if (!account) {
      showNote(note, "Please log in to enroll. ", true);
      return false;
    }
    if (account.status === "blocked") {
      showNote(note, "Account blocked. Contact admin.", false);
      return false;
    }
    if (account.status !== "approved") {
      showNote(note, "Your account is awaiting admin approval. Reading is free, but Enroll unlocks after approval.", false);
      return false;
    }
    if (note) note.hidden = true;
    return true;
  }

  function showNote(note, text, withLogin) {
    if (!note) return;
    note.innerHTML = "";
    note.appendChild(document.createTextNode(text));
    if (withLogin) {
      var a = document.createElement("a");
      a.href = "../auth/index.html";
      a.textContent = "Login →";
      note.appendChild(a);
    }
    note.hidden = false;
    note.scrollIntoView({ behavior: "smooth" });
  }
})();
