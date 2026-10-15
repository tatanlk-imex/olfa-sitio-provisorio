/* Herramientas del sitio OLFA: buscador de hojas, simulador por material, calculadora de accidentes, carrusel de novedades, impresión de ficha.
   Todo funciona en el navegador: no se guarda ni se envía nada. */
(function () {
  "use strict";
  function norm(t) { return (t || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, ""); }
  function clave(t) { return norm(t).replace(/[^a-z0-9]/g, ""); }
  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) { e.className = cls; } if (html) { e.innerHTML = html; } return e; }
  function esc(t) { return String(t).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;" }[c]; }); }

  // Imprimir ficha técnica
  Array.prototype.forEach.call(document.querySelectorAll("[data-imprimir]"), function (b) { b.addEventListener("click", function () { window.print(); }); });

  // ¿Qué hoja usa mi cuchillo?
  var q = document.getElementById("hoja-q"), res = document.getElementById("hoja-res"), datosEl = document.getElementById("datos-hojas");
  if (q && res && datosEl) {
    var D = {}; try { D = JSON.parse(datosEl.textContent); } catch (e) { D = {}; }
    var claves = Object.keys(D);
    var buscar = function () {
      var v = clave(q.value); res.innerHTML = "";
      if (v.length < 2) { return; }
      var ex = claves.filter(function (k) { return clave(k) === v; });
      var coin = ex.length ? ex : claves.filter(function (k) { return clave(k).indexOf(v) === 0; }).slice(0, 6);
      if (!coin.length) { res.innerHTML = "<p>No encontramos ese código. Revisa que esté bien escrito o <a href=\"" + (document.documentElement.getAttribute("data-raiz") || "./") + "cotizar/?interes=repuestos\">cuéntanos qué cuchillo tienes</a> y te ayudamos.</p>"; return; }
      coin.forEach(function (k) {
        var d = D[k], caja = el("div", "caja");
        var tit = d.t === "cuchillo" ? "Hojas de repuesto compatibles" : "Esta hoja sirve para estos cuchillos";
        var lis = d.r.map(function (r) { return "<li><a href=\"" + r.u + "\" title=\"" + esc(r.n) + "\">" + esc(r.s) + (r.a ? " <small>(" + esc(r.a) + ")</small>" : "") + "</a></li>"; }).join("");
        caja.innerHTML = "<h4><a href=\"" + d.u + "\">" + esc(k) + "</a> <span class=\"meta\">" + esc(d.n) + "</span></h4><p><strong>" + tit + ":</strong></p><ul class=\"chips-compat\">" + lis + "</ul>";
        res.appendChild(caja);
      });
    };
    q.addEventListener("input", buscar);
    var qs = new URLSearchParams(window.location.search); if (qs.get("modelo")) { q.value = qs.get("modelo"); buscar(); }
  }

  // ¿Qué cuchillo necesito? (simulador por material): sin JavaScript se ven todos los materiales
  var sel = document.getElementById("sim-material");
  if (sel) {
    var mats = Array.prototype.slice.call(document.querySelectorAll("#sim-resultado .material"));
    var mostrar = function () {
      mats.forEach(function (m) { m.hidden = sel.value !== "" ? m.getAttribute("data-material") !== sel.value : true; });
      if (!sel.value && mats.length) { var p = document.getElementById("sim-vacio"); if (!p) { p = el("p", "", "Elige un material arriba para ver los cuchillos que te pueden servir."); p.id = "sim-vacio"; document.getElementById("sim-resultado").appendChild(p); } p.hidden = false; }
      else { var p2 = document.getElementById("sim-vacio"); if (p2) { p2.hidden = true; } }
    };
    sel.addEventListener("change", function () { mostrar(); if (window.gtag) { window.gtag("event", "simulador_material", { material: sel.options[sel.selectedIndex].text }); } });
    var pm = new URLSearchParams(window.location.search).get("material"); if (pm) { sel.value = pm; }
    mostrar();
  }

  // Calculadora del costo de un accidente por corte
  var f = document.getElementById("calc-accidentes");
  if (f) {
    var dias = document.getElementById("calc-dias"), costo = document.getElementById("calc-costo"), n = document.getElementById("calc-n"), out = document.getElementById("calc-res");
    var clp = function (x) { return "$" + Math.round(x).toLocaleString("es-CL"); };
    var calcular = function () {
      var d = parseFloat(dias.value), c = parseFloat(costo.value), k = parseFloat(n.value);
      if (!(d >= 0) || !(c >= 0) || dias.value === "" || costo.value === "") { out.hidden = true; return; }
      if (!(k >= 0)) { k = 1; }
      var porAcc = d * c;
      out.innerHTML = "<p>Cada accidente por corte cuesta, solo en días de licencia: <strong>" + clp(porAcc) + "</strong></p>" +
        "<p>Con " + k + (k === 1 ? " accidente" : " accidentes") + " al año: <strong>" + clp(porAcc * k) + "</strong> al año</p>" +
        "<p class=\"meta\">" + d + (d === 1 ? " día" : " días") + " × " + clp(c) + " por día × " + k + (k === 1 ? " accidente" : " accidentes") + ". Referencial.</p>";
      out.hidden = false;
    };
    ["input", "change"].forEach(function (ev) { [dias, costo, n].forEach(function (i) { i.addEventListener(ev, calcular); }); });
    f.addEventListener("submit", function (e) { e.preventDefault(); calcular(); });
  }

  // Carrusel de novedades (deslizable; los botones aparecen solo con JavaScript)
  var nov = document.querySelector(".novedades"), ctl = document.querySelector(".novedades-ctl");
  if (nov && ctl) {
    ctl.hidden = false;
    var paso = function () { var c = nov.querySelector(".novedad"); return c ? c.getBoundingClientRect().width + 18 : 300; };
    ctl.querySelector("[data-nov-prev]").addEventListener("click", function () { nov.scrollBy({ left: -paso(), behavior: "smooth" }); });
    ctl.querySelector("[data-nov-sig]").addEventListener("click", function () { nov.scrollBy({ left: paso(), behavior: "smooth" }); });
  }
})();
