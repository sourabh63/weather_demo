# Minimal AI Agent Demo (Weather Agent)

This is a demonstration of a minimal, "tool-calling" AI agent. The agent uses the **Cerebras AI API** to decide whether to answer a question normally or execute a "Weather Tool" to retrieve simulated weather data. 

It is built with a **Python FastAPI** backend and a beautiful, vanilla **HTML/CSS/JS** frontend.

## Project Structure

```text
.
├── backend/
│   ├── main.py              # FastAPI server and Agent Logic
│   ├── requirements.txt     # Python dependencies
│   ├── .env                 # (Create this) API keys
│   └── Dockerfile           # Backend container setup
├── frontend/
│   ├── index.html           # Chat UI
│   ├── style.css            # UI Styling
│   ├── app.js               # Frontend chat logic
│   ├── nginx.conf           # Nginx routing configuration
│   └── Dockerfile           # Frontend container setup
├── docker-compose.yml       # Production deployment configuration
└── README.md                # This file
```

## Setup & Configuration

1. **Clone the repository** to your local machine or Ubuntu server.
2. **Create the `.env` file** in the `backend/` directory:
   ```bash
   echo 'CEREBRAS_API_KEY="your_cerebras_api_key_here"' > backend/.env
   ```

## Local Testing (No Docker Required)

If you just want to run the code locally on Windows/Mac without Docker:

1. Open a terminal and navigate to the `backend` folder.
2. Install the required Python packages:
   ```bash
   pip install -r requirements.txt
   ```
3. Start the FastAPI server:
   ```bash
   uvicorn main:app --host localhost --port 8081
   ```
4. Open your web browser and navigate to:
   **http://localhost:8081**
   
   *(The FastAPI backend automatically serves the frontend static files!)*

## Production Deployment (Ubuntu via Docker Compose)

When you are ready to deploy this to a live server (e.g., Ubuntu), Docker Compose will handle spinning up both the backend and an Nginx reverse-proxy for the frontend.

1. SSH into your server and clone the repository.
2. Ensure you have created the `backend/.env` file with your API key.
3. Run the following command from the root of the project:
   ```bash
   sudo docker compose up --build -d
   ```
4. The application will now be running on port `80` (HTTP). You can access it by navigating to your server's public IP address in a browser.

## Customization

- **Changing the Model:** The agent is currently configured to use `gpt-oss-120b` via the Cerebras API. You can change this in `backend/main.py`.
- **Modifying the Tool:** The `get_weather` function in `backend/main.py` is currently returning mocked data. You can easily connect this to a real API like OpenWeatherMap.
