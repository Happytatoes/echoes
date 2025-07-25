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

async function checkLogin() {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session) {
    const email = session.user.email;
    let username = localStorage.getItem("username");

    if (!username) {
      username = prompt("Pick a username (this will show next to your posts):");
      localStorage.setItem("username", username);
    }

    loginBtn.style.display = "none";
    logoutBtn.style.display = "inline-block";
    document.body.classList.add("logged-in");
  } else {
    loginBtn.style.display = "inline-block";
    logoutBtn.style.display = "none";
    document.body.classList.remove("logged-in");
  }
}