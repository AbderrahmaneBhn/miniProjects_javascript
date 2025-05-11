<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useAuthStore } from '~/stores/auth'
import { usePlayerStore } from '~/stores/player'

const authStore = useAuthStore()
const playerStore = usePlayerStore()
const playlists = ref<any[]>([])
const selectedPlaylist = ref<any>(null)
const playlistTracks = ref<any[]>([])
const isLoading = ref(false)
const newPlaylistName = ref('')
const newPlaylistDesc = ref('')
const errorMsg = ref('')
const refreshCounter = ref(0) // Used to force re-fetching

// Fetch all playlists with fresh data from the API
const fetchPlaylists = async () => {
  isLoading.value = true
  try {
    if (authStore.spotifyApi) {
      console.log('Fetching all playlists...')
      const response = await authStore.spotifyApi.getUserPlaylists({
        limit: 50,
        fields: 'items(id,name,images,tracks(total),owner,public)'
      })
      
      // Log the raw data from API for debugging
      console.log('Raw playlist data from API:', 
        response.body.items.map(p => ({ 
          name: p.name, 
          id: p.id,
          trackCount: p.tracks?.total 
        }))
      )
      
      playlists.value = response.body.items.map(playlist => ({
        ...playlist,
        tracks: {
          total: playlist.tracks?.total || 0
        }
      }))
      errorMsg.value = ''
    }
  } catch (error) {
    errorMsg.value = 'Failed to load playlists.'
    console.error('Error fetching playlists:', error)
  } finally {
    isLoading.value = false
  }
}

// Fetch tracks for a specific playlist
const fetchPlaylistTracks = async (playlistId: string) => {
  isLoading.value = true
  try {
    if (authStore.spotifyApi) {
      console.log(`Fetching tracks for playlist ${playlistId}...`)
      
      // First, get the latest playlist data to ensure we have the correct track count
      const playlistResponse = await authStore.spotifyApi.getPlaylist(playlistId, {
        fields: 'id,name,images,tracks(total)'
      })
      
      const trackResponse = await authStore.spotifyApi.getPlaylistTracks(playlistId, {
        limit: 100,
        fields: 'total,items(track(id,name,uri,artists,album(images)))'
      })
      
      playlistTracks.value = trackResponse.body.items
      
      // Log the track count from both API calls for debugging
      console.log('Track count from playlist API:', playlistResponse.body.tracks.total)
      console.log('Track count from tracks API:', trackResponse.body.total)
      console.log('Actual number of tracks returned:', trackResponse.body.items.length)
      
      // Update the selected playlist with the latest data
      if (selectedPlaylist.value && selectedPlaylist.value.id === playlistId) {
        selectedPlaylist.value = {
          ...selectedPlaylist.value,
          tracks: {
            total: playlistResponse.body.tracks.total
          }
        }
      }
      
      // Also update the playlist in the playlists array
      const playlistIndex = playlists.value.findIndex(p => p.id === playlistId)
      if (playlistIndex !== -1) {
        playlists.value[playlistIndex] = {
          ...playlists.value[playlistIndex],
          tracks: {
            total: playlistResponse.body.tracks.total
          }
        }
      }
      
      errorMsg.value = ''
    }
  } catch (error) {
    errorMsg.value = 'Failed to load playlist tracks.'
    console.error('Error fetching playlist tracks:', error)
  } finally {
    isLoading.value = false
  }
}

// Select a playlist and load its tracks
const selectPlaylist = async (playlist: any) => {
  // Don't re-fetch if it's the same playlist
  if (selectedPlaylist.value?.id === playlist.id) return
  
  console.log(`Selecting playlist: ${playlist.name} with ${playlist.tracks.total} tracks`)
  
  // Make a deep copy of the playlist to avoid reference issues
  selectedPlaylist.value = JSON.parse(JSON.stringify(playlist))
  
  // Fetch the latest tracks and playlist data
  await fetchPlaylistTracks(playlist.id)
  
  // After fetching, refresh the playlists list to ensure consistency
  await fetchPlaylists()
}

