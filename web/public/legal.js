/* Language toggle for the static legal pages: shows [lang=id] or [lang=en] blocks. Choice shared with the app via localStorage "ps_lang". */
(function () {
  var q = new URLSearchParams(location.search).get("lang");
  var lang = q === "en" || q === "id" ? q : null;
  try { if (!lang) lang = localStorage.getItem("ps_lang"); } catch (_) {}
  if (lang !== "en") lang = "id";
  function apply(l) {
    document.documentElement.lang = l;
    document.querySelectorAll("[data-l]").forEach(function (el) { el.hidden = el.getAttribute("data-l") !== l; });
    var b = document.getElementById("lang-toggle");
    if (b) { b.textContent = l === "en" ? "ID" : "EN"; b.setAttribute("aria-label", l === "en" ? "Ganti bahasa ke Indonesia" : "Switch language to English"); }
    try { localStorage.setItem("ps_lang", l); } catch (_) {}
    lang = l;
  }
  apply(lang);
  var b = document.getElementById("lang-toggle");
  if (b) b.addEventListener("click", function () { apply(lang === "en" ? "id" : "en"); });
})();
