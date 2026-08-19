<script setup>
import { ref, onMounted } from 'vue'
import { DATA } from './composables/useChecklist'
import { initTheme } from './composables/useTheme'
import TabBar from './components/TabBar.vue'
import TabPanel from './components/TabPanel.vue'
import MenuPanel from './components/MenuPanel.vue'
import ItemModal from './components/ItemModal.vue'

const activeTab = ref('menu')
const modalItem = ref(null)
const modalTabDef = ref(null)

function selectTab(key) {
  activeTab.value = key
}
function openModal(item) {
  modalItem.value = item
  modalTabDef.value = DATA[activeTab.value]
}
function closeModal() {
  modalItem.value = null
}

onMounted(() => {
  initTheme()

  document.addEventListener(
    'touchmove',
    (e) => {
      if (e.touches && e.touches.length > 1) e.preventDefault()
    },
    { passive: false },
  )
  document.addEventListener('gesturestart', (e) => e.preventDefault())
  let lastTouchEnd = 0
  document.addEventListener(
    'touchend',
    (e) => {
      const now = Date.now()
      if (now - lastTouchEnd <= 300) e.preventDefault()
      lastTouchEnd = now
    },
    { passive: false },
  )
})
</script>

<template>
  <ItemModal :item="modalItem" :tab-def="modalTabDef" @close="closeModal" />

  <div class="page">
    <TabBar :active-tab="activeTab" @select="selectTab" />

    <main>
      <TabPanel v-if="activeTab !== 'menu'" :active-tab="activeTab" @navigate-tab="selectTab" @open-modal="openModal" />
      <MenuPanel v-else />
    </main>
  </div>
</template>
