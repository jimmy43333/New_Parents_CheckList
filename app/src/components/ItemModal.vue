<script setup>
import { ref, watch } from 'vue'
import { getItemNote, setItemNote } from '../composables/useChecklist'

const props = defineProps({
  item: { type: Object, default: null },
})
const emit = defineEmits(['close'])

const notesValue = ref('')
const savedMessage = ref('')
const brandPanelOpen = ref(false)
let savedTimer = null

watch(
  () => props.item,
  (item) => {
    brandPanelOpen.value = false
    savedMessage.value = ''
    notesValue.value = item ? getItemNote(item.id) : ''
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
</script>

<template>
  <div class="modal-overlay" :class="{ open: !!item }">
    <div v-if="item" class="modal-panel" role="dialog" aria-modal="true" aria-labelledby="itemModalTitle" @click="onOverlayClick">
      <div class="modal-header">
        <h2 class="modal-title" id="itemModalTitle">{{ item.name }}</h2>
        <button class="modal-close" type="button" aria-label="關閉" @click="close">✕</button>
      </div>
      <div class="modal-body">
        <p class="modal-section-label">📝 我的備註</p>
        <textarea
          class="modal-notes-textarea"
          v-model="notesValue"
          placeholder="可以記錄比價結果、想選的款式、朋友推薦等任何筆記…"
          @input="onNotesInput"
        ></textarea>
        <p class="modal-notes-saved" aria-live="polite">{{ savedMessage }}</p>

        <p class="modal-section-label">💬 經驗分享</p>
        <div>
          <div v-if="item.notionNote && item.notionNote.length" class="modal-note-text">
            <template v-for="(line, i) in item.notionNote" :key="i">{{ line }}<br v-if="i < item.notionNote.length - 1" /></template>
          </div>
          <p v-else class="modal-note-text">目前沒有相關經驗分享。</p>
        </div>

        <div class="modal-brand-block" v-if="item.brandSuggestions && item.brandSuggestions.length">
          <button
            type="button"
            class="modal-brand-toggle"
            :aria-expanded="brandPanelOpen ? 'true' : 'false'"
            @click="brandPanelOpen = !brandPanelOpen"
          >
            <span>🔎 品牌分享</span>
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
        </div>
      </div>
    </div>
  </div>
</template>
