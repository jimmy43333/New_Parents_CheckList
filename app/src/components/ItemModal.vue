<script setup>
import { ref, computed, watch } from 'vue'
import { getItemNote, setItemNote, getItemStatus, setItemStatus, getPersonStatus, setPersonStatus, PERSON_LABEL } from '../composables/useChecklist'
import Icon from './Icon.vue'

const props = defineProps({
  item: { type: Object, default: null },
  tabDef: { type: Object, default: null },
})
const emit = defineEmits(['close'])

const noteLabel = computed(() => props.tabDef?.modalNoteLabel || '經驗分享')
const linksLabel = computed(() => props.tabDef?.modalLinksLabel || '品牌分享')
const linksCollapsible = computed(() => props.tabDef?.modalLinksCollapsible !== false)
const isDone = computed(
  () => !!props.item && !!props.tabDef && getItemStatus(props.tabDef, props.item) === props.tabDef.doneKey,
)
function toggleStatus() {
  if (!props.item || !props.tabDef) return
  setItemStatus(props.item.id, isDone.value ? props.tabDef.states[0].key : props.tabDef.doneKey)
}

const dadDone = computed(
  () => !!props.item && !!props.tabDef && getPersonStatus(props.tabDef, props.item, 'dad') === props.tabDef.doneKey,
)
const momDone = computed(
  () => !!props.item && !!props.tabDef && getPersonStatus(props.tabDef, props.item, 'mom') === props.tabDef.doneKey,
)
function togglePerson(person) {
  if (!props.item || !props.tabDef) return
  const done = person === 'dad' ? dadDone.value : momDone.value
  setPersonStatus(props.item.id, person, done ? props.tabDef.states[0].key : props.tabDef.doneKey)
}

const notesValue = ref('')
const savedMessage = ref('')
const brandPanelOpen = ref(false)
const dragDeltaY = ref(0)
const isDragging = ref(false)
let savedTimer = null
let dragStartY = 0

watch(
  () => props.item,
  (item) => {
    brandPanelOpen.value = false
    savedMessage.value = ''
    notesValue.value = item ? getItemNote(item.id) : ''
    dragDeltaY.value = 0
    isDragging.value = false
  },
  { immediate: true },
)

function onNotesInput() {
  if (!props.item) return
  setItemNote(props.item.id, notesValue.value)
  savedMessage.value = '已自動儲存'
  if (savedTimer) clearTimeout(savedTimer)
  savedTimer = setTimeout(() => {
    savedMessage.value = ''
  }, 1500)
}

function brandName(b) {
  return typeof b === 'object' && b ? b.name : b
}
function brandUrl(b) {
  return typeof b === 'object' && b ? b.url : null
}

function close() {
  emit('close')
}
function onOverlayClick(e) {
  if (e.target === e.currentTarget) close()
}

function onDragStart(e) {
  if (e.touches.length !== 1) return
  dragStartY = e.touches[0].clientY
  isDragging.value = true
}
function onDragMove(e) {
  if (!isDragging.value) return
  const delta = e.touches[0].clientY - dragStartY
  if (delta > 0) {
    dragDeltaY.value = delta
    e.preventDefault()
  }
}
function onDragEnd() {
  if (!isDragging.value) return
  isDragging.value = false
  if (dragDeltaY.value > 100) {
    close()
  }
  dragDeltaY.value = 0
}
</script>

