<script setup>
import { computed } from 'vue'
import { DATA, TAB_ORDER, countableItems, getItemStatus } from '../composables/useChecklist'
import Icon from './Icon.vue'

const props = defineProps({
  activeTab: { type: String, required: true },
})
const emit = defineEmits(['select'])

const tabs = computed(() => {
  const dataTabs = TAB_ORDER.map((key) => {
    const tabDef = DATA[key]
    const items = countableItems(tabDef)
    const doneCount = items.filter((it) => getItemStatus(tabDef, it) === tabDef.doneKey).length
    return { key, icon: tabDef.icon, label: tabDef.label, doneCount, total: items.length, isMenu: false }
  })
  return [{ key: 'menu', icon: 'menu', label: '主選單', isMenu: true }, ...dataTabs]
})

const activeIndex = computed(() => Math.max(tabs.value.findIndex((t) => t.key === props.activeTab), 0))

function selectTab(key) {
  if (key === props.activeTab) {
    window.scrollTo({ top: 0, behavior: 'smooth' })
    return
  }
  emit('select', key)
}
</script>

<template>
  <nav class="tabbar" role="tablist" aria-label="清單分類">
    <span class="tab-indicator" :style="{ transform: `translateX(${activeIndex * 100}%)` }"></span>
    <button
      v-for="tab in tabs"
      :key="tab.key"
      class="tab-btn"
      :class="{ 'menu-tab': tab.isMenu }"
      type="button"
      role="tab"
      :aria-selected="tab.key === activeTab ? 'true' : 'false'"
      @click="selectTab(tab.key)"
    >
      <Icon class="tab-icon" :name="tab.icon" />
      <span class="tab-label">{{ tab.label }}</span>
      <span v-if="!tab.isMenu" class="tab-count">{{ tab.doneCount }}/{{ tab.total }}</span>
    </button>
  </nav>
</template>
