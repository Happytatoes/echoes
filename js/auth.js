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
  const { error } = await supabase.auth.signOut();
  if (error) console.error("Logout error:", error);
});
