import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper to log API usage
async function logApiUsage(
  supabase: any,
  userId: string | null,
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
      user_id: userId,
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
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { topic } = await req.json();
    
    if (!topic) {
      throw new Error('Topic is required');
    }

    console.log('Exploring topic:', topic);

    // Get API keys
    const githubPat = Deno.env.get('GITHUB_PAT');
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    const geminiApiKeySecondary = Deno.env.get('GEMINI_API_KEY_SECONDARY');
    const youtubeApiKey = Deno.env.get('YOUTUBE_API_KEY');
    const redditApiKey = Deno.env.get('REDDIT_API_KEY');
    const tavilyApiKey = Deno.env.get('TAVILY_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!githubPat && !geminiApiKey && !geminiApiKeySecondary) {
      throw new Error('No AI API keys configured');
    }

    const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

    // Helper function to call GitHub Models GPT-5 API
    const callGitHubModelsAPI = async (prompt: string) => {
      const startTime = Date.now();
      const response = await fetch('https://models.inference.ai.azure.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${githubPat}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-5',
          messages: [
            { role: 'system', content: 'You are an educational assistant that generates learning content.' },
            { role: 'user', content: prompt }
          ],
          max_completion_tokens: 1000,
          response_format: { type: "json_object" }
        }),
      });

      const responseTime = Date.now() - startTime;

      if (!response.ok) {
        await logApiUsage(supabase, null, 'explore-topic', 'github-models', 'gpt-5', false, 'error', `Status ${response.status}`, responseTime);
        throw new Error(`GitHub Models API error: ${response.status}`);
      }

      const data = await response.json();
      await logApiUsage(supabase, null, 'explore-topic', 'github-models', 'gpt-5', false, 'success', null, responseTime);
      return data.choices[0].message.content;
    };

    // Helper function to call Gemini API with fallback
    const callGeminiAPI = async (prompt: string, apiKey: string, model: string = 'gemini-2.0-flash-exp') => {
      const startTime = Date.now();
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: prompt
              }]
            }],
            generationConfig: {
              temperature: 0.4,
              topK: 40,
              topP: 0.95,
              maxOutputTokens: 2048,
              responseMimeType: "application/json"
            }
          })
        }
      );

      const responseTime = Date.now() - startTime;

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Gemini API error ${response.status}:`, errorText);
        await logApiUsage(supabase, null, 'explore-topic', 'gemini', model, true, 'error', `Status ${response.status}`, responseTime);
        throw new Error(`Gemini API error: ${response.status}`);
      }

      const data = await response.json();
      console.log('Gemini API response received successfully');
      await logApiUsage(supabase, null, 'explore-topic', 'gemini', model, true, 'success', null, responseTime);
      return data;
    };

    // Topic-specific prompt for generating relevant learning tasks
    const geminiPrompt = `You are an expert educator creating personalized learning content. Generate comprehensive learning materials for the topic: "${topic}"

CRITICAL: You MUST respond with ONLY valid JSON in exactly this format, no additional text or markdown:

{
  "overview": "A detailed, engaging 2-3 sentence overview explaining what ${topic} is, why it matters, and what learners will gain. Make it specific to ${topic}, not generic.",
  "tips": [
    "Practical, actionable tip specifically about ${topic}",
    "Another specific tip for mastering ${topic}",
    "A third unique insight about ${topic}",
    "A fourth helpful tip for ${topic} learners",
    "A fifth expert recommendation for ${topic}"
  ],
  "learningSteps": [
    {
      "id": "step-1",
      "title": "Specific milestone title for ${topic}",
      "description": "Detailed actionable task description for ${topic}",
      "completed": false
    }
  ]
}

