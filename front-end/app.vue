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

const tokenCookie = useCookie('token'); // تأكد من استخدام نفس اسم الكوكي الخاص بالطالب

onMounted(() => {
    // نتحقق أولاً أن المستخدم مسجل دخوله ولديه توكن
    if (tokenCookie.value) {
        // نرسل الطلب في الخلفية بصمت (بدون await لكي لا نؤخر تحميل الصفحة)
        $fetch('http://localhost:5000/api/user/ping', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${tokenCookie.value}` }
        }).catch(err => {
            // نتجاهل الخطأ بصمت إذا فشل الاتصال، فهذا مجرد متتبع نشاط
            console.log("Activity tracking skipped");
        });
    }
});
</script>
