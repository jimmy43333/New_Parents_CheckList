<script setup>
import { ref, onMounted } from 'vue'
import { TAB_ORDER, THEME_KEY } from './composables/useChecklist'
import TabBar from './components/TabBar.vue'
import TabPanel from './components/TabPanel.vue'
import MenuPanel from './components/MenuPanel.vue'
import ItemModal from './components/ItemModal.vue'
import Icon from './components/Icon.vue'

const activeTab = ref(TAB_ORDER[0])
const modalItem = ref(null)
const themeIcon = ref('moon')

function currentEffectiveTheme() {
  const attr = document.documentElement.getAttribute('data-theme')
  if (attr === 'dark' || attr === 'light') return attr
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}
function updateThemeIcon() {
  themeIcon.value = currentEffectiveTheme() === 'dark' ? 'sun' : 'moon'
}
function toggleTheme() {
  const next = currentEffectiveTheme() === 'dark' ? 'light' : 'dark'
  document.documentElement.setAttribute('data-theme', next)
  try {
    localStorage.setItem(THEME_KEY, next)
  } catch (e) {
    /* ignore */
  }
  updateThemeIcon()
}

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
  try {
    const saved = localStorage.getItem(THEME_KEY)
    if (saved === 'dark' || saved === 'light') {
      document.documentElement.setAttribute('data-theme', saved)
    }
  } catch (e) {
    /* ignore */
  }
  updateThemeIcon()

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
    <header class="hero">
      <button class="theme-toggle" type="button" aria-label="切換深色/淺色模式" @click="toggleTheme"><Icon :name="themeIcon" /></button>
      <h1>新手爸媽準備清單</h1>
      <p class="hero-sub">
        整理自一對真實爸媽的育兒筆記, 依準備時間排序, 可自行調整，選擇待評估可將其從清單移除。<br />
        可點擊卡片紀錄個人備註，選擇狀態即可記錄自己的準備進度, 資料只存在你的瀏覽器裡, 不會被其他人看到或互相覆蓋。
      </p>
      <p class="hero-updated">製作日期:2026-07-29</p>
      <p class="hero-updated">更新日期:2026-08-11 · 版本:v4</p>
    </header>

    <TabBar :active-tab="activeTab" @select="selectTab" />

    <main>
      <TabPanel v-if="activeTab !== 'menu'" :active-tab="activeTab" @navigate-tab="selectTab" @open-modal="openModal" />
      <MenuPanel v-else />
    </main>

    <p class="footer">
      <strong>免責聲明:</strong>清單中說明與建議為自身經驗參考整理,並非醫療或育兒專業建議;每個寶寶與家庭狀況不同,實際準備項目與時機請依自身需求,並在必要時諮詢醫師或專業人員調整。祝每一位新手爸媽都能順利度過育兒的第一哩路 ❤️
    </p>
  </div>
</template>
