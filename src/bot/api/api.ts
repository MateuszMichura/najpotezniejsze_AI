import axios, { AxiosError } from 'axios'
import { sleep } from '../utils/sleep'

const AI_PROVIDER: 'openai' | 'groq' = process.env.AI_PROVIDER as
  | 'openai'
  | 'groq'
const GROQ_API_ENDPOINT: string = process.env.GROQ_API_ENDPOINT || ''
const GROQ_API_KEY: string = process.env.GROQ_API_KEY || ''
const OPENAI_API_ENDPOINT: string = process.env.OPENAI_API_ENDPOINT || ''
const OPENAI_API_KEY: string = process.env.OPENAI_API_KEY || ''

console.log('AI_PROVIDER: ', AI_PROVIDER)

export const sendRequest = async (
  userMessage: string,
  systemMessage: string
): Promise<string> => {
  const endpoint =
    AI_PROVIDER === 'openai' ? OPENAI_API_ENDPOINT : GROQ_API_ENDPOINT
  const apiKey = AI_PROVIDER === 'openai' ? OPENAI_API_KEY : GROQ_API_KEY
  const model =
    AI_PROVIDER === 'openai' ? 'gpt-4o-mini' : 'llama-3.1-70b-versatile'

  if (!endpoint || !apiKey) {
    console.error('Endpoint or API key is missing')
    return 'Endpoint or API key is missing'
  }

  let tries = 1
  while (tries <= 4) {
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
    } catch (err: AxiosError | any) {
      console.log('Api error: ', err?.response || err)
      if (err?.status === 429) {
        // Too many requests
        await sleep(10000)
        tries++
        continue
      }

      return 'Api error'
    }
  }

  return 'Api error'
}