// Create a new playlist
const createPlaylist = async () => {
  if (!newPlaylistName.value.trim()) return
  try {
    if (authStore.spotifyApi && authStore.user) {
      await authStore.spotifyApi.createPlaylist(authStore.user.id, {
        name: newPlaylistName.value,
        description: newPlaylistDesc.value,
        public: false
      })
      newPlaylistName.value = ''
      newPlaylistDesc.value = ''
      
      // Refresh playlists after creating a new one
      await fetchPlaylists()
      alert('Playlist created!')
    }
  } catch (error) {
    alert('Failed to create playlist.')
    console.error(error)
  }
}

// Remove a track from the selected playlist
const removeTrack = async (trackUri: string) => {
  if (!selectedPlaylist.value) return
  try {
    console.log(`Removing track ${trackUri} from playlist ${selectedPlaylist.value.id}`)
    
    await authStore.spotifyApi.removeTracksFromPlaylist(
      selectedPlaylist.value.id, 
      [{ uri: trackUri }]
    )
    
    // Force a complete refresh of data
    refreshCounter.value++
    
    // First refresh the tracks in the current playlist
    await fetchPlaylistTracks(selectedPlaylist.value.id)
    
    // Then refresh all playlists to update counts everywhere
    await fetchPlaylists()
    
    console.log('Track removed successfully')
  } catch (error) {
    alert('Failed to remove track.')
    console.error('Error removing track:', error)
  }
}

// Get the image URL for a playlist
const getPlaylistImage = (playlist: any) => {
  if (playlist.images && playlist.images.length > 0) {
    return playlist.images[0].url
  }
  return '/placeholder-album.png'
}

// Delete a playlist
const deletePlaylist = async (playlistId: string) => {
  if (!confirm('Are you sure you want to delete this playlist?')) return
  
  try {
    if (authStore.spotifyApi) {
      console.log(`Deleting playlist ${playlistId}`)
      await authStore.spotifyApi.unfollowPlaylist(playlistId)
      
      // Remove from local state
      playlists.value = playlists.value.filter(p => p.id !== playlistId)
      
      // If the deleted playlist was selected, clear the selection
      if (selectedPlaylist.value?.id === playlistId) {
        selectedPlaylist.value = null
        playlistTracks.value = []
      }
      
      // Refresh all playlists
      await fetchPlaylists()
      
      alert('Playlist deleted successfully')
    }
  } catch (error) {
    console.error('Error deleting playlist:', error)
    alert('Failed to delete playlist')
  }
}

// Get the image URL for a track
const getTrackImage = (item: any) => {
  if (item.track && item.track.album && item.track.album.images && item.track.album.images.length > 0) {
    return item.track.album.images[0].url
  }
  return '/placeholder-album.png'
}

// Play a track
const playTrack = async (trackUri: string) => {
  try {
    // First ensure we have the player initialized
    if (!playerStore.player) {
      await playerStore.initializePlayer()
    }

    // Play the track
    await playerStore.player.play({
      uris: [trackUri]
    })

    // Update UI state
    playerStore.setIsPlaying(true)
    const currentTrack = playlistTracks.value.find(item => item.track.uri === trackUri)?.track
    playerStore.setCurrentTrack(currentTrack || null)
    
  } catch (error) {
    console.error('Error playing track:', error)
    // Fallback to opening in Spotify
    const trackId = trackUri.split(':')[2]
    if (trackId) {
      window.open(`https://open.spotify.com/track/${trackId}`, '_blank')
    } else {
      alert('Could not play track. Please try again.')
    }
  }
}

// Force refresh when refreshCounter changes
watch(refreshCounter, () => {
  fetchPlaylists()
  if (selectedPlaylist.value) {
    fetchPlaylistTracks(selectedPlaylist.value.id)
  }
})

// Add a manual refresh function
const refreshAll = async () => {
  console.log('Manual refresh triggered')
  refreshCounter.value++
}

// Initialize on component mount
onMounted(async () => {
  await fetchPlaylists()
})
</script>

