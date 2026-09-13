// SINGLE SOURCE OF TRUTH for courses (vanilla JS, beginner-simple)
//
// EDIT COURSES ONLY HERE for the default list. Admin changes made on
// admin/courses.html are stored in cc_courses_custom and WIN over these
// defaults, so every section follows admin edits automatically.
// To bring back defaults, admin presses Reset (clears the override).
//
// FIELDS per course:
//   id        = short code, used in links (no spaces)
//   title     = shown on cards
//   subject   = small tag under the title
//   weeks     = duration in weeks
//   lessons   = number of lessons
//   level     = Easy, Normal or Hard (badge color comes from this word)
//   desc      = 1-2 lines shown on the detail page
//   topics    = lesson titles shown on the detail page
//   resources = [{ kind, title, meta }] shown on the detail page
//               kind is one of: pdf, video, doc, link
// Aligned to SIH 2026 PS-26075 (Capacity Connect LMS, Ministry of Earth Sciences):
// organizational training courses from different fields.
window.CC_DEFAULT_COURSES = [
  { id: "weather-basics", title: "Weather & Climate Basics", subject: "Earth Science", weeks: 4, lessons: 12, level: "Easy",
    desc: "Understand how weather forms and how forecasts are read, from clouds to cyclone warnings.",
    topics: ["Atmosphere layers", "Cloud types", "Reading forecasts", "Cyclone warnings"],
    resources: [
      { kind: "pdf", title: "Weather Basics Handbook", meta: "48 pages · 2.1 MB" },
      { kind: "video", title: "Climate Systems Explained", meta: "18 min · Beginner" },
      { kind: "link", title: "IMD Weather Services", meta: "Live forecasts and warnings" }
    ] },
  { id: "remote-gis", title: "Remote Sensing & GIS", subject: "Space Technology", weeks: 6, lessons: 14, level: "Normal",
    desc: "Learn how satellites capture Earth data and how GIS maps turn it into decisions.",
    topics: ["Satellite basics", "Reading satellite maps", "GIS layers", "BHUVAN portal tour"],
    resources: [
      { kind: "pdf", title: "GIS Starter Guide", meta: "36 pages · 1.8 MB" },
      { kind: "video", title: "Reading Satellite Maps", meta: "24 min · Beginner" },
      { kind: "link", title: "BHUVAN Geoportal", meta: "ISRO maps and satellite data" }
    ] },
  { id: "data-python", title: "Data Analysis with Python", subject: "Data Skills", weeks: 6, lessons: 15, level: "Normal",
    desc: "Clean, analyse and chart real datasets with Python, step by step.",
    topics: ["Python refresher", "Tables with pandas", "Charts", "Mini project"],
    resources: [
      { kind: "pdf", title: "Python for Data Notes", meta: "52 pages · 2.6 MB" },
      { kind: "video", title: "Python Data Walkthrough", meta: "31 min · Intermediate" }
    ] },
  { id: "disaster-prep", title: "Disaster Preparedness", subject: "Disaster Management", weeks: 4, lessons: 10, level: "Easy",
    desc: "Know what to do before, during and after floods, cyclones and earthquakes.",
    topics: ["Risk mapping", "Early warnings", "Response checklist", "Mock drill"],
    resources: [
      { kind: "doc", title: "Disaster Response Checklist", meta: "6 pages · Summary" },
      { kind: "link", title: "NDMA Guidelines", meta: "Disaster management resources" }
    ] },
  { id: "workplace-comm", title: "Workplace Communication", subject: "Soft Skills", weeks: 5, lessons: 11, level: "Easy",
    desc: "Write clear emails, speak in meetings and present work with confidence.",
    topics: ["Professional emails", "Meeting skills", "Presentations", "Feedback habits"],
    resources: [
      { kind: "doc", title: "Workplace Email Templates", meta: "4 pages · Summary" }
    ] },
  { id: "ocean-systems", title: "Ocean Observation Systems", subject: "Earth Science", weeks: 8, lessons: 16, level: "Hard",
    desc: "How buoys, floats and satellites watch the oceans, and what the data tells us.",
    topics: ["Ocean basins", "Buoys and floats", "Sea-level data", "Case study"],
    resources: [
      { kind: "doc", title: "Ocean Terms Glossary", meta: "9 pages · Reference" }
    ] }
];

// Effective list: admin override wins, else defaults above
window.CC_COURSES = (function () {
  try {
    var custom = JSON.parse(localStorage.getItem("cc_courses_custom"));
    if (custom && custom.length !== undefined) return custom;
  } catch (e) {}
  return window.CC_DEFAULT_COURSES;
})();

// The one number every section shows
window.CC_COURSE_COUNT = window.CC_COURSES.length;

// Pretty title for a course id (quiz page uses this)
window.CC_COURSE_TITLE = function (id) {
  var course = window.CC_COURSE_BY_ID(id);
  return course ? course.title : null;
};

// Full course object for an id, or null (detail page uses this)
window.CC_COURSE_BY_ID = function (id) {
  for (var i = 0; i < window.CC_COURSES.length; i++) {
    if (window.CC_COURSES[i].id === id) return window.CC_COURSES[i];
  }
  return null;
};
