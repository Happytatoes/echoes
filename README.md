# ECHOES 

Write something beautiful. Let it drift away.

A minimalist anonymous message board with ephemeral posts and gentle constraints. Built with vanilla JS and Supabase.

---

## Features

- Google-authenticated users
- Post short messages (5–50 characters)
- Each user gets 50 messages per day
- Messages auto-delete after 12 hours
- Hate speech filter
- Total site messages + visits tracking 

---

## Tech Stack

- **Frontend**: HTML, CSS, JavaScript
- **Backend**: Supabase (auth, DB, hosting)
- **Deploy**: Vercel

---

## Setup

1. **Clone the repo**
   git clone https://github.com/yourusername/echoes.git
   cd echoes

2. Set up Supabase
	Create a project at supabase.com
	Set up a messages table with columns:

	id: UUID (primary key)
	content: text
	username: text
	created_at: timestamp with time zone, default now()

3. Enable Google Auth under Authentication > Providers
	Add your localhost and deployed URL to Redirect URLs
	Configure Supabase
	In supabaseClient.js, set:
	const SUPABASE_URL = "https://your-project.supabase.co";
	const SUPABASE_ANON_KEY = "your-anon-key";

4. Run locally
	Use Live Server or any static server
	Visit http://localhost:5500

5. Deploy
	Push to GitHub
	Go to vercel.com, connect your repo
	Add your site URL to Supabase's Redirect URLs

## In Progress
 Rate-limit by user (50/day)
 Display total message + visit count
 Add hate speech filter
 Responsive design polish

## Philosophy
Ephemeral, anonymous-ish expression. Not for hate. Not for clout. Just passing thoughts in the wind.

## License
MIT
