import axios from 'axios';
import { auth, signOut } from '@/auth';
import { redirect } from 'next/navigation';

const API_URL = process.env.API_URL;

export async function createServerAxios() {
  const session = await auth();

  if (session?.error) {
    await signOut({ redirect: false });
    redirect('/login');
  }

  const instance = axios.create({
    baseURL: API_URL,
    headers: {
      ...(session?.accessToken ? { Authorization: `Bearer ${session.accessToken}` } : {}),
    },
    validateStatus: () => true,
  });

  instance.interceptors.response.use(async (response) => {
    if (response.status === 503) {
      if (session?.user) {
        await signOut({ redirect: false });
      }
      redirect('/maintenance');
    }
    return response;
  });

  return instance;
}
