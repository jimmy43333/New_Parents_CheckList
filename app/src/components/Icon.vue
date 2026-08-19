<script setup>
defineProps({
  name: { type: String, required: true },
})

const paths = {
  bag: '<rect x="3" y="8" width="18" height="12" rx="2"/><path d="M8 8V6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M3 13h18"/>',
  clipboard: '<rect x="6" y="4" width="12" height="17" rx="2"/><path d="M9 4V3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1"/><path d="M9 11h6"/><path d="M9 15h6"/>',
  baby: '<circle cx="12" cy="8" r="3.5"/><path d="M5 21c0-4.5 3-7.5 7-7.5s7 3 7 7.5"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  moon: '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z"/>',
  note: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
  chat: '<path d="M21 12a8 8 0 0 1-8 8H8l-5 3 1.5-5.5A8 8 0 1 1 21 12Z"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>',
  close: '<path d="M18 6 6 18"/><path d="M6 6l12 12"/>',
  wallet: '<path d="M3 7a2 2 0 0 1 2-2h13a1 1 0 0 1 1 1v3"/><path d="M3 7v10a2 2 0 0 0 2 2h14a1 1 0 0 0 1-1v-4"/><rect x="14" y="11" width="7" height="5" rx="1.5"/>',
  menu: '<path d="M4 6h16"/><path d="M4 12h16"/><path d="M4 18h16"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  play: '<circle cx="12" cy="12" r="9"/><path d="M10.5 8.5v7l6-3.5-6-3.5Z"/>',
}
</script>

<template>
  <svg
    v-if="paths[name]"
    class="icon"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.8"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
    v-html="paths[name]"
  ></svg>
  <span v-else class="icon icon-emoji" aria-hidden="true">{{ name }}</span>
</template>

<style scoped>
.icon {
  width: 1em;
  height: 1em;
  display: inline-block;
  vertical-align: -0.15em;
  flex-shrink: 0;
}
.icon-emoji {
  font-size: 0.95em;
  line-height: 1;
}
</style>
