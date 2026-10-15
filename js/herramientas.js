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

  // Inscripción al Club OLFA Prevención: abre el correo con los datos (no se envía nada solo)
  var fc = document.getElementById("form-club");
  if (fc) {
    var C = window.OLFA_CONFIG || {}, cm = document.getElementById("club-mensaje");
    fc.addEventListener("submit", function (e) {
      e.preventDefault();
      if (fc.elements.sitio_web && fc.elements.sitio_web.value) { return; }
      if (!fc.checkValidity()) { fc.reportValidity(); return; }
      var v = function (n) { return (fc.elements[n] && fc.elements[n].value) || "-"; };
      var modo = fc.querySelector("input[name=modo]:checked");
      var cuerpo = "Inscripción: " + (modo ? modo.value : "-") + "\n\nPREVENCIONISTA\nNombre: " + v("prev_nombre") + "\nCorreo: " + v("prev_correo") + "\nTeléfono: " + v("prev_tel") + "\nCargo o empresa: " + v("prev_cargo") +
        "\n\nCOMPAÑÍA\nNombre: " + v("empresa") + "\nRubro: " + v("rubro") + "\nTrabajadores que usan cuchillos: " + v("trabajadores") + "\nCiudad o faena: " + v("ciudad") + "\nContacto en la compañía: " + v("contacto_empresa") +
        "\n\nOtras compañías:\n" + v("otras") + "\n\nEnviado desde: " + window.location.href;
      if (window.gtag) { window.gtag("event", "inscripcion_club"); }
      window.location.href = "mailto:" + (C.CORREO_COTIZACIONES || "contacto@olfa.cl") + "?subject=" + encodeURIComponent("Inscripción Club OLFA Prevención: " + v("empresa")) + "&body=" + encodeURIComponent(cuerpo);
      if (cm) { cm.className = "aviso aviso-ok"; cm.textContent = "Se abrió tu programa de correo con la inscripción lista. Solo debes presionar Enviar. Si no se abrió, escríbenos a " + (C.CORREO_COTIZACIONES || "contacto@olfa.cl") + "."; cm.hidden = false; cm.focus(); }
    });
  }

  // Mi lista: comparar y cotizar varios productos (la lista vive solo en el navegador)
  var CLAVE = "olfa_lista";
  var leer = function () { try { var v = JSON.parse(window.localStorage.getItem(CLAVE) || "[]"); return Array.isArray(v) ? v : []; } catch (e) { return []; } };
  var guardar = function (l) { try { window.localStorage.setItem(CLAVE, JSON.stringify(l)); } catch (e) { /* sin almacenamiento: no se guarda */ } };
  var raizL = document.documentElement.getAttribute("data-raiz") || "./";
  var pintar = function () {
    var l = leer();
    Array.prototype.forEach.call(document.querySelectorAll("[data-lista-n]"), function (n) { n.textContent = l.length; });
    Array.prototype.forEach.call(document.querySelectorAll("[data-lista]"), function (b) {
      var en = l.indexOf(b.getAttribute("data-lista")) > -1; b.setAttribute("aria-pressed", en ? "true" : "false");
      var largo = b.classList.contains("btn-sec"); b.textContent = en ? "✓ En mi lista" : (largo ? "+ Agregar a mi lista para comparar" : "+ Mi lista");
    });
  };
  document.addEventListener("click", function (e) {
    var b = e.target.closest ? e.target.closest("[data-lista]") : null; if (!b) { return; }
    var sku = b.getAttribute("data-lista"), l = leer(), i = l.indexOf(sku);
    if (i > -1) { l.splice(i, 1); } else { l.push(sku); if (window.gtag) { window.gtag("event", "agregar_a_lista", { sku: sku }); } }
    guardar(l); pintar(); if (window.pintarLista) { window.pintarLista(); }
  });
  pintar();
  var app = document.getElementById("mi-lista-app"), dl = document.getElementById("datos-lista");
  if (app && dl) {
    var DL = {}; try { DL = JSON.parse(dl.textContent); } catch (e) { DL = {}; }
    window.pintarLista = function () {
      var l = leer().filter(function (s) { return DL[s]; });
      if (!l.length) { app.innerHTML = "<p>Tu lista está vacía. Agrega productos con el botón «+ Mi lista» en el <a href=\"" + raizL + "productos/\">catálogo</a> o en la ficha de cada producto.</p>"; return; }
      var filas = [["Línea", function (d) { return d.l; }], ["Medida de la hoja", function (d) { return d.a || "-"; }], ["Sistema", function (d) { return d.s || "-"; }], ["Mango", function (d) { return d.g || "-"; }],
        ["Resistente a la acetona", function (d) { return d.c ? "Sí" : "No indicada"; }], ["Certificación NSF", function (d) { return d.f ? "Sí (según ficha)" : "No indicada"; }], ["Detectable por detectores de metales", function (d) { return d.m ? "Sí" : "No indicada"; }], ["Hojas de repuesto", function (d) { return d.h || "-"; }]];
      var h = "<div class=\"tabla-envoltorio\"><table class=\"ficha comparar\"><thead><tr><th></th>" + l.map(function (s) { var d = DL[s]; return "<th scope=\"col\"><a href=\"" + d.u + "\"><img src=\"" + d.i + "\" alt=\"\" width=\"90\" height=\"90\"><br>" + esc(s) + "</a><br><button type=\"button\" class=\"btn btn-peq btn-sec\" data-quitar=\"" + esc(s) + "\">Quitar</button></th>"; }).join("") + "</tr></thead><tbody>";
      filas.forEach(function (f) { h += "<tr><th scope=\"row\">" + esc(f[0]) + "</th>" + l.map(function (s) { return "<td>" + esc(f[1](DL[s])) + "</td>"; }).join("") + "</tr>"; });
      h += "</tbody></table></div>";
      var msg = "Quiero cotizar estos productos de mi lista: " + l.join(", ") + ".";
      h += "<p style=\"margin-top:20px\"><a class=\"btn\" href=\"" + raizL + "cotizar/?interes=otro&producto=" + encodeURIComponent(l.join(", ")) + "&msg=" + encodeURIComponent(msg) + "\">Cotizar mi lista (" + l.length + ")</a> <button type=\"button\" class=\"btn btn-sec\" data-vaciar>Vaciar la lista</button></p>";
      app.innerHTML = h;
    };
    app.addEventListener("click", function (e) {
      var q = e.target.closest ? e.target.closest("[data-quitar]") : null, v = e.target.closest ? e.target.closest("[data-vaciar]") : null;
      if (q) { guardar(leer().filter(function (s) { return s !== q.getAttribute("data-quitar"); })); }
      if (v) { guardar([]); }
      if (q || v) { pintar(); window.pintarLista(); }
    });
    window.pintarLista();
  }
})();
