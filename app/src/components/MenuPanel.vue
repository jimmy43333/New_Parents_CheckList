<script setup>
import { onMounted } from 'vue'
import { themeIcon, toggleTheme, initTheme } from '../composables/useTheme'
import { APP_TITLE, APP_DESCRIPTION, BUILD_DATE, UPDATED_DATE, APP_VERSION, DISCLAIMER } from '../data/about'
import Icon from './Icon.vue'

onMounted(initTheme)
</script>

<template>
  <section role="tabpanel" class="menu-panel">
    <div class="menu-about">
      <div class="menu-about-head">
        <h1>{{ APP_TITLE }}</h1>
        <button class="theme-toggle theme-toggle-inline" type="button" aria-label="切換深色/淺色模式" @click="toggleTheme">
          <Icon :name="themeIcon" />
        </button>
      </div>
      <p class="hero-sub">
        {{ APP_DESCRIPTION[0] }}<br />
        {{ APP_DESCRIPTION[1] }}
      </p>
    </div>

    <div class="footer">
      <p class="footer-text"><strong>免責聲明:</strong>{{ DISCLAIMER }}</p>
      <p class="footer-meta">製作日期:{{ BUILD_DATE }} · 更新日期:{{ UPDATED_DATE }} · 版本:{{ APP_VERSION }}</p>
    </div>
  </section>
</template>
