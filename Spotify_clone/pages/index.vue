<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-900 to-black">
    <div class="text-center">
      <h1 class="text-4xl font-bold mb-8">Welcome to Spotify Clone</h1>
      <div v-if="authStore.isAuthenticated">
        <p class="mb-4">Logged in as: <strong>{{ authStore.user?.display_name }}</strong></p>
        <img v-if="authStore.user?.images?.[0]?.url" :src="authStore.user.images[0].url" alt="Profile" class="mx-auto rounded-full w-24 h-24 mb-4" />
        <button @click="logout" class="btn-spotify">Logout</button>
      </div>
      <div v-else>
        <button
          @click="login"
          class="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-8 rounded-full transition-colors duration-200"
        >
          Login with Spotify
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const config = useRuntimeConfig()
const authStore = useAuthStore()

const login = () => {
  const scope = [
    'user-read-email',
    'user-read-private',
    'user-read-playback-state',
    'user-modify-playback-state',
    'user-read-currently-playing',
    'user-read-recently-played',
    'user-top-read',
    'playlist-read-private',
    'playlist-read-collaborative',
    'playlist-modify-public',
    'playlist-modify-private',
    'streaming'
  ].join(' ')

  const params = new URLSearchParams({
    client_id: config.public.spotifyClientId,
    response_type: 'code',
    redirect_uri: config.public.spotifyRedirectUri,
    scope
  })

  window.location.href = `https://accounts.spotify.com/authorize?${params.toString()}`
}

const logout = () => {
  authStore.logout()
  window.location.reload()
}
</script>