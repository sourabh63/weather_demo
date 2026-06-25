import os
import json
import httpx
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

CEREBRAS_API_KEY = os.getenv("CEREBRAS_API_KEY", "")
CEREBRAS_URL = "https://api.cerebras.ai/v1/chat/completions"

class ChatRequest(BaseModel):
    message: str

def get_weather(location: str):
    # Mock weather tool
    return json.dumps({
        "location": location,
        "temperature": "22°C (72°F)",
        "condition": "Sunny with a light breeze",
        "humidity": "45%"
    })

tools = [
    {
        "type": "function",
        "function": {
            "name": "get_weather",
            "description": "Get the current weather in a given location",
            "parameters": {
                "type": "object",
                "properties": {
                    "location": {
                        "type": "string",
                        "description": "The city and state, e.g. San Francisco, CA",
                    }
                },
                "required": ["location"],
            },
        }
    }
]

@app.post("/api/chat")
async def chat(request: ChatRequest):
    messages = [
        {"role": "system", "content": "You are a helpful AI weather agent. Use the provided get_weather tool to answer weather questions. For any non-weather questions, answer conversationally."},
        {"role": "user", "content": request.message}
    ]
    
    async with httpx.AsyncClient() as client:
        # First call to check if tool is needed
        response = await client.post(
            CEREBRAS_URL,
            headers={"Authorization": f"Bearer {CEREBRAS_API_KEY}"},
            json={
                "model": "gpt-oss-120b",
                "messages": messages,
                "tools": tools,
                "tool_choice": "auto"
            },
            timeout=30.0
        )
        
        response_data = response.json()
        
        if "choices" not in response_data:
            return {"reply": "Sorry, I had an issue connecting to the AI.", "debug": response_data}
            
        message = response_data["choices"][0]["message"]
        
        if message.get("tool_calls"):
            # The model wants to call a tool
            tool_call = message["tool_calls"][0]
            function_name = tool_call["function"]["name"]
            arguments = json.loads(tool_call["function"]["arguments"])
            
            if function_name == "get_weather":
                weather_info = get_weather(arguments.get("location"))
                
                # Add model's tool call message
                messages.append(message)
                
                # Add tool response
                messages.append({
                    "role": "tool",
                    "tool_call_id": tool_call["id"],
                    "name": "get_weather",
                    "content": weather_info
                })
                
                # Second call to get the final conversational answer
                second_response = await client.post(
                    CEREBRAS_URL,
                    headers={"Authorization": f"Bearer {CEREBRAS_API_KEY}"},
                    json={
                        "model": "gpt-oss-120b",
                        "messages": messages
                    },
                    timeout=30.0
                )
                
                final_data = second_response.json()
                
                if "choices" not in final_data:
                    return {"reply": "Sorry, I had an issue connecting to the AI.", "debug": final_data}
                    
                return {
                    "reply": final_data["choices"][0]["message"]["content"],
                    "tool_used": "get_weather",
                    "tool_args": arguments
                }
        
        # No tool called
        return {"reply": message.get("content", "I am not sure how to answer that.")}

app.mount("/", StaticFiles(directory="../frontend", html=True), name="frontend")
