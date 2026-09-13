// Shared activity feed helper - stores per-user actions in the browser.
// Same idea as cc_enrolled: no server, per-browser only.
// Any page can call: CCActivity.log("Enrolled in HTML Basics")
// Dashboards auto-render into #activityBox when this file loads after the DOM.
(function () {
  var MAX = 20;

  function emailKey() {
    try {
      var e = (localStorage.getItem("cc_email") || "").toLowerCase();
      return e ? "cc_activity_" + e : null;
    } catch (err) {
      return null;
    }
  }

  function load() {
    var k = emailKey();
    if (!k) return [];
    try {
      var v = JSON.parse(localStorage.getItem(k) || "[]");
      return Array.isArray(v) ? v : [];
    } catch (err) {
      return [];
    }
  }

  function save(list) {
    var k = emailKey();
    if (!k) return;
    try {
      localStorage.setItem(k, JSON.stringify(list.slice(0, MAX)));
    } catch (err) {}
  }

  // Save one entry: newest first. Called from many pages (one line each).
  // If courseId is given, row gets a Go button to that course.
  function log(text, courseId) {
    if (!text) return;
    var list = load();
    var entry = { text: text, time: Date.now() };
    if (courseId) entry.courseId = courseId;
    list.unshift(entry);
    if (list.length > MAX) list.length = MAX;
    save(list);
  }

  // Save for a specific email (used before login, e.g. registration).
  function logFor(email, text) {
    if (!email || !text) return;
    var k = "cc_activity_" + email.toLowerCase();
    var list = [];
    try {
      list = JSON.parse(localStorage.getItem(k) || "[]");
      if (!Array.isArray(list)) list = [];
    } catch (err) {
      list = [];
    }
    list.unshift({ text: text, time: Date.now() });
    if (list.length > MAX) list.length = MAX;
    try {
      localStorage.setItem(k, JSON.stringify(list));
    } catch (err) {}
  }

  // Small time helper: just now, 5m ago, 2h ago, 12 Sep
  function ago(t) {
    var d = Date.now() - t;
    if (d < 60000) return "just now";
    if (d < 3600000) return Math.floor(d / 60000) + "m ago";
    if (d < 86400000) return Math.floor(d / 3600000) + "h ago";
    var dt = new Date(t);
    return dt.getDate() + " " + dt.toLocaleString("en", { month: "short" });
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  // Draw the feed into #activityBox (called on dashboards).
  // Course rows get a small Go button to open that course.
  function render() {
    var box = document.getElementById("activityBox");
    if (!box) return;
    var list = load();
    if (list.length === 0) {
      box.textContent = "Your latest workspace activity will appear here.";
      box.className = "empty-state";
      return;
    }
    box.className = "act-list";
    box.innerHTML = "";
    var show = list.slice(0, 5);
    for (var i = 0; i < show.length; i++) {
      var row = document.createElement("div");
      row.className = "act-row";

      var dot = document.createElement("span");
      dot.className = "act-dot";
      row.appendChild(dot);

      var txt = document.createElement("span");
      txt.className = "act-text";
      txt.textContent = show[i].text;
      row.appendChild(txt);

      // Go button for course rows
      if (show[i].courseId) {
        var go = document.createElement("a");
        go.className = "act-go";
        go.href = "../trainee/course-detail.html?id=" + show[i].courseId;
        // If we are already in trainee folder, use relative without ../
        try {
          var inTrainee = window.location.pathname.toLowerCase().indexOf("/trainee/") !== -1;
          if (inTrainee) go.href = "course-detail.html?id=" + show[i].courseId;
        } catch (e) {}
        go.textContent = "Go →";
        row.appendChild(go);
      }

      var tm = document.createElement("span");
      tm.className = "act-time";
      tm.textContent = ago(show[i].time);
      row.appendChild(tm);

      box.appendChild(row);
    }
  }

  // Make it global so other scripts can call CCActivity.log(...)
  window.CCActivity = { log: log, logFor: logFor, render: render };

  // Auto-draw when the page is ready (dashboards have #activityBox)
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", render);
  } else {
    render();
  }
})();
