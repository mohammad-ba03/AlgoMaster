// middleware/auth.ts
export default defineNuxtRouteMiddleware((to, from) => {
    // جلب التوكن من الكوكيز
    const token = useCookie('auth_token');

    // إذا لم يكن هناك توكن، قم بتوجيه المستخدم إلى صفحة تسجيل الدخول
    if (!token.value) {
        return navigateTo('/login');
    }
});