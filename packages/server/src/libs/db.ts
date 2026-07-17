import postgres from 'postgres'

const connectionString = process.env.DATABASE_URL || 'postgresql://aix:aix123@localhost:5432/aix_chat'

export const sql = postgres(connectionString, {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
})

// Test connection
export async function testConnection() {
  try {
    await sql`SELECT 1`
    console.log('✅ Database connected successfully')
    return true
  } catch (error) {
    console.error('❌ Database connection failed:', error)
    return false
  }
}
