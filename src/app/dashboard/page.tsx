'use client'

import Link from 'next/link'

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Welcome to Salesly</h1>
        <p className="text-lg text-gray-600">
          Practice sales scenarios and get instant AI feedback to improve your skills.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link
          href="/dashboard/practice"
          className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition cursor-pointer"
        >
          <div className="text-4xl mb-2">🎤</div>
          <h2 className="text-xl font-bold mb-2">Start Practicing</h2>
          <p className="text-gray-600">Select a sales scenario and record your response</p>
        </Link>

        <Link
          href="/dashboard/history"
          className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition cursor-pointer"
        >
          <div className="text-4xl mb-2">📊</div>
          <h2 className="text-xl font-bold mb-2">View History</h2>
          <p className="text-gray-600">Review your past attempts and track your progress</p>
        </Link>
      </div>

      <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">💡 How it works</h3>
        <ol className="list-decimal list-inside space-y-2 text-blue-800">
          <li>Choose a sales scenario (cold call, objection handling, discovery, etc.)</li>
          <li>Record your spoken response (up to 2 minutes)</li>
          <li>AI transcribes and evaluates your response</li>
          <li>Get detailed feedback and a score</li>
          <li>Track your improvement over time</li>
        </ol>
      </div>
    </div>
  )
}
