const axios = require('axios')

const AI_PROVIDER = process.env.AI_PROVIDER // 'openai' or 'groq'
const GROQ_API_ENDPOINT = process.env.GROQ_API_ENDPOINT
const GROQ_API_KEY = process.env.GROQ_API_KEY
const OPENAI_API_ENDPOINT = process.env.OPENAI_API_ENDPOINT
const OPENAI_API_KEY = process.env.OPENAI_API_KEY

console.log('AI_PROVIDER: ', AI_PROVIDER)

module.exports.sendRequest = async (userMessage, systemMessage) => {
  const endpoint =
    AI_PROVIDER === 'openai' ? OPENAI_API_ENDPOINT : GROQ_API_ENDPOINT
  const apiKey = AI_PROVIDER === 'openai' ? OPENAI_API_KEY : GROQ_API_KEY
  const model =
    AI_PROVIDER === 'openai' ? 'gpt-4o-mini' : 'llama-3.1-70b-versatile'

  try {
    const response = await axios.post(
      endpoint,
      {
        messages: [
          {
            role: 'system',
            content: systemMessage,
          },
          {
            role: 'user',
            content: userMessage,
          },
        ],
        model: model,
        temperature: 0,
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      }
    )

    return response.data.choices[0]?.message?.content || ''
  } catch (err) {
    console.log('Api error: ', err)

    return err
  }
}
