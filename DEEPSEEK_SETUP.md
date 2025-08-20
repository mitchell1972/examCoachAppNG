# 🚀 Quick DeepSeek Setup Guide

Your AI integration has been updated to use DeepSeek! Follow these steps:

## Step 1: Get DeepSeek API Key
1. Visit: https://platform.deepseek.com
2. Create account or log in
3. Generate new API key
4. Copy the key

## Step 2: Add to Supabase
1. Open Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Go to **Edge Functions** → **Settings**
4. Add environment variable:
   - **Key**: `DEEPSEEK_API_KEY`
   - **Value**: [Your API key from step 1]
5. Save changes

## Step 3: Test
Open your app: https://9j16qde9pffu.space.minimax.io
Try generating questions - they should now be AI-powered!

---

✅ **Done!** Your app now uses DeepSeek AI for better question generation.

📖 **Need help?** Check `docs/deepseek-integration-guide.md` for detailed troubleshooting.