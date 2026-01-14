
import { GoogleGenAI } from "@google/genai";

export default {
  async fetch(request: Request, env: any) {
    const url = new URL(request.url);

    // CORS headers
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    // 1. Firebase構成情報を安全にフロントエンドへ渡す
    if (url.pathname === "/api/config") {
      const config = {
        apiKey: env.FIREBASE_API_KEY || env.FIREBASE_APIKEY,
        authDomain: env.FIREBASE_AUTH_DOMAIN || env.FIREBASE_AUTHDOMAIN,
        projectId: env.FIREBASE_PROJECT_ID || env.FIREBASE_PROJECTID,
        storageBucket: env.FIREBASE_STORAGE_BUCKET || env.FIREBASE_STORAGEBUCKET,
        messagingSenderId: env.FIREBASE_MESSAGING_SENDER_ID || env.FIREBASE_MESSAGINGSENDERID,
        appId: env.FIREBASE_APP_ID || env.FIREBASE_APPID,
        measurementId: env.FIREBASE_MEASUREMENT_ID || env.FIREBASE_MEASUREMENTID,
        adminEmail: env.ADMIN_EMAIL
      };
      
      return new Response(JSON.stringify(config), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. Gemini API プロキシ
    if (url.pathname === "/api/gemini" && request.method === "POST") {
      try {
        const body = await request.json();
        const { model, contents, config, action } = body;
        
        const apiKey = env.GEMINI_API_KEY || env.API_KEY;
        if (!apiKey) {
          return new Response(JSON.stringify({ error: "Gemini API Key missing in Cloudflare Secrets" }), { 
            status: 500, 
            headers: corsHeaders 
          });
        }

        const ai = new GoogleGenAI({ apiKey });

        if (action === "generateContent") {
          const response = await ai.models.generateContent({ model, contents, config });
          // Ensure getters like 'text' and 'functionCalls' are included in the JSON response for the client proxy
          const responseData = {
            ...response,
            text: response.text,
            functionCalls: response.functionCalls,
          };
          return new Response(JSON.stringify(responseData), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        
        return new Response(JSON.stringify({ error: "Unsupported action" }), { status: 400, headers: corsHeaders });
      } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), { 
          status: 500, 
          headers: corsHeaders 
        });
      }
    }

    return new Response("API Endpoint Not Found", { status: 404, headers: corsHeaders });
  },
};
