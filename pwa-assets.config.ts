import {
    defineConfig,
    minimal2023Preset as preset,
} from '@vite-pwa/assets-generator/config'

// تعديل الـ Preset الافتراضي لدمج الخلفية السوداء للأيقونات المتجاوبة (Maskable)
const customPreset = {
    ...preset,
    maskable: {
        ...preset.maskable,
        resizeOptions: {
            background: '#000000', // إجبار الخلفية على اللون الأسود بدلاً من الأبيض
        },
    },
    // إذا كنت تريد أيضاً الأيقونات العادية بخلفية سوداء يمكنك تفعيل السطر التالي:
    // transparent: { ...preset.transparent, resizeOptions: { background: '#000000' } }
}

export default defineConfig({
    headLinkOptions: {
        preset: '2023',
    },
    preset: customPreset, // تمرير الـ preset المعدل بالخلفية السوداء
    images: ['public/favicon.svg'],
})