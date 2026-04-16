const tabs = Array.from(document.querySelectorAll('.role-tab'));
const panels = {
  patient: document.getElementById('role-patient'),
  pharmacist: document.getElementById('role-pharmacist'),
  driver: document.getElementById('role-driver'),
  admin: document.getElementById('role-admin'),
};

function setActiveRole(role) {
  tabs.forEach((tab) => tab.classList.toggle('active', tab.dataset.role === role));
  Object.entries(panels).forEach(([key, panel]) => {
    if (!panel) return;
    panel.classList.toggle('active', key === role);
  });
}

tabs.forEach((tab) => {
  tab.addEventListener('click', () => setActiveRole(tab.dataset.role));
});

if (window.lucide) {
  window.lucide.createIcons();
}
