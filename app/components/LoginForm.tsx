// app/components/LoginForm.tsx
'use client';

import { useRef } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function LoginForm() {
  const username = useRef("");
  const password = useRef("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    signIn('credentials', {
      redirect: false,
      username: username.current,
      password: password.current,
    })
    .then(r => {
      if (r?.ok) {
        router.push('/note-de-frais');
      } else {
        throw new Error('Une erreur est survenue', {cause: r});
      }
    })
    .catch(e => console.log(e))
    ;
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Username"
        onChange={(e) => username.current = e.target.value}
      />
      <input
        type="password"
        placeholder="Password"
        onChange={(e) => password.current = e.target.value}
      />
      <button type="submit">Login</button>
    </form>
  );
}