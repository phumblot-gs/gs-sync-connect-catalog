import AuthForm from '@/components/Auth/AuthForm'
import EnvironmentBanner from '@/components/EnvironmentBanner'

export const dynamic = 'force-dynamic'

export default function LoginPage() {
  return (
    <>
      <EnvironmentBanner />
      <AuthForm />
    </>
  )
} 