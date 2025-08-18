import { supabase } from './supabaseClient.js';

const loginBtn = document.getElementById("login");
const logoutBtn = document.getElementById("logout");

loginBtn.addEventListener("click", async () => {
  const { error } = await supabase.auth.signInWithOAuth({
	provider: 'google',
  });

  if (error) console.error('Login error:', error);
});

logoutBtn.addEventListener("click", async () => {
  await supabase.auth.signOut();
  localStorage.removeItem("username");
  window.location.reload();
});

// Check session on load
checkLogin();

async function storeUsername(session) {
  const user_id = session.user.id;
  let username = localStorage.getItem("username");
  
  username = prompt("Pick a username (this will show next to your posts):");
  localStorage.setItem("username", username);

  // Upsert the username into the users table
  const { data, error } = await supabase
	.from("users")
	.upsert({ id: user_id, username: username })
	.select();

  if (error) {
	console.error("Error storing username:", error);
  } else {
	console.log("Username stored/updated:", data);
  }
}

async function checkLogin() {
  const {
	data: { session },
  } = await supabase.auth.getSession();

  if (session) {
	await storeUsername(session);  // <-- call your upsert logic here

	loginBtn.style.display = "none";
	logoutBtn.style.display = "inline-block";
	document.body.classList.add("logged-in");
  } else {
	loginBtn.style.display = "inline-block";
	logoutBtn.style.display = "none";
	document.body.classList.remove("logged-in");
  }
}