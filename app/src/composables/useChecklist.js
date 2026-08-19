import { reactive } from 'vue'
import suppliesData from '../data/supplies.json'
import bagData from '../data/bag.json'
import skillsData from '../data/skills.json'
import phasesData from '../data/phases.json'

const STORAGE_KEY = 'npchecklist_v1'
const COST_KEY = 'npchecklist_costs_v1'
const NOTES_KEY = 'npchecklist_notes_v1'
const PHASE_KEY = 'npchecklist_phase_v1'
const PERSON_KEY = 'npchecklist_person_v1'
export const THEME_KEY = 'npchecklist_theme'
const DEFAULT_SNAPSHOT_KEY = 'npchecklist_default_snapshot_v1'
const CUSTOM_ITEMS_KEY = 'npchecklist_custom_items_v1'

export const TAB_ORDER = ['supplies', 'bag', 'skills']
export const PHASE_LABEL = phasesData.PHASE_LABEL
export const PHASE_SORT_ORDER = phasesData.PHASE_SORT_ORDER
export const STATUS_FILTER_PREFIX = 'status:'
export const STATUS_FILTERS = [
  { key: 'not-bought', label: '未準備' },
  { key: 'in-progress', label: '準備中' },
]
export const PERSONS = ['dad', 'mom']
export const PERSON_LABEL = { dad: '爸爸', mom: '媽媽' }

function loadJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch (e) {
    return fallback
  }
}
function saveJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (e) {
    /* ignore quota errors */
  }
}

function cloneTab(data) {
  return JSON.parse(JSON.stringify(data))
}

export const DATA = reactive({
  supplies: cloneTab(suppliesData),
  bag: cloneTab(bagData),
  skills: cloneTab(skillsData),
})

export const state = reactive(loadJSON(STORAGE_KEY, {}))
export const costState = reactive(loadJSON(COST_KEY, {}))
export const notesState = reactive(loadJSON(NOTES_KEY, {}))
export const phaseState = reactive(loadJSON(PHASE_KEY, {}))
export const personState = reactive(loadJSON(PERSON_KEY, {}))

function saveState() { saveJSON(STORAGE_KEY, state) }
function saveCosts() { saveJSON(COST_KEY, costState) }
function saveNotes() { saveJSON(NOTES_KEY, notesState) }
function savePhases() { saveJSON(PHASE_KEY, phaseState) }
function savePersonState() { saveJSON(PERSON_KEY, personState) }

export function allItems(tabDef) {
  return tabDef.groups.flatMap((g) => g.items)
}

export function getItemPhase(item) {
  return phaseState[item.id] || item.phase || 'unassessed'
}
export function setItemPhase(itemId, phaseKey) {
  phaseState[itemId] = phaseKey
  savePhases()
}
export function isUnassessedItem(tabDef, item) {
  return !!tabDef.phaseSelectable && getItemPhase(item) === 'unassessed'
}
export function countableItems(tabDef) {
  return allItems(tabDef).filter((it) => !isUnassessedItem(tabDef, it))
}

export function computeLinkedTabStatusKey(tabDef, linkedTabDef) {
  const linkedItems = allItems(linkedTabDef)
  const doneCount = linkedItems.filter(
    (it) => getItemStatus(linkedTabDef, it) === linkedTabDef.doneKey,
  ).length
  if (!linkedItems.length || doneCount === 0) return tabDef.states[0].key
  if (doneCount === linkedItems.length) return tabDef.doneKey
  return tabDef.states[1].key
}

export function getItemStatus(tabDef, item) {
  if (item.linkToTab) {
    return computeLinkedTabStatusKey(tabDef, DATA[item.linkToTab])
  }
  return state[item.id] || tabDef.states[0].key
}
export function setItemStatus(itemId, statusKey) {
  state[itemId] = statusKey
  saveState()
}

