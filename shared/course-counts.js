// Course count filler - writes the same number everywhere (vanilla JS)
// Any element with data-course-count gets CC_COURSE_COUNT as its text.
// Elements with data-course-text="active-line" get "N active, 2 updated this week."
// Static fallback numbers stay in the HTML for no-JS readers.
(function () {
  if (!window.CC_COURSES) return;
  var n = window.CC_COURSES.length;

  // Plain numbers: <strong data-course-count>12</strong>
  var nums = document.querySelectorAll("[data-course-count]");
  for (var i = 0; i < nums.length; i++) {
    nums[i].textContent = n;
  }

  // Full line: <p data-course-text="active-line">4 active, ...</p>
  var lines = document.querySelectorAll('[data-course-text="active-line"]');
  for (var j = 0; j < lines.length; j++) {
    lines[j].textContent = n + " active, 2 updated this week.";
  }
})();
