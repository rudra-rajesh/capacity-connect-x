// Resources page - search filters every entry (vanilla JS, beginner-simple)
(function () {
  var box = document.getElementById("resSearch");
  var empty = document.getElementById("resEmpty");
  if (!box) return;

  // One search box filters rows and plain links in all sections at once
  box.addEventListener("input", function () {
    var q = box.value.trim().toLowerCase();
    var rows = document.querySelectorAll(".res-row, .link-item");
    var shown = 0;

    for (var i = 0; i < rows.length; i++) {
      var text = rows[i].textContent.toLowerCase();
      var hit = !q || text.indexOf(q) !== -1;
      rows[i].style.display = hit ? "" : "none";
      if (hit) shown++;
    }

    // Hide sections that have no visible entries left
    var secs = document.querySelectorAll(".res-sec");
    for (var s = 0; s < secs.length; s++) {
      var count = 0;
      var all = secs[s].querySelectorAll(".res-row, .link-item");
      for (var k = 0; k < all.length; k++) {
        if (all[k].style.display !== "none") count++;
      }
      secs[s].style.display = count === 0 ? "none" : "";
    }

    if (empty) empty.hidden = shown !== 0;
  });
})();