export function getPersonStatus(tabDef, item, person) {
  const rec = personState[item.id]
  if (rec && rec[person]) return rec[person]
  return tabDef.states[0].key
}
export function setPersonStatus(itemId, person, statusKey) {
  if (!personState[itemId]) personState[itemId] = {}
  personState[itemId][person] = statusKey
  savePersonState()
}
export function countPersonDone(tabDef, person) {
  return allItems(tabDef).filter((it) => getPersonStatus(tabDef, it, person) === tabDef.doneKey).length
}
export function computePersonBadge(tabDef, item) {
  const dadDone = getPersonStatus(tabDef, item, 'dad') === tabDef.doneKey
  const momDone = getPersonStatus(tabDef, item, 'mom') === tabDef.doneKey
  if (dadDone && momDone) return { label: tabDef.states[1].label, slot: 2 }
  if (dadDone) return { label: PERSON_LABEL.dad + tabDef.states[1].label, slot: 1 }
  if (momDone) return { label: PERSON_LABEL.mom + tabDef.states[1].label, slot: 1 }
  return { label: tabDef.states[0].label, slot: 0 }
}
export function computePersonCardState(tabDef, item) {
  const dadDone = getPersonStatus(tabDef, item, 'dad') === tabDef.doneKey
  const momDone = getPersonStatus(tabDef, item, 'mom') === tabDef.doneKey
  if (dadDone && momDone) return 'done'
  if (dadDone || momDone) return 'in-progress'
  return 'pending'
}

export function getItemCost(itemId) {
  const v = costState[itemId]
  return typeof v === 'number' && !isNaN(v) ? v : null
}
export function setItemCost(itemId, value) {
  if (value === null) delete costState[itemId]
  else costState[itemId] = value
  saveCosts()
}
export function formatNTD(n) {
  return 'NT$ ' + Math.round(n).toLocaleString('zh-TW')
}
export function computeCostTotal(tabDef) {
  return allItems(tabDef).reduce((total, it) => {
    const v = getItemCost(it.id)
    return v !== null ? total + v : total
  }, 0)
}

export function getItemNote(itemId) {
  return notesState[itemId] || ''
}
export function setItemNote(itemId, value) {
  if (value.trim() === '') delete notesState[itemId]
  else notesState[itemId] = value
  saveNotes()
}

export function computeCardState(tabDef, status) {
  if (status === tabDef.doneKey) return 'done'
  if (tabDef.phaseSelectable && tabDef.states.length > 2 && status === tabDef.states[1].key) return 'in-progress'
  return 'pending'
}

export function resetTab(tabDef) {
  allItems(tabDef).forEach((it) => {
    delete state[it.id]
    if (tabDef.perPersonStatus) delete personState[it.id]
  })
  saveState()
  if (tabDef.perPersonStatus) savePersonState()
}

// ---------------- custom item orphan preservation ----------------
// When a Notion sync removes a default supplies item that a visitor already
// interacted with (checked/costed/noted/phase-overridden), it gets promoted
// into a "自訂項目" group instead of silently disappearing.
function loadDefaultSnapshot() {
  return loadJSON(DEFAULT_SNAPSHOT_KEY, null)
}
function saveDefaultSnapshot(items) {
  saveJSON(DEFAULT_SNAPSHOT_KEY, items)
}
function loadCustomItems() {
  return loadJSON(CUSTOM_ITEMS_KEY, [])
}
function saveCustomItemsList(items) {
  saveJSON(CUSTOM_ITEMS_KEY, items)
}

function hasUserData(itemId) {
  return Boolean(state[itemId] || getItemCost(itemId) !== null || notesState[itemId] || phaseState[itemId])
}

function reconcileOrphanedDefaults() {
  const currentDefaults = allItems(DATA.supplies)
  const currentIds = {}
  currentDefaults.forEach((it) => {
    currentIds[it.id] = true
  })

  const previousSnapshot = loadDefaultSnapshot()
  if (previousSnapshot) {
    const customItems = loadCustomItems()
    const alreadyPromoted = {}
    customItems.forEach((it) => {
      if (it.promotedFrom) alreadyPromoted[it.promotedFrom] = true
    })

    let changed = false
    previousSnapshot.forEach((prevItem) => {
      if (currentIds[prevItem.id]) return
      if (alreadyPromoted[prevItem.id]) return
      if (!hasUserData(prevItem.id)) return
      customItems.push({ ...prevItem, id: 'custom-' + prevItem.id, promotedFrom: prevItem.id })
      changed = true
    })
    if (changed) saveCustomItemsList(customItems)
  }

  saveDefaultSnapshot(
    currentDefaults.map((it) => ({
      id: it.id,
      name: it.name,
      phase: it.phase,
      estCost: it.estCost,
      note: it.note,
      month: it.month,
    })),
  )
}

reconcileOrphanedDefaults()
const initialCustomItems = loadCustomItems()
if (initialCustomItems.length) {
  DATA.supplies.groups.push({ name: '自訂項目', items: initialCustomItems })
}
