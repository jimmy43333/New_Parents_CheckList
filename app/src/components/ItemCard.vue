<script setup>
import { computed } from 'vue'
import {
  DATA,
  PHASE_LABEL,
  PHASE_SORT_ORDER,
  getItemStatus,
  setItemStatus,
  getItemPhase,
  setItemPhase,
  getItemCost,
  setItemCost,
  computeCardState,
  computePersonBadge,
  computePersonCardState,
} from '../composables/useChecklist'
import Icon from './Icon.vue'

const props = defineProps({
  tabDef: { type: Object, required: true },
  item: { type: Object, required: true },
  group: { type: Object, required: true },
})
const emit = defineEmits(['open-modal', 'navigate-tab'])

const isLink = computed(() => !!props.item.linkToTab)
const linkedTabDef = computed(() => (isLink.value ? DATA[props.item.linkToTab] : null))

const status = computed(() => getItemStatus(props.tabDef, props.item))
const isDone = computed(() => status.value === props.tabDef.doneKey)
const personBadge = computed(() => (props.tabDef.perPersonStatus ? computePersonBadge(props.tabDef, props.item) : null))
const cardState = computed(() =>
  props.tabDef.perPersonStatus ? computePersonCardState(props.tabDef, props.item) : computeCardState(props.tabDef, status.value),
)
const activeSlot = computed(() => {
  const idx = props.tabDef.states.findIndex((st) => st.key === status.value)
  return idx === -1 ? 0 : idx
})

const phaseValue = computed(() => (props.tabDef.phaseSelectable ? getItemPhase(props.item) : props.item.phase))

const costValue = computed({
  get() {
    const v = getItemCost(props.item.id)
    return v === null ? '' : String(v)
  },
  set(raw) {
    if (raw === '') {
      setItemCost(props.item.id, null)
    } else {
      const num = parseFloat(raw)
      setItemCost(props.item.id, isNaN(num) ? null : num)
    }
  },
})
const costPlaceholder = computed(() =>
  typeof props.item.estCost === 'number' ? props.item.estCost.toLocaleString('zh-TW') : '',
)

function onPhaseSelect(e) {
  setItemPhase(props.item.id, e.target.value)
}
function onStatusSelect(e) {
  setItemStatus(props.item.id, e.target.value)
}
function onCheckboxChange(e) {
  setItemStatus(props.item.id, e.target.checked ? props.tabDef.doneKey : props.tabDef.states[0].key)
}

function handleClick() {
  if (isLink.value) {
    emit('navigate-tab', props.item.linkToTab)
  } else if (props.tabDef.hasBrandInfo) {
    emit('open-modal', props.item)
  }
}
function handleKeydown(e) {
  if ((e.key === 'Enter' || e.key === ' ') && (isLink.value || props.tabDef.hasBrandInfo)) {
    e.preventDefault()
    handleClick()
  }
}
</script>

