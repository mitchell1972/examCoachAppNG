# DeepSeek AI Integration Guide

## Overview
Your JAMB Coaching PWA has been successfully updated to use DeepSeek AI instead of Gemini AI for generating practice questions. This guide explains how to set up the DeepSeek API key and verify the integration is working.

## Changes Made

### ✅ Updated Edge Functions
- **`generate-questions`** - Updated to use DeepSeek API for on-demand question generation
- **`generate-ai-questions`** - Updated to use DeepSeek API for daily question batch generation

### ✅ API Integration Changes
- **Previous**: Google Gemini API (`GEMINI_API_KEY`)
- **Current**: DeepSeek API (`DEEPSEEK_API_KEY`)
- **Endpoint**: `https://api.deepseek.com/chat/completions`
- **Model**: `deepseek-chat`

## Required Setup Steps

### 1. Get DeepSeek API Key

1. **Visit DeepSeek Platform**: Go to [https://platform.deepseek.com](https://platform.deepseek.com)
2. **Create Account**: Sign up or log in to your account
3. **Generate API Key**: Navigate to API keys section and create a new key
4. **Copy API Key**: Save the key securely (you'll need it in the next step)

### 2. Set Environment Variable in Supabase

1. **Open Supabase Dashboard**: Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. **Select Your Project**: Choose your JAMB coaching project
3. **Navigate to Edge Functions**: Go to **Edge Functions** in the left sidebar
4. **Open Settings**: Click on **Settings** or **Environment Variables**
5. **Add New Variable**:
   - **Key**: `DEEPSEEK_API_KEY`
   - **Value**: Your DeepSeek API key (paste from step 1)
6. **Save Changes**: Click save to apply the new environment variable

### 3. Remove Old Environment Variable (Optional)

If you had a `GEMINI_API_KEY` set, you can now remove it:
1. In the same environment variables section
2. Find `GEMINI_API_KEY`
3. Delete the variable

## Testing the Integration

### Test Question Generation

You can test the new DeepSeek integration by:

1. **Via Your App**: 
   - Open your app at https://9j16qde9pffu.space.minimax.io
   - Try generating new practice questions
   - Questions should now be generated using DeepSeek AI

2. **Direct API Test**: 
   ```bash
   curl -X POST 'https://zjfilhbczaquokqlcoej.supabase.co/functions/v1/generate-questions' \
   -H 'Authorization: Bearer YOUR_SUPABASE_ANON_KEY' \
   -H 'Content-Type: application/json' \
   -d '{
     "subject": "Mathematics",
     "topic": "Algebra",
     "difficulty_level": 2,
     "count": 3
   }'
   ```

### Expected Response
With DeepSeek integration, you should see:
- `"source": "AI-generated"` in the response
- High-quality JAMB-style questions
- Proper Nigerian context and syllabus alignment

## Benefits of DeepSeek Integration

### 🚀 **Performance**
- **Faster Response Times**: DeepSeek typically provides quicker API responses
- **Better JSON Structure**: More reliable structured responses

### 💡 **Quality**
- **Improved Question Quality**: DeepSeek excels at educational content generation
- **Better Context Understanding**: Enhanced understanding of Nigerian JAMB requirements

### 💰 **Cost**
- **Cost-Effective**: Generally more affordable than other AI providers
- **Flexible Pricing**: Pay-per-use model

## Troubleshooting

### Common Issues

#### ❌ "Missing required environment variables" Error
**Solution**: Ensure `DEEPSEEK_API_KEY` is properly set in Supabase environment variables

#### ❌ "DeepSeek API error: 401" Error
**Solution**: 
- Check that your API key is valid
- Ensure you have credits/quota remaining in your DeepSeek account
- Verify the API key is correctly copied (no extra spaces)

#### ❌ Questions show as "mock-data" instead of "AI-generated"
**Solution**: 
- Check Supabase logs: Go to **Logs** → **Edge Functions** in Supabase dashboard
- Verify the `DEEPSEEK_API_KEY` environment variable is set
- Test the API key directly with DeepSeek's documentation

### Checking Logs

To view detailed logs and debug issues:

1. **Supabase Dashboard** → **Logs** → **Edge Functions**
2. Look for `generate-questions` or `generate-ai-questions` function calls
3. Check for any error messages or API response issues

## Function URLs

- **Generate Questions**: `https://zjfilhbczaquokqlcoej.supabase.co/functions/v1/generate-questions`
- **Generate AI Questions**: `https://zjfilhbczaquokqlcoej.supabase.co/functions/v1/generate-ai-questions`

## Support

If you encounter any issues:
1. Check the troubleshooting section above
2. Review Supabase function logs
3. Verify your DeepSeek API key has sufficient quota
4. Test the API key directly with DeepSeek's API documentation

---

✅ **Integration Complete**: Your JAMB Coaching PWA is now powered by DeepSeek AI!

Once you've set up the `DEEPSEEK_API_KEY` environment variable, your app will automatically start using DeepSeek for question generation.