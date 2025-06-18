/* eslint-disable @typescript-eslint/ban-ts-comment */
import useSWR from 'swr'

export type CurrentUser = {
  uuid:     string
  username: string
  role:     string
}

const fetcher = (url: string) =>
  fetch(url, {
    credentials: 'include',
  }).then(res => {
    if (!res.ok) {
      const err = new Error('Not authenticated')
      // @ts-ignore
      err.status = res.status
      throw err
    }
    return res.json() as Promise<CurrentUser>
  })

export function useCurrentUser() {
  const { data, error, mutate } = useSWR<CurrentUser>('/api/me', fetcher)
  return {
    user:            data,
    loading:         !error && !data,
    error,
    isAuthenticated: !!data,
    isAdmin:         data?.role === 'admin',
    refresh:         () => mutate(),
  }
}
