<script setup>
import { computed, onMounted } from 'vue'
import { themeIcon, toggleTheme, initTheme } from '../composables/useTheme'
import { babyState, setBabyName, setBabyDueDate } from '../composables/useChecklist'
import { APP_TITLE, APP_DESCRIPTION, BUILD_DATE, UPDATED_DATE, APP_VERSION, DISCLAIMER } from '../data/about'
import Icon from './Icon.vue'

onMounted(initTheme)

const babyName = computed({
  get: () => babyState.name,
  set: (v) => setBabyName(v),
})
const babyDueDate = computed({
  get: () => babyState.dueDate,
  set: (v) => setBabyDueDate(v),
})
</script>

<template>
  <section role="tabpanel" class="menu-panel">
    <div class="menu-about">
      <div class="menu-about-head">
        <h1 class="panel-title">{{ APP_TITLE }}</h1>
        <button class="theme-toggle theme-toggle-inline" type="button" aria-label="切換深色/淺色模式" @click="toggleTheme">
          <Icon :name="themeIcon" />
        </button>
      </div>
      <p class="hero-sub">
        {{ APP_DESCRIPTION[0] }}<br />
        {{ APP_DESCRIPTION[1] }}
      </p>
    </div>

    <div class="baby-info-block">
      <div class="baby-info-field">
        <label class="baby-info-label" for="babyNameInput">寶寶姓名</label>
        <input id="babyNameInput" class="baby-info-input" type="text" v-model="babyName" placeholder="尚未命名" />
      </div>
      <div class="baby-info-field">
        <label class="baby-info-label" for="babyDueDateInput">出生日期(預產期)</label>
        <input id="babyDueDateInput" class="baby-info-input" type="date" v-model="babyDueDate" />
      </div>
    </div>

    <div class="footer">
      <p class="footer-text"><strong>免責聲明 : </strong>{{ DISCLAIMER }}</p>
      <p class="footer-meta">
        製作:{{ BUILD_DATE }} · 更新:{{ UPDATED_DATE }} · 版本:{{ APP_VERSION }}
      </p>
    </div>
  </section>
</template>
