<script setup lang="ts">
definePageMeta({
  title: '无权访问',
})
</script>

<template>
  <main class="forbidden-page">
    <section class="forbidden-card">
      <div class="error-code">403</div>

      <h2>没有访问权限</h2>

      <p>
        当前账号没有权限访问此页面。
        如需使用该功能，请联系系统管理员。
      </p>

      <NuxtLink
        class="home-link"
        to="/"
      >
        返回系统概览
      </NuxtLink>
    </section>
  </main>
</template>

<style scoped>
.forbidden-page {
  min-height: calc(100vh - 180px);
  display: grid;
  place-items: center;
}

.forbidden-card {
  width: min(100%, 520px);
  padding: 52px 40px;
  box-sizing: border-box;
  border: 1px solid #dbe5f3;
  border-radius: 22px;
  background: #fff;
  box-shadow: 0 18px 50px rgb(15 23 42 / 9%);
  text-align: center;
}

.error-code {
  color: #2563eb;
  font-size: 72px;
  font-weight: 900;
  line-height: 1;
}

.forbidden-card h2 {
  margin: 20px 0 0;
  color: #0f172a;
  font-size: 27px;
}

.forbidden-card p {
  margin: 15px 0 0;
  color: #64748b;
  line-height: 1.8;
}

.home-link {
  display: inline-block;
  margin-top: 28px;
  padding: 11px 18px;
  border-radius: 10px;
  color: #fff;
  background: #2563eb;
  font-weight: 700;
  text-decoration: none;
}

.home-link:hover {
  background: #1d4ed8;
}
</style>