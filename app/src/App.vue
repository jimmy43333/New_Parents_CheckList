<script setup>
import { ref, onMounted } from 'vue'
import { TAB_ORDER } from './composables/useChecklist'
import { themeIcon, toggleTheme, initTheme } from './composables/useTheme'
import { APP_TITLE, APP_DESCRIPTION, BUILD_DATE, UPDATED_DATE, APP_VERSION, DISCLAIMER } from './data/about'
import TabBar from './components/TabBar.vue'
import TabPanel from './components/TabPanel.vue'
import MenuPanel from './components/MenuPanel.vue'
import ItemModal from './components/ItemModal.vue'
import Icon from './components/Icon.vue'

const isMobileViewport = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(max-width: 700px)').matches
const activeTab = ref(isMobileViewport ? 'menu' : TAB_ORDER[0])
const modalItem = ref(null)

function selectTab(key) {
  activeTab.value = key
}
function openModal(item) {
  modalItem.value = item
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
  <ItemModal :item="modalItem" @close="closeModal" />

  <div class="page">
    <header class="hero desktop-only">
      <button class="theme-toggle" type="button" aria-label="切換深色/淺色模式" @click="toggleTheme"><Icon :name="themeIcon" /></button>
      <h1>{{ APP_TITLE }}</h1>
      <p class="hero-sub">
        {{ APP_DESCRIPTION[0] }}<br />
        {{ APP_DESCRIPTION[1] }}
      </p>
    </header>

    <TabBar :active-tab="activeTab" @select="selectTab" />

    <main>
      <TabPanel v-if="activeTab !== 'menu'" :active-tab="activeTab" @navigate-tab="selectTab" @open-modal="openModal" />
      <MenuPanel v-else />
    </main>

    <div class="footer desktop-only">
      <p class="footer-text"><strong>免責聲明:</strong>{{ DISCLAIMER }}</p>
      <p class="footer-meta">製作日期:{{ BUILD_DATE }} · 更新日期:{{ UPDATED_DATE }} · 版本:{{ APP_VERSION }}</p>
    </div>
  </div>
</template>
