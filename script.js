const form = document.getElementById("movementForm");
const body = document.getElementById("movementsBody");
const filterDate = document.getElementById("filterDate");
const clearFilterButton = document.getElementById("clearFilterButton");
const exportCsvButton = document.getElementById("exportCsvButton");
const dailySummary = document.getElementById("dailySummary");
const cancelEditButton = document.getElementById("cancelEditButton");
const submitButton = document.getElementById("submitButton");

const storageKey = "lucca-airport-ops.movements";
const movements = JSON.parse(localStorage.getItem(storageKey) || "[]").map((m) => ({
  id: m.id || crypto.randomUUID(),
  callsign: m.callsign || "",
  provenienza: m.provenienza || "",
  destinazione: m.destinazione || "",
  stato: m.stato || "Atteso",
  ...m,
}));

function getSortDateTime(record) {
  return new Date(`${record.dataArrivo}T${record.oraArrivoLocale || "00:00"}`).getTime();
}

function save() {
  localStorage.setItem(storageKey, JSON.stringify(movements));
}

function sortMovements() {
  movements.sort((a, b) => getSortDateTime(b) - getSortDateTime(a));
}

function getVisibleMovements() {
  const selectedDate = filterDate.value;
  if (!selectedDate) {
    return movements;
  }

  return movements.filter(
    (m) => m.dataArrivo === selectedDate || m.dataPartenza === selectedDate
  );
}

function setFieldError(fieldName, message) {
  const field = form.elements[fieldName];
  const error = form.querySelector(`[data-error-for="${fieldName}"]`);
  if (!field || !error) {
    return;
  }

  field.classList.toggle("field-invalid", Boolean(message));
  error.textContent = message || "";
}

function clearFieldErrors() {
  form.querySelectorAll(".field-error").forEach((node) => {
    node.textContent = "";
  });

  form.querySelectorAll(".field-invalid").forEach((field) => {
    field.classList.remove("field-invalid");
  });
}

function isNonNegativeInteger(value) {
  return /^\d+$/.test(String(value));
}

function validateForm(data) {
  clearFieldErrors();
  let hasErrors = false;

  const callsign = data.get("callsign")?.toString().trim() || "";
  const marca = data.get("marca")?.toString().trim() || "";
  const provenienza = data.get("provenienza")?.toString().trim() || "";
  const destinazione = data.get("destinazione")?.toString().trim() || "";
  const paxArrivo = data.get("paxArrivo")?.toString().trim() || "";
  const paxPartenza = data.get("paxPartenza")?.toString().trim() || "";

  if (!callsign && !marca) {
    const message = "Compilare almeno Callsign o Marca aeromobile.";
    setFieldError("callsign", message);
    setFieldError("marca", message);
    hasErrors = true;
  }

  if (!provenienza) {
    setFieldError("provenienza", "La provenienza è obbligatoria.");
    hasErrors = true;
  }

  if (!destinazione) {
    setFieldError("destinazione", "La destinazione è obbligatoria.");
    hasErrors = true;
  }

  if (!isNonNegativeInteger(paxArrivo)) {
    setFieldError("paxArrivo", "Inserire un numero intero maggiore o uguale a 0.");
    hasErrors = true;
  }

  if (!isNonNegativeInteger(paxPartenza)) {
    setFieldError("paxPartenza", "Inserire un numero intero maggiore o uguale a 0.");
    hasErrors = true;
  }

  return !hasErrors;
}

