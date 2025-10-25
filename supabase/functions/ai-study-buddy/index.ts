import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, contextType, roomMessages, sharedNotes } = await req.json();
    
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY not configured');
    }

    // Build context based on type
    let systemPrompt = "You are an AI Study Buddy helping students learn together. Be concise, encouraging, and educational.";
    let contextInfo = "";

    if (contextType === 'summary' && roomMessages?.length > 0) {
      const recentMessages = roomMessages.slice(-10).map((m: any) => 
        `${m.user_name}: ${m.message}`
      ).join('\n');
      contextInfo = `Recent discussion:\n${recentMessages}\n\n`;
      systemPrompt += " Summarize the recent discussion and highlight key learning points.";
    } else if (contextType === 'explanation') {
      systemPrompt += " Provide a clear, educational explanation suitable for students.";
    } else if (sharedNotes?.length > 0) {
      const notesContext = sharedNotes.slice(0, 3).map((n: any) => 
        `Note: ${n.title}\n${n.summary || n.original_content?.substring(0, 200)}`
      ).join('\n\n');
      contextInfo = `Relevant study materials:\n${notesContext}\n\n`;
      systemPrompt += " Use the study materials as context to help answer the question.";
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `${systemPrompt}\n\n${contextInfo}User question: ${message}`
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 500,
          }
        })
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.statusText}`);
    }

    const data = await response.json();
    const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || "I couldn't generate a response. Please try again.";

    return new Response(
      JSON.stringify({ response: aiResponse }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'An error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
