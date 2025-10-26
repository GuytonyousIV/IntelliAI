let activeAlerts = [];
let assignedAlerts = [];
let selectedAlertForAssignment = null;
let alertCounter = 1;
let sortField = "time";
let sortDirection = "desc";

const order = ["Critical", "Warning", "Info"];

let unusedTemplates = [
  { severity: "Critical", facility: "Central Plant", unit: "Chiller-1", title: "Refrigerant Leak Detected", desc: "Sensor indicates refrigerant level drop." },
  { severity: "Critical", facility: "Central Plant", unit: "Pump-1", title: "Pump Failure", desc: "Pump not rotating, mechanical seizure possible." },
  { severity: "Critical", facility: "Research Wing", unit: "AHU-3", title: "High Return Air Temperature", desc: "Temperature exceeds 95°F." },
  { severity: "Warning", facility: "Admin Building", unit: "RTU-1", title: "Filter Pressure Drop Increasing", desc: "Filter nearing limit, replacement soon." },
  { severity: "Info", facility: "Data Center", unit: "CRAC-2", title: "Cooling Mode Normal", desc: "System operating at normal load." },
  { severity: "Warning", facility: "Production Floor", unit: "AHU-4", title: "Temperature Deviation", desc: "Zone temperature exceeds ±3°F threshold." },
  { severity: "Critical", facility: "Warehouse", unit: "Boiler-1", title: "Overpressure Alert", desc: "Boiler pressure approaching danger limit." },
  { severity: "Critical", facility: "North Plant", unit: "Compressor-2", title: "Compressor Overload", desc: "Compressor load > 120%, immediate check required." },
  { severity: "Warning", facility: "Central Plant", unit: "Cooling Tower-1", title: "High Water Conductivity", desc: "Scaling risk detected, treat water." },
  { severity: "Warning", facility: "Data Center", unit: "CRAC-2", title: "Humidity Slightly High", desc: "Relative humidity above 60%." },
  { severity: "Info", facility: "South Production", unit: "AHU-6", title: "Scheduled Maintenance Logged", desc: "Maintenance schedule confirmed." },
  { severity: "Info", facility: "Admin Wing", unit: "CRAC-3", title: "Audit Log Updated", desc: "System event recorded successfully." },
  { severity: "Info", facility: "Warehouse", unit: "Lighting", title: "Energy Consumption Logged", desc: "Usage data sent to energy dashboard." },
  { severity: "Critical", facility: "Central Plant", unit: "Chiller-2", title: "Low Refrigerant Pressure", desc: "Refrigerant pressure below safe limit." },
  { severity: "Warning", facility: "Warehouse", unit: "Fan-2", title: "Fan Vibration Detected", desc: "Excessive vibration measured." },
  { severity: "Info", facility: "North Plant", unit: "AHU-2", title: "Air Quality Normal", desc: "CO2 levels within acceptable range." },
  { severity: "Critical", facility: "Data Center", unit: "UPS-1", title: "Power Supply Fault", desc: "UPS battery output unstable." },
  { severity: "Warning", facility: "Maintenance", unit: "Pump-2", title: "Low Water Flow", desc: "Flow rate 20% below setpoint." },
  { severity: "Info", facility: "Main Office", unit: "AHU-1", title: "Filter Condition Nominal", desc: "Differential pressure normal." },
  { severity: "Critical", facility: "Warehouse B", unit: "Boiler-3", title: "Flame Failure", desc: "No ignition detected after 3 attempts." },
  { severity: "Warning", facility: "Central Plant", unit: "Chiller-3", title: "Condenser Pressure High", desc: "Possible water flow issue." },
  { severity: "Critical", facility: "South Plant", unit: "Compressor-4", title: "Motor Overheating", desc: "Motor temperature exceeded limit." },
  { severity: "Info", facility: "Maintenance Wing", unit: "Pump-3", title: "Runtime Logged", desc: "Weekly runtime summary generated." },
  { severity: "Warning", facility: "Data Center", unit: "Sensor-5", title: "Temperature Drift Detected", desc: "Deviation from calibration curve." },
  { severity: "Critical", facility: "Research Wing", unit: "AHU-7", title: "Sensor Communication Failure", desc: "BACnet sensor not responding." },
  { severity: "Info", facility: "Warehouse A", unit: "Lighting-1", title: "System Startup Logged", desc: "Lighting schedule started successfully." },
  { severity: "Warning", facility: "Production", unit: "AHU-5", title: "Airflow Below Threshold", desc: "Fan speed drop detected." },
  { severity: "Critical", facility: "North Facility", unit: "Pump-4", title: "Seal Leak Detected", desc: "Small fluid leak identified." },
  { severity: "Info", facility: "Admin Building", unit: "Thermostat-1", title: "Temperature Adjustment Logged", desc: "User changed temperature setpoint." },
  { severity: "Info", facility: "IT Wing", unit: "CRAC-1", title: "Audit Log Updated", desc: "Control system event recorded." }
];

function generateAlertCode(sev) {
  const prefix = sev === "Critical" ? "R" : sev === "Warning" ? "Y" : "G";
  return `${prefix}-${String(alertCounter++).padStart(3, "0")}`;
}

function generateUniqueAlert() {
  if (unusedTemplates.length === 0) return null;
  const i = Math.floor(Math.random() * unusedTemplates.length);
  const t = unusedTemplates.splice(i, 1)[0];
  return {
    ...t,
    code: generateAlertCode(t.severity),
    time: new Date().toLocaleString(),
    isNew: true,
    completed: false
  };
}

