# Simple AI Agent Demo with NodeJS

This is a part of my study on learning AI agent development.

## Requirements
1. Ollama (https://ollama.com/) - tested on version 0.13.2
2. NodeJS 16 or later (https://nodejs.org)

## Installation

1. Download and install Ollama (Refer to their official documentation).
2. Pull the model you want to use within your Ollama e.g. `mistral:7b`

```bash
ollama pull mistral:7b
```

3. Make sure the model is fully downloaded. Use this command to see what are models available on your computer:

```bash
ollama list
```

4. Clone or Download this source code.
5. Install required node dependencies:

```bash
npm install
```

## Run Agent

1. Run your Ollama server (again refer to their documentation).
2. Make sure your Ollama is functional.
3. Duplicate `.env.example` file and rename it to `.env`, then edit the `.env` file according to your ollama server host and model you have downloaded in your ollama server.

```.env
LLM_API_URL=http://127.0.0.1:11434
LLM_MODEL=mistral:7b
```

4. Run the server with `npm` command

```bash
npm run dev
```


## Test Agent via HTTP API Request

Open another terminal to run the curl command

```bash
curl -s -X POST http://localhost:3000/chat -H "Content-Type: application/json" -d '{"message":"Calculate the total for items: 2x T-shirt $32, 1x cap $11.\nAlso check my order status for 1001, please"}'
```