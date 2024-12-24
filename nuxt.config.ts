export default defineNuxtConfig({
  vue: {
    compilerOptions: {
      isCustomElement: (tag) => tag === 'elevenlabs-convai',
    },
  },

  compatibilityDate: '2024-12-24',
});