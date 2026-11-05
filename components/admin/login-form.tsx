'use client'

import { useActionState } from 'react'
import { login, type LoginState } from '@/app/admin/actions'

const INITIAL_STATE: LoginState = { error: '' }

export function LoginForm() {
  const [state, action, pending] = useActionState(login, INITIAL_STATE)

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-sm flex-col justify-center px-4 py-10">
      <p className="text-[13px] font-semibold uppercase tracking-[0.2em]">
        Panel del evento
      </p>
      <h1 className="mt-1 font-serif text-4xl italic">Los 15 de Ángela</h1>

      <form action={action} className="mt-8">
        <label htmlFor="pin" className="block text-base font-semibold">
          PIN de acceso
        </label>
        <input
          id="pin"
          name="pin"
          type="password"
          inputMode="numeric"
          autoComplete="current-password"
          required
          maxLength={32}
          aria-invalid={Boolean(state.error)}
          aria-describedby={state.error ? 'pin-error' : undefined}
          className="mt-2 min-h-12 w-full rounded-lg border-2 border-[#14110f] bg-[#fffdf8] px-3 text-base focus:outline-none focus-visible:ring-2 focus-visible:ring-[#14110f] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f5efe3]"
        />
        {state.error && (
          <p
            id="pin-error"
            role="alert"
            data-error
            className="mt-3 text-base font-semibold text-[#8f1022]"
          >
            {state.error}
          </p>
        )}
        <button
          type="submit"
          disabled={pending}
          className="mt-4 min-h-12 w-full rounded-lg bg-[#14110f] px-4 text-base font-semibold text-[#f5efe3] transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-[#14110f] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f5efe3] disabled:opacity-60"
        >
          {pending ? 'Ingresando…' : 'Ingresar'}
        </button>
      </form>
    </main>
  )
}
