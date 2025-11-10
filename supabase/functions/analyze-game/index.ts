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
    const { moves, whitePlayerMoves, blackPlayerMoves } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const prompt = `Analyze this chess game and provide detailed accuracy assessment.

Game moves: ${moves.join(', ')}

Accuracy should be calculated based on:
- Move quality (compared to optimal chess engine moves)
- Tactical awareness (not missing obvious tactics)
- Positional understanding (piece placement, pawn structure)
- Opening knowledge (first 10-15 moves)
- Endgame technique (if applicable)

IMPORTANT: 
- Minimum accuracy should be 30% (even poor play has some merit)
- Average club player accuracy: 60-75%
- Strong player accuracy: 75-85%
- Excellent play: 85-95%
- Near-perfect play: 95%+
- Consider the complexity of positions - difficult positions allow lower accuracy
- Only assign very low accuracy (30-50%) if there were major blunders or hanging pieces

Playstyle definitions:
- aggressive: frequent attacks, sacrifices, dynamic play
- defensive: solid, reactive, prophylactic moves
- positional: focuses on structure, space, piece coordination
- tactical: seeks combinations, concrete calculations
- strategic: long-term planning, maneuvering

Respond in JSON format:
{
  "whiteAccuracy": number (30-99),
  "blackAccuracy": number (30-99),
  "whitePlaystyle": string,
  "blackPlaystyle": string,
  "summary": string
}`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'You are a chess analysis expert. Provide accurate game analysis based on moves played.' },
          { role: 'user', content: prompt }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const analysisText = data.choices[0].message.content;
    
    // Parse JSON from the response
    const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to parse AI response');
    }
    
    const analysis = JSON.parse(jsonMatch[0]);

    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error in analyze-game function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});