import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
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
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${LOVABLE_API_KEY}`
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: `${contextInfo}${message}` }
          ],
          temperature: 0.7,
          max_tokens: 500,
        })
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        console.error('Rate limit exceeded');
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        console.error('Payment required');
        return new Response(
          JSON.stringify({ error: "AI credits depleted. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      throw new Error(`AI Gateway error: ${response.statusText}`);
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content || "I couldn't generate a response. Please try again.";

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
