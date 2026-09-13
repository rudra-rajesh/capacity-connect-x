// Role guard - keeps logged-in users inside their own folder (vanilla JS)
// Strict for all roles. Guests browse freely. Any cross-role page
// bounces to the owner's dashboard with a notice via sessionStorage.
(function () {
  // Find page role from the address
  var pageRole = null;
  try {
    var path = window.location.pathname.toLowerCase();
    if (path.indexOf("/trainee/") !== -1) pageRole = "trainee";
    else if (path.indexOf("/trainer/") !== -1) pageRole = "trainer";
    else if (path.indexOf("/admin/") !== -1) pageRole = "admin";
    else return; // not a role page (landing, auth, shared)
  } catch (e) {
    return;
  }

  // Who is logged in?
  var sessionRole = null;
  try {
    sessionRole = localStorage.getItem("cc_role");
  } catch (err) {}
  if (!sessionRole) return; // guest: allow browse

  // Match: do nothing
  if (sessionRole === pageRole) {
    // If we landed here after a bounce, show the notice
    try {
      var denied = sessionStorage.getItem("cc_denied");
      if (denied) {
        sessionStorage.removeItem("cc_denied");
        // Wait for the dashboard to exist, then insert notice at top
        var atLoad = function () {
          var main = document.querySelector("main.dashboard");
          if (!main) return;
          var note = document.createElement("p");
          note.className = "gate-note";
          note.textContent =
            "You are logged in as " +
            denied.charAt(0).toUpperCase() + denied.slice(1) +
            " — the " +
            pageRole.charAt(0).toUpperCase() + pageRole.slice(1) +
            " pages need a " + pageRole + " login.";
          main.insertBefore(note, main.firstChild);
          note.scrollIntoView({ behavior: "smooth" });
        };
        if (document.readyState === "loading") {
          document.addEventListener("DOMContentLoaded", atLoad);
        } else {
          atLoad();
        }
      }
    } catch (e) {}
    return;
  }

  // Mismatch: remember what was attempted, then bounce to own dashboard
  try {
    sessionStorage.setItem("cc_denied", pageRole);
  } catch (e) {}
  window.location.replace("../" + sessionRole + "/index.html");
})();
