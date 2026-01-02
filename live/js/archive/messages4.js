//old functions

/* OLD
document.addEventListener("DOMContentLoaded", async () => {
  // restore session on first load
  const { data: { session } } = await supabase.auth.getSession();
  currentUser = session?.user || null;

  if (currentUser) {
	await ensureUsername(currentUser);
	loadMessages();
	subscribeToMessages();
	signedinUI();
  }
  else if(!currentUser) {
	//signedoutUI();
  }
 
});
*/

/* OLD
supabase.auth.onAuthStateChange(async (_event, session) => {
  currentUser = session?.user || null;

  if (currentUser) {
    await ensureUsername(currentUser);
    subscribeToMessages();
	signedinUI();
  } else {
    if (channel) {
      channel.unsubscribe();
      channel = null;
      subscribed = false;
	  signedoutUI();
    }
    container.innerHTML = "";
  }

});
*/