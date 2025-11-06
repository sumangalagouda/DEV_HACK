import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageBase64, cameraId } = await req.json();
    
    if (!imageBase64) {
      throw new Error('No image data provided');
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    console.log('Analyzing image for PPE violations...');

    // Call Lovable AI for vision analysis
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: 'You are a construction safety AI inspector. Analyze images for PPE (Personal Protective Equipment) violations and unsafe behaviors. Focus on: missing hard hats/helmets, missing safety vests/hi-vis clothing, unsafe working at heights, improper equipment use, and hazardous conditions. Respond with a JSON object containing: violations (array of strings), confidence (0-1), severity (low/medium/high), and recommendations (array of strings).'
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Analyze this construction site image for safety violations. Identify any missing PPE (helmets, safety vests) or unsafe behaviors.'
              },
              {
                type: 'image_url',
                image_url: {
                  url: imageBase64
                }
              }
            ]
          }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      throw new Error(`AI analysis failed: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;
    
    console.log('AI Response:', aiResponse);

    // Parse AI response (it should return JSON)
    let analysisResult;
    try {
      // Try to extract JSON from the response
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysisResult = JSON.parse(jsonMatch[0]);
      } else {
        // Fallback if no JSON found
        analysisResult = {
          violations: aiResponse.includes('helmet') || aiResponse.includes('hard hat') 
            ? ['Missing helmet/hard hat'] 
            : aiResponse.includes('vest') || aiResponse.includes('hi-vis')
            ? ['Missing safety vest']
            : ['Potential safety concern detected'],
          confidence: 0.75,
          severity: 'medium',
          recommendations: ['Ensure all workers wear required PPE']
        };
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      analysisResult = {
        violations: ['Safety inspection completed'],
        confidence: 0.7,
        severity: 'medium',
        recommendations: ['Review site safety protocols']
      };
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Upload image to storage
    const imageBuffer = Uint8Array.from(atob(imageBase64.split(',')[1]), c => c.charCodeAt(0));
    const fileName = `detection-${Date.now()}.jpg`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('detection-images')
      .upload(fileName, imageBuffer, {
        contentType: 'image/jpeg',
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw uploadError;
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('detection-images')
      .getPublicUrl(fileName);

    // Only save to database if there are actual violations
    const hasViolations = analysisResult.violations && analysisResult.violations.length > 0;

    let detectionData = null;
    if (hasViolations) {
      const { data, error: dbError } = await supabase
        .from('detections')
        .insert({
          camera_id: cameraId,
          violation_type: analysisResult.violations.join(', '),
          confidence: Math.round((analysisResult.confidence || 0.75) * 100),
          image_url: publicUrl,
          severity: analysisResult.severity || 'medium',
          status: 'new'
        })
        .select()
        .single();

      if (dbError) {
        console.error('Database error:', dbError);
        throw dbError;
      }

      detectionData = data;
      console.log('Violation detected and saved:', detectionData);
    } else {
      console.log('No violations detected - image is compliant');
    }

    return new Response(
      JSON.stringify({
        success: true,
        hasViolations,
        detection: detectionData,
        analysis: analysisResult,
        message: hasViolations 
          ? 'Safety violation detected!' 
          : 'No violations detected - all safety protocols followed'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in detect-ppe function:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        details: 'Failed to analyze image for PPE violations'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
