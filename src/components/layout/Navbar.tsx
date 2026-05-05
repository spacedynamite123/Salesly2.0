'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useUser } from '@/hooks/useUser'

export function Navbar() {
  const { user } = useUser()
  const router = useRouter()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <nav className="bg-white shadow">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link href="/dashboard" className="text-2xl font-bold text-indigo-600">
          Salesly
        </Link>
        <div className="flex gap-6 items-center">
          <Link href="/dashboard/practice" className="text-gray-600 hover:text-gray-900 transition">
            Practice
          </Link>
          <Link href="/dashboard/history" className="text-gray-600 hover:text-gray-900 transition">
            History
          </Link>
          <div className="flex items-center gap-4 pl-4 border-l border-gray-200">
            <span className="text-sm text-gray-600">{user?.email}</span>
            <button
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded text-sm font-semibold transition"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}
