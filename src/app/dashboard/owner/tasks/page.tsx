import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { createTask, assignTask, giveFeedback, markDone, cancelTask } from '@/app/actions/tasks'
import StageBadge from '@/components/stage-badge'

export default async function OwnerTasksPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  if (profile?.role !== 'owner') redirect('/dashboard')

  const { data: tasks } = await supabase
    .from('tasks')
    .select('*, profiles(full_name)')
    .order('created_at', { ascending: false })

  const { data: editors } = await supabase
    .from('profiles')
    .select('id, full_name')
    .eq('role', 'editor')

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-semibold mb-8">Tasks</h1>

      {/* Create task form */}
      <div className="bg-white border rounded-xl p-6 mb-10">
        <h2 className="text-base font-medium mb-4">Create new task</h2>
        <form action={createTask} className="flex flex-col gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700">Title</label>
            <input
              name="title"
              type="text"
              required
              placeholder="e.g. Edit vlog episode 12"
              className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Description / Notes</label>
            <textarea
              name="description"
              rows={3}
              placeholder="Instructions, notes, or context for the editor..."
              className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700">
                Upload link <span className="text-gray-400">(where editor submits)</span>
              </label>
              <input
                name="upload_link"
                type="url"
                placeholder="https://drive.google.com/..."
                className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">
                Asset link <span className="text-gray-400">(raw files, references)</span>
              </label>
              <input
                name="asset_link"
                type="url"
                placeholder="https://drive.google.com/..."
                className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700">
                Assign to <span className="text-gray-400">(optional)</span>
              </label>
              <select
                name="assigned_to"
                className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black bg-white"
              >
                <option value="">Unassigned</option>
                {editors?.map(e => (
                  <option key={e.id} value={e.id}>{e.full_name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">
                Due date <span className="text-gray-400">(optional)</span>
              </label>
              <input
                name="due_date"
                type="date"
                className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>
          </div>
          <button
            type="submit"
            className="w-full bg-black text-white py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition"
          >
            Create task
          </button>
        </form>
      </div>

      {/* Task list */}
      <h2 className="text-base font-medium mb-4">All tasks ({tasks?.length ?? 0})</h2>
      {tasks?.length === 0 && (
        <p className="text-sm text-gray-400">No tasks yet.</p>
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
              {task.profiles?.full_name && (
                <span>👤 {task.profiles.full_name}</span>
              )}
              {task.due_date && (
                <span>
                  📅 Due {new Date(task.due_date).toLocaleDateString('en-PH', {
                    month: 'short', day: 'numeric', year: 'numeric'
                  })}
                </span>
              )}
              {task.upload_link && (
                <a href={task.upload_link} target="_blank" className="text-blue-500 hover:underline">
                  📤 Upload folder
                </a>
              )}
              {task.asset_link && (
                <a href={task.asset_link} target="_blank" className="text-blue-500 hover:underline">
                  📁 Assets
                </a>
              )}
              {task.submission_link && (
                <a href={task.submission_link} target="_blank" className="text-green-600 hover:underline">
                  ✅ Submission
                </a>
              )}
            </div>

            {/* Assign (if unassigned) */}
            {task.stage === 'ready_for_editing' && (
              <form action={assignTask} className="flex gap-2 mt-2">
                <input type="hidden" name="task_id" value={task.id} />
                <select
                  name="editor_id"
                  required
                  className="flex-1 border rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-black"
                >
                  <option value="">Select editor...</option>
                  {editors?.map(e => (
                    <option key={e.id} value={e.id}>{e.full_name}</option>
                  ))}
                </select>
                <button
                  type="submit"
                  className="bg-black text-white px-4 py-1.5 rounded-lg text-sm hover:bg-gray-800 transition"
                >
                  Assign
                </button>
              </form>
            )}

            {/* Owner actions — only on needs_review */}
            {task.stage === 'needs_review' && (
              <div className="border-t pt-4 mt-2 flex flex-col gap-3">

                {/* Mark as done */}
                <form action={markDone}>
                  <input type="hidden" name="task_id" value={task.id} />
                  <button
                    type="submit"
                    className="bg-green-600 text-white px-4 py-1.5 rounded-lg text-sm hover:bg-green-700 transition"
                  >
                    Mark as done
                  </button>
                </form>

                {/* Give feedback */}
                <form action={giveFeedback} className="flex flex-col gap-2">
                  <input type="hidden" name="task_id" value={task.id} />
                  <textarea
                    name="feedback"
                    rows={2}
                    required
                    placeholder="Write your feedback..."
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                  />
                  <button
                    type="submit"
                    className="self-end bg-orange-500 text-white px-4 py-1.5 rounded-lg text-sm hover:bg-orange-600 transition"
                  >
                    Give feedback
                  </button>
                </form>

              </div>
            )}

            {/* Show existing feedback */}
            {task.feedback && ['feedback_given', 'working_on_revisions'].includes(task.stage) && (
              <div className="mt-3 border-t pt-3">
                <p className="text-xs font-medium text-gray-500 mb-1">Feedback</p>
                <p className="text-sm text-gray-700">{task.feedback}</p>
              </div>
            )}

            {/* Cancel button — available on any active stage */}
            {!['done', 'cancelled'].includes(task.stage) && (
              <form action={cancelTask} className="mt-3">
                <input type="hidden" name="task_id" value={task.id} />
                <button
                  type="submit"
                  className="text-xs text-red-500 hover:text-red-700 hover:underline transition"
                >
                  Cancel task
                </button>
              </form>
            )}

          </div>
        ))}
      </div>
    </div>
  )
}