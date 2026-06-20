'use client'

import React from 'react'

interface State { hasError: boolean; message: string }

export default class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  state: State = { hasError: false, message: '' }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-8">
          <div className="bg-white rounded-2xl border border-red-100 p-8 max-w-md w-full text-center shadow-sm">
            <div className="text-4xl mb-4">⚠️</div>
            <h2 className="text-lg font-bold text-gray-900 mb-2">Nešto je pošlo naopako</h2>
            <p className="text-gray-500 text-sm mb-6">Osvežite stranicu ili se vratite na početnu.</p>
            <div className="flex gap-3">
              <button
                onClick={() => window.location.reload()}
                className="flex-1 bg-[#1e3a8a] text-white py-2.5 rounded-xl font-semibold text-sm"
              >
                Osveži stranicu
              </button>
              <a href="/home" className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center">
                Početna
              </a>
            </div>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
