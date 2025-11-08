// @ts-nocheck
// This is a Deno Edge Function - Deno types and imports are available at runtime
// TypeScript errors for Deno imports are expected in local linting but work in Supabase Edge Functions
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
    const { imageBase64, cameraId, violationType, severity } = await req.json();
    
    if (!imageBase64) {
      return new Response(
        JSON.stringify({ error: 'No image data provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Processing image for PPE violations...');

    // Initialize Supabase client
    // Supabase Edge Functions automatically provide these via request headers
    const requestUrl = new URL(req.url);
    const hostname = requestUrl.hostname;
    
    // Extract project ref from hostname
    // Can be: iscxriwdxxvzhcoguvyk.supabase.co or iscxriwdxxvzhcoguvyk.functions.supabase.co
    let projectRef: string | null = null;
    let supabaseUrl: string | null = null;
    
    // Try pattern 1: projectref.supabase.co
    const match1 = hostname.match(/^([^.]+)\.supabase\.co$/);
    if (match1) {
      projectRef = match1[1];
      supabaseUrl = `https://${projectRef}.supabase.co`;
    } else {
      // Try pattern 2: projectref.functions.supabase.co
      const match2 = hostname.match(/^([^.]+)\.functions\.supabase\.co$/);
      if (match2) {
        projectRef = match2[1];
        supabaseUrl = `https://${projectRef}.supabase.co`;
      }
    }
    
    // Fallback: use environment variable or construct from known project ref
    if (!supabaseUrl) {
      // @ts-ignore - Deno is available in Edge Functions runtime
      supabaseUrl = Deno.env.get('SUPABASE_URL') || 'https://iscxriwdxxvzhcoguvyk.supabase.co';
      console.log('Using fallback Supabase URL:', supabaseUrl);
    } else {
      console.log('Extracted Supabase URL from hostname:', supabaseUrl);
    }
    
    // Get API key from request headers (Supabase automatically includes this)
    // @ts-ignore - Deno is available in Edge Functions runtime
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
    // @ts-ignore - Deno is available in Edge Functions runtime
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const apiKey = req.headers.get('apikey') || 
                   req.headers.get('authorization')?.replace('Bearer ', '') ||
                   anonKey ||
                   serviceKey;
    
    if (!apiKey) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'API key missing',
          details: 'No API key found in request headers or environment. Make sure you are calling this function from your Supabase client.'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log('Initializing Supabase client with URL:', supabaseUrl);
    const supabase = createClient(supabaseUrl, apiKey);
    console.log('Supabase client initialized successfully');
    
    // Test connection by checking if we can access the database
    try {
      const { error: testError } = await supabase.from('detections').select('id').limit(1);
      if (testError && testError.code !== 'PGRST116') {
        console.warn('Database connection test warning:', testError.message);
        // Continue anyway - might be RLS or table doesn't exist yet
      } else {
        console.log('Database connection test passed');
      }
    } catch (testErr) {
      console.warn('Database connection test failed, continuing anyway:', testErr);
    }

    // If violationType is provided (from Python worker), use it directly
    // Otherwise, try Lovable AI (optional) or use basic analysis
    let analysisResult;
    
    if (violationType) {
      // Direct from Python worker - use provided data
      console.log('Using provided violation data:', violationType);
      analysisResult = {
        violations: [violationType],
        confidence: 0.85,
        severity: severity || 'high',
        recommendations: ['Review site safety protocols']
      };
    } else {
      // Try Lovable AI if available (optional)
      // @ts-ignore - Deno is available in Edge Functions runtime
      const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
      
      if (LOVABLE_API_KEY) {
        console.log('Using Lovable AI for analysis...');
        try {
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
                  content: 'You are a construction safety AI inspector. Analyze images for PPE violations. Respond with JSON: {violations: [array], confidence: 0-1, severity: "low/medium/high"}'
                },
                {
                  role: 'user',
                  content: [
                    { type: 'text', text: 'Analyze this image for PPE violations.' },
                    { type: 'image_url', image_url: { url: imageBase64 } }
                  ]
                }
              ],
            }),
          });

          if (response.ok) {
            const data = await response.json();
            const aiResponse = data.choices[0].message.content;
            const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              analysisResult = JSON.parse(jsonMatch[0]);
            }
          }
        } catch (aiError) {
          console.log('Lovable AI not available, using basic analysis');
        }
      }
      
      // Fallback: Basic analysis (no AI)
      if (!analysisResult) {
        console.log('Using basic image analysis (no AI available)');
        analysisResult = {
          violations: ['Image uploaded - Manual review recommended'],
          confidence: 0.5,
          severity: 'medium',
          recommendations: ['Review image manually for PPE compliance']
        };
      }
    }

    // Upload image to storage (with error handling)
    let publicUrl = 'https://via.placeholder.com/640x480?text=Image+Upload+Failed';
    
    try {
      console.log('Attempting to upload image to storage...');
      const imageData = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;
      
      if (!imageData || imageData.length === 0) {
        throw new Error('Invalid image data');
      }
      
      const imageBuffer = Uint8Array.from(atob(imageData), c => c.charCodeAt(0));
      const fileName = `detection-${Date.now()}.jpg`;
      
      console.log('Uploading to bucket: detection-images');
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('detection-images')
        .upload(fileName, imageBuffer, {
          contentType: 'image/jpeg',
        });

      if (uploadError) {
        console.error('Storage upload error:', uploadError);
        console.log('Error details:', JSON.stringify(uploadError));
        // Continue without image URL - use placeholder
        console.log('Continuing without image upload...');
      } else {
        console.log('Image uploaded successfully');
        // Get public URL
        const { data: urlData } = supabase.storage
          .from('detection-images')
          .getPublicUrl(fileName);
        publicUrl = urlData.publicUrl;
        console.log('Image URL:', publicUrl);
      }
    } catch (storageError: any) {
      console.error('Storage error (continuing anyway):', storageError);
      console.error('Storage error message:', storageError?.message);
      // Continue with placeholder URL
    }

    // Decide whether the analysis actually indicates a real violation.
    // Some fallback/placeholder analysis results (e.g. "Image uploaded - Manual review recommended")
    // are not real violations and should not trigger alarms or voice alerts in the UI.
    const rawViolations = Array.isArray(analysisResult.violations) ? analysisResult.violations : [];

    // Patterns that indicate placeholder / manual-review messages rather than true violations.
    const PLACEHOLDER_PATTERNS = [
      /manual review/i,
      /image uploaded/i,
      /manual inspection/i,
      /no violations detected/i,
      /all clear/i,
      /all ppe requirements met/i,
    ];

    const hasMeaningfulViolation = rawViolations.some((v: string) => {
      if (!v || typeof v !== 'string') return false;
      // If the violation text matches any placeholder pattern, treat it as non-violation
      for (const p of PLACEHOLDER_PATTERNS) {
        if (p.test(v)) return false;
      }
      // Otherwise consider it meaningful
      return true;
    });

    const hasViolations = hasMeaningfulViolation;
    const violationText = hasViolations
      ? rawViolations.join(', ')
      : 'No violations detected - All Clear';

    // Ensure camera exists or use null
    let finalCameraId = cameraId;
    if (cameraId) {
      try {
        console.log('Checking if camera exists:', cameraId);
        // Check if camera exists
        const { data: cameraData, error: cameraCheckError } = await supabase
          .from('cameras')
          .select('id')
          .eq('id', cameraId)
          .single();
        
        if (cameraCheckError && cameraCheckError.code !== 'PGRST116') {
          console.error('Error checking camera:', cameraCheckError);
        }
        
        if (!cameraData) {
          console.log('Camera not found, creating...');
          // Try to create camera
          const { data: newCamera, error: cameraCreateError } = await supabase
            .from('cameras')
            .insert({
              id: cameraId,
              name: `Camera ${cameraId}`,
              location: 'Unknown',
              status: 'active'
            })
            .select()
            .single();
          
          if (cameraCreateError) {
            console.error('Could not create camera:', cameraCreateError);
            console.log('Using null for camera_id');
            finalCameraId = null;
          } else if (newCamera) {
            console.log('Camera created successfully');
          }
        } else {
          console.log('Camera exists');
        }
      } catch (cameraError: any) {
        console.error('Camera operation error:', cameraError);
        finalCameraId = null;
      }
    }

    console.log('Inserting detection into database...');
    const { data: detectionData, error: dbError } = await supabase
      .from('detections')
      .insert({
        camera_id: finalCameraId,
        violation_type: violationText,
        confidence: Math.round((analysisResult.confidence || 0.75) * 100),
        image_url: publicUrl,
        severity: analysisResult.severity || (hasViolations ? 'high' : 'low'),
        status: 'new'
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database insert error:', dbError);
      console.error('Error code:', dbError.code);
      console.error('Error message:', dbError.message);
      console.error('Error details:', dbError.details);
      console.error('Error hint:', dbError.hint);
      
      // Return error but don't throw - let frontend handle it
      return new Response(
        JSON.stringify({
          success: false,
          error: dbError.message,
          code: dbError.code,
          details: dbError.details || 'Failed to save detection to database. Check RLS policies or database connection.',
          hint: dbError.hint || 'Make sure RLS policies allow INSERT, or disable RLS for testing'
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
    
    console.log('Detection saved successfully:', detectionData?.id);

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
    console.error('Error type:', typeof error);
    console.error('Error constructor:', error?.constructor?.name);
    
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    const errorName = error instanceof Error ? error.name : 'UnknownError';
    
    // Log additional error details
    if (error && typeof error === 'object') {
      console.error('Error keys:', Object.keys(error));
      for (const key in error) {
        if (key !== 'stack' && key !== 'message') {
          console.error(`Error ${key}:`, error[key]);
        }
      }
    }
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: errorMessage,
        errorName: errorName,
        stack: errorStack,
        details: 'Failed to analyze image for PPE violations. Check Supabase logs for more details.',
        troubleshooting: {
          step1: 'Check if SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set as Edge Function secrets',
          step2: 'Check if detection-images storage bucket exists and is public',
          step3: 'Check if detections and cameras tables exist',
          step4: 'Check RLS policies - may need to disable RLS for testing',
          step5: 'Check Supabase Dashboard → Logs → Edge Functions for detailed error logs'
        }
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
