<script setup>
import { reactive, computed, ref, watch } from 'vue'
import {
  DATA,
  TAB_ORDER,
  PHASE_LABEL,
  PHASE_SORT_ORDER,
  STATUS_FILTERS,
  STATUS_FILTER_PREFIX,
  allItems,
  countableItems,
  getItemStatus,
  getItemPhase,
  computeCostTotal,
  formatNTD,
  resetTab,
} from '../composables/useChecklist'
import ItemCard from './ItemCard.vue'

const props = defineProps({
  activeTab: { type: String, required: true },
})
const emit = defineEmits(['navigate-tab', 'open-modal'])

const activeFilter = reactive(Object.fromEntries(TAB_ORDER.map((k) => [k, 'all'])))

const tabDef = computed(() => DATA[props.activeTab])
const allTabItems = computed(() => allItems(tabDef.value))
const countable = computed(() => countableItems(tabDef.value))
const doneCount = computed(
  () => countable.value.filter((it) => getItemStatus(tabDef.value, it) === tabDef.value.doneKey).length,
)
const pct = computed(() => (countable.value.length ? Math.round((doneCount.value / countable.value.length) * 100) : 0))
const budgetTotal = computed(() => formatNTD(computeCostTotal(tabDef.value)))

const phasesPresent = computed(() => {
  if (!tabDef.value.hasFilter) return []
  const present = []
  allTabItems.value.forEach((it) => {
    const ph = tabDef.value.phaseSelectable ? getItemPhase(it) : it.phase
    if (ph && !present.includes(ph)) present.push(ph)
  })
  present.sort((a, b) => PHASE_SORT_ORDER.indexOf(a) - PHASE_SORT_ORDER.indexOf(b))
  return present
})

function setFilter(key) {
  activeFilter[props.activeTab] = key
}

const visibleGroups = computed(() => {
  const filter = activeFilter[props.activeTab]
  return tabDef.value.groups
    .map((group) => {
      let visibleItems = group.items.filter((it) => {
        const ph = tabDef.value.phaseSelectable ? getItemPhase(it) : it.phase
        if (filter === 'all') return ph !== 'unassessed'
        if (filter.indexOf(STATUS_FILTER_PREFIX) === 0) {
          return getItemStatus(tabDef.value, it) === filter.slice(STATUS_FILTER_PREFIX.length)
        }
        return ph === filter
      })
      if (tabDef.value.phaseSelectable) {
        visibleItems = visibleItems.slice().sort((a, b) => {
          let ka = PHASE_SORT_ORDER.indexOf(getItemPhase(a))
          let kb = PHASE_SORT_ORDER.indexOf(getItemPhase(b))
          if (ka === -1) ka = PHASE_SORT_ORDER.length
          if (kb === -1) kb = PHASE_SORT_ORDER.length
          if (ka !== kb) return ka - kb
          const ma = typeof a.month === 'number' ? a.month : Infinity
          const mb = typeof b.month === 'number' ? b.month : Infinity
          return ma - mb
        })
      }
      return { group, visibleItems }
    })
    .filter((g) => g.visibleItems.length)
})

const resetConfirming = ref(false)
let resetConfirmTimer = null

function onReset() {
  if (!resetConfirming.value) {
    resetConfirming.value = true
    if (resetConfirmTimer) clearTimeout(resetConfirmTimer)
    resetConfirmTimer = setTimeout(() => {
      resetConfirming.value = false
    }, 3000)
    return
  }
  clearTimeout(resetConfirmTimer)
  resetConfirming.value = false
  resetTab(tabDef.value)
}

watch(
  () => props.activeTab,
  () => {
    if (resetConfirmTimer) clearTimeout(resetConfirmTimer)
    resetConfirming.value = false
  },
)
</script>

<template>
  <section role="tabpanel">
    <div class="progress-block">
      <div class="progress-top">
        <span class="progress-label">準備進度</span>
        <span class="progress-stat-wrap">
          <span class="progress-stat"><strong>{{ pct }}%</strong> · {{ doneCount }} / {{ countable.length }} 項完成</span>
          <button class="reset-btn" :class="{ confirming: resetConfirming }" type="button" @click="onReset">
            {{ resetConfirming ? '再按一次確認重置' : '重置本頁進度' }}
          </button>
        </span>
      </div>
      <div class="progress-track"><div class="progress-fill" :style="{ width: pct + '%' }"></div></div>
    </div>

    <div v-if="tabDef.description && tabDef.description.length" class="panel-desc-block">
      <ul class="panel-desc-list">
        <li v-for="(line, i) in tabDef.description" :key="i">{{ line }}</li>
      </ul>
    </div>

    <div v-if="tabDef.hasCost" class="budget-block">
      <span class="budget-label">💰 已填寫預算總額</span>
      <span class="budget-value">{{ budgetTotal }}</span>
      <span class="budget-hint">每張卡片灰色數字是市場行情粗估價,僅供參考;請自行輸入預算或實際花費。</span>
    </div>

    <div v-if="tabDef.hasFilter" class="filter-row">
      <button
        class="chip"
        type="button"
        :aria-pressed="activeFilter[activeTab] === 'all' ? 'true' : 'false'"
        @click="setFilter('all')"
      >
        全部
      </button>
      <button
        v-for="sf in STATUS_FILTERS"
        :key="sf.key"
        class="chip"
        type="button"
        :aria-pressed="activeFilter[activeTab] === STATUS_FILTER_PREFIX + sf.key ? 'true' : 'false'"
        @click="setFilter(STATUS_FILTER_PREFIX + sf.key)"
      >
        {{ sf.label }}
      </button>
      <button
        v-for="ph in phasesPresent"
        :key="ph"
        class="chip"
        type="button"
        :aria-pressed="activeFilter[activeTab] === ph ? 'true' : 'false'"
        @click="setFilter(ph)"
      >
        {{ PHASE_LABEL[ph] || ph }}
      </button>
    </div>

    <div v-for="{ group, visibleItems } in visibleGroups" :key="group.name" class="group">
      <div class="group-head">
        <h2 class="group-title">{{ group.name }}</h2>
        <span class="group-count">{{ visibleItems.length }} 項</span>
      </div>
      <div class="card-grid">
        <ItemCard
          v-for="item in visibleItems"
          :key="item.id"
          :tab-def="tabDef"
          :item="item"
          :group="group"
          @open-modal="emit('open-modal', $event)"
          @navigate-tab="emit('navigate-tab', $event)"
        />
      </div>
    </div>
  </section>
</template>
