import { createClient } from '@/lib/supabase/server'
import { createEditor } from '@/app/actions/create-editor'
import { redirect } from 'next/navigation'

export default async function EditorsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'owner') redirect('/dashboard')

  const { data: editors } = await supabase
    .from('profiles')
    .select('id, full_name, created_at')
    .eq('role', 'editor')
    .order('created_at', { ascending: false })

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-semibold">Editors</h1>
      </div>

      {/* Add editor form */}
      <div className="bg-white border rounded-xl p-6 mb-8">
        <h2 className="text-base font-medium mb-4">Add new editor</h2>
        <form action={createEditor} className="flex flex-col gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700">Full name</label>
            <input
              name="full_name"
              type="text"
              required
              placeholder="Juan dela Cruz"
              className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Email</label>
            <input
              name="email"
              type="email"
              required
              placeholder="juan@example.com"
              className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Password</label>
            <input
              name="password"
              type="password"
              required
              minLength={6}
              placeholder="••••••••"
              className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-black text-white py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition"
          >
            Create editor account
          </button>
        </form>
      </div>

      {/* Editors list */}
      <h2 className="text-base font-medium mb-4">All editors ({editors?.length ?? 0})</h2>
      {editors?.length === 0 && (
        <p className="text-sm text-gray-400">No editors yet. Add one above.</p>
      )}
      <div className="flex flex-col gap-2">
        {editors?.map(editor => (
          <div key={editor.id} className="bg-white border rounded-xl px-5 py-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-sm font-medium text-gray-600 flex-shrink-0">
              {editor.full_name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-medium">{editor.full_name}</p>
              <p className="text-xs text-gray-400 mt-0.5">
                Added {new Date(editor.created_at).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' })}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}