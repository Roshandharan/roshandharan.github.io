/* =========================================================
   Roshan Dharan — Portfolio (Enhanced) | main.js
   - Theme toggle (persisted)
   - Mobile menu
   - Active nav link
   - Reveal-on-scroll
   - Modal/lightbox for images
   - Projects page: search, filter pills, sort
   ========================================================= */

(function(){
  const $ = (sel, root=document) => root.querySelector(sel);
  const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));

  // ---------- Theme ----------
  const themeBtn = $("#themeToggle");
  const getPreferredTheme = () => {
    const saved = localStorage.getItem("theme");
    if (saved === "light" || saved === "dark") return saved;
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
  };
  const applyTheme = (t) => {
    document.documentElement.setAttribute("data-theme", t);
    localStorage.setItem("theme", t);
    if (themeBtn) themeBtn.setAttribute("aria-label", t === "light" ? "Switch to dark theme" : "Switch to light theme");
  };
  applyTheme(getPreferredTheme());
  if (themeBtn) {
    themeBtn.addEventListener("click", () => {
      const t = document.documentElement.getAttribute("data-theme") === "light" ? "dark" : "light";
      applyTheme(t);
      toast(`Theme: ${t}`);
    });
  }

  // ---------- Mobile Nav ----------
  const navToggle = $("#navToggle");
  const navLinks = $("#navLinks");
  const closeNav = () => navLinks && navLinks.classList.remove("open");
  if (navToggle && navLinks){
    navToggle.addEventListener("click", () => navLinks.classList.toggle("open"));
    document.addEventListener("click", (e) => {
      const within = navLinks.contains(e.target) || navToggle.contains(e.target);
      if (!within) closeNav();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeNav();
    });
  }

  // ---------- Active nav link ----------
  const file = (location.pathname.split("/").pop() || "index.html").toLowerCase();
  $$("#navLinks a").forEach(a => {
    const href = (a.getAttribute("href") || "").toLowerCase();
    if (href === file) a.setAttribute("aria-current", "page");
  });

  // ---------- Reveal on scroll ----------
  const reveal = $$(".reveal");
  if ("IntersectionObserver" in window && reveal.length){
    const io = new IntersectionObserver((entries) => {
      for (const e of entries){
        if (e.isIntersecting) e.target.classList.add("in");
      }
    }, { threshold: .12 });
    reveal.forEach(el => io.observe(el));
  } else {
    reveal.forEach(el => el.classList.add("in"));
  }

  // ---------- Modal (lightbox) ----------
  const modalBackdrop = $("#modalBackdrop");
  const modalTitle = $("#modalTitle");
  const modalImg = $("#modalImg");
  const modalDesc = $("#modalDesc");
  const modalClose = $("#modalClose");

  const openModal = ({title, src, desc}) => {
    if (!modalBackdrop) return;
    modalTitle && (modalTitle.textContent = title || "Preview");
    if (modalImg){
      modalImg.src = src;
      modalImg.alt = title || "Preview image";
    }
    modalDesc && (modalDesc.textContent = desc || "");
    modalBackdrop.classList.add("open");
    modalClose && modalClose.focus();
  };

  const closeModal = () => modalBackdrop && modalBackdrop.classList.remove("open");

  if (modalBackdrop){
    modalBackdrop.addEventListener("click", (e) => {
      const isBackdrop = e.target === modalBackdrop;
      if (isBackdrop) closeModal();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeModal();
    });
    modalClose && modalClose.addEventListener("click", closeModal);

    // Attach to all elements with data-modal
    $$("[data-modal='image']").forEach(btn => {
      btn.addEventListener("click", () => {
        const title = btn.getAttribute("data-title") || btn.getAttribute("aria-label") || "Preview";
        const src = btn.getAttribute("data-src");
        const desc = btn.getAttribute("data-desc") || "";
        if (src) openModal({title, src, desc});
      });
      btn.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); btn.click(); }
      });
    });
  }

  // ---------- Projects page: search/filter/sort ----------
  const projectsRoot = $("#projectsRoot");
  if (projectsRoot){
    const search = $("#projectSearch");
    const sort = $("#projectSort");
    const pills = $$("#tagPills .pill");
    const cards = $$("#projectsRoot .card");

    const normalize = (s) => (s || "").toLowerCase();

    const getActiveTags = () => pills.filter(p => p.getAttribute("aria-pressed") === "true").map(p => p.dataset.tag);

    const run = () => {
      const q = normalize(search && search.value);
      const tags = getActiveTags();
      const sortMode = sort ? sort.value : "recent";
      const visible = [];

      cards.forEach(card => {
        const title = normalize(card.dataset.title);
        const meta = normalize(card.dataset.meta);
        const blob = `${title} ${meta} ${normalize(card.textContent)}`;
        const cardTags = (card.dataset.tags || "").split("|").filter(Boolean);

        const okQuery = !q || blob.includes(q);
        const okTags = !tags.length || tags.every(t => cardTags.includes(t));
        const show = okQuery && okTags;

        card.style.display = show ? "" : "none";
        if (show) visible.push(card);
      });

      // sorting within the grid
      const sorted = visible.slice().sort((a,b) => {
        const da = parseInt(a.dataset.order || "0", 10);
        const db = parseInt(b.dataset.order || "0", 10);

        if (sortMode === "recent") return db - da;
        if (sortMode === "oldest") return da - db;

        // name
        const ta = (a.dataset.title || "").toLowerCase();
        const tb = (b.dataset.title || "").toLowerCase();
        return ta.localeCompare(tb);
      });

      sorted.forEach(el => projectsRoot.appendChild(el));

      const count = $("#projectCount");
      if (count) count.textContent = `${visible.length} shown`;
    };

    pills.forEach(p => {
      p.addEventListener("click", () => {
        const pressed = p.getAttribute("aria-pressed") === "true";
        p.setAttribute("aria-pressed", pressed ? "false" : "true");
        run();
      });
    });
    search && search.addEventListener("input", run);
    sort && sort.addEventListener("change", run);

    // keyboard shortcut: "/" focuses search
    document.addEventListener("keydown", (e) => {
      if (e.key === "/" && document.activeElement !== search){
        e.preventDefault();
        search && search.focus();
      }
    });

    run();
  }

  // ---------- Toast ----------
  const toastEl = $("#toast");
  let toastTimer = null;
  function toast(msg){
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove("show"), 1600);
  }

  // ---------- Copy email button (if present) ----------
  const copyEmail = $("#copyEmail");
  if (copyEmail){
    copyEmail.addEventListener("click", async () => {
      const email = copyEmail.getAttribute("data-email") || "";
      if (!email) return;
      try{
        await navigator.clipboard.writeText(email);
        toast("Email copied");
      }catch{
        toast("Copy failed");
      }
    });
  }
})();
