'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const ownerLinks = [
  { href: '/dashboard/owner', label: 'Overview', icon: '⊞' },
  { href: '/dashboard/owner/projects', label: 'Projects', icon: '📁' },
  { href: '/dashboard/owner/editors', label: 'Editors', icon: '👥' },
  { href: '/dashboard/owner/tasks', label: 'Tasks', icon: '✓' },
]

const editorLinks = [
  { href: '/dashboard/editor', label: 'My Tasks', icon: '✓' },
]

export default function Sidebar({ role }: { role: 'owner' | 'editor' }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const links = role === 'owner' ? ownerLinks : editorLinks

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <aside className="w-60 min-h-screen bg-white border-r flex flex-col">
      <div className="px-5 py-5 border-b">
        <h1 className="text-base font-semibold tracking-tight">TaskFlow</h1>
        <p className="text-xs text-gray-400 mt-0.5 capitalize">{role}</p>
      </div>

      <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
        {links.map(link => (
          <Link
            key={link.href}
            href={link.href}
            className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition
              ${pathname === link.href
                ? 'bg-black text-white'
                : 'text-gray-600 hover:bg-gray-100'
              }`}
          >
            <span>{link.icon}</span>
            {link.label}
          </Link>
        ))}
      </nav>

      <div className="px-3 py-4 border-t">
        <button
          onClick={handleLogout}
          className="w-full text-left px-3 py-2 text-sm text-gray-500 hover:bg-gray-100 rounded-lg transition"
        >
          Sign out
        </button>
      </div>
    </aside>
  )
}