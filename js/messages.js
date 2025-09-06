import { supabase } from './supabaseClient.js';

let currentUser = null;
let subscribed = false;
let channel = null;

const textbox = document.getElementById('textbox');
const button = document.getElementById('sendbutton');
const container = document.getElementById("viewport");

async function ensureUsername(user) {
  const { data: userRow } = await supabase
    .from("users")
    .select("username")
    .eq("id", user.id)
    .single();

  if (!userRow) {
    const username = prompt("Pick a username:") || "user";
    const { error } = await supabase.from("users").insert({
      id: user.id,
      username,
    });
    if (error) console.error("Insert user failed:", error);

    currentUser.user_metadata = { ...currentUser.user_metadata, custom_username: username };
  } else {
    currentUser.user_metadata = { ...currentUser.user_metadata, custom_username: userRow.username };
  }
}

function subscribeToMessages() {
  if (subscribed) return;
  channel = supabase
    .channel('public:messages')
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'messages',
    }, payload => displayMessage(payload.new))
    .subscribe();
  subscribed = true;
}

async function getCurrentUser() {
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    console.error("Session fetch failed:", error);
    return null;
  }
  return data.session?.user || null;
}

supabase.auth.onAuthStateChange((_event, session) => {
  currentUser = session?.user || null;
  if (currentUser) {
    signedinUI();
  } else {
	if (channel) {
      channel.unsubscribe();
      channel = null;
      subscribed = false;
    }
    signedoutUI();
  }
});

document.addEventListener("DOMContentLoaded", async () => {
  // Block until session result is known
  currentUser = await getCurrentUser();
  await loadTotalCount();

  if (currentUser) {
    await ensureUsername(currentUser);
    loadMessages();
    subscribeToMessages();
    signedinUI();
  } else {
    signedoutUI();
  }
});


async function add() {
  const content = textbox.value.trim();
  if (content.length < 5 || content.length > 50) {
    alert("Message must be between 5 and 50 characters.");
    return;
  }
  if (!currentUser) {
    alert("Please sign in.");
    return;
  }

  const { error } = await supabase.from("messages").insert({
    content,
    user_id: currentUser.id,
    username: currentUser.user_metadata?.custom_username || "anon-user"
  });

  if (error) console.error("Insert failed:", error);
  textbox.value = "";
  await loadTotalCount();
}

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

async function loadTotalCount() {
  const { data, error } = await supabase
    .from("stats")
    .select("total_messages")
    .eq("id", 1)
    .single();

  if (error) {
    console.error("Failed to load total:", error);
    return;
  }

  document.getElementById("totalCounter").textContent =
    `Total messages sent: ${data.total_messages}`;
}

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

function signedinUI() {
  const loginBtn = document.getElementById("login");
  const logoutBtn = document.getElementById("logout");
  const app = document.getElementById("portal");
  
  loginBtn.style.display = "none";
  logoutBtn.style.display = "inline-block";
  app.style.display = "block";
}

function signedoutUI() {
  const loginBtn = document.getElementById("login");
  const logoutBtn = document.getElementById("logout");
  const app = document.getElementById("portal");

  loginBtn.style.display = "inline-block";
  logoutBtn.style.display = "none";
  app.style.display = "none";
}

function loadingUI() {
  const loginBtn = document.getElementById("login");
  const logoutBtn = document.getElementById("logout");
  const app = document.getElementById("portal");

  loginBtn.style.display = "none";
  logoutBtn.style.display = "none";
  app.style.display = "none";
}

async function cleanupOldMessages() {
  const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString();
  
  const { error } = await supabase
    .from("messages")
    .delete()
    .lt("created_at", twelveHoursAgo);

  if (error) console.error("Cleanup error:", error);
  //else console.log("Old messages cleaned up!");
}

textbox.addEventListener("keypress", e => {
  if (e.key === "Enter") add();
});
button.addEventListener("click", add);

cleanupOldMessages();