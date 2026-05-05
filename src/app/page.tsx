'use client'

import Link from 'next/link'

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <div className="text-center max-w-2xl mx-auto">
        <h1 className="text-5xl font-bold text-gray-900 mb-4">Salesly</h1>
        <p className="text-xl text-gray-600 mb-8">
          Practice sales interviews. Get instant AI feedback. Master objection handling.
        </p>
        <Link
          href="/auth/login"
          className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-lg font-semibold transition"
        >
          Get Started →
        </Link>
      </div>
    </div>
  )
}
