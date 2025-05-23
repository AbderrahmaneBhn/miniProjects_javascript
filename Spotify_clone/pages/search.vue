<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAuthStore } from '~/stores/auth'

const searchQuery = ref('')
const searchResults = ref<any[]>([])
const isLoading = ref(false)
const authStore = useAuthStore()

const playlists = ref<any[]>([])
const showDropdown = ref<string | null>(null) // Track ID for which dropdown is open
const playlistsError = ref('')

// Function to get image URL with fallback
const getImageUrl = (item: any) => {
  if (item.type === 'track' && item.album && item.album.images && item.album.images.length > 0) {
    return item.album.images[0].url
  } else if (item.images && item.images.length > 0) {
    return item.images[0].url
  }
  return '/placeholder-album.png' // Fallback image
}

// Fetch user playlists on mount
onMounted(async () => {
  await loadPlaylists()
})

const loadPlaylists = async () => {
  if (authStore.spotifyApi && authStore.isAuthenticated) {
    try {
      const response = await authStore.spotifyApi.getUserPlaylists()
      playlists.value = response.body.items
      playlistsError.value = ''
      console.log('Loaded playlists:', playlists.value)
    } catch (error) {
      playlistsError.value = 'Failed to load playlists. Please re-login or check your permissions.'
      console.error('Error fetching playlists:', error)
    }
  } else {
    playlistsError.value = 'You must be logged in to load playlists.'
    console.warn('Not authenticated or Spotify API not initialized.')
  }
}

const handleSearch = async () => {
  if (!searchQuery.value.trim()) {
    searchResults.value = []
    return
  }

  isLoading.value = true
  try {
    if (authStore.spotifyApi) {
      const results = await authStore.spotifyApi.search(searchQuery.value, ['track', 'artist', 'album'], { limit: 20 })
      searchResults.value = [
        ...results.body.tracks?.items || [],
        ...results.body.artists?.items || [],
        ...results.body.albums?.items || []
      ]
      console.log('Search results:', searchResults.value) // Log results to check image URLs
    }
  } catch (error) {
    console.error('Search error:', error)
  } finally {
    isLoading.value = false
  }
}

const addToPlaylist = async (playlistId: string, trackUri: string) => {
  console.log('Adding to playlist:', playlistId, trackUri)
  if (!authStore.spotifyApi) {
    alert('Spotify API not initialized. Please log in again.')
    return
  }
  try {
    await authStore.spotifyApi.addTracksToPlaylist(playlistId, [trackUri])
    alert('Track added to playlist!')
    showDropdown.value = null

    // Update the track count locally for instant feedback
    const playlist = playlists.value.find(p => p.id === playlistId)
    if (playlist) {
      playlist.tracks.total += 1
    }
  } catch (error: any) {
    let message = 'Failed to add track to playlist.'
    if (error && error.body && error.body.error && error.body.error.message) {
      message += '\n' + error.body.error.message
    }
    alert(message)
    console.error('Add to playlist error:', error)
  }
}
</script>

<template>
  <div class="space-y-6">
    <div class="relative">
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Search for songs, artists, or albums..."
        class="w-full px-4 py-3 bg-gray-800 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-spotify-green"
        @input="handleSearch"
      />
      <span class="material-icons absolute right-4 top-3 text-gray-400">search</span>
    </div>

    <div v-if="playlistsError" class="text-center text-red-400 py-2">
      {{ playlistsError }}
    </div>
    <div v-else-if="playlists.length === 0 && authStore.isAuthenticated" class="text-center text-yellow-400 py-2">
      No playlists loaded. Try refreshing or check your account permissions.
    </div>

    <div v-if="isLoading" class="flex justify-center py-8">
      <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-spotify-green"></div>
    </div>

    <div v-else-if="searchResults.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div
        v-for="item in searchResults"
        :key="item.id"
        class="bg-gray-800 p-4 rounded-lg hover:bg-gray-700 transition-colors"
      >
        <div class="aspect-square bg-gray-700 rounded-lg mb-4 overflow-hidden">
          <img 
            :src="getImageUrl(item)" 
            :alt="item.name" 
            class="w-full h-full object-cover"
            @error="$event.target.src = '/placeholder-album.png'"
          />
        </div>
        <h3 class="font-medium">{{ item.name }}</h3>
        <p class="text-sm text-gray-400">
          <span v-if="item.type === 'track' && item.artists">
            {{ item.artists.map(a => a.name).join(', ') }}
          </span>
          <span v-else-if="item.type === 'album' && item.artists">
            {{ item.artists.map(a => a.name).join(', ') }}
          </span>
          <span v-else>
            {{ item.type }}
          </span>
        </p>
        <a
          v-if="item.type === 'track' && item.external_urls && item.external_urls.spotify"
          :href="item.external_urls.spotify"
          target="_blank"
          rel="noopener"
          class="btn-spotify mt-4 inline-block"
        >
          <span class="material-icons align-middle mr-1">open_in_new</span>
          Play on Spotify
        </a>
        <div v-if="item.type === 'track'" class="mt-2 relative">
          <button
            class="bg-spotify-green hover:bg-green-600 text-white font-bold py-2 px-4 rounded-full transition-colors duration-200 shadow mt-2 flex items-center justify-center"
            @click="() => { console.log('Dropdown opened for', item.id); showDropdown = showDropdown === item.id ? null : item.id }"
          >
            <span class="material-icons align-middle mr-1">playlist_add</span>
            Add to Playlist
          </button>
          <div
            v-if="showDropdown === item.id"
            class="absolute z-10 mt-2 w-56 bg-gray-900 border border-gray-700 rounded shadow-lg"
          >
            <ul>
              <li
                v-for="playlist in playlists"
                :key="playlist.id"
                class="px-4 py-2 hover:bg-spotify-green hover:text-white cursor-pointer transition-colors"
                @click="() => { console.log('Clicked playlist:', playlist.id); addToPlaylist(playlist.id, item.uri) }"
              >
                {{ playlist.name }} <span class="text-xs text-gray-400 ml-2">({{ playlist.tracks.total }} tracks)</span>
              </li>
              <li v-if="playlists.length === 0" class="px-4 py-2 text-gray-400">
                No playlists available
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <div v-else-if="searchQuery" class="text-center py-8 text-gray-400">
      No results found for "{{ searchQuery }}"
    </div>
  </div>
</template>

<style>
.btn-spotify {
  background-color: #22c55e; /* bg-green-500 */
  color: white;
  font-weight: bold;
  padding: 0.5rem 1rem; /* py-2 px-4 */
  border-radius: 9999px; /* rounded-full */
  transition: background-color 200ms ease-in-out;
  box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1); /* shadow */
}

.btn-spotify:hover {
  background-color: #16a34a; /* hover:bg-green-600 */
}
</style>