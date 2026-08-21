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
  countPersonDone,
  PERSON_LABEL,
} from '../composables/useChecklist'
import ItemCard from './ItemCard.vue'
import Icon from './Icon.vue'

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

const dadDoneCount = computed(() => (tabDef.value.perPersonStatus ? countPersonDone(tabDef.value, 'dad') : 0))
const momDoneCount = computed(() => (tabDef.value.perPersonStatus ? countPersonDone(tabDef.value, 'mom') : 0))
const dadPct = computed(() => (countable.value.length ? Math.round((dadDoneCount.value / countable.value.length) * 100) : 0))
const momPct = computed(() => (countable.value.length ? Math.round((momDoneCount.value / countable.value.length) * 100) : 0))

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

const infoPanelOpen = ref(false)
function onInfoOverlayClick(e) {
  if (e.target === e.currentTarget) infoPanelOpen.value = false
}

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
    infoPanelOpen.value = false
  },
)
</script>

<template>
  <Transition name="info-drop">
    <div v-if="infoPanelOpen" class="info-overlay" @click="onInfoOverlayClick">
      <div class="info-panel" role="dialog" aria-modal="true" aria-labelledby="infoPanelTitle">
        <div class="info-panel-header">
          <h2 class="info-panel-title" id="infoPanelTitle">{{ tabDef.label }} 說明</h2>
          <button class="modal-close" type="button" aria-label="關閉" @click="infoPanelOpen = false">
            <Icon name="close" />
          </button>
        </div>
        <div class="info-panel-body">
          <ul class="panel-desc-list">
            <li v-for="(line, i) in tabDef.description" :key="i">{{ line }}</li>
          </ul>
        </div>
      </div>
    </div>
  </Transition>

  <section role="tabpanel">
    <div class="panel-title-row">
      <h2 class="panel-title">{{ tabDef.label }}</h2>
      <button
        v-if="tabDef.description && tabDef.description.length"
        class="panel-info-btn"
        type="button"
        :aria-label="tabDef.label + ' 說明'"
        @click="infoPanelOpen = true"
      >
        <Icon name="info" />
      </button>
    </div>

    <div v-if="tabDef.perPersonStatus" class="progress-block person-progress-block">
      <div class="progress-top">
        <span class="progress-label">學習進度</span>
        <button class="reset-btn" :class="{ confirming: resetConfirming }" type="button" @click="onReset">
          {{ resetConfirming ? '再按一次確認重置' : '重置本頁進度' }}
        </button>
      </div>
      <div class="person-progress-row">
        <span class="person-progress-label">{{ PERSON_LABEL.dad }}</span>
        <div class="progress-track"><div class="progress-fill" :style="{ width: dadPct + '%' }"></div></div>
        <span class="person-progress-stat">{{ dadPct }}% · {{ dadDoneCount }}/{{ countable.length }}</span>
      </div>
      <div class="person-progress-row">
        <span class="person-progress-label">{{ PERSON_LABEL.mom }}</span>
        <div class="progress-track"><div class="progress-fill" :style="{ width: momPct + '%' }"></div></div>
        <span class="person-progress-stat">{{ momPct }}% · {{ momDoneCount }}/{{ countable.length }}</span>
      </div>
    </div>

    <div v-else class="progress-block">
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

    <div v-if="tabDef.hasCost" class="budget-block">
      <span class="budget-label"><Icon name="cash" /> 已填寫預算總額</span>
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
