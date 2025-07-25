import { supabase } from './supabaseClient.js';

//all stuff for adding
const textbox = document.getElementById('textbox'); 
const button = document.getElementById('sendbutton');
const container = document.getElementById("viewport");

async function add() {
   
	const textboxContent = textbox.value.trim();

	//between 5 and 50 characters
	if (textboxContent.length < 5 || textboxContent.length > 50) {
		alert("Message must be between 5 and 50 characters.");
		return;
	}

	//something
	const { data: { user } } = await supabase.auth.getUser();
	if (!user) {
		alert("Please sign in to send a message.");
		return;
	}

	const username = user.user_metadata?.full_name || "anon";

	const { error } = await supabase.from("messages").insert([
		{
			content: textboxContent,
			username: username,
		}
	]);

	if (error) {
		console.error("Supabase insert error:", error.message);
		alert("Failed to send message.");
		return;
	}

	const message = document.createElement("div");
    message.classList.add("message");
    message.textContent = textboxContent;
	container.appendChild(message);
    textbox.value = "";
}

// load messages 
async function loadMessages() {
	const { data, error } = await supabase
		.from("messages")
		.select("*")
		.order("created_at", { ascending: false })
		.limit(100);

	if (error) {
		alert("Could not load messages. Try again later.");
		console.error("Error fetching messages:", error);
		return;
	}

	data.reverse().forEach(msg => {
		const message = document.createElement("div");
		message.classList.add("message");

		if (msg.username === user?.user_metadata?.full_name) {
			message.style.backgroundColor = "#ddf"; // Own messages different color
		}

		message.textContent = msg.content;
		container.appendChild(message);
	});
}

//times stuff
const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString();

const { data, error } = await supabase
	.from("messages")
	.select("*")
	.gte("created_at", twelveHoursAgo)
	.order("created_at", { ascending: false });


//login 
const loginButton = document.getElementById("login");
const logoutButton = document.getElementById("logout");
const appContainer = document.getElementById("portal");

supabase.auth.onAuthStateChange(async (event, session) => {
  if (session) {
    loginButton.style.display = "none";
    logoutButton.style.display = "inline-block";
    appContainer.style.display = "block";
  } else {
    loginButton.style.display = "inline-block";
    logoutButton.style.display = "none";
    appContainer.style.display = "none";
  }
});


//event listeners
document.addEventListener("DOMContentLoaded", loadMessages);

textbox.addEventListener("keypress", function (e) {
    if (e.key === "Enter") {
        add();
    }
});

button.addEventListener("click", add);



