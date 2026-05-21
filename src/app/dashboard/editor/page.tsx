import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function EditorDashboard() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
  .from('profiles')
  .select('role')
  .eq('id', user.id)
  .single()

  if (profile?.role !== 'editor') redirect('/dashboard')
  const { data: tasks } = await supabase
    .from('tasks')
    .select('*, projects(title)')
    .eq('assigned_to', user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-semibold mb-8">My Tasks</h1>

      {tasks?.length === 0 && (
        <p className="text-sm text-gray-400">No tasks assigned to you yet.</p>
      )}

      <div className="flex flex-col gap-3">
        {tasks?.map(task => (
          <div key={task.id} className="bg-white border rounded-xl px-5 py-4">
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm font-medium">{task.title}</p>
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium
                ${task.status === 'done' ? 'bg-green-50 text-green-700' :
                  task.status === 'in_progress' ? 'bg-blue-50 text-blue-700' :
                  task.status === 'review' ? 'bg-yellow-50 text-yellow-700' :
                  'bg-gray-100 text-gray-500'}`}>
                {task.status.replace('_', ' ')}
              </span>
            </div>
            <p className="text-xs text-gray-400">{task.projects?.title}</p>
            {task.description && (
              <p className="text-sm text-gray-500 mt-2">{task.description}</p>
            )}
            {task.due_date && (
              <p className="text-xs text-gray-400 mt-2">Due: {task.due_date}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}