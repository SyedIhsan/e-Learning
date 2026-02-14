document.addEventListener('DOMContentLoaded', () => {
  if (SDC_ADMIN.isAuthed()) {
    location.replace('dashboard.html');
    return;
  }

  const next = new URLSearchParams(location.search).get('next') || 'dashboard.html';

  document.getElementById('loginForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const u = document.getElementById('username').value.trim();
    const p = document.getElementById('password').value;

    const ok = (u === 'admin' && p === 'admin') || (u === 'demo' && p === 'demo');
    if (!ok) {
      const box = document.getElementById('loginError');
      box.textContent = 'Invalid credentials.';
      box.classList.remove('hidden');
      return;
    }

    SDC_ADMIN.login(u);
    location.replace(next);
  });
});