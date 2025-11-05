'use server';

export async function submitForm(_previousState: unknown, formData: FormData) {
  // Mimic a server response
  await new Promise((resolve) => {
    setTimeout(resolve, 1000);
  });

  try {
    const username = formData.get('username') as string | null;

    if (username === 'admin') {
      return { success: false, serverErrors: { username: "'admin' is reserved for system use" } };
    }

    // 50% chance the username is taken
    const success = Math.random() > 0.5;

    if (!success) {
      return {
        success: false,
        serverErrors: { username: `${username} is unavailable` },
      };
    }
  } catch {
    return { success: false, serverErrors: { username: 'A server error has occurred' } };
  }

  return { success: true };
}
