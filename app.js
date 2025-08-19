// Simple Fishing Reminder (localStorage + Notification API)
// Reminders are checked every 30s. Works as a static page.

const form = document.getElementById('reminder-form');
const listEl = document.getElementById('list');
const notifyBtn = document.getElementById('notify-btn');

const STORAGE_KEY = 'fishing_reminders_v1';

function loadReminders() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function saveReminders(reminders) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(reminders));
}

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

function render() {
  const reminders = loadReminders().sort((a, b) => new Date(a.when) - new Date(b.when));
  listEl.innerHTML = '';
  if (!reminders.length) {
    const li = document.createElement('li');
    li.className = 'muted';
    li.textContent = 'No reminders yet.';
    listEl.appendChild(li);
    return;
  }

  reminders.forEach(r => {
    const li = document.createElement('li');
    li.className = 'item';

    const row = document.createElement('div');
    row.className = 'row';

    const title = document.createElement('strong');
    title.textContent = r.title;

    const badge = document.createElement('span');
    badge.className = 'badge small';
    const d = new Date(r.when);
    badge.textContent = d.toLocaleString();

    row.appendChild(title);
    row.appendChild(badge);

    const notes = document.createElement('div');
    notes.className = 'muted small';
    notes.textContent = r.notes || '';

    const actions = document.createElement('div');
    actions.className = 'actions';

    const del = document.createElement('button');
    del.type = 'button';
    del.textContent = 'Delete';
    del.onclick = () => {
      const rest = loadReminders().filter(x => x.id !== r.id);
      saveReminders(rest);
      render();
    };

    const test = document.createElement('button');
    test.type = 'button';
    test.textContent = 'Test Notify';
    test.onclick = () => notify(r.title, r.notes);

    actions.appendChild(test);
    actions.appendChild(del);

    li.appendChild(row);
    if (r.notes) li.appendChild(notes);
    li.appendChild(actions);

    listEl.appendChild(li);
  });
}

function notify(title, body) {
  if (!('Notification' in window)) return alert('Notifications not supported in this browser.');
  if (Notification.permission === 'granted') {
    new Notification(title || 'Fishing Reminder', { body: body || 'It is time!', tag: 'fishing-reminder' });
  } else if (Notification.permission !== 'denied') {
    Notification.requestPermission().then(p => {
      if (p === 'granted') notify(title, body);
    });
  }
}

function tick() {
  const reminders = loadReminders();
  const now = Date.now();
  let changed = false;

  reminders.forEach(r => {
    const t = new Date(r.when).getTime();
    if (!r.fired && t <= now) {
      notify(r.title, r.notes || 'Time to go fishing!');
      r.fired = true;
      changed = true;
    }
  });

  if (changed) saveReminders(reminders);
}

form.addEventListener('submit', e => {
  e.preventDefault();
  const title = document.getElementById('title').value.trim();
  const when = document.getElementById('when').value;
  const notes = document.getElementById('notes').value.trim();

  if (!title || !when) return;

  const reminders = loadReminders();
  reminders.push({ id: uid(), title, when, notes, fired: false });
  saveReminders(reminders);

  form.reset();
  render();
});

notifyBtn.addEventListener('click', () => {
  if (!('Notification' in window)) return alert('Notifications not supported.');
  Notification.requestPermission().then(p => {
    if (p === 'granted') alert('Notifications enabled!');
    else alert('Permission not granted.');
  });
});

// Start
render();
setInterval(tick, 30000); // check every 30s
