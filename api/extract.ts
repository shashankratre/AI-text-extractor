
import { GoogleGenAI } from '@google/genai';

// Vercel specific configuration
export const config = {
  runtime: 'edge',
};

// This is the main function that runs when a request comes to /api/extract
export default async function handler(request: Request) {
  // Only allow POST requests
  if (request.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  try {
    // Get the data sent from the frontend
    const { imageParts, prompt } = await request.json();

    // Get the secret API key from Vercel's environment variables
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      return new Response('API key not configured on the server.', { status: 500 });
    }
    
    // Initialize the Google AI client with the secret key
    const ai = new GoogleGenAI({ apiKey, vertexai: true });

    // Call the real Google Gemini API
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { role: 'user', parts: [{ text: prompt }, ...imageParts] },
    });

    // Send the result back to the frontend
    return new Response(JSON.stringify({ text: response.text }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in serverless function:', error);
    return new Response('An error occurred on the server.', { status: 500 });
  }
}
