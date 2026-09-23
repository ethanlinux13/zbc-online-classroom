(() => {
  const config = window.ZBC_CONFIG || {};
  const dayNames = ["sunday","monday","tuesday","wednesday","thursday","friday","saturday"];
  const label = s => s.charAt(0).toUpperCase() + s.slice(1);

  const fmt = new Intl.DateTimeFormat("en-PH", {
    timeZone: config.timezone || "Asia/Manila",
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric"
  });

  function manilaNowParts() {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: config.timezone || "Asia/Manila",
      weekday: "long",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true
    }).formatToParts(new Date());
    const obj = Object.fromEntries(parts.map(p => [p.type, p.value]));
    return obj;
  }

  function currentDayKey() {
    return manilaNowParts().weekday.toLowerCase();
  }

  function renderToday() {
    const dayKey = currentDayKey();
    const today = config.schedule?.[dayKey];
    const active = Boolean(today);
    const dateText = fmt.format(new Date());

    document.getElementById("dayPill").textContent = dateText;
    document.getElementById("zoomBtn").href = config.zoomUrl || "#";
    document.getElementById("discordBtn").href = config.discordUrl || "#";

    const zoomBtn = document.getElementById("zoomBtn");
    const discordBtn = document.getElementById("discordBtn");
    [zoomBtn, discordBtn].forEach(btn => btn.classList.toggle("disabled", !active));

    if (active) {
      document.getElementById("heroTitle").textContent = today.subject;
      document.getElementById("heroSubtitle").textContent = `${today.instructor} • ${today.time} • ${today.mode || "Online"}`;
      document.getElementById("todaySubject").textContent = today.subject;
      document.getElementById("todayInstructor").textContent = today.instructor;
      document.getElementById("todayTime").textContent = today.time;
      document.getElementById("todayMode").textContent = today.mode || "Online";
    } else {
      document.getElementById("heroTitle").textContent = "No Regular Class Today";
      document.getElementById("heroSubtitle").textContent = "Regular ZBC online classes run Monday through Thursday. Check announcements for special sessions.";
      document.getElementById("todaySubject").textContent = "No regular class";
      document.getElementById("todayInstructor").textContent = "—";
      document.getElementById("todayTime").textContent = "—";
      document.getElementById("todayMode").textContent = "—";
    }
  }

  function renderSchedule() {
    const grid = document.getElementById("scheduleGrid");
    const current = currentDayKey();
    const days = ["monday","tuesday","wednesday","thursday"];
    grid.innerHTML = days.map(day => {
      const item = config.schedule?.[day] || {};
      const isActive = day === current;
      return `<article class="schedule-item ${isActive ? "active" : ""}">
        ${isActive ? '<span class="active-dot" aria-hidden="true"></span>' : ''}
        <div class="schedule-day">${label(day)}</div>
        <h4>${item.subject || "Class schedule"}</h4>
        <p>${item.instructor || "Instructor TBA"}</p>
        <p>${item.time || "Time TBA"}</p>
      </article>`;
    }).join("");
  }

  function renderAnnouncements() {
    const list = document.getElementById("announcementList");
    const items = config.announcements || [];
    list.innerHTML = items.length ? items.map(item => `
      <div class="announcement">
        <strong>${item.title}</strong>
        <p>${item.text}</p>
      </div>`).join("") : '<div class="announcement"><p>No announcements at this time.</p></div>';
  }

  function updateClock() {
    const p = manilaNowParts();
    document.getElementById("liveClock").textContent = `${p.hour}:${p.minute} ${p.dayPeriod}`;
  }

  let deferredPrompt;
  const installBtn = document.getElementById("installBtn");
  window.addEventListener("beforeinstallprompt", e => {
    e.preventDefault();
    deferredPrompt = e;
    installBtn.classList.remove("hidden");
  });
  installBtn.addEventListener("click", async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt = null;
    installBtn.classList.add("hidden");
  });

  function updateOnlineState() {
    document.getElementById("offlineBanner").classList.toggle("hidden", navigator.onLine);
  }
  window.addEventListener("online", updateOnlineState);
  window.addEventListener("offline", updateOnlineState);

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => navigator.serviceWorker.register("service-worker.js"));
  }

  renderToday();
  renderSchedule();
  renderAnnouncements();
  updateClock();
  updateOnlineState();
  setInterval(updateClock, 30000);
  setInterval(() => { renderToday(); renderSchedule(); }, 300000);
})();
