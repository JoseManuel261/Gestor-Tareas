'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function Home() {
  useEffect(() => {
    window.location.href = '/login'
  }, [])

  return null
}