<script setup>
import { computed } from 'vue'
import { DATA, TAB_ORDER, countableItems, getItemStatus } from '../composables/useChecklist'

const props = defineProps({
  activeTab: { type: String, required: true },
})
const emit = defineEmits(['select'])

const tabs = computed(() =>
  TAB_ORDER.map((key) => {
    const tabDef = DATA[key]
    const items = countableItems(tabDef)
    const doneCount = items.filter((it) => getItemStatus(tabDef, it) === tabDef.doneKey).length
    return { key, icon: tabDef.icon, label: tabDef.label, doneCount, total: items.length }
  }),
)
</script>

<template>
  <nav class="tabbar" role="tablist" aria-label="清單分類">
    <button
      v-for="tab in tabs"
      :key="tab.key"
      class="tab-btn"
      type="button"
      role="tab"
      :aria-selected="tab.key === activeTab ? 'true' : 'false'"
      @click="emit('select', tab.key)"
    >
      <span class="tab-icon">{{ tab.icon }}</span>
      <span>{{ tab.label }}</span>
      <span class="tab-count">{{ tab.doneCount }}/{{ tab.total }}</span>
    </button>
  </nav>
</template>
