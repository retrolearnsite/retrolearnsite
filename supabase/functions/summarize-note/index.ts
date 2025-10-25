import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper to log API usage
async function logApiUsage(
  supabase: any,
  functionName: string,
  apiProvider: string,
  apiModel: string,
  isFallback: boolean,
  status: string,
  errorMessage: string | null,
  responseTimeMs: number | null
) {
  try {
    await supabase.from('ai_api_usage').insert({
      function_name: functionName,
      api_provider: apiProvider,
      api_model: apiModel,
      is_fallback: isFallback,
      status,
      error_message: errorMessage,
      response_time_ms: responseTimeMs
    });
  } catch (error) {
    console.error('Failed to log API usage:', error);
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { noteId } = await req.json();

    if (!noteId) {
      throw new Error('Note ID is required');
    }

    console.log('Summarizing note:', noteId);

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          persistSession: false,
        },
      }
    );

    // Get note content
    const { data: note, error: noteError } = await supabaseClient
      .from('notes')
      .select('original_content, title')
      .eq('id', noteId)
      .maybeSingle();

    if (noteError) throw noteError;
    if (!note) {
      throw new Error('Note not found');
    }

    console.log('Note content length:', note.original_content.length);

    // Get API keys
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    const geminiApiKeySecondary = Deno.env.get('GEMINI_API_KEY_SECONDARY');

    if (!geminiApiKey) {
      throw new Error('GEMINI_API_KEY not configured');
    }

    const prompt = `Summarize the following note in exactly 3 concise lines. Be direct and informative:\n\n${note.original_content}`;

    // Helper function to call Gemini
    const callGemini = async (apiKey: string, model: string) => {
      const startTime = Date.now();
      console.log(`Calling Gemini ${model}...`);
      
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [{ text: prompt }]
            }],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 150,
            }
          })
        }
      );
      
      const data = await res.json();
      const responseTime = Date.now() - startTime;
      
      console.log(`Gemini ${model} response status:`, res.status);
      
      return { res, data, responseTime };
    };

    // Try Gemini 2.5 Flash as primary model
    let { res: aiRes, data: aiData, responseTime } = await callGemini(geminiApiKey, 'gemini-2.5-flash');
    let usedModel = 'gemini-2.5-flash';
    
    if (!aiRes.ok) {
      const errorMsg = aiData?.error?.message || 'Unknown error';
      console.error(`Gemini 2.5 Flash error:`, errorMsg);
      
      await logApiUsage(supabaseClient, 'summarize-note', 'gemini', usedModel, false, 'error', errorMsg, responseTime);
      
      const status = aiRes.status;
      const quotaLike = status === 429 || /quota|exceed|rate|insufficient/i.test(errorMsg);

      // If quota-like or 5xx, try secondary key
      if ((quotaLike || status >= 500) && geminiApiKeySecondary) {
        console.log('Trying secondary key on gemini-2.5-flash');
        const retry = await callGemini(geminiApiKeySecondary, 'gemini-2.5-flash');
        aiRes = retry.res;
        aiData = retry.data;
        responseTime = retry.responseTime;
      }

      // If still not OK, try flash-lite as fallback
      if (!aiRes.ok) {
        const keyForFlash = geminiApiKeySecondary ?? geminiApiKey;
        console.log('Falling back to gemini-1.5-flash');
        usedModel = 'gemini-1.5-flash';
        const fb = await callGemini(keyForFlash, usedModel);
        
        if (!fb.res.ok) {
          await logApiUsage(supabaseClient, 'summarize-note', 'gemini', usedModel, true, 'error', fb.data?.error?.message || 'Unknown error', fb.responseTime);
          throw new Error(`All Gemini models failed: ${fb.data?.error?.message || 'Unknown error'}`);
        }
        
        aiRes = fb.res;
        aiData = fb.data;
        responseTime = fb.responseTime;
      }
    }

    if (!aiData.candidates || aiData.candidates.length === 0) {
      console.error('No candidates in Gemini response:', aiData);
      await logApiUsage(supabaseClient, 'summarize-note', 'gemini', usedModel, false, 'error', 'No candidates returned', responseTime);
      throw new Error('No summary generated by Gemini API');
    }

    const summary = aiData.candidates[0]?.content?.parts?.[0]?.text;
    
    if (!summary) {
      console.error('No summary text in response:', aiData);
      await logApiUsage(supabaseClient, 'summarize-note', 'gemini', usedModel, false, 'error', 'No summary text', responseTime);
      throw new Error('No summary text generated');
    }

    console.log('Successfully generated summary, length:', summary.length);

    // Log successful API usage
    await logApiUsage(supabaseClient, 'summarize-note', 'gemini', usedModel, false, 'success', null, responseTime);

    return new Response(
      JSON.stringify({ success: true, summary }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in summarize-note:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
