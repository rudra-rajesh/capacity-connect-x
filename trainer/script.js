// Capacity Connect - small shared interactions (vanilla JS only)
// Same file copied to trainer/ and admin/. Each section is commented.

(function () {
  // 1. Show logged-in role + email (saved by auth page)
  // No saved login = guest. Guest card is drawn by shared/guest.js,
  // so we only fill the card when a real login exists.
  var role = null;
  var email = null;
  try {
    role = localStorage.getItem("cc_role");
    email = localStorage.getItem("cc_email");
  } catch (e) {}

  if (role) {
    var badge = document.getElementById("roleBadge");
    if (badge) badge.textContent = "| " + role;

    var emailEl = document.getElementById("userEmail");
    if (emailEl && email) emailEl.textContent = email;

    var avatar = document.getElementById("avatarLetter");
    if (avatar && email) avatar.textContent = email.charAt(0).toUpperCase();

    // Logged in: Get Started is for guests only, hide it
    var startBtn = document.getElementById("startBtn");
    if (startBtn) startBtn.style.display = "none";
  }

  // 2. Logout clears saved login
  var logout = document.getElementById("logoutLink");
  if (logout) {
    logout.addEventListener("click", function () {
      try {
        localStorage.removeItem("cc_role");
        localStorage.removeItem("cc_email");
      } catch (e) {}
    });
  }

  // 2b. Click user-card (not the Logout link) opens the profile page.
  // Shared pages (settings/more) live outside role folders, so jump to
  // the logged-in role's profile there. Guests go to the login page.
  var card = document.querySelector(".user-card");
  if (card) {
    card.style.cursor = "pointer";
    card.addEventListener("click", function (e) {
      if (e.target.closest("#logoutLink")) return;
      var session = null;
      var sharedPage = false;
      try {
        session = localStorage.getItem("cc_role");
        sharedPage = window.location.pathname.toLowerCase().indexOf("/shared/") !== -1;
      } catch (err) {}
      if (!session) {
        if (sharedPage) window.location.href = "../auth/index.html";
        else window.location.href = "profile.html";
        return;
      }
      if (sharedPage) window.location.href = "../" + session + "/profile.html";
      else window.location.href = "profile.html";
    });
  }

  // 3. Mobile sidebar toggle
  var menuBtn = document.getElementById("menuBtn");
  var sidebar = document.getElementById("sidebar");
  if (menuBtn && sidebar) {
    menuBtn.addEventListener("click", function () {
      sidebar.classList.toggle("open");
    });
  }

  // 4. Sidebar active link highlight
  var nav = document.getElementById("mainNav");
  if (nav) {
    nav.addEventListener("click", function (e) {
      var a = e.target.closest("a");
      if (!a) return;
      var links = nav.querySelectorAll("a");
      for (var i = 0; i < links.length; i++) links[i].classList.remove("active");
      a.classList.add("active");
      if (window.innerWidth <= 560 && sidebar) sidebar.classList.remove("open");
    });
  }

  // 5. Search filters nav links (simple filter)
  var search = document.getElementById("searchInput");
  if (search && nav) {
    search.addEventListener("input", function () {
      var q = search.value.toLowerCase();
      var links = nav.querySelectorAll("a");
      for (var i = 0; i < links.length; i++) {
        var text = links[i].textContent.toLowerCase();
        links[i].style.display = text.indexOf(q) === -1 ? "none" : "";
      }
    });
  }

  // 6. Get Started scrolls to cards (guest login is handled by shared/guest.js)
  var startBtn2 = document.getElementById("startBtn");
  if (startBtn2) {
    startBtn2.addEventListener("click", function () {
      var grid = document.querySelector(".dashboard-grid");
      if (grid) grid.scrollIntoView({ behavior: "smooth" });
    });
  }
})();
