// Trainer courses page - read-only cards from shared data (vanilla JS)
// Same list as trainee side. View opens the shared detail page.
(function () {
  var grid = document.getElementById("courseGrid");
  var emptyBox = document.getElementById("courseEmpty");
  var list = window.CC_COURSES || [];
  if (!grid) return;

  if (list.length === 0) {
    if (emptyBox) emptyBox.hidden = false;
    return;
  }

  for (var c = 0; c < list.length; c++) {
    grid.appendChild(courseCard(list[c]));
  }

  // One card: badge + title + subject + duration + View button
  function courseCard(course) {
    var card = document.createElement("article");
    card.className = "course-card";

    var badge = document.createElement("span");
    badge.className = "level level-" + String(course.level).toLowerCase();
    badge.textContent = course.level;
    card.appendChild(badge);

    var title = document.createElement("h3");
    title.textContent = course.title;
    card.appendChild(title);

    var subject = document.createElement("p");
    subject.className = "course-subject";
    subject.textContent = course.subject;
    card.appendChild(subject);

    var meta = document.createElement("p");
    meta.className = "course-meta";
    meta.textContent = course.weeks + " weeks";
    card.appendChild(meta);

    var btn = document.createElement("a");
    btn.className = "view-btn";
    btn.href = "../trainee/course-detail.html?id=" + course.id;
    btn.textContent = "View →";
    card.appendChild(btn);

    return card;
  }
})();
