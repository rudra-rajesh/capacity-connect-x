// Guest overlay - login popup for visitors who are not logged in.
// Included on every role page AFTER script.js (2 lines per page).
// If logged in: does nothing (normal page behavior stays).
// If guest: user-card shows "not logged in", and Login / Get Started
// buttons open this overlay instead of going to the auth page.
(function () {
  // ---- find saved session ----
  var savedRole = null;
  try {
    savedRole = localStorage.getItem("cc_role");
  } catch (e) {}
  if (savedRole) return; // logged in, nothing to do

  // ---- 1. Rewrite user-card as guest ----
  var avatar = document.getElementById("avatarLetter");
  if (avatar) avatar.textContent = "?";

  var badge = document.getElementById("roleBadge");
  // badge lives inside <strong>, keep the name part outside it
  var nameStrong = badge ? badge.parentNode : null;
  if (nameStrong) {
    nameStrong.childNodes[0].textContent = "Guest ";
  }
  if (badge) badge.textContent = "| not logged in";

  var emailEl = document.getElementById("userEmail");
  if (emailEl) emailEl.textContent = "Please log in";

  var loginLink = document.getElementById("logoutLink");
  if (loginLink) {
    loginLink.textContent = "Login";
    loginLink.setAttribute("href", "#");
  }

  // ---- 2. Pick default role from page address ----
  // trainee pages -> Trainee, trainer pages -> Trainer, admin pages -> Admin
  var pageRole = "trainee"; // fallback
  try {
    var path = window.location.pathname.toLowerCase();
    if (path.indexOf("/trainer/") !== -1) pageRole = "trainer";
    else if (path.indexOf("/admin/") !== -1) pageRole = "admin";
    else pageRole = "trainee";
  } catch (e) {}
  var selectedRole = pageRole;

  function cap(s) {
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  function load(key, fallback) {
    try {
      var v = JSON.parse(localStorage.getItem(key));
      return v === null || v === undefined ? fallback : v;
    } catch (e) {
      return fallback;
    }
  }

  // ---- 3. Build overlay HTML (hidden at first) ----
  var overlay = document.createElement("div");
  overlay.className = "guest-overlay";
  overlay.hidden = true;
  overlay.innerHTML =
    "<div class='guest-panel'>" +
    "<div class='guest-head'><h2>Login</h2>" +
    "<button type='button' class='guest-close' aria-label='Close'>✕</button></div>" +
    "<p class='guest-sub' id='guestSub'>Logging in as Trainee</p>" +
    "<p class='guest-msg' id='guestMsg' hidden></p>" +
    "<div class='guest-roles'>" +
    "<button type='button' class='guest-role' data-role='trainee'>Trainee</button>" +
    "<button type='button' class='guest-role' data-role='trainer'>Trainer</button>" +
    "<button type='button' class='guest-role' data-role='admin'>Admin</button>" +
    "</div>" +
    "<label class='guest-field'><span>Email</span>" +
    "<input type='email' id='guestEmail' placeholder='you@mail.com' /></label>" +
    "<label class='guest-field'><span>Password</span>" +
    "<input type='password' id='guestPass' placeholder='••••••••' /></label>" +
    "<div class='guest-row'>" +
    "<button type='button' class='guest-login' id='guestLogin'>Login</button>" +
    "<button type='button' class='guest-demo' id='guestDemo'>Demo</button>" +
    "</div>" +
    "<p class='guest-switch'>New here? <a href='../auth/register.html'>Create account</a></p>" +
    "</div>";
  document.body.appendChild(overlay);

  var sub = overlay.querySelector("#guestSub");
  var roleBtns = overlay.querySelectorAll(".guest-role");
  var emailInput = overlay.querySelector("#guestEmail");
  var passInput = overlay.querySelector("#guestPass");
  var loginBtn = overlay.querySelector("#guestLogin");
  var demoBtn = overlay.querySelector("#guestDemo");
  var msgBox = overlay.querySelector("#guestMsg");
  var closeBtn = overlay.querySelector(".guest-close");

  // Mark the page's role tab as selected
  function selectRole(role) {
    selectedRole = role;
    for (var i = 0; i < roleBtns.length; i++) {
      var on = roleBtns[i].getAttribute("data-role") === role;
      roleBtns[i].classList.toggle("active", on);
    }
    if (sub) sub.textContent = "Logging in as " + cap(role);
    if (loginBtn) loginBtn.textContent = "Login as " + cap(role);
  }

  for (var t = 0; t < roleBtns.length; t++) {
    roleBtns[t].addEventListener("click", function () {
      selectRole(this.getAttribute("data-role"));
    });
  }
  selectRole(pageRole);

  // Plain text note on the upper side (red errors, green confirmations)
  function say(text, ok) {
    if (!msgBox) return;
    msgBox.hidden = false;
    msgBox.textContent = text;
    msgBox.className = "guest-msg " + (ok ? "ok" : "no");
  }

  // Demo button: fills demo email + password for the selected tab.
  // Judges still press Login, so the real approval gate is demonstrated.
  if (demoBtn) {
    demoBtn.addEventListener("click", function () {
      var demoMap = {
        trainee: { email: "trainee@mail.com", pass: "demo1234" },
        trainer: { email: "trainer@mail.com", pass: "demo1234" },
        admin: { email: "admin@mail.com", pass: "demo1234" }
      };
      var demo = demoMap[selectedRole] || demoMap.trainee;
      if (emailInput) emailInput.value = demo.email;
      if (passInput) passInput.value = demo.pass;
      say("Demo details filled for " + cap(selectedRole) + " — press Login.", true);
    });
  }

  // ---- 4. Open / close ----
  function openOverlay() {
    overlay.hidden = false;
    if (msgBox) msgBox.hidden = true;
    if (emailInput) emailInput.focus();
  }

  function closeOverlay() {
    overlay.hidden = true;
  }

  if (closeBtn) closeBtn.addEventListener("click", closeOverlay);

  // Click dark area closes too
  overlay.addEventListener("click", function (e) {
    if (e.target === overlay) closeOverlay();
  });

  // ESC closes too
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && !overlay.hidden) closeOverlay();
  });

  // Login link in user-card opens overlay
  if (loginLink) {
    loginLink.addEventListener("click", function (e) {
      e.preventDefault();
      openOverlay();
    });
  }

  // Get Started button opens overlay (only on pages that have it)
  var startBtn = document.getElementById("startBtn");
  if (startBtn) {
    // Remove old scroll behavior by cloning the button (cloning drops old listeners)
    var fresh = startBtn.cloneNode(true);
    startBtn.parentNode.replaceChild(fresh, startBtn);
    fresh.addEventListener("click", function () {
      openOverlay();
    });
  }

  // ---- 5. Login with the same approval gate as the auth page ----
  if (loginBtn) {
    loginBtn.addEventListener("click", function () {
      var email = emailInput.value.trim().toLowerCase();
      var pass = passInput.value;
      if (!email) return say("Please enter your email.");

      var accounts = load("cc_users", {});
      var account = accounts[email];
      if (!account) {
        var pending = load("cc_requests", []);
        for (var p = 0; p < pending.length; p++) {
          if (pending[p].email === email && pending[p].status === "pending") {
            return say("Awaiting admin approval. Please wait.");
          }
        }
        return say("No account found. Please create one first.");
      }
      if (account.status === "blocked") {
        return say("Account blocked. Contact admin.");
      }
      if (account.pass && account.pass !== pass) {
        return say("Wrong password. Try again.");
      }
      if (account.role !== selectedRole) {
        selectRole(account.role);
        return say("This email is registered as " + cap(account.role) + ". Role switched for you.");
      }
      try {
        localStorage.setItem("cc_role", account.role);
        localStorage.setItem("cc_email", email);
      } catch (e) {}
      // Reload so the page starts in logged-in state
      window.location.reload();
    });
  }
})();
