console.log('GEMINI_API_KEY present:', !!process.env.GEMINI_API_KEY);
console.log('GEMINI_API_KEY value:', process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.substring(0, 4) + '...' : null);