<template>
  <article
    class="card"
    :class="{ 'has-phase': tabDef.hasPhase, 'card-link': isLink, 'card-badge-only': tabDef.badgeOnly }"
    :data-state="cardState"
    :role="isLink || tabDef.hasBrandInfo ? 'button' : null"
    :tabindex="isLink || tabDef.hasBrandInfo ? 0 : null"
    :aria-label="isLink ? `${item.name} — 前往「${linkedTabDef.label}」分頁` : (tabDef.hasBrandInfo ? `${item.name} — ${tabDef.modalAriaLabel || '查看品牌參考與備註'}` : null)"
    @click="handleClick"
    @keydown="handleKeydown"
  >
    <template v-if="tabDef.hasPhase">
      <div class="card-main">
        <div class="card-name-row">
          <h3 class="card-name">
            <Icon v-if="group.groupIcon" class="card-group-icon" :name="group.groupIcon" />
            {{ item.name }}
          </h3>
          <div v-if="tabDef.phaseSelectable" class="phase-select-wrap" :data-phase="phaseValue" @click.stop>
            <select class="phase-select" :aria-label="`${item.name} 的時間標籤`" :value="phaseValue" @change="onPhaseSelect">
              <option v-for="ph in PHASE_SORT_ORDER" :key="ph" :value="ph">{{ PHASE_LABEL[ph] }}</option>
            </select>
            <span class="select-arrow-sm" aria-hidden="true">▾</span>
          </div>
          <span v-else class="phase-chip" :data-phase="item.phase">{{ item.phase ? PHASE_LABEL[item.phase] : '' }}</span>
        </div>
        <p class="card-note" :title="item.note || null">{{ item.note || '' }}</p>
      </div>

      <div class="card-side">
        <div v-if="tabDef.hasCost" class="cost-input-wrap" @click.stop @keydown.stop>
          <span class="cost-prefix" aria-hidden="true">NT$</span>
          <input
            class="cost-input"
            type="number"
            min="0"
            inputmode="numeric"
            :aria-label="`${item.name} 的花費金額`"
            :placeholder="costPlaceholder"
            v-model="costValue"
          />
        </div>

        <div v-if="isLink" class="status-select-wrap" :data-slot="activeSlot">
          <select
            class="status-select"
            disabled
            :aria-label="`${item.name} 的準備狀態(自動依「${linkedTabDef.label}」分頁進度同步,無法手動更改)`"
            :value="status"
          >
            <option v-for="st in tabDef.states" :key="st.key" :value="st.key">{{ st.label }}</option>
          </select>
          <span class="select-arrow" aria-hidden="true">▾</span>
        </div>
        <div v-else class="status-select-wrap" :data-slot="activeSlot">
          <select class="status-select" :aria-label="`${item.name} 的準備狀態`" :value="status" @click.stop @change="onStatusSelect">
            <option v-for="st in tabDef.states" :key="st.key" :value="st.key">{{ st.label }}</option>
          </select>
          <span class="select-arrow" aria-hidden="true">▾</span>
        </div>
      </div>
    </template>

    <template v-else-if="tabDef.badgeOnly">
      <h3 class="card-name">
        <Icon v-if="group.groupIcon" class="card-group-icon" :name="group.groupIcon" />
        {{ item.name }}
      </h3>
      <span
        class="status-badge"
        :data-slot="tabDef.perPersonStatus ? personBadge.slot : activeSlot"
      >{{ tabDef.perPersonStatus ? personBadge.label : (status === tabDef.doneKey ? tabDef.states[1].label : tabDef.states[0].label) }}</span>
    </template>

    <template v-else>
      <h3 class="card-name">
        <Icon v-if="group.groupIcon" class="card-group-icon" :name="group.groupIcon" />
        {{ item.name }}
      </h3>
      <p class="card-note" :title="item.note || null">{{ item.note || '' }}</p>
      <div class="status-select-wrap" :class="{ 'is-checkbox': tabDef.simpleCheckbox }" :data-slot="activeSlot" :data-checked="tabDef.simpleCheckbox ? (isDone ? 'true' : 'false') : null">
        <label v-if="tabDef.simpleCheckbox" class="status-checkbox-label-wrap" @click.stop>
          <input type="checkbox" class="status-checkbox" :checked="isDone" :aria-label="`${item.name} 是否${tabDef.states[tabDef.states.length - 1].label}`" @change="onCheckboxChange" />
          <span class="status-checkbox-text">{{ isDone ? tabDef.states[tabDef.states.length - 1].label : tabDef.states[0].label }}</span>
        </label>
        <template v-else>
          <select class="status-select" :aria-label="`${item.name} 的準備狀態`" :value="status" @click.stop @change="onStatusSelect">
            <option v-for="st in tabDef.states" :key="st.key" :value="st.key">{{ st.label }}</option>
          </select>
          <span class="select-arrow" aria-hidden="true">▾</span>
        </template>
      </div>
    </template>
  </article>
</template>
