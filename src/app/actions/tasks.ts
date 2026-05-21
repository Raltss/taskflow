'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

async function requireOwner() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'owner') throw new Error('Unauthorized')
  return supabase
}

async function requireEditor() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  return { supabase, userId: user.id }
}

// Owner: create a task
export async function createTask(formData: FormData) {
  const supabase = await requireOwner()

  const assignedTo = formData.get('assigned_to') as string | null

  const { error } = await supabase.from('tasks').insert({
    title: formData.get('title') as string,
    description: formData.get('description') as string,
    due_date: formData.get('due_date') || null,
    upload_link: formData.get('upload_link') as string,
    asset_link: formData.get('asset_link') as string,
    assigned_to: assignedTo || null,
    stage: assignedTo ? 'pending' : 'ready_for_editing',
  })

  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/owner/tasks')
}

// Owner: assign task to editor (auto moves to pending)
export async function assignTask(formData: FormData) {
  const supabase = await requireOwner()

  const { error } = await supabase
    .from('tasks')
    .update({
      assigned_to: formData.get('editor_id') as string,
      stage: 'pending'
    })
    .eq('id', formData.get('task_id') as string)

  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/owner/tasks')
}

// Owner: give feedback → feedback_given (only from needs_review)
export async function giveFeedback(formData: FormData) {
  const supabase = await requireOwner()

  const { error } = await supabase
    .from('tasks')
    .update({
      feedback: formData.get('feedback') as string,
      stage: 'feedback_given'
    })
    .eq('id', formData.get('task_id') as string)
    .eq('stage', 'needs_review')

  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/owner/tasks')
}

// Owner: mark as done (only from needs_review)
export async function markDone(formData: FormData) {
  const supabase = await requireOwner()

  const { error } = await supabase
    .from('tasks')
    .update({ stage: 'done' })
    .eq('id', formData.get('task_id') as string)
    .eq('stage', 'needs_review')

  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/owner/tasks')
}

// Owner: cancel a task (from any stage except done)
export async function cancelTask(formData: FormData) {
  const supabase = await requireOwner()

  const { error } = await supabase
    .from('tasks')
    .update({ stage: 'cancelled' })
    .eq('id', formData.get('task_id') as string)
    .not('stage', 'eq', 'done')

  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/owner/tasks')
}

// Editor: pending → in_progress
export async function startTask(formData: FormData) {
  const { supabase, userId } = await requireEditor()

  const { error } = await supabase
    .from('tasks')
    .update({ stage: 'in_progress' })
    .eq('id', formData.get('task_id') as string)
    .eq('assigned_to', userId)
    .eq('stage', 'pending')

  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/editor')
}

// Editor: in_progress → needs_review
export async function submitTask(formData: FormData) {
  const { supabase, userId } = await requireEditor()

  const { error } = await supabase
    .from('tasks')
    .update({
      submission_link: formData.get('submission_link') as string,
      stage: 'needs_review'
    })
    .eq('id', formData.get('task_id') as string)
    .eq('assigned_to', userId)
    .eq('stage', 'in_progress')

  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/editor')
}

// Editor: feedback_given → working_on_revisions
export async function startRevision(formData: FormData) {
  const { supabase, userId } = await requireEditor()

  const { error } = await supabase
    .from('tasks')
    .update({ stage: 'working_on_revisions' })
    .eq('id', formData.get('task_id') as string)
    .eq('assigned_to', userId)
    .eq('stage', 'feedback_given')

  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/editor')
}

// Editor: working_on_revisions → needs_review (loops back, owner decides done)
export async function submitRevision(formData: FormData) {
  const { supabase, userId } = await requireEditor()

  const { error } = await supabase
    .from('tasks')
    .update({
      submission_link: formData.get('submission_link') as string,
      stage: 'needs_review'
    })
    .eq('id', formData.get('task_id') as string)
    .eq('assigned_to', userId)
    .eq('stage', 'working_on_revisions')

  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/editor')
}