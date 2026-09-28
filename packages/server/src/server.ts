// Loads the repo-root .env — must stay the first import (see env.ts)
import { envPath } from './env.js'
import Fastify from 'fastify'
import cors from '@fastify/cors'
import { agentChatRoute } from './routes/agent-chat.js'
import { testConnection } from './libs/db.js'

const fastify = Fastify({
  logger: true,
})

// Register CORS
await fastify.register(cors, {
  origin: true,
  credentials: true,
})

// Register routes
await fastify.register(agentChatRoute, { prefix: '/api/agent' })

// Health check
fastify.get('/health', async () => {
  return { status: 'ok', timestamp: new Date().toISOString() }
})

// Start server
const start = async () => {
  try {
    // Warn early — an empty key otherwise only surfaces as an opaque upstream error
    if (!process.env.DASHSCOPE_API_KEY) {
      console.warn('⚠️  DASHSCOPE_API_KEY is not set — AI requests will fail.')
      console.warn(`   Add it to ${envPath} (see .env.example).`)
    }

    // Test database connection
    const dbConnected = await testConnection()
    if (!dbConnected) {
      console.error('❌ Database connection failed. Please ensure PostgreSQL is running.')
      console.error('   Run: docker compose up -d   (older Docker CLI: docker-compose up -d)')
      console.error(`   Or point DATABASE_URL in ${envPath} at another PostgreSQL instance.`)
      process.exit(1)
    }

    const port = Number(process.env.PORT) || 3000
    await fastify.listen({ port, host: '0.0.0.0' })
    console.log(`🚀 Server running on http://localhost:${port}`)
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}

start()
