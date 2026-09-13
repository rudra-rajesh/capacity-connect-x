// Assessments page - checking + score + feedback (vanilla JS, beginner-simple)
(function () {
  var form = document.getElementById("quizForm");
  var scoreBox = document.getElementById("scoreBox");
  var scoreText = document.getElementById("scoreText");
  if (!form) return;

  // YOUR ASSESSMENTS: rows only for enrolled courses (shared list x cc_enrolled).
  // Choosing a row (Open Quiz) reloads with ?course=ID and asks its questions.
  var assessList = document.getElementById("assessList");
  var assessEmpty = document.getElementById("assessEmpty");
  var lockNote = document.getElementById("lockNote");
  var intro = document.getElementById("quizIntro");

  var enrolled = {};
  try {
    enrolled = JSON.parse(localStorage.getItem("cc_enrolled") || "{}");
  } catch (e) {}
  var catalog = window.CC_COURSES || [];
  var mine = [];
  for (var m = 0; m < catalog.length; m++) {
    if (enrolled[catalog[m].id]) mine.push(catalog[m]);
  }

  // Which course is chosen right now?
  var chosenId = null;
  try {
    chosenId = new URLSearchParams(window.location.search).get("course");
  } catch (e) {}
  var chosen = null;
  for (var f = 0; f < mine.length; f++) {
    if (mine[f].id === chosenId) chosen = mine[f];
  }

  // Draw one row per enrolled course; highlight the chosen one
  if (assessList) {
    for (var r = 0; r < mine.length; r++) {
      assessList.appendChild(assessRow(mine[r], chosen && mine[r].id === chosen.id));
    }
  }
  if (assessEmpty) assessEmpty.hidden = mine.length !== 0;

  function assessRow(course, isChosen) {
    var row = document.createElement("div");
    row.className = "res-row" + (isChosen ? " chosen" : "");

    var info = document.createElement("div");
    info.className = "req-info";
    var title = document.createElement("a");
    title.className = "row-title-link";
    title.href = "courses.html";
    title.textContent = course.title;
    info.appendChild(title);
    var meta = document.createElement("small");
    meta.textContent = course.subject + " · " + course.level;
    info.appendChild(meta);
    row.appendChild(info);

    var btn = document.createElement("a");
    btn.className = "inspect-btn";
    btn.href = "assessments.html?course=" + course.id;
    btn.textContent = isChosen ? "Answering ✓" : "Open Quiz";
    row.appendChild(btn);
    return row;
  }

  // Show questions only for the chosen enrolled course, else lock them
  var feedbackPart = document.querySelector(".feedback-part");
  if (chosen) {
    if (intro) {
      intro.innerHTML =
        "Quiz for <b>" + chosen.title + "</b>. Parts A and B are checked at once. " +
        "Part C is sent to your trainer. Feedback at the end is <b>optional</b>.";
    }
    if (lockNote) lockNote.hidden = true;
  } else {
    if (form) form.hidden = true;
    if (feedbackPart) feedbackPart.style.display = "none";
    if (lockNote) {
      lockNote.innerHTML = "";
      if (mine.length === 0) {
        lockNote.appendChild(document.createTextNode("No assessments yet. "));
      } else {
        lockNote.appendChild(document.createTextNode("Choose one of your assessments above to see its questions. "));
      }
      var a = document.createElement("a");
      a.href = "courses.html";
      a.textContent = "Browse courses →";
      lockNote.appendChild(a);
      lockNote.hidden = false;
    }
  }

  // SUBMIT: only approved trainees are scored (reading stays free).
  // Others see a note; answers are kept, nothing is lost.
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (!canLearn()) return;
    var score = 0;

    // Part A: each MCQ gives 1 mark if the correct radio is picked
    var mcqs = form.querySelectorAll('.question[data-type="mcq"]');
    for (var i = 0; i < mcqs.length; i++) {
      var picked = mcqs[i].querySelector("input:checked");
      if (picked && picked.getAttribute("data-correct") === "1") {
        score = score + 1;
      }
    }

    // Part B: multi-tick gives 1 mark only if ALL correct are ticked and NO wrong one is ticked
    var multi = form.querySelector('.question[data-type="multi"]');
    if (multi) {
      var boxes = multi.querySelectorAll('input[type="checkbox"]');
      var allRight = true;
      for (var j = 0; j < boxes.length; j++) {
        var shouldTick = boxes[j].getAttribute("data-correct") === "1";
        if (boxes[j].checked !== shouldTick) {
          allRight = false;
          break;
        }
      }
      if (allRight) score = score + 1;
    }

    // Part C (short answer) is NOT auto-checked. Max score = 3 MCQ + 1 multi = 4.
    if (scoreText) scoreText.textContent = "You scored " + score + " / 4";
    if (scoreBox) {
      scoreBox.hidden = false;
      scoreBox.scrollIntoView({ behavior: "smooth" });
    }
    if (window.CCActivity) {
      var title = chosen ? chosen.title : "quiz";
      CCActivity.log("Scored " + score + " / 4 in " + title);
    }
  });

  // GATE: same rule as courses page (approved trainee only)
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
      showNote(note, "Please log in to submit. Your answers are kept. ", true);
      return false;
    }
    if (account.status === "blocked") {
      showNote(note, "Account blocked. Contact admin.", false);
      return false;
    }
    if (account.status !== "approved") {
      showNote(note, "Your account is awaiting admin approval. Reading is free, but Submit unlocks after approval.", false);
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
