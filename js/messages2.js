import { supabase } from './supabaseClient.js';

let currentUser = null;

// DOM elements
const textbox = document.getElementById('textbox');
const button = document.getElementById('sendbutton');
const container = document.getElementById("viewport");

async function ensureUsername(user) {
  // Get the user row from your users table
  let { data: userRow, error } = await supabase
    .from("users")
    .select("username")
    .eq("id", user.id)
    .single();

  // If the user doesn't exist, create them
  if (!userRow) {
    const username = prompt("Pick a username:") || "unlogged-user";
    const { error: insertError } = await supabase.from("users").insert({
      id: user.id,
      username,
    });
    if (insertError) console.error("Failed to insert user:", insertError);

    // Update user_metadata so currentUser always has it
    currentUser.user_metadata = currentUser.user_metadata || {};
    currentUser.user_metadata.custom_username = username;
  } else {
    // Load existing username into currentUser for seamless access
    currentUser.user_metadata = currentUser.user_metadata || {};
    currentUser.user_metadata.custom_username = userRow.username;
  }
}

function subscribeToMessages() {
  supabase
    .channel('public:messages')
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'messages',
    }, payload => displayMessage(payload.new))
    .subscribe();
}

// Auth state listener
supabase.auth.onAuthStateChange(async (_event, session) => {
  currentUser = session?.user || null;
  if (currentUser) {
    await ensureUsername(currentUser);
    loadMessages();
    subscribeToMessages();
  }
  updateUI();
});

// Manual session check on page load
document.addEventListener("DOMContentLoaded", async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    currentUser = user;
    if (currentUser) {
      await ensureUsername(currentUser);
      loadMessages();
      subscribeToMessages();
    }
  } catch (err) {
    console.error("Error restoring session:", err);
  } finally {
    updateUI(); // always update UI, even if session fails
  }
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
  const username = currentUser.user_metadata?.custom_username || "unlogged-user";

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
/*
supabase
  .channel('public:messages')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'messages',
  }, payload => {
    displayMessage(payload.new);
    console.log("payload new message:", payload);
  })
  .subscribe();
*/
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

// Call it when user logs in or page loads
cleanupOldMessages();

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