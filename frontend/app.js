const chatBox = document.getElementById('chat-box');
const userInput = document.getElementById('user-input');

userInput.addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
        sendMessage();
    }
});

async function sendMessage() {
    const text = userInput.value.trim();
    if (!text) return;

    // Add user message to UI
    appendMessage('user', text);
    userInput.value = '';

    // Add loading indicator
    const loadingId = appendLoading();

    try {
        // Send request to backend
        // Since we are testing via CMD locally without Docker, we will call localhost:8000
        // When deployed with Docker, nginx will route /api/chat to the backend.
        // We'll try the relative /api/chat first, fallback to localhost:8000/api/chat if it fails (CORS allowed).
        
        let url = '/api/chat';
        // Check if we are running from file:// or direct localhost without proxy
        if (window.location.protocol === 'file:' || window.location.port === '5500') {
            url = 'http://localhost:8081/api/chat';
        }

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ message: text })
        });

        const data = await response.json();
        
        removeLoading(loadingId);

        if (data.reply === "Sorry, I had an issue connecting to the AI." && data.debug) {
            const errorMsg = data.debug.error ? data.debug.error.message : JSON.stringify(data.debug);
            appendMessage('ai', `Sorry, I had an issue connecting to the AI. Error: <strong>${errorMsg}</strong>`, true);
        } else if (data.tool_used) {
            const toolMsg = `<div class="tool-badge"><i class="fa-solid fa-wrench"></i> Used Tool: ${data.tool_used} (${JSON.stringify(data.tool_args)})</div>${data.reply}`;
            appendMessage('ai', toolMsg, true);
        } else {
            appendMessage('ai', data.reply);
        }

    } catch (error) {
        removeLoading(loadingId);
        appendMessage('ai', 'Sorry, I encountered an error. Is the backend running?');
        console.error(error);
    }
}

function appendMessage(role, content, isHtml = false) {
    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${role}-message`;

    const avatar = document.createElement('div');
    avatar.className = 'avatar';
    avatar.innerHTML = role === 'user' ? '<i class="fa-solid fa-user"></i>' : '<i class="fa-solid fa-robot"></i>';

    const contentDiv = document.createElement('div');
    contentDiv.className = 'content';
    
    if (isHtml) {
        contentDiv.innerHTML = content;
    } else {
        contentDiv.textContent = content;
    }

    msgDiv.appendChild(avatar);
    msgDiv.appendChild(contentDiv);
    chatBox.appendChild(msgDiv);

    chatBox.scrollTop = chatBox.scrollHeight;
}

function appendLoading() {
    const id = 'loading-' + Date.now();
    const msgDiv = document.createElement('div');
    msgDiv.className = `message ai-message`;
    msgDiv.id = id;

    const avatar = document.createElement('div');
    avatar.className = 'avatar';
    avatar.innerHTML = '<i class="fa-solid fa-robot"></i>';

    const contentDiv = document.createElement('div');
    contentDiv.className = 'content';
    contentDiv.innerHTML = `
        <div class="typing-indicator">
            <div class="dot"></div>
            <div class="dot"></div>
            <div class="dot"></div>
        </div>
    `;

    msgDiv.appendChild(avatar);
    msgDiv.appendChild(contentDiv);
    chatBox.appendChild(msgDiv);

    chatBox.scrollTop = chatBox.scrollHeight;
    return id;
}

function removeLoading(id) {
    const el = document.getElementById(id);
    if (el) el.remove();
}
