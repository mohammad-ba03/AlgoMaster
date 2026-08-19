<template>
  <div>
    <Head>
      <Link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
    </Head>
    <NuxtPage />
  </div>
</template>
<script setup>
import { onMounted } from 'vue'

const tokenCookie = useCookie('token');

onMounted(() => {
    if (tokenCookie.value) {
        $fetch('http://localhost:5000/api/user/ping', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${tokenCookie.value}` }
        }).catch(err => {
            console.log("Activity tracking skipped");
        });
    }
});
</script>
