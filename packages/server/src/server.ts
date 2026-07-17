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
    // Test database connection
    const dbConnected = await testConnection()
    if (!dbConnected) {
      console.error('❌ Database connection failed. Please ensure PostgreSQL is running.')
      console.error('   Run: docker-compose up -d')
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