<template>
  <Transition name="sheet">
    <div v-if="item" class="modal-overlay" @click="onOverlayClick">
      <div
        class="modal-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="itemModalTitle"
        :style="isDragging && dragDeltaY > 0 ? { transform: `translateY(${dragDeltaY}px)`, transition: 'none' } : null"
      >
        <div class="modal-drag-zone" @touchstart="onDragStart" @touchmove="onDragMove" @touchend="onDragEnd">
          <div class="modal-drag-handle" aria-hidden="true"></div>
          <div class="modal-header">
            <h2 class="modal-title" id="itemModalTitle">{{ item.name }}</h2>
            <button class="modal-close" type="button" aria-label="關閉" @click="close"><Icon name="close" /></button>
          </div>
        </div>

        <div class="modal-body">
          <p class="modal-section-label"><Icon name="chat" /> {{ noteLabel }}</p>
          <div>
            <ul v-if="item.notionNote && item.notionNote.length" class="modal-note-list">
              <li v-for="(line, i) in item.notionNote" :key="i">{{ line }}</li>
            </ul>
            <p v-else class="modal-note-text">目前沒有相關內容。</p>
          </div>

          <div class="modal-brand-block" v-if="item.brandSuggestions && item.brandSuggestions.length">
            <template v-if="linksCollapsible">
              <button
                type="button"
                class="modal-brand-toggle"
                :aria-expanded="brandPanelOpen ? 'true' : 'false'"
                @click="brandPanelOpen = !brandPanelOpen"
              >
                <span><Icon name="search" /> {{ linksLabel }}</span>
                <span class="modal-brand-toggle-arrow" aria-hidden="true">▾</span>
              </button>
              <div class="modal-brand-panel" v-show="brandPanelOpen">
                <ul class="modal-brand-list">
                  <li v-for="(b, i) in item.brandSuggestions" :key="i">
                    <a v-if="brandUrl(b)" :href="brandUrl(b)" target="_blank" rel="noopener noreferrer">{{ brandName(b) }} ↗</a>
                    <template v-else>{{ brandName(b) }}</template>
                  </li>
                </ul>
              </div>
            </template>
            <template v-else>
              <p class="modal-section-label"><Icon name="search" /> {{ linksLabel }}</p>
              <div class="modal-brand-panel is-static">
                <ul class="modal-brand-list">
                  <li v-for="(b, i) in item.brandSuggestions" :key="i">
                    <a v-if="brandUrl(b)" :href="brandUrl(b)" target="_blank" rel="noopener noreferrer">{{ brandName(b) }} ↗</a>
                    <template v-else>{{ brandName(b) }}</template>
                  </li>
                </ul>
              </div>
            </template>
          </div>

          <div v-if="tabDef && tabDef.modalPersonalNotes !== false" class="modal-notes-block">
            <p class="modal-section-label"><Icon name="note" /> 我的備註</p>
            <textarea
              class="modal-notes-textarea"
              v-model="notesValue"
              placeholder="可以記錄比價結果、想選的款式、朋友推薦等任何筆記…"
              @input="onNotesInput"
            ></textarea>
            <p class="modal-notes-saved" aria-live="polite">{{ savedMessage }}</p>
          </div>

          <div v-if="tabDef && tabDef.modalStatusToggle" class="modal-status-toggle-block">
            <div v-if="tabDef.perPersonStatus" class="modal-status-toggle-row">
              <button
                type="button"
                class="modal-status-toggle"
                :data-done="dadDone ? 'true' : 'false'"
                @click="togglePerson('dad')"
              >
                <Icon :name="dadDone ? 'check' : 'baby'" />
                <span>{{ PERSON_LABEL.dad }}{{ dadDone ? tabDef.states[1].label : tabDef.states[0].label }}</span>
              </button>
              <button
                type="button"
                class="modal-status-toggle"
                :data-done="momDone ? 'true' : 'false'"
                @click="togglePerson('mom')"
              >
                <Icon :name="momDone ? 'check' : 'baby'" />
                <span>{{ PERSON_LABEL.mom }}{{ momDone ? tabDef.states[1].label : tabDef.states[0].label }}</span>
              </button>
            </div>
            <button
              v-else
              type="button"
              class="modal-status-toggle"
              :data-done="isDone ? 'true' : 'false'"
              @click="toggleStatus"
            >
              <Icon :name="isDone ? 'check' : 'baby'" />
              <span>{{ isDone ? tabDef.states[1].label : tabDef.states[0].label }}</span>
              <span class="modal-status-toggle-hint">{{ isDone ? '點擊改回未學習' : '點擊標記為已學習' }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>
