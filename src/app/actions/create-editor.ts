'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function createEditor(formData: FormData) {
  const supabase = await createClient()

  // Make sure the caller is an owner
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'owner') {
    throw new Error('Unauthorized')
  }

  const fullName = formData.get('full_name') as string
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const admin = createAdminClient()

  // Create the auth user
  const { data: newUser, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName }
  })

  if (createError) {
    throw new Error(createError.message)
  }

  // Profile is auto-created by the trigger we set up earlier
  // But we update it just to be safe
  await admin.from('profiles').upsert({
    id: newUser.user.id,
    full_name: fullName,
    role: 'editor'
  })
}