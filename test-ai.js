const { streamText } = require('ai');
const { google } = require('@ai-sdk/google');
require('dotenv').config({ path: '.env.local' });

async function main() {
  try {
    const result = streamText({
      model: google('gemini-1.5-flash'),
      messages: [{ role: 'user', content: 'hy' }]
    });
    console.log("streamText returned successfully");
    console.log(typeof result.toDataStreamResponse === 'function' ? 'Has toDataStreamResponse' : 'Missing toDataStreamResponse');
  } catch (err) {
    console.error("Error:", err);
  }
}
main();
