import { invokeLLM } from "./server/_core/llm.js";

async function test() {
  try {
    console.log("Testing LLM invocation...");
    const response = await invokeLLM({
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        { role: "user", content: "Say 'test successful'" }
      ]
    });
    
    console.log("LLM Response:", response.choices[0].message.content);
    console.log("✅ LLM is working!");
  } catch (error) {
    console.error("❌ LLM Error:", error.message);
    console.error(error);
  }
}

test();