Requirements:
- Create exactly 8 progressive learning steps from beginner to advanced
- Each step must be specific to ${topic} - no generic content
- Overview must be 2-3 sentences explaining ${topic} specifically
- Tips must be actionable and unique to ${topic}
- Return ONLY the JSON object, no markdown formatting, no explanations
- Ensure all JSON is properly formatted with correct quotes and commas`;

    console.log('Calling AI API...');
    let geminiData;
    let aiContent;
    
    // Try Gemini first (primary model)
    const currentApiKey = geminiApiKey || geminiApiKeySecondary;
    
    if (!currentApiKey && !githubPat) {
      throw new Error('No AI API keys available');
    }
    
    if (currentApiKey) {
      try {
        console.log('Using Gemini (primary) for topic exploration');
        geminiData = await callGeminiAPI(geminiPrompt, currentApiKey, 'gemini-2.0-flash-exp');
        console.log('Gemini response structure:', JSON.stringify(geminiData, null, 2));
        
        // Check if response was blocked by safety filters
        if (geminiData.promptFeedback?.blockReason) {
          console.error('Gemini blocked response:', geminiData.promptFeedback.blockReason);
          throw new Error(`Content blocked: ${geminiData.promptFeedback.blockReason}`);
        }
        
        // Check if candidates exist and have content
        if (!geminiData.candidates || geminiData.candidates.length === 0) {
          console.error('No candidates in Gemini response');
          throw new Error('Gemini returned no candidates');
        }
        
        const candidate = geminiData.candidates[0];
        if (candidate.finishReason === 'SAFETY') {
          console.error('Response blocked by safety filter');
          throw new Error('Content blocked by safety filters');
        }
        
        aiContent = candidate?.content?.parts?.[0]?.text;
        
        if (!aiContent) {
          console.error('No text content in candidate');
          throw new Error('No text in Gemini response');
        }
        
        console.log('Gemini generated content successfully');
      } catch (error) {
        console.error('Primary Gemini API error:', error);
        // Try secondary key if primary fails
        if (geminiApiKeySecondary && currentApiKey === geminiApiKey) {
          console.log('Trying secondary Gemini API key...');
          try {
            geminiData = await callGeminiAPI(geminiPrompt, geminiApiKeySecondary, 'gemini-2.0-flash-exp');
            console.log('Secondary Gemini response structure:', JSON.stringify(geminiData, null, 2));
            
            if (geminiData.promptFeedback?.blockReason) {
              throw new Error(`Content blocked: ${geminiData.promptFeedback.blockReason}`);
            }
            
            if (!geminiData.candidates || geminiData.candidates.length === 0) {
              throw new Error('Gemini returned no candidates');
            }
            
            const candidate = geminiData.candidates[0];
            if (candidate.finishReason === 'SAFETY') {
              throw new Error('Content blocked by safety filters');
            }
            
            aiContent = candidate?.content?.parts?.[0]?.text;
            
            if (!aiContent) {
              throw new Error('No text in secondary Gemini response');
            }
          } catch (secondaryError) {
            console.error('Secondary Gemini API also failed, trying GitHub Models as last resort');
            // Only try GitHub Models as last resort
            if (githubPat) {
              try {
                console.log('Trying GitHub Models GPT-5 as fallback');
                aiContent = await callGitHubModelsAPI(geminiPrompt);
                console.log('GitHub Models GPT-5 response received');
              } catch (gptError) {
                console.error('GitHub Models also failed:', gptError);
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                throw new Error(`All AI providers failed: ${errorMessage}`);
              }
            } else {
              throw secondaryError;
            }
          }
        } else {
          // If no secondary key, try GitHub Models as fallback
          if (githubPat) {
            try {
              console.log('Trying GitHub Models GPT-5 as fallback');
              aiContent = await callGitHubModelsAPI(geminiPrompt);
              console.log('GitHub Models GPT-5 response received');
            } catch (gptError) {
              console.error('GitHub Models also failed:', gptError);
              throw error;
            }
          } else {
            throw error;
          }
        }
      }
    } else if (githubPat) {
      // Only use GitHub Models if no Gemini key available
      try {
        console.log('Using GitHub Models GPT-5 (no Gemini key available)');
        aiContent = await callGitHubModelsAPI(geminiPrompt);
        console.log('GitHub Models GPT-5 response received');
      } catch (error) {
        console.error('GitHub Models GPT-5 error:', error);
        throw error;
      }
    }
    
    console.log('AI API response received');
    console.log('AI content length:', aiContent?.length);
    
    if (!aiContent) {
      console.error('No content generated by any AI provider');
      throw new Error('Failed to generate content - all AI providers returned empty responses');
    }

    console.log('Raw AI response (first 500 chars):', aiContent.substring(0, 500));

    // Parse AI response with comprehensive error handling
    let aiJsonStr = aiContent?.trim() || '';
    
    // Remove markdown code blocks if present
    if (aiJsonStr.includes('```')) {
      // Extract content between code blocks
      const codeBlockMatch = aiJsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (codeBlockMatch) {
        aiJsonStr = codeBlockMatch[1];
      } else {
        // Remove all code block markers
        aiJsonStr = aiJsonStr.replace(/```json/g, '').replace(/```/g, '');
      }
    }
    
    aiJsonStr = aiJsonStr.trim();

    // Try to find JSON object in the response if not at the start
    if (!aiJsonStr.startsWith('{')) {
      const jsonMatch = aiJsonStr.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        aiJsonStr = jsonMatch[0];
      }
    }

    let learningContent;
    try {
      learningContent = JSON.parse(aiJsonStr);
      console.log('Successfully parsed AI JSON response');
      
      // Validate the parsed content has required fields
      if (!learningContent.overview || !learningContent.tips || !learningContent.learningSteps) {
        console.error('Parsed JSON missing required fields');
        throw new Error('Invalid JSON structure - missing required fields');
      }
      
      console.log('AI generated overview length:', learningContent.overview.length);
      console.log('AI generated tips count:', learningContent.tips?.length);
      console.log('AI generated steps count:', learningContent.learningSteps?.length);
      
    } catch (parseError) {
      console.error('AI JSON parse error:', parseError);
      console.error('Failed to parse content (first 1000 chars):', aiJsonStr.substring(0, 1000));
      console.error('Will use fallback content generation');
      
      // Enhanced fallback content with topic-specific tasks
      const topicLower = topic.toLowerCase();
      const generateTopicSpecificSteps = (topic: string) => {
        const commonPatterns = {
          programming: [
            { title: "Set up development environment", description: `Install necessary tools and IDE for ${topic}` },
            { title: "Write your first program", description: `Create a simple "Hello World" program in ${topic}` },
            { title: "Learn basic syntax", description: `Study variables, functions, and control structures in ${topic}` },
            { title: "Practice with exercises", description: `Complete coding challenges and exercises in ${topic}` },
            { title: "Build a small project", description: `Create a practical application using ${topic}` },
            { title: "Debug and test code", description: `Learn debugging techniques and testing in ${topic}` },
            { title: "Explore frameworks", description: `Investigate popular frameworks and libraries for ${topic}` },
            { title: "Join the community", description: `Participate in ${topic} forums and contribute to projects` }
          ],
          design: [
            { title: "Learn design principles", description: `Study color theory, typography, and layout in ${topic}` },
            { title: "Practice with tools", description: `Get familiar with design software for ${topic}` },
            { title: "Study examples", description: `Analyze successful ${topic} examples and case studies` },
            { title: "Create mockups", description: `Design wireframes and prototypes for ${topic}` },
            { title: "Get feedback", description: `Share your ${topic} work and gather constructive criticism` },
            { title: "Iterate and improve", description: `Refine your ${topic} skills based on feedback` },
            { title: "Build a portfolio", description: `Showcase your best ${topic} projects` },
            { title: "Stay updated", description: `Follow ${topic} trends and emerging techniques` }
          ],
          language: [
            { title: "Learn basic vocabulary", description: `Master essential words and phrases in ${topic}` },
            { title: "Practice pronunciation", description: `Work on speaking and accent in ${topic}` },
            { title: "Study grammar rules", description: `Understand sentence structure and grammar in ${topic}` },
            { title: "Listen actively", description: `Consume ${topic} media like podcasts and videos` },
            { title: "Practice conversation", description: `Find speaking partners for ${topic} practice` },
            { title: "Read regularly", description: `Read books, articles, and news in ${topic}` },
            { title: "Write daily", description: `Keep a journal or blog in ${topic}` },
            { title: "Take a proficiency test", description: `Assess your ${topic} level with official tests` }
          ],
          science: [
            { title: "Understand fundamentals", description: `Learn basic concepts and terminology in ${topic}` },
            { title: "Study key theories", description: `Explore major theories and principles of ${topic}` },
            { title: "Conduct experiments", description: `Perform hands-on experiments related to ${topic}` },
            { title: "Analyze data", description: `Learn to collect and interpret ${topic} data` },
            { title: "Read research papers", description: `Study current research and findings in ${topic}` },
            { title: "Use scientific tools", description: `Get familiar with equipment and software for ${topic}` },
            { title: "Present findings", description: `Practice communicating ${topic} concepts clearly` },
            { title: "Apply knowledge", description: `Use ${topic} principles to solve real-world problems` }
          ]
        };

        // Determine topic category and return appropriate steps
        if (topicLower.includes('programming') || topicLower.includes('coding') || topicLower.includes('javascript') || topicLower.includes('python') || topicLower.includes('java') || topicLower.includes('react') || topicLower.includes('web development')) {
          return commonPatterns.programming;
        } else if (topicLower.includes('design') || topicLower.includes('ui') || topicLower.includes('ux') || topicLower.includes('graphic') || topicLower.includes('photography') || topicLower.includes('art')) {
          return commonPatterns.design;
        } else if (topicLower.includes('language') || topicLower.includes('english') || topicLower.includes('spanish') || topicLower.includes('french') || topicLower.includes('german') || topicLower.includes('chinese') || topicLower.includes('japanese')) {
          return commonPatterns.language;
        } else if (topicLower.includes('science') || topicLower.includes('physics') || topicLower.includes('chemistry') || topicLower.includes('biology') || topicLower.includes('mathematics') || topicLower.includes('math')) {
          return commonPatterns.science;
        } else {
          // Generic but topic-specific fallback
          return [
            { title: `${topic} Fundamentals`, description: `Master the basic concepts and principles of ${topic}` },
            { title: `${topic} Terminology`, description: `Learn key terms and vocabulary specific to ${topic}` },
            { title: `${topic} Practice`, description: `Apply ${topic} concepts through hands-on exercises` },
            { title: `${topic} Tools`, description: `Get familiar with essential tools and resources for ${topic}` },
            { title: `${topic} Community`, description: `Connect with other ${topic} learners and experts` },
            { title: `${topic} Projects`, description: `Work on practical projects to deepen ${topic} understanding` },
            { title: `${topic} Advanced Topics`, description: `Explore more complex aspects of ${topic}` },
            { title: `${topic} Mastery`, description: `Achieve proficiency and teach others about ${topic}` }
          ];
        }
      };

      const topicSteps = generateTopicSpecificSteps(topic);
      
      learningContent = {
        overview: `${topic} is a valuable subject that offers diverse learning opportunities and practical applications. Understanding ${topic} requires a structured approach, starting with fundamentals and progressively building expertise through practice and real-world application.`,
        tips: [
          `Start with the core fundamentals of ${topic} to build a solid foundation`,
          `Practice ${topic} regularly through hands-on exercises and projects`,
          `Join ${topic} communities to learn from experienced practitioners`,
          `Use multiple learning resources to gain comprehensive ${topic} knowledge`,
          `Set specific, measurable goals for your ${topic} learning journey`
        ],
        learningSteps: topicSteps.map((step, index) => ({
          id: `step-${index + 1}`,
          title: step.title,
          description: step.description,
          completed: false
        }))
      };
    }

    // Fetch YouTube videos
    let videos = [];
    if (youtubeApiKey) {
      try {
        console.log('Searching YouTube videos...');
        const youtubeResponse = await fetch(
          `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(topic + ' tutorial')}&type=video&maxResults=5&key=${youtubeApiKey}`
        );

        if (youtubeResponse.ok) {
          const youtubeData = await youtubeResponse.json();
          videos = youtubeData.items?.map((item: any) => ({
            title: item.snippet.title,
            url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
            description: item.snippet.description.substring(0, 150) + '...'
          })) || [];
          console.log(`Found ${videos.length} YouTube videos`);
        }
      } catch (error) {
        console.error('YouTube API error:', error);
      }
    }

    // Fallback videos if YouTube API fails
    if (videos.length === 0) {
      videos = [
        {
          title: `Learn ${topic} - Beginner's Guide`,
          url: `https://www.youtube.com/results?search_query=${encodeURIComponent(topic + ' tutorial')}`,
          description: `Comprehensive tutorial covering the basics of ${topic}`
        },
        {
          title: `${topic} Fundamentals`,
          url: `https://www.youtube.com/results?search_query=${encodeURIComponent(topic + ' fundamentals')}`,
          description: `Understanding the core concepts of ${topic}`
        },
        {
          title: `Advanced ${topic} Techniques`,
          url: `https://www.youtube.com/results?search_query=${encodeURIComponent(topic + ' advanced')}`,
          description: `Deep dive into advanced ${topic} concepts and techniques`
        }
      ];
    }

    // Fetch Reddit communities
    let communities = [];
    try {
      console.log('Searching Reddit communities...');
      const redditResponse = await fetch(
        `https://www.reddit.com/subreddits/search.json?q=${encodeURIComponent(topic)}&limit=5`,
        {
          headers: {
            'User-Agent': 'LearningApp/1.0'
          }
        }
      );

      if (redditResponse.ok) {
        const redditData = await redditResponse.json();
        communities = redditData.data?.children?.map((item: any) => ({
          name: item.data.display_name_prefixed,
          url: `https://www.reddit.com${item.data.url}`,
          platform: "Reddit",
          description: item.data.public_description || `Community for ${topic} enthusiasts`
        })) || [];
        console.log(`Found ${communities.length} Reddit communities`);
      }
    } catch (error) {
      console.error('Reddit API error:', error);
    }

    // Add fallback communities
    if (communities.length === 0) {
      communities = [
        {
          name: `r/${topic.toLowerCase().replace(/\s+/g, '')}`,
          url: `https://www.reddit.com/search/?q=${encodeURIComponent(topic)}`,
          platform: "Reddit",
          description: `Community for ${topic} enthusiasts and learners`
        }
      ];
    }

    // Add other community suggestions
    communities.push(
      {
        name: `${topic} Discord Server`,
        url: `https://discord.com/invite/search?q=${encodeURIComponent(topic)}`,
        platform: "Discord",
        description: `Real-time chat community for ${topic} learners`
      },
      {
        name: `${topic} Stack Overflow`,
        url: `https://stackoverflow.com/questions/tagged/${encodeURIComponent(topic.toLowerCase().replace(/\s+/g, '-'))}`,
        platform: "Stack Overflow",
        description: `Q&A community for technical ${topic} questions`
      }
    );

    // Fetch Wikipedia articles using official Wikipedia API with improved relevance
    interface WikipediaArticle {
      title: string;
      url: string;
      description: string;
      thumbnail: string | null;
    }
    
    let wikipediaArticles: WikipediaArticle[] = [];
    try {
      console.log('Searching Wikipedia articles...');
      
      // Create more specific search terms for better relevance
      const searchTerms = [
        topic,
        `${topic} techniques`,
        `${topic} fundamentals`,
        `${topic} tutorial`
      ];
      
      const allResults: any[] = [];
      
      // Search with multiple specific terms
      for (const searchTerm of searchTerms) {
        try {
          const searchResponse = await fetch(
            `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(searchTerm)}&format=json&srlimit=3&origin=*`
          );

          if (searchResponse.ok) {
            const searchData = await searchResponse.json();
            const searchResults = searchData.query?.search || [];
            
            // Filter out irrelevant results (movies, TV shows, specific products unless the topic is about them)
            const filteredResults = searchResults.filter((result: any) => {
              const title = result.title.toLowerCase();
              const snippet = result.snippet.toLowerCase();
              const topicLower = topic.toLowerCase();
              
              // Exclude specific movies, TV shows, games unless the topic is specifically about entertainment
              const isEntertainmentSpecific = title.includes('(film)') || 
                                            title.includes('(movie)') || 
                                            title.includes('(tv series)') || 
                                            title.includes('(video game)') ||
                                            title.includes('(album)') ||
                                            title.includes('(song)');
              
              const isTopicAboutEntertainment = topicLower.includes('film') || 
                                              topicLower.includes('movie') || 
                                              topicLower.includes('cinema') ||
                                              topicLower.includes('entertainment');
              
              // If it's entertainment-specific content, only include if the topic is about entertainment
              if (isEntertainmentSpecific && !isTopicAboutEntertainment) {
                return false;
              }
              
              // Prefer educational, technical, or general concept articles
              const isEducational = snippet.includes('technique') || 
                                   snippet.includes('method') || 
                                   snippet.includes('process') ||
                                   snippet.includes('study') ||
                                   snippet.includes('field') ||
                                   snippet.includes('discipline') ||
                                   title.toLowerCase().includes(topicLower);
              
              return isEducational || !isEntertainmentSpecific;
            });
            
            allResults.push(...filteredResults);
          }
        } catch (searchError) {
          console.error(`Error searching for term "${searchTerm}":`, searchError);
        }
      }
      
      // Remove duplicates and prioritize by relevance
      const uniqueResults = allResults.filter((result, index, self) => 
        index === self.findIndex(r => r.title === result.title)
      );
      
      // Sort by relevance (title similarity to topic gets priority)
      const sortedResults = uniqueResults.sort((a, b) => {
        const aRelevance = a.title.toLowerCase().includes(topic.toLowerCase()) ? 1 : 0;
        const bRelevance = b.title.toLowerCase().includes(topic.toLowerCase()) ? 1 : 0;
        return bRelevance - aRelevance;
      });
      
      console.log(`Found ${sortedResults.length} filtered search results`);
      
      // Get summaries for top results
      for (const result of sortedResults.slice(0, 4)) {
        try {
          const summaryResponse = await fetch(
            `https://en.wikipedia.org/w/api.php?action=query&prop=extracts&exintro&titles=${encodeURIComponent(result.title)}&format=json&origin=*`
          );
          
          if (summaryResponse.ok) {
            const summaryData = await summaryResponse.json();
            const pages = summaryData.query?.pages || {};
            const pageId = Object.keys(pages)[0];
            const page = pages[pageId];
            
            if (page && page.extract) {
              // Clean up the extract (remove HTML tags and limit length)
              let cleanExtract = page.extract.replace(/<[^>]*>/g, '');
              if (cleanExtract.length > 200) {
                cleanExtract = cleanExtract.substring(0, 200) + '...';
              }
              
              wikipediaArticles.push({
                title: result.title,
                url: `https://en.wikipedia.org/wiki/${encodeURIComponent(result.title.replace(/ /g, '_'))}`,
                description: cleanExtract || result.snippet || `Wikipedia article about ${result.title}`,
                thumbnail: null
              });
            }
          }
        } catch (summaryError) {
          console.error(`Error fetching summary for ${result.title}:`, summaryError);
          // Add without summary if summary fetch fails
          wikipediaArticles.push({
            title: result.title,
            url: `https://en.wikipedia.org/wiki/${encodeURIComponent(result.title.replace(/ /g, '_'))}`,
            description: result.snippet || `Wikipedia article about ${result.title}`,
            thumbnail: null
          });
        }
      }
      
      console.log(`Successfully fetched ${wikipediaArticles.length} relevant Wikipedia articles`);
    } catch (error) {
      console.error('Wikipedia API error:', error);
    }

    // Improved fallback articles if API fails
    if (wikipediaArticles.length === 0) {
      console.log('Using improved fallback Wikipedia articles');
      wikipediaArticles = [
        {
          title: topic,
          url: `https://en.wikipedia.org/wiki/${encodeURIComponent(topic.replace(/ /g, '_'))}`,
          description: `Comprehensive Wikipedia article about ${topic}`,
          thumbnail: null
        },
        {
          title: `${topic.split(' ')[0]}`, // First word of topic
          url: `https://en.wikipedia.org/wiki/${encodeURIComponent(topic.split(' ')[0])}`,
          description: `Learn about ${topic.split(' ')[0]} fundamentals`,
          thumbnail: null
        },
        {
          title: "Learning",
          url: "https://en.wikipedia.org/wiki/Learning",
          description: "Process of acquiring new understanding, knowledge, behaviors, and skills",
          thumbnail: null
        }
      ];
    }

    // Generate image suggestions using Tavily or fallback
    let images = [];
    if (tavilyApiKey) {
      try {
        console.log('Searching for educational images...');
        const tavilyResponse = await fetch('https://api.tavily.com/search', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${tavilyApiKey}`
          },
          body: JSON.stringify({
            query: `${topic} educational diagrams infographics`,
            search_depth: 'basic',
            include_images: true,
            max_results: 4
          })
        });

        if (tavilyResponse.ok) {
          const tavilyData = await tavilyResponse.json();
          images = tavilyData.images?.slice(0, 3).map((img: any) => ({
            title: `${topic} Visual Guide`,
            url: img.url,
            description: `Educational visual resource for understanding ${topic}`
          })) || [];
          console.log(`Found ${images.length} educational images`);
        }
      } catch (error) {
        console.error('Tavily API error:', error);
      }
    }

    // Fallback images
    if (images.length === 0) {
      images = [
        {
          title: `${topic} Infographic`,
          url: `https://www.google.com/search?q=${encodeURIComponent(topic + ' infographic')}&tbm=isch`,
          description: `Visual representations and infographics about ${topic}`
        },
        {
          title: `${topic} Diagrams`,
          url: `https://www.google.com/search?q=${encodeURIComponent(topic + ' diagram')}&tbm=isch`,
          description: `Diagrams and charts explaining ${topic} concepts`
        },
        {
          title: `${topic} Visual Guide`,
          url: `https://www.google.com/search?q=${encodeURIComponent(topic + ' visual guide')}&tbm=isch`,
          description: `Visual learning materials for ${topic}`
        }
      ];
    }

    const result = {
      overview: learningContent.overview,
      videos: videos.slice(0, 4),
      tips: learningContent.tips,
      learningSteps: learningContent.learningSteps || [],
      images: images.slice(0, 3),
      communities: communities.slice(0, 5),
      wikipediaArticles: wikipediaArticles.slice(0, 3)
    };

    console.log('Successfully processed topic exploration with real API data');

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in explore-topic function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});