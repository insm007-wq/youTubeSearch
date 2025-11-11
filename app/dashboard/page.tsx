'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Search from './search'

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  if (status === 'loading') {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <div>로딩 중...</div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '1rem',
        borderBottom: '1px solid #e5e7eb'
      }}>
        <div>
          {session.user?.image && (
            <img
              src={session.user.image}
              alt={session.user.name || 'User'}
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                marginRight: '0.5rem'
              }}
            />
          )}
          <span>{session.user?.name || session.user?.email}</span>
        </div>
        <button
          onClick={() => signOut({ redirectTo: '/login' })}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#f3f4f6',
            border: '1px solid #d1d5db',
            borderRadius: '0.5rem',
            cursor: 'pointer'
          }}
        >
          로그아웃
        </button>
      </div>
      <Search />
    </div>
  )
}
