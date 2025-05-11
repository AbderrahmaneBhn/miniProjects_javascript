<script setup lang="ts">
import { usePlayerStore } from '~/stores/player'
const playerStore = usePlayerStore()

const play = () => playerStore.player?.resume()
const pause = () => playerStore.player?.pause()
const next = () => playerStore.player?.nextTrack()
const previous = () => playerStore.player?.previousTrack()
</script>

<template>
  <div class="flex h-screen">
    <!-- Sidebar -->
    <aside class="w-64 bg-black border-r border-gray-800 p-6">
      <div class="mb-8">
        <h1 class="text-2xl font-bold text-white">Spotify Clone</h1>
      </div>
      <nav class="space-y-4">
        <NuxtLink to="/" class="flex items-center text-gray-400 hover:text-white">
          <span class="material-icons mr-4">home</span>
          Home
        </NuxtLink>
        <NuxtLink to="/search" class="flex items-center text-gray-400 hover:text-white">
          <span class="material-icons mr-4">search</span>
          Search
        </NuxtLink>
        <NuxtLink to="/library" class="flex items-center text-gray-400 hover:text-white">
          <span class="material-icons mr-4">library_music</span>
          Your Library
        </NuxtLink>
      </nav>
    </aside>

    <!-- Main Content -->
    <main class="flex-1 overflow-y-auto bg-gradient-to-b from-gray-900 to-black">
      <div class="p-8">
        <slot />
      </div>
    </main>

    
  </div>
</template>