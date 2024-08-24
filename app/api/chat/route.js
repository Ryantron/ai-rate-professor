import OpenAI from 'openai';
import { Pinecone } from '@pinecone-database/pinecone';
import { NextResponse } from 'next/server';
import { encode } from 'sentence-transformers'; // Import the sentence-transformers encoding function

// Configure OpenAI client with base URL and API key
const openai = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY, // Use environment variable for API key
});

// System prompt for the AI, providing guidelines on how to respond to users
const systemPrompt = 'You are a helpful customer support assistant';

// POST function to handle incoming requests
export async function POST(req) {
  // Parse the JSON body of the incoming request
  const data = await req.json();

  const pc = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY,
  });
  const index = pc.index('rag').namespace('ns1');

  // Get the text from the latest message in the conversation
  const text = data[data.length - 1].content;

  // Encode the text using the sentence-transformers model
  const embedding = encode(text, 'sentence-transformers/all-MiniLM-L6-v2'); 

  // Query Pinecone with the generated embedding
  const results = await index.query({
    topK: 5,
    includeMetadata: true,
    vector: embedding, // Pass the embedding directly
  });

  let resultString = '';
  results.matches.forEach((match) => {
    resultString += `
      Returned Results:
      Professor: ${match.id}
      Review: ${match.metadata.review}
      Subject: ${match.metadata.subject}
      Stars: ${match.metadata.stars}
      \n\n`;
  });

  const lastMessage = data[data.length - 1];
  const lastMessageContent = lastMessage.content + resultString;
  const lastDataWithoutLastMessage = data.slice(0, data.length - 1);

  // Create a chat completion request to the OpenAI API
  const completion = await openai.chat.completions.create({
    messages: [
      { role: 'system', content: systemPrompt },
      ...lastDataWithoutLastMessage,
      { role: 'user', content: lastMessageContent },
    ],
    model: 'meta-llama/llama-3.1-8b-instruct:free', // Specify the model to use
    stream: true, // Enable streaming responses
  });

  // Create a ReadableStream to handle the streaming response
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder(); // Create a TextEncoder to convert strings to Uint8Array
      try {
        // Iterate over the streamed chunks of the response
        for await (const chunk of completion) {
          const content = chunk.choices[0]?.delta?.content; // Extract the content from the chunk
          if (content) {
            const text = encoder.encode(content); // Encode the content to Uint8Array
            controller.enqueue(text); // Enqueue the encoded text to the stream
          }
        }
      } catch (err) {
        controller.error(err); // Handle any errors that occur during streaming
      } finally {
        controller.close(); // Close the stream when done
      }
    },
  });

  return new NextResponse(stream); // Return the stream as the response
}
