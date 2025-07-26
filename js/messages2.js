import { supabase } from './supabaseClient.js';

let currentUser = null;

// DOM elements
const textbox = document.getElementById('textbox');
const button = document.getElementById('sendbutton');
const container = document.getElementById("viewport");

// Auth state listener
supabase.auth.onAuthStateChange(async (_event, session) => {
  currentUser = session?.user || null;
  updateUI();
  if (currentUser) loadMessages();
});

// Manual session check on page load
document.addEventListener("DOMContentLoaded", async () => {
  const { data: { user } } = await supabase.auth.getUser();
  currentUser = user;
  updateUI();
  if (currentUser) loadMessages();
});

// Send message
async function add() {
  const content = textbox.value.trim();

  if (content.length < 5 || content.length > 50) {
    alert("Message must be between 5 and 50 characters.");
    return;
  }

  if (!currentUser) {
    alert("Please sign in to send a message.");
    return;
  }

  const user_id = currentUser.id;
  const username = currentUser.user_metadata?.full_name || currentUser.email || "anon";

  const { error } = await supabase.from("messages").insert({
    content,
    user_id,
    username
  });

  if (error) {
    console.error("Insert failed:", error);
    alert("Failed to send message.");
    return;
  }

  textbox.value = "";
  // message will appear via realtime listener
}

// Realtime listener
supabase
  .channel('public:messages')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'messages',
  }, payload => {
    displayMessage(payload.new);
  })
  .subscribe();

// Load existing messages (last 12h)
async function loadMessages() {
  container.innerHTML = "";

  const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .gte("created_at", twelveHoursAgo)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Load error:", error);
    return;
  }

  data.forEach(displayMessage);
}

// Display message in DOM
function displayMessage(msg) {
  const message = document.createElement("div");
  message.classList.add("message");

  if (msg.user_id === currentUser?.id) {
    message.style.backgroundColor = "#ddf";
  }

  message.textContent = `${msg.username}: ${msg.content}`;
  container.appendChild(message);
}

// UI toggle login/logout
function updateUI() {
  const loginBtn = document.getElementById("login");
  const logoutBtn = document.getElementById("logout");
  const app = document.getElementById("portal");

  if (currentUser) {
    loginBtn.style.display = "none";
    logoutBtn.style.display = "inline-block";
    app.style.display = "block";
  } else {
    loginBtn.style.display = "inline-block";
    logoutBtn.style.display = "none";
    app.style.display = "none";
  }
}

// Events
textbox.addEventListener("keypress", e => {
  if (e.key === "Enter") add();
});
button.addEventListener("click", add);