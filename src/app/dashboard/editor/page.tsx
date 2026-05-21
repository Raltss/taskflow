import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { startTask, submitTask, startRevision, submitRevision } from '@/app/actions/tasks'
import StageBadge from '@/components/stage-badge'

export default async function EditorDashboard() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'editor') redirect('/dashboard')

  const { data: tasks } = await supabase
    .from('tasks')
    .select('*')
    .eq('assigned_to', user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-semibold mb-8">My Tasks</h1>

      {tasks?.length === 0 && (
        <p className="text-sm text-gray-400">No tasks assigned to you yet.</p>
      )}

      <div className="flex flex-col gap-4">
        {tasks?.map(task => (
          <div key={task.id} className="bg-white border rounded-xl p-5">

            {/* Header */}
            <div className="flex items-start justify-between gap-4 mb-3">
              <div>
                <p className="font-medium text-sm">{task.title}</p>
                {task.description && (
                  <p className="text-sm text-gray-500 mt-1">{task.description}</p>
                )}
              </div>
              <StageBadge stage={task.stage} />
            </div>

            {/* Meta */}
            <div className="flex flex-wrap gap-3 text-xs text-gray-400 mb-4">
              {task.due_date && <span>📅 Due {new Date(task.due_date).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}</span>}
              {task.upload_link && <a href={task.upload_link} target="_blank" className="text-blue-500 hover:underline">📤 Upload here</a>}
              {task.asset_link && <a href={task.asset_link} target="_blank" className="text-blue-500 hover:underline">📁 Assets</a>}
            </div>

            {/* Feedback from owner */}
            {task.feedback && task.stage === 'feedback_given' && (
              <div className="bg-orange-50 border border-orange-100 rounded-lg px-4 py-3 mb-4">
                <p className="text-xs font-medium text-orange-700 mb-1">Feedback from owner</p>
                <p className="text-sm text-orange-800">{task.feedback}</p>
              </div>
            )}

            {/* Actions */}

            {/* Pending → In Progress */}
            {task.stage === 'pending' && (
              <form action={startTask}>
                <input type="hidden" name="task_id" value={task.id} />
                <button type="submit"
                  className="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-sm hover:bg-blue-700 transition">
                  Start task
                </button>
              </form>
            )}

            {/* In Progress → Needs Review */}
            {task.stage === 'in_progress' && (
              <form action={submitTask} className="flex flex-col gap-2 border-t pt-3">
                <input type="hidden" name="task_id" value={task.id} />
                <input name="submission_link" type="url" required
                  placeholder="Paste your submission link..."
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black" />
                <button type="submit"
                  className="self-end bg-purple-600 text-white px-4 py-1.5 rounded-lg text-sm hover:bg-purple-700 transition">
                  Submit for review
                </button>
              </form>
            )}

            {/* Feedback Given → Working on Revisions */}
            {task.stage === 'feedback_given' && (
              <form action={startRevision}>
                <input type="hidden" name="task_id" value={task.id} />
                <button type="submit"
                  className="bg-indigo-600 text-white px-4 py-1.5 rounded-lg text-sm hover:bg-indigo-700 transition">
                  Start revision
                </button>
              </form>
            )}

            {/* Working on Revisions → Done with Revisions */}
            {task.stage === 'working_on_revisions' && (
              <form action={submitRevision} className="flex flex-col gap-2 border-t pt-3">
                <input type="hidden" name="task_id" value={task.id} />
                <input name="submission_link" type="url" required
                  placeholder="Paste your revised submission link..."
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black" />
                <button type="submit"
                  className="self-end bg-green-600 text-white px-4 py-1.5 rounded-lg text-sm hover:bg-green-700 transition">
                  Submit revision
                </button>
              </form>
            )}

          </div>
        ))}
      </div>
    </div>
  )
}