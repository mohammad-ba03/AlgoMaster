// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@nuxthub/core'],
  css:['~/assets/style.css'],
  app:{
    head: {
      title: "Algo Master",
      meta: [
        {name:'viewport' , content:'width=device-width, initial-scale=1.0'}
      ],
      link: [
        {rel:'preconnect' , href:'https://fonts.googleapis.com'},
        {rel:'stylesheet' , href:'https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;700;800&display=swap'},
        {rel:'stylesheet' , href:'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'},
        
      
      ]
    }
  }
})
