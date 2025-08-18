/**
 * handleSession(user)
 * - centralizes all login/logout logic
 * - ensures UI updates only after async work completes
 *
 * Usage:
 * - Call from DOMContentLoaded (initial restore)
 * - Call from supabase.auth.onAuthStateChange (runtime changes)
 */
import { supabase } from './supabaseClient.js';

let currentUser = null;
let subscribed = false;
let channel = null;

/* DOM elems */
const textbox = document.getElementById('textbox');
const button = document.getElementById('sendbutton');
const container = document.getElementById('viewport');
const loginBtn = document.getElementById('login');
const logoutBtn = document.getElementById('logout');
const appEl = document.getElementById('portal');

/* UI helpers */
function loadingUI() {
  loginBtn.style.display = 'none';
  logoutBtn.style.display = 'none';
  appEl.style.display = 'none';
}
function signedinUI() {
  loginBtn.style.display = 'none';
  logoutBtn.style.display = 'inline-block';
  appEl.style.display = 'block';
}
function signedoutUI() {
  loginBtn.style.display = 'inline-block';
  logoutBtn.style.display = 'none';
  appEl.style.display = 'none';
}

/* subscribe guard */
function subscribeToMessages() {
  if (subscribed) return;
  channel = supabase
    .channel('public:messages')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, payload => {
      displayMessage(payload.new);
    })
    .subscribe();
  subscribed = true;
}

function unsubscribeMessages() {
  if (channel) {
    channel.unsubscribe();
    channel = null;
    subscribed = false;
  }
}

/* user/DB helpers */
async function ensureUsernameForUser(user) {
  // returns username (string) or null on error
  try {
    const { data: userRow, error } = await supabase.from('users').select('username').eq('id', user.id).single();
    if (error && error.code !== 'PGRST116') { // ignore missing row
      console.error('ensureUsername select error', error);
      return null;
    }
    if (!userRow) {
      const username = prompt('Pick a username:') || `user-${user.id.slice(0,6)}`;
      const { error: insertErr } = await supabase.from('users').insert({ id: user.id, username });
      if (insertErr) {
        console.error('Failed insert user row', insertErr);
        return null;
      }
      return username;
    }
    return userRow.username;
  } catch (err) {
    console.error('ensureUsername exception', err);
    return null;
  }
}

/* central session handler */
async function handleSession(user) {
  // show neutral/loading state until resolved
  loadingUI();

  // set global user
  currentUser = user || null;

  if (currentUser) {
    // ensure username exists and attach to currentUser (non-blocking failure handled)
    const username = await ensureUsernameForUser(currentUser);
    currentUser.user_metadata = { ...(currentUser.user_metadata || {}), custom_username: username || currentUser.user_metadata?.custom_username };

    // load and subscribe
    await loadMessages();        // safe to await; populates UI
    subscribeToMessages();      // idempotent
    signedinUI();
  } else {
    // logged out: clean up
    unsubscribeMessages();
    container.innerHTML = '';
    signedoutUI();
  }
}

/* startup helper */
async function getCurrentUser() {
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    console.error('getSession error', error);
    return null;
  }
  return data?.session?.user || null;
}

/* DOM ready: restore session and run central handler */
document.addEventListener('DOMContentLoaded', async () => {
  loadingUI();
  const user = await getCurrentUser();
  await handleSession(user);
});

/* single auth state change listener */
supabase.auth.onAuthStateChange(async (_event, session) => {
  const user = session?.user || null;
  await handleSession(user); // ensures all async order + UI correctness
});

/* message functions (unchanged) */
async function add() {
  const content = textbox.value.trim();
  if (content.length < 5 || content.length > 50) { alert('Message must be 5–50 chars'); return; }
  if (!currentUser) { alert('Please sign in.'); return; }
  const { error } = await supabase.from('messages').insert({
    content,
    user_id: currentUser.id,
    username: currentUser.user_metadata?.custom_username || currentUser.email || 'anon'
  });
  if (error) console.error('Insert failed', error);
  textbox.value = '';
}

async function loadMessages() {
  container.innerHTML = '';
  const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase.from('messages').select('*').gte('created_at', twelveHoursAgo).order('created_at', { ascending: true });
  if (error) { console.error('Load error', error); return; }
  data.forEach(displayMessage);
}

function displayMessage(msg) {
  if (document.getElementById(`msg-${msg.id}`)) return;
  const el = document.createElement('div');
  el.className = 'message';
  el.id = `msg-${msg.id}`;
  if (msg.user_id === currentUser?.id) el.style.backgroundColor = '#ddf';
  el.textContent = `${msg.username}: ${msg.content}`;
  container.appendChild(el);
  container.scrollTop = container.scrollHeight;
}

async function cleanupOldMessages() {
  const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString();
  
  const { error } = await supabase
    .from("messages")
    .delete()
    .lt("created_at", twelveHoursAgo);

  if (error) console.error("Cleanup error:", error);
  else console.log("Old messages cleaned up!");
}

cleanupOldMessages();

/* wire UI events */
textbox.addEventListener('keypress', e => { if (e.key === 'Enter') add(); });
button.addEventListener('click', add);