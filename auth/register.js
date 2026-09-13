// Register step 1 - role + email + password (vanilla JS)
// Checks duplicates now, saves to sessionStorage, sends to step 2.
// Nothing is sent to admin until step 2 is submitted.
(function () {
  var selectedRole = "trainee"; // default top selection

  var roleBtns = document.querySelectorAll(".role-btn");
  var roleName = document.getElementById("roleName");
  var form = document.getElementById("regForm");
  var msg = document.getElementById("authMsg");

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

  function say(text) {
    if (!msg) return;
    msg.hidden = false;
    msg.textContent = text;
    msg.className = "auth-msg no";
  }

  // 1. Top role selection
  for (var i = 0; i < roleBtns.length; i++) {
    roleBtns[i].addEventListener("click", function () {
      for (var j = 0; j < roleBtns.length; j++) {
        roleBtns[j].classList.remove("active");
        roleBtns[j].setAttribute("aria-selected", "false");
      }
      this.classList.add("active");
      this.setAttribute("aria-selected", "true");
      selectedRole = this.getAttribute("data-role");
      if (roleName) roleName.textContent = cap(selectedRole);
    });
  }

  // 2 + 3. Validate, remember, go to details page
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var email = document.getElementById("email").value.trim().toLowerCase();
      var pass = document.getElementById("password").value;
      if (!email) return;

      var users = load("cc_users", {});
      var reqs = load("cc_requests", []);
      if (users[email]) return say("This email already has an account. Please login.");
      for (var i = 0; i < reqs.length; i++) {
        if (reqs[i].email === email && reqs[i].status === "pending") {
          return say("Request already sent. Waiting for admin approval.");
        }
      }

      // Keep step 1 for the next page (cleared after final submit)
      try {
        sessionStorage.setItem("cc_reg_step1", JSON.stringify({
          email: email,
          pass: pass,
          role: selectedRole
        }));
      } catch (err) {}
      window.location.href = "register-details.html";
    });
  }
})();