<template>
  <div class="space-y-8 pb-20">
    <div>
      <div class="flex justify-between items-center mb-4">
        <h1 class="text-2xl font-bold">Your Playlists</h1>
        <button 
          @click="refreshAll" 
          class="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-full flex items-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-refresh-cw">
            <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
            <path d="M21 3v5h-5"/>
            <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
            <path d="M3 21v-5h5"/>
          </svg>
          Refresh
        </button>
      </div>
      
      <form @submit.prevent="createPlaylist" class="flex flex-col md:flex-row gap-2 mb-6">
        <input
          v-model="newPlaylistName"
          type="text"
          placeholder="New playlist name"
          class="px-4 py-2 rounded bg-gray-800 text-white"
        />
        <input
          v-model="newPlaylistDesc"
          type="text"
          placeholder="Description (optional)"
          class="px-4 py-2 rounded bg-gray-800 text-white"
        />
        <button
          type="submit"
          class="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded transition-colors"
        >
          Create Playlist
        </button>
      </form>
      
      <div v-if="errorMsg" class="text-center text-red-400 py-2">{{ errorMsg }}</div>
      <div v-if="isLoading" class="text-center text-gray-400">Loading...</div>
      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div
          v-for="playlist in playlists"
          :key="playlist.id"
          class="bg-gray-800 p-4 rounded-lg hover:bg-gray-700 transition-colors cursor-pointer relative"
          @click="selectPlaylist(playlist)"
        >
          <div class="aspect-square bg-gray-700 rounded-lg mb-4 overflow-hidden">
            <img 
              :src="getPlaylistImage(playlist)" 
              :alt="playlist.name" 
              class="w-full h-full object-cover"
              @error="$event.target.src = '/placeholder-album.png'"
            />
          </div>
          <h3 class="font-medium">{{ playlist.name }}</h3>
          <p class="text-sm text-gray-400"></p>
          <button
            class="absolute top-2 right-2 bg-red-500 hover:bg-red-700 text-white p-1 rounded-full"
            @click.stop="deletePlaylist(playlist.id)"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-trash-2">
              <path d="M3 6h18"/>
              <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
              <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
              <line x1="10" x2="10" y1="11" y2="17"/>
              <line x1="14" x2="14" y1="11" y2="17"/>
            </svg>
          </button>
        </div>
      </div>
    </div>

    <div v-if="selectedPlaylist" class="mt-8">
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-xl font-bold">Tracks in "{{ selectedPlaylist.name }}"</h2>
        <div class="text-gray-400">{{ playlistTracks.length }} tracks loaded</div>
      </div>
      
      <div v-if="isLoading" class="text-center text-gray-400">Loading tracks...</div>
      <div v-else>
        <div v-if="playlistTracks.length === 0" class="text-gray-400">No tracks in this playlist.</div>
        <ul>
          <li
            v-for="item in playlistTracks"
            :key="item.track.id"
            class="flex items-center justify-between bg-gray-700 rounded p-3 mb-2 hover:bg-gray-600 transition-colors"
          >
            <div class="flex items-center">
              <div class="w-12 h-12 mr-3 flex-shrink-0 overflow-hidden rounded">
                <img 
                  :src="getTrackImage(item)" 
                  :alt="item.track.name" 
                  class="w-full h-full object-cover"
                  @error="$event.target.src = '/placeholder-album.png'"
                />
              </div>
              <div>
                <span class="font-medium block">{{ item.track.name }}</span>
                <span class="text-gray-400 text-sm">
                  {{ item.track.artists.map(a => a.name).join(', ') }}
                </span>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <button
                class="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-full"
                @click.stop="playTrack(item.track.uri)"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-play"><polygon points="5 3 19 12 5 21 5 3"/></svg>
              </button>
              <button
                class="bg-red-500 hover:bg-red-700 text-white px-3 py-1 rounded-full"
                @click.stop="removeTrack(item.track.uri)"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-trash-2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
              </button>
            </div>
          </li>
        </ul>
      </div>
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
.main-content {
  min-height: calc(100vh - 150px); /* Adjust based on your footer height */
  padding-bottom: 80px; /* Extra space for footer */
}

/* Make the playlist tracks scrollable */
ul {
  max-height: 60vh;
  overflow-y: auto;
  padding-right: 8px;
}

/* Custom scrollbar */
ul::-webkit-scrollbar {
  width: 6px;
}
ul::-webkit-scrollbar-track {
  background: #1e1e1e;
}
ul::-webkit-scrollbar-thumb {
  background: #535353;
  border-radius: 3px;
}
</style>
