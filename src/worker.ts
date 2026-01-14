
import { GoogleGenAI } from "@google/genai";

export default {
  async fetch(request: Request, env: any) {
    const url = new URL(request.url);

    // CORS header helper
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
        apiKey: env.FIREBASE_API_KEY,
        authDomain: env.FIREBASE_AUTH_DOMAIN,
        projectId: env.FIREBASE_PROJECT_ID,
        storageBucket: env.FIREBASE_STORAGE_BUCKET,
        messagingSenderId: env.FIREBASE_MESSAGING_SENDER_ID,
        appId: env.FIREBASE_APP_ID,
        measurementId: env.FIREBASE_MEASUREMENT_ID,
        adminEmail: env.ADMIN_EMAIL
      };
      return new Response(JSON.stringify(config), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. Gemini API プロキシ (APIキーをサーバーサイドで秘匿)
    if (url.pathname === "/api/gemini" && request.method === "POST") {
      try {
        const body = await request.json();
        const { model, contents, config, action } = body;
        
        // シークレットからAPIキーを取得
        const apiKey = env.GEMINI_API_KEY || env.API_KEY;
        if (!apiKey) {
          return new Response(JSON.stringify({ error: "API Key not configured in Cloudflare Secrets" }), { 
            status: 500, 
            headers: corsHeaders 
          });
        }

        const ai = new GoogleGenAI({ apiKey });

        // TTSや画像生成などのアクション分岐
        if (action === "generateContent") {
          const response = await ai.models.generateContent({ model, contents, config });
          return new Response(JSON.stringify(response), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        
        if (action === "generateImages") {
          // imagen等
          const response = await ai.models.generateImages({ model, prompt: contents, config });
          return new Response(JSON.stringify(response), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        return new Response(JSON.stringify({ error: "Invalid action" }), { status: 400, headers: corsHeaders });
      } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), { 
          status: 500, 
          headers: corsHeaders 
        });
      }
    }

    // 通常の静的ファイルリクエストなどはパススルー（Pagesの場合は自動処理されるが、念のため）
    return new Response("Not Found", { status: 404 });
  },
};
