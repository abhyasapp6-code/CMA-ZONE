/*
  FILE: home.js
  REFERENCE: CMA-ZONE-HOME-FINAL-V1
  PURPOSE: Home dashboard state, onboarding, calculations, rendering and UI interactions.
  EDITABLE AREAS:
  - ATTEMPT_MASTER
  - student data mappings
  - task/revision/activity data mappings
  DEPENDENCIES: index.html, css/theme.css, css/home.css, academic-structure.js
  IMPORTANT NOTES:
  - No fixed 62/38/51/57 demo progress values are used.
  - New students begin at zero.
  - Production version should replace localStorage with the authenticated
    CMA Zone student data service.
  LAST UPDATED: 2026-10-04
*/

const STORAGE_KEY = "cma_zone_student_home_v1";

const ATTEMPT_MASTER = [
  { id:"JUN-2027", label:"June 2027 Attempt", examDate:"2027-06-11" },
  { id:"DEC-2026", label:"December 2026 Attempt", examDate:"2026-12-11" },
  { id:"JUN-2026", label:"June 2026 Attempt", examDate:"2026-06-11" }
];

const LEVELS = Object.keys(window.CMA_ACADEMIC_MASTER.levels);

let state = loadState();

function freshState() {
  return {
    setupComplete: false,
    level: "",
    group: "",
    attemptId: "",
    progress: {},
    daily: {},
    tasks: [],
    revisions: [],
    activities: []
  };
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return freshState();
    const saved = JSON.parse(raw);
    return { ...freshState(), ...saved };
  } catch {
    return freshState();
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

function getGroups(level) {
  return Object.keys(window.CMA_ACADEMIC_MASTER.levels[level]?.groups || {});
}

function getSubjects() {
  if (!state.setupComplete) return [];
  if (state.group === "Both Groups") {
    const groups = getGroups(state.level);
    return groups.flatMap(group =>
      window.CMA_ACADEMIC_MASTER.levels[state.level].groups[group].subjects
        .map(subject => ({ ...subject, group }))
    );
  }
  return window.CMA_ACADEMIC_MASTER.levels[state.level]?.groups?.[state.group]?.subjects || [];
}

function getAttempt() {
  return ATTEMPT_MASTER.find(item => item.id === state.attemptId) || null;
}

function populateSetup() {
  const level = document.getElementById("setupLevel");
  level.innerHTML = LEVELS
    .map(item => `<option value="${escapeHtml(item)}">${escapeHtml(item)}</option>`)
    .join("");

  level.value = state.level || "Final";
  populateSetupGroups();

  document.getElementById("setupAttempt").innerHTML = ATTEMPT_MASTER
    .map(item => `<option value="${escapeHtml(item.id)}">${escapeHtml(item.label)}</option>`)
    .join("");

  document.getElementById("setupAttempt").value =
    state.attemptId || ATTEMPT_MASTER[0].id;

  level.addEventListener("change", populateSetupGroups);
}

function populateSetupGroups() {
  const group = document.getElementById("setupGroup");
  const level = document.getElementById("setupLevel").value;
  let groups = getGroups(level);

  if (level === "Intermediate" || level === "Final") {
    groups = [...groups, "Both Groups"];
  }

  group.innerHTML = groups
    .map(item => `<option value="${escapeHtml(item)}">${escapeHtml(item)}</option>`)
    .join("");

  if (groups.includes(state.group)) group.value = state.group;
}

function startPreparation() {
  state.level = document.getElementById("setupLevel").value;
  state.group = document.getElementById("setupGroup").value;
  state.attemptId = document.getElementById("setupAttempt").value;
  state.setupComplete = true;

  saveState();
  renderAll();
  showToast("Your CMA preparation is ready.");
}

function showOrHideOnboarding() {
  const onboarding = document.getElementById("onboarding");
  const dashboard = document.getElementById("dashboardContent");

  onboarding.classList.toggle("hidden", state.setupComplete);
  dashboard.classList.toggle("hidden", !state.setupComplete);
}

function calculateAggregate() {
  const subjects = getSubjects();

  let syllabusTotal = 0;
  let syllabusDone = 0;
  let revisionTotal = 0;
  let revisionDone = 0;
  let testTotal = 0;
  let testDone = 0;

  subjects.forEach(subject => {
    const p = state.progress[subject.id] || {};
    syllabusTotal += Number(p.syllabusTotal) || 0;
    syllabusDone += Number(p.syllabusDone) || 0;
    revisionTotal += Number(p.revisionTotal) || 0;
    revisionDone += Number(p.revisionDone) || 0;
    testTotal += Number(p.testTotal) || 0;
    testDone += Number(p.testDone) || 0;
  });

  const syllabus = percentage(syllabusDone, syllabusTotal);
  const revision = percentage(revisionDone, revisionTotal);
  const tests = percentage(testDone, testTotal);

  /*
    Readiness is intentionally calculated only from real available data.
    If there is no syllabus/revision/test data yet, readiness remains 0.
  */
  const readiness =
    syllabusTotal || revisionTotal || testTotal
      ? Math.round((syllabus + revision + tests) / 3)
      : 0;

  return {
    syllabusTotal, syllabusDone, syllabus,
    revisionTotal, revisionDone, revision,
    testTotal, testDone, tests,
    readiness
  };
}

function percentage(done, total) {
  return total > 0 ? Math.round((done / total) * 100) : 0;
}

function renderHeader() {
  const attempt = getAttempt();

  document.getElementById("headerPreparation").textContent =
    state.setupComplete
      ? `CMA ${state.level} – ${state.group}`
      : "Set your preparation";

  document.getElementById("headerAttempt").textContent =
    attempt?.label || "Choose level, group and attempt";

  document.getElementById("heroTitle").textContent =
    state.setupComplete
      ? `CMA ${state.level} – ${state.group}`
      : "Your CMA Preparation";

  const exam = getAttempt();

  if (!exam) {
    document.getElementById("daysRemaining").textContent = "—";
    document.getElementById("examDate").textContent = "Set your preparation first";
    return;
  }

  const today = new Date();
  const target = new Date(`${exam.examDate}T23:59:59`);
  const diff = Math.max(0, target - today);
  const days = Math.ceil(diff / 86400000);

  document.getElementById("daysRemaining").textContent = `${days} Days`;

  document.getElementById("examDate").textContent =
    new Date(`${exam.examDate}T00:00:00`).toLocaleDateString("en-IN", {
      day:"2-digit", month:"short", year:"numeric"
    });
}

function renderMetrics() {
  const a = calculateAggregate();

  document.getElementById("heroPercent").textContent = `${a.syllabus}%`;
  document.getElementById("heroProgress").style.width = `${a.syllabus}%`;
  document.getElementById("topicCount").textContent =
    `${a.syllabusDone} / ${a.syllabusTotal} topics`;

  setMetric("Syllabus", a.syllabus, `${a.syllabusDone} / ${a.syllabusTotal} topics`);
  setMetric("Revision", a.revision, `${a.revisionDone} / ${a.revisionTotal} topics`);
  setMetric("Tests", a.tests, `${a.testDone} / ${a.testTotal} questions`);

  document.getElementById("metricReadiness").textContent = `${a.readiness}%`;
  document.getElementById("metricReadinessBar").style.width = `${a.readiness}%`;
  document.getElementById("metricReadinessDetail").textContent =
    a.syllabusTotal || a.revisionTotal || a.testTotal
      ? "Based on your preparation"
      : "Not enough data yet";

  document.getElementById("readinessSyllabus").textContent = `${a.syllabus}%`;
  document.getElementById("readinessRevision").textContent = `${a.revision}%`;
  document.getElementById("readinessTests").textContent = `${a.tests}%`;

  document.getElementById("readinessSyllabusBar").style.width = `${a.syllabus}%`;
  document.getElementById("readinessRevisionBar").style.width = `${a.revision}%`;
  document.getElementById("readinessTestsBar").style.width = `${a.tests}%`;
}

function setMetric(type, value, detail) {
  const map = {
    Syllabus: ["metricSyllabus","metricSyllabusBar","metricSyllabusDetail"],
    Revision: ["metricRevision","metricRevisionBar","metricRevisionDetail"],
    Tests: ["metricTests","metricTestsBar","metricTestsDetail"]
  };

  const ids = map[type];
  document.getElementById(ids[0]).textContent = `${value}%`;
  document.getElementById(ids[1]).style.width = `${value}%`;
  document.getElementById(ids[2]).textContent = detail;
}

function renderSubjects() {
  const container = document.getElementById("subjectGrid");
  const subjects = getSubjects();

  if (!subjects.length) {
    container.innerHTML = `
      <div class="subject-empty">
        <strong>Academic structure is not connected yet.</strong>
        <span>Once the approved CMA academic master is connected, your subjects will appear here.</span>
      </div>
    `;
    return;
  }

  container.innerHTML = subjects.map(subject => {
    const p = state.progress[subject.id] || {};
    const syllabus = percentage(p.syllabusDone, p.syllabusTotal);
    const revision = percentage(p.revisionDone, p.revisionTotal);
    const tests = percentage(p.testDone, p.testTotal);

    return `
      <article class="subject-card">
        <div class="subject-title">${escapeHtml(subject.name)}</div>
        <div class="paper-name">(${escapeHtml(subject.paper)})${subject.group ? ` • ${escapeHtml(subject.group)}` : ""}</div>

        <div class="donut-wrap">
          <div class="donut" style="--progress:${syllabus}%;--donut-color:#18b86a"></div>
          <div class="donut-value">${syllabus}%</div>
        </div>

        <div class="subject-legend">
          ${legendRow("#18b86a","Syllabus",syllabus)}
          ${legendRow("#358be9","Revision",revision)}
          ${legendRow("#8d3eea","Tests",tests)}
        </div>
      </article>
    `;
  }).join("");
}

function legendRow(color, label, value) {
  return `
    <div class="legend-row">
      <span class="legend-dot" style="background:${color}"></span>
      <span>${label}</span>
      <strong>${value}%</strong>
    </div>
  `;
}

function renderTasks() {
  const list = document.getElementById("taskList");
  const empty = document.getElementById("emptyPlan");

  if (!state.tasks.length) {
    list.innerHTML = "";
    empty.classList.remove("hidden");
  } else {
    empty.classList.add("hidden");
    list.innerHTML = state.tasks.map(task => `
      <div class="task-row">
        <button class="task-check ${task.done ? "done" : ""}" type="button"
          onclick="toggleTask('${escapeHtml(task.id)}')">${task.done ? "✓" : ""}</button>
        <span class="task-name ${task.done ? "done" : ""}">${escapeHtml(task.name)}</span>
        <span class="task-hours">${Number(task.hours || 0).toFixed(1)} hrs</span>
        <button class="task-play" type="button" onclick="startTask('${escapeHtml(task.name)}')">▶</button>
      </div>
    `).join("");
  }

  const total = state.tasks.reduce((s,t) => s + (Number(t.hours)||0), 0);
  const done = state.tasks.filter(t=>t.done).reduce((s,t) => s + (Number(t.hours)||0), 0);
  const pct = total ? Math.round(done / total * 100) : 0;

  document.getElementById("todaySummaryBar").style.width = `${pct}%`;
  document.getElementById("todayHours").textContent = `${done.toFixed(1)} / ${total.toFixed(1)} hrs`;
  document.getElementById("todayPercent").textContent = `${pct}%`;
}

function toggleTask(id) {
  const task = state.tasks.find(t => t.id === id);
  if (!task) return;
  task.done = !task.done;
  saveState();
  renderTasks();
  showToast(task.done ? "Task completed." : "Task marked incomplete.");
}

function startTask(name) {
  showToast(`Starting: ${name}`);
}

function renderActivities() {
  const container = document.getElementById("activityList");

  if (!state.activities.length) {
    container.innerHTML = `
      <div class="empty-state">
        <strong>No activity yet</strong>
        <span>Your completed classes, revisions and practice attempts will appear here.</span>
      </div>
    `;
    return;
  }

  container.innerHTML = state.activities.slice(0,10).map(item => `
    <div class="activity-row">
      <div class="activity-icon ${escapeHtml(item.type || "blue")}">${escapeHtml(item.icon || "•")}</div>
      <div>
        <div class="activity-title">${escapeHtml(item.title)}</div>
        <div class="activity-detail">${escapeHtml(item.detail)}</div>
      </div>
      <time class="activity-time">${escapeHtml(item.time)}</time>
    </div>
  `).join("");
}

function calculateStreak() {
  const active = new Set(
    Object.entries(state.daily)
      .filter(([,v]) => Number(v.completed) > 0 || Number(v.hours) > 0)
      .map(([date]) => date)
  );

  let streak = 0;
  const d = new Date();

  while (active.has(dateKey(d))) {
    streak++;
    d.setDate(d.getDate() - 1);
  }

  return streak;
}

function renderStreak() {
  const streak = calculateStreak();
  document.getElementById("streakValue").textContent =
    `${streak} Day${streak === 1 ? "" : "s"}`;

  document.getElementById("streakMessage").textContent =
    streak ? "Keep going!" : "Start your first study day.";

  const row = document.getElementById("weekRow");
  const labels = ["S","M","T","W","T","F","S"];

  row.innerHTML = labels.map((label,index) =>
    `<span class="${index < Math.min(streak,7) ? "active" : ""}">${label}</span>`
  ).join("");
}

function renderRevision() {
  const list = document.getElementById("revisionList");

  if (!state.revisions.length) {
    document.getElementById("revisionCount").textContent = "0 Topics";
    list.innerHTML = `<li><span></span><b>No revision due yet</b><time>—</time></li>`;
    return;
  }

  document.getElementById("revisionCount").textContent =
    `${state.revisions.length} Topic${state.revisions.length === 1 ? "" : "s"}`;

  list.innerHTML = state.revisions.slice(0,5).map(item => `
    <li><span></span><b>${escapeHtml(item.name)}</b><time>${escapeHtml(item.date)}</time></li>
  `).join("");
}

function renderRecommendation() {
  const box = document.getElementById("studyRecommendation");

  if (!state.activities.length && !state.revisions.length) {
    box.className = "recommendation empty-recommendation";
    box.innerHTML = `
      <strong>Build your preparation data first.</strong>
      <p>Once you study, revise and practice, CMA Zone can recommend your next activity.</p>
    `;
    return;
  }

  const item = state.revisions[0];

  if (!item) {
    box.className = "recommendation empty-recommendation";
    box.innerHTML = `
      <strong>Keep building your data.</strong>
      <p>CMA Zone will use your revision and practice history to suggest what to study next.</p>
    `;
    return;
  }

  box.className = "recommendation";
  box.innerHTML = `
    <div class="recommendation-top">
      <strong>${escapeHtml(item.name)}</strong>
      <span>Review</span>
    </div>
    <div class="recommendation-time">${escapeHtml(item.duration || "30 min")}</div>
    <p>Reason:</p>
    <ul>
      <li>Revision is due</li>
      <li>Topic is in your current plan</li>
    </ul>
  `;
}

function renderStudyChart() {
  const values = getLastSevenDaysHours();
  const max = Math.max(...values.map(v => v.hours), 0);
  const total = values.reduce((s,v)=>s+v.hours,0);

  document.getElementById("chartTotal").textContent = `${total.toFixed(1)} hrs`;

  document.getElementById("studyChart").innerHTML = values.map(item => {
    const height = max ? Math.max(4, item.hours / max * 82) : 4;
    return `<div class="chart-bar-group" title="${item.hours} hours"><div class="chart-bar" style="height:${height}%"></div></div>`;
  }).join("");

  document.getElementById("chartAxis").innerHTML =
    values.map(item => `<span>${item.label}</span>`).join("");
}

function getLastSevenDaysHours() {
  const result = [];
  const d = new Date();

  for (let i=6;i>=0;i--) {
    const day = new Date(d);
    day.setDate(d.getDate() - i);
    const key = dateKey(day);
    result.push({
      label: day.toLocaleDateString("en-IN",{weekday:"short"}),
      hours: Number(state.daily[key]?.hours || 0)
    });
  }

  return result;
}

function dateKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

function renderTodayDate() {
  document.getElementById("todayDate").textContent =
    new Date().toLocaleDateString("en-IN", {
      day:"numeric", month:"short", year:"numeric", weekday:"long"
    });
}

function renderAll() {
  showOrHideOnboarding();
  renderHeader();
  renderMetrics();
  renderSubjects();
  renderTasks();
  renderActivities();
  renderStreak();
  renderRevision();
  renderRecommendation();
  renderStudyChart();
  renderTodayDate();
}

function openSection(id) {
  document.getElementById(id)?.scrollIntoView({behavior:"smooth",block:"start"});
}

function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove("show"), 2200);
}

function init() {
  populateSetup();

  document.getElementById("startPreparation").addEventListener("click", startPreparation);

  document.getElementById("attemptButton").addEventListener("click", () => {
    document.getElementById("onboarding").classList.remove("hidden");
    document.getElementById("dashboardContent").classList.add("hidden");
    window.scrollTo({top:0,behavior:"smooth"});
  });

  renderAll();

  /*
    Countdown refresh only updates the exam timer. Student data is not
    regenerated or overwritten.
  */
  setInterval(renderHeader, 60000);
}

init();