function sortAlerts() {
  if (sortField === "time") {
    activeAlerts.sort((a, b) =>
      sortDirection === "asc"
        ? new Date(a.time) - new Date(b.time)
        : new Date(b.time) - new Date(a.time)
    );
  } else if (sortField === "severity") {
    activeAlerts.sort((a, b) =>
      sortDirection === "asc"
        ? order.indexOf(a.severity) - order.indexOf(b.severity)
        : order.indexOf(b.severity) - order.indexOf(a.severity)
    );
  }
}

function renderAlerts() {
  const tbody = document.getElementById("alertBody");
  tbody.innerHTML = "";
  sortAlerts();

  activeAlerts.forEach(a => {
    const tr = document.createElement("tr");
    tr.classList.toggle("new-alert", a.isNew);
    if (a.completed) tr.classList.add("completed");

    tr.innerHTML = `
      <td>${a.time}</td>
      <td>${a.code}</td>
      <td class="severity ${a.severity.toLowerCase()}">${a.severity}</td>
      <td>${a.facility}</td>
      <td>${a.unit}</td>
      <td>${a.title}</td>
      <td>${a.desc}</td>
      <td>${a.severity === "Info" ? "" : `<button class="assign-btn">Assign</button>`}</td>
      <td>${a.severity === "Info" ? "" : `<button class="done-btn">Completed</button>`}</td>
    `;

    tr.addEventListener("click", e => {
      if (!e.target.classList.contains("assign-btn") && !e.target.classList.contains("done-btn")) {
        a.isNew = false;
        tr.classList.remove("new-alert");
      }
    });

    // Only attach Assign and Completed handlers for non-info alerts
    if (a.severity !== "Info") {
      tr.querySelector(".assign-btn").addEventListener("click", e => {
        e.stopPropagation();
        selectedAlertForAssignment = a;
        document.getElementById("assignAlertTitle").innerText = `Assign: ${a.title}`;
        document.getElementById("assignModal").style.display = "block";
      });

      tr.querySelector(".done-btn").addEventListener("click", e => {
        e.stopPropagation();
        a.completed = !a.completed;
        renderAlerts();
      });
    }

    tbody.appendChild(tr);
  });
}

for (let i = 0; i < 5; i++) {
  const a = generateUniqueAlert();
  if (!a) break;
  a.isNew = false;
  activeAlerts.push(a);
}
renderAlerts();
setInterval(() => {
  const n = generateUniqueAlert();
  if (n) {
    activeAlerts.push(n);
    if (activeAlerts.length > 25) activeAlerts.shift();
    renderAlerts();
  }
}, 10000);

// Sorting header click
document.querySelectorAll(".sortable").forEach(h =>
  h.addEventListener("click", () => {
    const f = h.dataset.field;
    if (sortField === f) sortDirection = sortDirection === "asc" ? "desc" : "asc";
    else sortField = f;
    renderAlerts();
  })
);

// --- Modal Logic ---
document.getElementById("confirmAssign").addEventListener("click", () => {
  const staff = document.getElementById("staffName").value.trim();
  if (staff && selectedAlertForAssignment) {
    const assigned = {
      ...selectedAlertForAssignment,
      assignedTo: staff,
      aiSuggestion: "Inspect system and follow maintenance protocol."
    };
    assignedAlerts.push(assigned);
    activeAlerts = activeAlerts.filter(a => a !== selectedAlertForAssignment);
    renderAlerts();
    renderAssigned();
  }
  document.getElementById("assignModal").style.display = "none";
  document.getElementById("staffName").value = "";
});
document.getElementById("cancelAssign").addEventListener("click", () => {
  document.getElementById("assignModal").style.display = "none";
});

// --- Assigned Tab ---
function renderAssigned() {
  const tbody = document.getElementById("assignedBody");
  tbody.innerHTML = "";
  assignedAlerts.forEach(a => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${a.time}</td>
      <td>${a.code}</td>
      <td class="severity ${a.severity.toLowerCase()}">${a.severity}</td>
      <td>${a.facility}</td>
      <td>${a.unit}</td>
      <td>${a.title}</td>
      <td>${a.assignedTo}</td>
      <td>${a.aiSuggestion}</td>`;
    tr.addEventListener("click", () => openAIPanel(a));
    tbody.appendChild(tr);
  });
}

// --- Side Panel ---
const aiPanel = document.getElementById("aiPanel");
document.getElementById("closePanel").addEventListener("click", () => aiPanel.classList.remove("open"));

function openAIPanel(a) {
  aiPanel.classList.add("open");
  document.getElementById("aiPanelTitle").textContent = a.title;
  document.getElementById("aiPanelContent").innerHTML = `
    <h4>AI Fix Steps</h4>
    <p><strong>Severity:</strong> ${a.severity}</p>
    <p><strong>Assigned To:</strong> ${a.assignedTo}</p>
    <ul>
      <li>Verify power and connections.</li>
      <li>Inspect sensors and readings.</li>
      <li>Review event logs for recurring faults.</li>
    </ul>`;
}

// --- Tabs ---
document.querySelectorAll(".tab-button").forEach(btn =>
  btn.addEventListener("click", () => {
    document.querySelector(".tab-button.active").classList.remove("active");
    btn.classList.add("active");
    document.querySelector(".tab-content.active").classList.remove("active");
    document.getElementById(btn.dataset.tab).classList.add("active");
  })
);
