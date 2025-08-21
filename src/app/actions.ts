"use server";

import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

const secretKey = process.env.JWT_SECRET!;
const key = new TextEncoder().encode(secretKey);

export async function encrypt(payload: any) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('1h')
    .sign(key);
}

export async function decrypt(input: string): Promise<any> {
  try {
    const { payload } = await jwtVerify(input, key, {
      algorithms: ['HS256'],
    });
    return payload;
  } catch (error) {
    console.error("Decryption error:", error);
    return null;
  }
}

export async function login(formData: FormData) {
  const password = formData.get('password');

  // 1. Check if the password matches the one in your environment variables
  if (password === process.env.NEXT_PUBLIC_DASHBOARD_PASSWORD) {
    // 2. If it matches, create a session object.
    // We can add any data we want here, but for this case, it's simple.
    const session = { isLoggedIn: true, createdAt: Date.now() };

    // 3. Encrypt the session to create a secure token
    const encryptedSession = await encrypt(session);

    // 4. Save the token in a cookie.
    // 'httpOnly' makes it inaccessible to client-side JavaScript, which is more secure.
    (await
      // 4. Save the token in a cookie.
      // 'httpOnly' makes it inaccessible to client-side JavaScript, which is more secure.
      cookies()).set('session', encryptedSession, { httpOnly: true
        , secure: process.env.NODE_ENV === 'production'
        , maxAge: 60 * 60});

    // 5. Redirect the user to the protected dashboard page
    redirect('/dashboard');
  }

  // If the password does not match, you could redirect back with an error
  // For simplicity, we'll just redirect back to the login page.
  redirect('/?error=InvalidPassword');
}

export async function logout() {
  (await
    cookies()).set('session', '', { expires: new Date(0) });
  redirect('/');
}