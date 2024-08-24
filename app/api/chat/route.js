import OpenAI from "openai";
import { Pinecone } from "@pinecone-database/pinecone";
import fetch from "node-fetch";
import { NextResponse } from "next/server";
const MODEL = "sentence-transformers/all-mpnet-base-v2";
const HUGGINGFACE_API_TOKEN = process.env.HUGGINGFACE_API_TOKEN;

// Configure OpenAI client with base URL and API key
const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY, // Use environment variable for API key
});

const pc = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY,
});
const index = pc.index("rag").namespace("ns1");

// System prompt for the AI, providing guidelines on how to respond to users
const systemPrompt = `You are an intelligent assistant for the RateMyProfessor system. Your primary role is to help students find the best professors based on their specific queries. Using the Retrieval-Augmented Generation (RAG) approach, you will retrieve relevant information about professors and generate responses to student questions.

### Instructions:

1. **Retrieve Relevant Information:**
- Given a student's query, use the RAG model to search and retrieve relevant information from the database of professors and their reviews.
- Ensure that the information retrieved is pertinent to the student's query.

2. **Generate Response:**
- Only respond to queries related to professors. If the student asks about professors, select the top 3 professors who best match the student's criteria.
- For each selected professor, provide a review that includes key details such as their name, department, rating, and notable feedback from students.
- Format the response clearly, listing the top 3 professors in order of relevance to the student's query.

3. **Response Format:**
- **Query:** Repeat the student's query for context.
- **Top 3 Professors of Relevance:**
    1. **Professor Name:** [Name]
        - **Department:** [Department]
        - **Rating:** [Rating]
        - **Review:** [Brief Review of notable feedback]
    2. **Professor Name:** [Name]
        - **Department:** [Department]
        - **Rating:** [Rating]
        - **Review:** [Brief Review of notable feedback]
    3. **Professor Name:** [Name]
        - **Department:** [Department]
        - **Rating:** [Rating]
        - **Review:** [Brief Review of notable feedback]

4. **Quality Assurance:**
- Ensure that the information provided is accurate and relevant to the student's query.
- If multiple professors have similar ratings, choose those with the most positive or detailed feedback.

### Example:

**Query:** "I am looking for a professor in Computer Science who is known for their engaging lectures and clear explanations."

**Top 3 Professors:**
1. **Professor Alice Johnson**
- **Department:** Computer Science
- **Rating:** 4.8/5
- **Review:** Known for interactive lectures and practical examples. Highly recommended for her clarity in teaching complex topics.

2. **Professor Bob Smith**
- **Department:** Computer Science
- **Rating:** 4.7/5
- **Review:** Praised for his engaging teaching style and thorough explanations. Students appreciate his support outside of class.

3. **Professor Carol Davis**
- **Department:** Computer Science
- **Rating:** 4.6/5
- **Review:** Valued for her clear and concise lectures. Students find her approachable and helpful.
`;

// Credit: @preciousmbaekwe at Medium
async function fetchEmbeddingsWithRetry(text, retries = 5) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch(
        `https://api-inference.huggingface.co/pipeline/feature-extraction/${MODEL}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${HUGGINGFACE_API_TOKEN}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ inputs: text }),
        }
      );

      if (!response.ok) {
        const errorBody = await response.text();
        if (response.status === 503) {
          console.warn(`Model is loading, retrying (${attempt}/${retries})...`);
          await new Promise((resolve) => setTimeout(resolve, 2000));
        } else {
          console.error("Error response body:", errorBody);
          throw new Error(`Failed to fetch embeddings: ${response.statusText}`);
        }
      } else {
        return await response.json();
      }
    } catch (error) {
      if (attempt === retries) {
        throw error;
      }
    }
  }
}

// POST function to handle incoming requests
export async function POST(req) {
  // Parse the JSON body of the incoming request
  const data = await req.json();

  // Get the text from the latest message in the conversation
  const text = data[data.length - 1].content;

  // Encode the text using the sentence-transformers model
  const queryEmbedding = await fetchEmbeddingsWithRetry(text);

  // Query Pinecone with the generated embedding
  const results = await index.query({
    topK: 5,
    includeMetadata: true,
    vector: queryEmbedding, // Pass the embedding directly
  });

  let resultString = "";
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
      { role: "system", content: systemPrompt },
      ...lastDataWithoutLastMessage,
      { role: "user", content: lastMessageContent },
    ],
    model: "meta-llama/llama-3.1-8b-instruct:free", // Specify the model to use
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