function escapeCsvValue(value) {
  const normalized = String(value ?? "").replace(/"/g, '""');
  return `"${normalized}"`;
}

function exportVisibleMovementsCsv() {
  const visibleMovements = getVisibleMovements();
  const headers = [
    "Callsign",
    "Marca",
    "Tipo",
    "Esercente",
    "Provenienza",
    "Destinazione",
    "Stato",
    "Arrivo locale",
    "Arrivo UTC",
    "Partenza locale",
    "Partenza UTC",
    "Passeggeri in arrivo",
    "Passeggeri in partenza",
    "Carburante",
    "Taxi",
    "Altre richieste",
  ];

  const rows = visibleMovements.map((m) => [
    m.callsign,
    m.marca,
    m.tipo,
    m.esercente,
    m.provenienza,
    m.destinazione,
    m.stato,
    `${m.dataArrivo} ${m.oraArrivoLocale}`,
    `${m.dataArrivo} ${m.oraArrivoUtc}`,
    `${m.dataPartenza} ${m.oraPartenzaLocale}`,
    `${m.dataPartenza} ${m.oraPartenzaUtc}`,
    m.paxArrivo,
    m.paxPartenza,
    m.carburante,
    m.taxi ? "Sì" : "No",
    m.altreRichieste || "",
  ]);

  const csvContent = [headers, ...rows]
    .map((row) => row.map(escapeCsvValue).join(","))
    .join("\n");

  const blob = new Blob([`\ufeff${csvContent}`], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const dateSuffix = filterDate.value || "tutti-i-movimenti";

  const link = document.createElement("a");
  link.href = url;
  link.download = `lucca-tassignano-movimenti-${dateSuffix}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function renderSummary(visibleMovements) {
  const totals = visibleMovements.reduce(
    (acc, movement) => {
      acc.arrivi += 1;
      acc.partenze += 1;
      acc.movimenti += 1;
      acc.paxArrivo += Number(movement.paxArrivo || 0);
      acc.paxPartenza += Number(movement.paxPartenza || 0);
      return acc;
    },
    {
      arrivi: 0,
      partenze: 0,
      movimenti: 0,
      paxArrivo: 0,
      paxPartenza: 0,
    }
  );

  dailySummary.innerHTML = `
    <div class="summary-item">
      <div class="summary-label">Numero arrivi</div>
      <div class="summary-value">${totals.arrivi}</div>
    </div>
    <div class="summary-item">
      <div class="summary-label">Numero partenze</div>
      <div class="summary-value">${totals.partenze}</div>
    </div>
    <div class="summary-item">
      <div class="summary-label">Totale movimenti</div>
      <div class="summary-value">${totals.movimenti}</div>
    </div>
    <div class="summary-item">
      <div class="summary-label">Totale passeggeri in arrivo</div>
      <div class="summary-value">${totals.paxArrivo}</div>
    </div>
    <div class="summary-item">
      <div class="summary-label">Totale passeggeri in partenza</div>
      <div class="summary-value">${totals.paxPartenza}</div>
    </div>
  `;
}


function getStatusBadgeClass(status) {
  const normalized = String(status || "").toLowerCase();
  const map = {
    atteso: "status-atteso",
    arrivato: "status-arrivato",
    pronto: "status-pronto",
    partito: "status-partito",
    cancellato: "status-cancellato",
  };

  return map[normalized] || "status-partito";
}

function render() {
  sortMovements();
  const visibleMovements = getVisibleMovements();
  renderSummary(visibleMovements);

  if (!visibleMovements.length) {
    body.innerHTML = '<tr><td colspan="14" class="empty">Nessun movimento registrato per i criteri selezionati.</td></tr>';
    return;
  }

  body.innerHTML = visibleMovements
    .map(
      (m) => `
      <tr>
        <td>${m.callsign}</td>
        <td>${m.marca}</td>
        <td>${m.tipo}</td>
        <td>${m.esercente}</td>
        <td>${m.provenienza}</td>
        <td>${m.destinazione}</td>
        <td><span class="status-badge ${getStatusBadgeClass(m.stato)}">${m.stato}</span></td>
        <td>${m.dataArrivo} ${m.oraArrivoLocale} / ${m.oraArrivoUtc}</td>
        <td>${m.dataPartenza} ${m.oraPartenzaLocale} / ${m.oraPartenzaUtc}</td>
        <td>${m.paxArrivo} / ${m.paxPartenza}</td>
        <td>${m.carburante}</td>
        <td>${m.taxi ? "Sì" : "No"}</td>
        <td>${m.altreRichieste || "-"}</td>
        <td>
          <div class="table-actions">
            <button type="button" class="small secondary" data-action="edit" data-id="${m.id}">Modifica</button>
            <button type="button" class="small danger-soft" data-action="delete" data-id="${m.id}">Elimina</button>
          </div>
        </td>
      </tr>
    `
    )
    .join("");
}

function populateForm(record) {
  clearFieldErrors();
  form.recordId.value = record.id;
  form.callsign.value = record.callsign;
  form.marca.value = record.marca;
  form.tipo.value = record.tipo;
  form.esercente.value = record.esercente;
  form.provenienza.value = record.provenienza;
  form.destinazione.value = record.destinazione;
  form.stato.value = record.stato;
  form.dataArrivo.value = record.dataArrivo;
  form.oraArrivoLocale.value = record.oraArrivoLocale;
  form.oraArrivoUtc.value = record.oraArrivoUtc;
  form.dataPartenza.value = record.dataPartenza;
  form.oraPartenzaLocale.value = record.oraPartenzaLocale;
  form.oraPartenzaUtc.value = record.oraPartenzaUtc;
  form.paxArrivo.value = record.paxArrivo;
  form.paxPartenza.value = record.paxPartenza;
  form.carburante.value = record.carburante;
  form.taxi.checked = Boolean(record.taxi);
  form.altreRichieste.value = record.altreRichieste || "";

  submitButton.textContent = "Aggiorna movimento";
  cancelEditButton.classList.remove("hidden");
}

function resetFormEditMode() {
  form.recordId.value = "";
  submitButton.textContent = "Salva movimento";
  cancelEditButton.classList.add("hidden");
}

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const data = new FormData(form);
  if (!validateForm(data)) {
    return;
  }

  const recordId = data.get("recordId")?.toString();
  const movement = {
    id: recordId || crypto.randomUUID(),
    callsign: data.get("callsign")?.toString().trim(),
    marca: data.get("marca")?.toString().trim(),
    tipo: data.get("tipo")?.toString().trim(),
    esercente: data.get("esercente")?.toString().trim(),
    provenienza: data.get("provenienza")?.toString().trim(),
    destinazione: data.get("destinazione")?.toString().trim(),
    stato: data.get("stato"),
    dataArrivo: data.get("dataArrivo"),
    oraArrivoLocale: data.get("oraArrivoLocale"),
    oraArrivoUtc: data.get("oraArrivoUtc"),
    dataPartenza: data.get("dataPartenza"),
    oraPartenzaLocale: data.get("oraPartenzaLocale"),
    oraPartenzaUtc: data.get("oraPartenzaUtc"),
    paxArrivo: data.get("paxArrivo"),
    paxPartenza: data.get("paxPartenza"),
    carburante: data.get("carburante"),
    taxi: data.get("taxi") === "on",
    altreRichieste: data.get("altreRichieste")?.toString().trim(),
  };

  const existingIndex = movements.findIndex((item) => item.id === movement.id);
  if (existingIndex >= 0) {
    movements[existingIndex] = movement;
  } else {
    movements.push(movement);
  }

  save();
  render();
  form.reset();
  clearFieldErrors();
  resetFormEditMode();
});

body.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button) {
    return;
  }

  const id = button.dataset.id;
  const action = button.dataset.action;
  const movement = movements.find((item) => item.id === id);
  if (!movement) {
    return;
  }

  if (action === "edit") {
    populateForm(movement);
    window.scrollTo({ top: 0, behavior: "smooth" });
    return;
  }

  if (action === "delete") {
    const index = movements.findIndex((item) => item.id === id);
    movements.splice(index, 1);
    save();
    render();
  }
});

filterDate.addEventListener("change", render);

clearFilterButton.addEventListener("click", () => {
  filterDate.value = "";
  render();
});

cancelEditButton.addEventListener("click", () => {
  form.reset();
  clearFieldErrors();
  resetFormEditMode();
});

exportCsvButton.addEventListener("click", exportVisibleMovementsCsv);

render();
