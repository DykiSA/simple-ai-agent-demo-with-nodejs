// index.js
import * as dotenv from "dotenv";
import express, { json } from "express";
import fetch from "node-fetch";
import { system } from "./prompts.js";
import * as tools from "./tools.js";

dotenv.config();

const app = express();
app.use(json());

const LLM_API_URL = process.env.LLM_API_URL;
const LLM_MODEL = process.env.LLM_MODEL;

const TOOL_PROVIDERS = [
  {
    type: "function",
    function: {
      name: "searchOrder",
      description: "Look up an order by ID",
      parameters: {
        type: "object",
        properties: {
          orderId: { type: "string" },
        },
        required: ["orderId"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "calculatePrice",
      description: "Calculate subtotal, tax and total for list of items",
      parameters: {
        type: "object",
        properties: {
          items: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                qty: { type: "number" },
                price: { type: "number" },
              },
            },
          },
        },
        required: ["items"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "logUserAction",
      description: "Log a user action",
      parameters: {
        type: "object",
        properties: {
          userid: { type: "string" },
          action: { type: "string" },
        },
        required: ["userid", "action"],
      },
    },
  },
];

async function callLLM(messages, functions = null) {
  const endpoint = "/api/chat";
  const body = {
    model: LLM_MODEL,
    messages,
    stream: false,
  };
  if (functions) {
    body.tools = functions;
  }

  console.log("calling LLM with body:", body);
  const r = await fetch(LLM_API_URL + endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  console.log("LLM response:", r);
  if (!r.ok) {
    throw new Error(`LLM error: ${r.status}`);
  }
  return r.json();
}

app.post("/chat", async (req, res) => {
  try {
    const userMessage = req.body.message;
    if (!userMessage) return res.status(400).json({ error: "no message" });

    // 1st call: provide system + user
    const messages = [
      { role: "system", content: system },
      { role: "user", content: userMessage },
    ];

    const llmResp = await callLLM(messages, TOOL_PROVIDERS);
    console.log("Response body:", llmResp);
    const msg = llmResp.message;
    let tool_calls;
    // sometimes ollama doesn't return tool_calls in the response
    if (!msg.tool_calls && msg.content) {
      console.log(
        "No `tool_calls` property in response, trying to parse content"
      );
      // try to parse the content as tool_calls content
      try {
        tool_calls = JSON.parse(msg.content);
        console.log("Parsed `tool_calls` property:", tool_calls);
      } catch (e) {
        /* ignore */
      }
    } else {
      console.log("Got `tool_calls` property in response:", msg.tool_calls);
      tool_calls = msg.tool_calls.map((tool_call) => tool_call.function);
    }

    // If LLM asked to call a function
    if (tool_calls) {
      const toolCalls = [],
        toolResultMessages = [];
      let i = 0;
      for (const functionCall of tool_calls) {
        const name = functionCall.name;
        const args = functionCall.arguments;
        console.log("Should call tool:", name, args);
        // Execute the corresponding local tool
        if (!tools[name]) return res.json({ error: "unknown_tool", name });

        console.log("Calling tool:", name);
        const toolResult = await tools[name](args);

        // Stack up the tool calls and results
        toolCalls.push({
          type: "function",
          function: {
            index: i,
            name,
            arguments: args,
          },
        });
        toolResultMessages.push({
          role: "tool",
          tool_name: name,
          content: JSON.stringify(toolResult),
        });
        i++;
      }
      // Send the tool result back to the LLM (so it can finalize the reply)
      const followupMessages = [
        { role: "system", content: system },
        { role: "user", content: userMessage },
        {
          role: "assistant",
          content: null,
          tool_calls: toolCalls,
        },
        ...toolResultMessages,
      ];

      console.log("Sending followup messages:", followupMessages);
      const finalResp = await callLLM(followupMessages);
      console.log("Final response:", finalResp);
      const finalText = finalResp.message.content;
      return res.json({ final: finalText });
    }

    // Otherwise LLM answered directly
    const directText = msg?.content || "No content from model";
    res.json({ final: directText });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Agent server listening on ${PORT}`));
