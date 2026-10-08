const { streamText } = require('ai');
const { google } = require('@ai-sdk/google');
require('dotenv').config({ path: '.env.local' });

async function main() {
  try {
    const result = streamText({
      model: google('gemini-1.5-flash'),
      messages: [{ role: 'user', content: 'hy' }]
    });
    for await (const chunk of result.textStream) {
      process.stdout.write(chunk);
    }
  } catch (err) {
    console.error("\nCaught Error:", err.message || err);
  }
}
main();
