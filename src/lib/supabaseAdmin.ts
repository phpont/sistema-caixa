// lib/supabaseAdmin.ts
import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl: string = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceRoleKey: string = process.env.SUPABASE_SERVICE_ROLE_KEY!

export const supabaseAdmin: SupabaseClient = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false
  }
})
