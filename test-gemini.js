const { google } = require('@ai-sdk/google');
const { generateText } = require('ai');

async function main() {
  try {
    const { text } = await generateText({
      model: google('gemini-1.5-flash-latest'),
      prompt: 'Hello',
    });
    console.log("SUCCESS:", text);
  } catch (err) {
    console.error("ERROR:", err.message);
  }
}
main();
