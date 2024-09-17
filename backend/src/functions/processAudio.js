const { app } = require('@azure/functions');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { pipeline } = require('stream');
const { promisify } = require('util');

const openaiApiKey = process.env.OPENAI_API_KEY; // Ensure this environment variable is set
const openaiApiUrl = 'https://api.openai.com/v1/audio/transcriptions';
const chatgptApiUrl = 'https://api.openai.com/v1/chat/completions';

// Promisify pipeline for easier async/await usage
const streamPipeline = promisify(pipeline);

app.http('processAudio', {
  methods: ['POST'],
  authLevel: 'anonymous',
  handler: async (request, context) => {
    context.log(`Http function processed request for url "${request.url}"`);

    const filePath = path.join('/tmp', 'audio.mp3'); 
    try {
      // Save the incoming audio stream to a file
      await streamPipeline(request.body, fs.createWriteStream(filePath));

      // Transcribe the audio file using OpenAI API with axios
      const transcriptionResponse = await axios.post(openaiApiUrl, 
        {
          file: fs.createReadStream(filePath),
          model: 'whisper-1',
        },
        {
          headers: {
            'Authorization': `Bearer ${openaiApiKey}`,
            'Content-Type': 'multipart/form-data',
          },
          maxRedirects: 0,
          responseType: 'json'
        }
      );

      // Extract and return transcription text
      const transcriptionText = transcriptionResponse.data.text;
      console.log('transcriptionText => ', transcriptionText);


      // Send the transcription text to ChatGPT for an answer
      const chatgptResponse = await axios.post(chatgptApiUrl, 
        {
          model: "gpt-3.5-turbo",
          messages: [
            { role: "system", content: "You are a helpful assistant." },
            { role: "user", content: transcriptionText }
          ],
        },
        {
          headers: {
            'Authorization': `Bearer ${openaiApiKey}`,
            'Content-Type': 'application/json',
          },
          responseType: 'json'
        }
      );

      // Extract and return ChatGPT response
      const chatgptText = chatgptResponse.data.choices[0].message.content;
      console.log('ChatGPT Response => ', chatgptText);

      // Clean up the saved file
      fs.unlinkSync(filePath);


      return { body: chatgptText };
    } catch (error) {
      console.error('Error processing audio', error);
      return { status: 500, body: 'Error processing audio' };
    }
  }
});
