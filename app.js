const API_URL = "https://script.google.com/macros/s/AKfycbx4AeYVDWO-4x7tj8Vzqvcd3GdqU2zduG1UP1oB7GwdEi3ZZi7LKJHQgtJcHFrs9XJxdw/exec";
 
// ---------- รหัสประจำเครื่อง ----------
// ใช้แยกว่าใครเป็นเจ้าของรายการไหน เก็บไว้ในเครื่องนี้ถาวร (จนกว่าจะล้างข้อมูลเว็บไซต์)
const USER_ID_KEY = "timetable2_userId";
 
function getUserId() {
  let id = localStorage.getItem(USER_ID_KEY);
  if (!id) {
    id = (crypto.randomUUID ? crypto.randomUUID() : Date.now() + "-" + Math.random().toString(16).slice(2));
    localStorage.setItem(USER_ID_KEY, id);
  }
  return id;
}
 
const userId = getUserId();
 
let items = [];
let currentFilter = "all";
 
const el = {
  form: document.getElementById("itemForm"),
  subject: document.getElementById("subject"),
  type: document.getElementById("type"),
  dueDate: document.getElementById("dueDate"),
  note: document.getElementById("note"),
  submitBtn: document.getElementById("submitBtn"),
  itemList: document.getElementById("itemList"),
  loading: document.getElementById("loading"),
  emptyMsg: document.getElementById("emptyMsg"),
  totalCount: document.getElementById("totalCount"),
  doneCount: document.getElementById("doneCount"),
  progressFill: document.getElementById("progressFill"),
  progressPercent: document.getElementById("progressPercent"),
  filterBtns: document.querySelectorAll(".filter-btn"),
};
 
const STATUS_DONE = "เสร็จแล้ว";
const STATUS_PENDING = "ยังไม่เสร็จ";
 
// ---------- API helpers ----------
 
async function apiRead() {
  const res = await fetch(`${API_URL}?action=read&userId=${encodeURIComponent(userId)}`);
  const data = await res.json();
  if (data.status !== "ok") throw new Error(data.message || "โหลดข้อมูลล้มเหลว");
  return data.items;
}
 
async function apiCreate(payload) {
  const res = await fetch(API_URL, {
    method: "POST",
    body: JSON.stringify({ action: "create", data: { ...payload, userId } }),
  });
  return res.json();
}
 
async function apiUpdate(id, payload) {
  const res = await fetch(API_URL, {
    method: "POST",
    body: JSON.stringify({ action: "update", data: { id, ...payload } }),
  });
  return res.json();
}
 
async function apiDelete(id) {
  const res = await fetch(API_URL, {
    method: "POST",
    body: JSON.stringify({ action: "delete", data: { id } }),
  });
  return res.json();
}
 
// ---------- Rendering ----------
 
function isOverdue(dueDate, status) {
  if (status === STATUS_DONE) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(dueDate) < today;
}
 
function render() {
  const filtered = items.filter((it) => {
    if (currentFilter === "done") return it.Status === STATUS_DONE;
    if (currentFilter === "pending") return it.Status !== STATUS_DONE;
    return true;
  });
 
  el.itemList.innerHTML = "";
  el.emptyMsg.style.display = filtered.length === 0 ? "block" : "none";
 
  filtered
    .slice()
    .sort((a, b) => new Date(a.DueDate) - new Date(b.DueDate))
    .forEach((it) => {
      const li = document.createElement("li");
      li.className = "item-card" + (it.Status === STATUS_DONE ? " done" : "");
 
      const overdue = isOverdue(it.DueDate, it.Status);
      const dateLabel = it.DueDate ? formatDate(it.DueDate) : "-";
 
      li.innerHTML = `
        <input type="checkbox" class="item-check" ${it.Status === STATUS_DONE ? "checked" : ""}>
        <div class="item-info">
          <div class="item-subject ${it.Status === STATUS_DONE ? "strike" : ""}">${escapeHtml(it.Subject)}</div>
          <div class="item-meta">
            <span class="badge">${escapeHtml(it.Type || "")}</span>
            <span class="badge ${overdue ? "overdue" : ""}">📅 ${dateLabel}${overdue ? " (เลยกำหนด)" : ""}</span>
          </div>
          ${it.Note ? `<div class="item-note">${escapeHtml(it.Note)}</div>` : ""}
        </div>
        <button class="delete-btn" title="ลบรายการ">ลบ</button>
      `;
 
      li.querySelector(".item-check").addEventListener("change", (e) => {
        toggleStatus(it.ID, e.target.checked);
      });
      li.querySelector(".delete-btn").addEventListener("click", () => {
        removeItem(it.ID);
      });
 
      el.itemList.appendChild(li);
    });
 
  updateSummary();
}
 
function updateSummary() {
  const total = items.length;
  const done = items.filter((it) => it.Status === STATUS_DONE).length;
  const percent = total === 0 ? 0 : Math.round((done / total) * 100);
 
  el.totalCount.textContent = total;
  el.doneCount.textContent = done;
  el.progressFill.style.width = percent + "%";
  el.progressPercent.textContent = percent + "%";
}
 
function formatDate(dateStr) {
  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr;
  return d.toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" });
}
 
function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str ?? "";
  return div.innerHTML;
}
 
// ---------- Actions ----------
 
async function loadItems() {
  el.loading.style.display = "block";
  try {
    items = await apiRead();
  } catch (err) {
    alert("โหลดข้อมูลไม่สำเร็จ: " + err.message);
  } finally {
    el.loading.style.display = "none";
    render();
  }
}
 
async function toggleStatus(id, checked) {
  const newStatus = checked ? STATUS_DONE : STATUS_PENDING;
  // อัปเดตหน้าจอทันที (optimistic update)
  const target = items.find((it) => it.ID === id);
  if (target) target.Status = newStatus;
  render();
  try {
    await apiUpdate(id, { status: newStatus });
  } catch (err) {
    alert("อัปเดตสถานะไม่สำเร็จ: " + err.message);
    loadItems();
  }
}
 
async function removeItem(id) {
  if (!confirm("ต้องการลบรายการนี้ใช่หรือไม่?")) return;
  try {
    await apiDelete(id);
    items = items.filter((it) => it.ID !== id);
    render();
  } catch (err) {
    alert("ลบไม่สำเร็จ: " + err.message);
  }
}
 
el.form.addEventListener("submit", async (e) => {
  e.preventDefault();
  el.submitBtn.disabled = true;
  el.submitBtn.textContent = "กำลังบันทึก...";
 
  const payload = {
    subject: el.subject.value.trim(),
    type: el.type.value,
    dueDate: el.dueDate.value,
    status: STATUS_PENDING,
    note: el.note.value.trim(),
  };
 
  try {
    await apiCreate(payload);
    el.form.reset();
    await loadItems();
  } catch (err) {
    alert("เพิ่มรายการไม่สำเร็จ: " + err.message);
  } finally {
    el.submitBtn.disabled = false;
    el.submitBtn.textContent = "➕ เพิ่มรายการ";
  }
});
 
el.filterBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    el.filterBtns.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    currentFilter = btn.dataset.filter;
    render();
  });
});
 
// ---------- Init ----------
loadItems();
 