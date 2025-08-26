// ===== Navigation =====
document.querySelectorAll("nav button").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll("nav button").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    const target = btn.dataset.target;
    document.querySelectorAll("main section").forEach(sec => sec.classList.remove("active"));
    document.getElementById(target).classList.add("active");
  });
});

// ===== Task List =====
const taskInput = document.getElementById("taskInput");
const addTaskBtn = document.getElementById("addTaskBtn");
const taskList = document.getElementById("taskList");
const tabs = document.querySelectorAll(".task-tabs .tab");

let tasks = [];

addTaskBtn.addEventListener("click", () => {
  const text = taskInput.value.trim();
  if (!text) return;

  const task = { text: text, done: false, created: new Date() };
  tasks.push(task);
  taskInput.value = "";
  renderTasks(getActiveFilter());
});

tabs.forEach(tab => {
  tab.addEventListener("click", () => {
    tabs.forEach(t => t.classList.remove("active"));
    tab.classList.add("active");
    renderTasks(getActiveFilter());
  });
});

function toggleDone(index) {
  tasks[index].done = !tasks[index].done;
  renderTasks(getActiveFilter());
}

function getActiveFilter() {
  return document.querySelector(".task-tabs .tab.active").dataset.filter;
}

function renderTasks(filter) {
  taskList.innerHTML = "";
  tasks.forEach((task, index) => {
    let show = false;
    if (filter === "all") show = true;
    if (filter === "pending" && !task.done) show = true;
    if (filter === "completed" && task.done) show = true;
    if (filter === "today") {
      const today = new Date();
      show = task.created.toDateString() === today.toDateString();
    }
    if (!show) return;

    const li = document.createElement("li");
    li.className = task.done ? "done" : "";
    li.textContent = task.text;
    li.addEventListener("click", () => toggleDone(index));

    const delBtn = document.createElement("button");
    delBtn.textContent = "Delete";
    delBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      tasks.splice(index, 1);
      renderTasks(getActiveFilter());
    });
    li.appendChild(delBtn);
    taskList.appendChild(li);
  });
}

// ===== Pomodoro Timer =====
let pomodoroInterval;
let pomodoroTime = 25 * 60;
const timerDisplay = document.getElementById("timerDisplay");
const startBtn = document.getElementById("startPomodoro");
const pauseBtn = document.getElementById("pausePomodoro"); // Added pause button
const resetBtn = document.getElementById("resetPomodoro");

function updateDisplay() {
  const m = Math.floor(pomodoroTime / 60).toString().padStart(2, '0');
  const s = (pomodoroTime % 60).toString().padStart(2, '0');
  timerDisplay.textContent = `${m}:${s}`;
}

startBtn.addEventListener("click", () => {
  if (pomodoroInterval) return; // Prevent multiple intervals
  pomodoroInterval = setInterval(() => {
    if (pomodoroTime > 0) {
      pomodoroTime--;
      updateDisplay();
    } else {
      clearInterval(pomodoroInterval);
      pomodoroInterval = null;
      alert("Time's up!");
    }
  }, 1000);
});

pauseBtn.addEventListener("click", () => {
  clearInterval(pomodoroInterval);
  pomodoroInterval = null;
});

resetBtn.addEventListener("click", () => {
  clearInterval(pomodoroInterval);
  pomodoroInterval = null;
  pomodoroTime = 25 * 60;
  updateDisplay();
});

updateDisplay();

// ===== Timetable Generator =====
let activities = [];
let currentSchedule = [];

const timetableForm = document.getElementById("timetableForm");
const activityInput = document.getElementById("activity");
const durationInput = document.getElementById("duration");
const startTimeInput = document.getElementById("startTime");
const endTimeInput = document.getElementById("endTime");
const breaksInput = document.getElementById("numBreaks");
const timetableOutput = document.getElementById("timetableOutput");
const generateBtn = document.getElementById("generateBtn");
const exportBtn = document.getElementById("exportBtn");

// Add activity
timetableForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const name = activityInput.value.trim();
  const duration = parseInt(durationInput.value);
  if (!name || isNaN(duration) || duration <= 0) return;

  activities.push({ name, duration });

  const div = document.createElement("div");
  div.className = "activity";
  div.textContent = `${name} - ${duration} min`;
  timetableOutput.appendChild(div);

  activityInput.value = "";
  durationInput.value = "";
});

// Generate timetable
generateBtn.addEventListener("click", () => {
  const startTime = startTimeInput.value;
  const endTime = endTimeInput.value;
  const numBreaks = parseInt(breaksInput.value) || 0;

  if (!startTime || !endTime || startTime >= endTime) {
    alert("Invalid start or end time!");
    return;
  }

  const [sh, sm] = startTime.split(":").map(Number);
  const [eh, em] = endTime.split(":").map(Number);
  const startMinutes = sh * 60 + sm;
  const endMinutes = eh * 60 + em;
  const totalAvailable = endMinutes - startMinutes;

  const totalStudy = activities.reduce((sum, a) => sum + a.duration, 0);
  if (totalStudy > totalAvailable) {
    alert("Not enough time for all activities!");
    return;
  }

  const breakGap = Math.floor(totalAvailable / (numBreaks + 1));
  let breakTimes = [];
  for (let i = 1; i <= numBreaks; i++) breakTimes.push(startMinutes + i * breakGap);

  let currentTime = startMinutes;
  let schedule = [];

  for (let act of activities) {
    while (breakTimes.length > 0 && currentTime + act.duration > breakTimes[0]) {
      const bTime = breakTimes.shift();
      schedule.push({ name: "Break", start: currentTime, end: bTime });
      currentTime = bTime;
    }
    schedule.push({ name: act.name, start: currentTime, end: currentTime + act.duration });
    currentTime += act.duration;
  }

  while (breakTimes.length > 0) {
    const bTime = breakTimes.shift();
    schedule.push({ name: "Break", start: bTime, end: bTime + 10 });
  }

  currentSchedule = schedule;
  renderTimetable(currentSchedule);
});

// Export timetable
exportBtn.addEventListener("click", () => {
  const text = Array.from(timetableOutput.querySelectorAll(".slot")).map(d => d.textContent).join("\n");
  const blob = new Blob([text], { type: "text/plain" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "timetable.txt";
  link.click();
});

// Render timetable with drag & drop
function renderTimetable(schedule) {
  timetableOutput.innerHTML = "";

  schedule.forEach((item, index) => {
    const div = document.createElement("div");
    div.className = "slot " + (item.name === "Break" ? "break" : "activity");
    div.textContent = `${formatTime(item.start)} - ${formatTime(item.end)}: ${item.name}`;

    if (item.name !== "Break") {
      div.setAttribute("draggable", "true");

      div.addEventListener("dragstart", (e) => {
        e.dataTransfer.setData("text/plain", index);
        div.style.opacity = "0.5";
      });

      div.addEventListener("dragend", () => {
        div.style.opacity = "1";
      });

      div.addEventListener("dragover", (e) => e.preventDefault());

      div.addEventListener("drop", (e) => {
        e.preventDefault();
        const draggedIndex = e.dataTransfer.getData("text/plain");
        const temp = schedule[draggedIndex];
        schedule[draggedIndex] = schedule[index];
        schedule[index] = temp;
        renderTimetable(schedule);
      });
    }

    timetableOutput.appendChild(div);
  });
}

function formatTime(mins) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}`;
}
