import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function OwnerDashboard() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
  .from('profiles')
  .select('role')
  .eq('id', user.id)
  .single()

  if (profile?.role !== 'owner') redirect('/dashboard')

  const { data: projects } = await supabase
    .from('projects')
    .select('*, tasks(count)')
    .order('created_at', { ascending: false })

  const { data: editors } = await supabase
    .from('profiles')
    .select('id, full_name')
    .eq('role', 'editor')

  const { data: tasks } = await supabase
    .from('tasks')
    .select('*, profiles(full_name), projects(title)')
    .order('created_at', { ascending: false })

  return (
    <div className="max-w-5xl mx-auto">
      <h1 className="text-2xl font-semibold mb-8">Dashboard</h1>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-10">
        <div className="bg-white border rounded-xl p-5">
          <p className="text-sm text-gray-400">Projects</p>
          <p className="text-3xl font-semibold mt-1">{projects?.length ?? 0}</p>
        </div>
        <div className="bg-white border rounded-xl p-5">
          <p className="text-sm text-gray-400">Editors</p>
          <p className="text-3xl font-semibold mt-1">{editors?.length ?? 0}</p>
        </div>
        <div className="bg-white border rounded-xl p-5">
          <p className="text-sm text-gray-400">Total Tasks</p>
          <p className="text-3xl font-semibold mt-1">{tasks?.length ?? 0}</p>
        </div>
      </div>

      {/* Editors list */}
      <section className="mb-10">
        <h2 className="text-base font-medium mb-4">Editors</h2>
        {editors?.length === 0 && (
          <p className="text-sm text-gray-400">No editors yet.</p>
        )}
        <div className="flex flex-col gap-2">
          {editors?.map(editor => (
            <div key={editor.id} className="bg-white border rounded-xl px-5 py-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm font-medium text-gray-600">
                {editor.full_name?.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm">{editor.full_name}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Tasks */}
      <section>
        <h2 className="text-base font-medium mb-4">All Tasks</h2>
        {tasks?.length === 0 && (
          <p className="text-sm text-gray-400">No tasks yet.</p>
        )}
        <div className="flex flex-col gap-2">
          {tasks?.map(task => (
            <div key={task.id} className="bg-white border rounded-xl px-5 py-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{task.title}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {task.projects?.title} {task.profiles?.full_name ? `· ${task.profiles.full_name}` : '· Unassigned'}
                </p>
              </div>
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium
                ${task.status === 'done' ? 'bg-green-50 text-green-700' :
                  task.status === 'in_progress' ? 'bg-blue-50 text-blue-700' :
                  task.status === 'review' ? 'bg-yellow-50 text-yellow-700' :
                  'bg-gray-100 text-gray-500'}`}>
                {task.status.replace('_', ' ')}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}