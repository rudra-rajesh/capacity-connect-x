// Courses page - cards drawn from shared data + Enroll buttons (vanilla JS)
(function () {
  // Draw every card from the single course list (shared/courses-data.js).
  // Admin adds/removals flow here automatically through the resolver.
  var grid = document.getElementById("courseGrid");
  var list = window.CC_COURSES || [];
  if (grid) {
    for (var c = 0; c < list.length; c++) {
      grid.appendChild(courseCard(list[c]));
    }
    if (list.length === 0) {
      var emptyBox = document.getElementById("courseEmpty");
      if (emptyBox) emptyBox.hidden = false;
    }
  }

  // One card: badge + title + subject + duration + Enroll + hidden quiz link
  function courseCard(course) {
    var card = document.createElement("article");
    card.className = "course-card";
    card.setAttribute("data-course", course.id);

    var badge = document.createElement("span");
    badge.className = "level level-" + course.level.toLowerCase();
    badge.textContent = course.level;
    card.appendChild(badge);

    var title = document.createElement("h3");
    title.textContent = course.title;
    card.appendChild(title);

    var subject = document.createElement("p");
    subject.className = "course-subject";
    subject.textContent = course.subject;
    card.appendChild(subject);

    // Slim card: duration only (weeks), no lesson count
    var meta = document.createElement("p");
    meta.className = "course-meta";
    meta.textContent = course.weeks + " weeks";
    card.appendChild(meta);

    // Actions row: pinned to bottom so every card stays the same height
    var actions = document.createElement("div");
    actions.className = "card-actions";

    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "enroll-btn";
    btn.textContent = "Enroll";
    actions.appendChild(btn);

    // Unenroll button: shown only after enrolling (lets user leave the course)
    var unBtn = document.createElement("button");
    unBtn.type = "button";
    unBtn.className = "unenroll-btn";
    unBtn.textContent = "Unenroll";
    unBtn.hidden = true;
    actions.appendChild(unBtn);

    var link = document.createElement("a");
    link.className = "quiz-link";
    link.href = "assessments.html?course=" + course.id;
    link.textContent = "Start Quiz →";
    link.hidden = true;
    actions.appendChild(link);

    // Go button: opens the full detail page (shown after enrolling)
    var go = document.createElement("a");
    go.className = "quiz-link go-link";
    go.href = "course-detail.html?id=" + course.id;
    go.textContent = "Go →";
    go.hidden = true;
    actions.appendChild(go);

    card.appendChild(actions);

    return card;
  }

  // Find all course cards on this page
  var cards = document.querySelectorAll(".course-card");

  // Remember enrolled courses in the browser (stays after refresh)
  var enrolled = {};
  try {
    enrolled = JSON.parse(localStorage.getItem("cc_enrolled") || "{}");
  } catch (e) {
    enrolled = {};
  }

  // Save helper
  function save() {
    try {
      localStorage.setItem("cc_enrolled", JSON.stringify(enrolled));
    } catch (e) {}
  }

  // Set up each card
  for (var i = 0; i < cards.length; i++) {
    setupCard(cards[i]);
  }

  function setupCard(card) {
    var name = card.getAttribute("data-course");
    var btn = card.querySelector(".enroll-btn");
    var unBtn = card.querySelector(".unenroll-btn");
    var link = card.querySelector(".quiz-link:not(.go-link)");
    var go = card.querySelector(".go-link");
    if (!btn || !unBtn || !link || !go) return;

    // If already enrolled before, show enrolled state at once
    if (enrolled[name]) {
      showEnrolled(btn, unBtn, link, go);
    }

    // Title for activity feed (nice name instead of id)
    var titleEl = card.querySelector("h3");
    var courseTitle = titleEl ? titleEl.textContent.trim() : name;

    // Click Enroll -> only approved trainees can enroll (browse is free)
    btn.addEventListener("click", function () {
      if (!canLearn()) return;
      enrolled[name] = true;
      save();
      showEnrolled(btn, unBtn, link, go);
      if (window.CCActivity) CCActivity.log("Enrolled in " + courseTitle, name);
    });

    // Click Unenroll -> leave the course, hide quiz/go, back to Enroll
    unBtn.addEventListener("click", function () {
      delete enrolled[name];
      save();
      showNotEnrolled(btn, unBtn, link, go);
      if (window.CCActivity) CCActivity.log("Unenrolled from " + courseTitle, name);
    });

    // Click Go or Start Quiz -> also log that you visited the course
    function logVisited() {
      if (window.CCActivity) CCActivity.log("Visited " + courseTitle, name);
    }
    link.addEventListener("click", logVisited);
    go.addEventListener("click", logVisited);
  }

  function showEnrolled(btn, unBtn, link, go) {
    btn.textContent = "Enrolled ✓";
    btn.disabled = true;
    unBtn.hidden = false;
    link.hidden = false;
    go.hidden = false;
  }

  function showNotEnrolled(btn, unBtn, link, go) {
    btn.textContent = "Enroll";
    btn.disabled = false;
    unBtn.hidden = true;
    link.hidden = true;
    go.hidden = true;
  }

  // GATE: returns true only for approved trainee accounts.
  // Guests and waiting/blocked users see a note instead. Browsing stays free.
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
      showNote(note, "Your account is awaiting admin approval. You can browse, but Enroll unlocks after approval.", false);
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
