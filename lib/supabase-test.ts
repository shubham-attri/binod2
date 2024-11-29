import { supabase } from './supabase-client'

export async function testConnection() {
  try {
    const { data, error } = await supabase.from('cases').select('count')
    if (error) {
      console.error('Supabase connection error:', error.message)
      return false
    }
    console.log('Supabase connection successful')
    return true
  } catch (error) {
    console.error('Supabase connection failed:', error)
    return false
  }
}

// Optional: Add environment variable validation
export function validateEnv() {
  const requiredEnvVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'NEXT_PUBLIC_API_URL'
  ]

  const missingEnvVars = requiredEnvVars.filter(
    envVar => !process.env[envVar]
  )

  if (missingEnvVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingEnvVars.join(', ')}`
    )
  }
} 