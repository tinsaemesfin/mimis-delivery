// import { Redirect } from 'expo-router';

// export default function Index() {
//   return <Redirect href="/sign-in" />;
// } 

import { useState, useEffect } from 'react'
import { supabase } from '@/utils/supabase'
import Auth from '@/app/components/auth/Auth'
import Account from '@/app/components/auth/Account'
import { View } from 'react-native'
import { Session } from '@supabase/supabase-js'

export default function App() {
  const [session, setSession] = useState<Session | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
  }, [])

  return (
    <View>
      {session && session.user ? <Account key={session.user.id} session={session} /> : <Auth />}
    </View>
  )
}