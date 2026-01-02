// Simple static archive app - no auth, no database, just reads from messages.json

const container = document.getElementById("viewport");
const messageCountEl = document.getElementById("subtitle-2");
const archiveDateEl = document.getElementById("archive-date");

async function loadArchivedMessages() {
  try {
    // Fetch the exported messages
    const response = await fetch('./messages.json');
    const data = await response.json();
    
    // Clear loading message
    container.innerHTML = "";
    
    // Update total count
    messageCountEl.textContent = `Total messages sent: ${data.totalMessages}`;
    
    // Update archive date
    const exportDate = new Date(data.exportDate);
    archiveDateEl.textContent = exportDate.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    
    // Display all messages
    data.messages.forEach((msg, index) => {
      // Stagger the animation slightly for a nice effect
      setTimeout(() => displayMessage(msg), index * 20);
    });
    
    // Scroll to bottom after all messages load
    setTimeout(() => {
      container.scrollTop = container.scrollHeight;
    }, data.messages.length * 20 + 100);
    
  } catch (error) {
    console.error("Failed to load archived messages:", error);
    container.innerHTML = '<div class="loading-message" style="color: #ffcccc;">Failed to load archived messages. Please refresh the page.</div>';
  }
}

function displayMessage(msg) {
  const message = document.createElement("div");
  message.classList.add("message");
  message.textContent = `${msg.username}: ${msg.content}`;
  container.appendChild(message);
}

// Load messages on page load
loadArchivedMessages();