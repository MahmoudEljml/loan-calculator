import PWABadge from './PWA/PWABadge.tsx';
import InstallPWA from './PWA/InstallPWA.tsx';
import './App.css';
import ProfessionalLoanCalculator from './Project/LoanCalculator.tsx';

function App() {
  const clearCacheAndReload = async () => {
    // حذف جميع الكاشات
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.map(cacheName => caches.delete(cacheName)));
    // إعادة تحميل الصفحة
    window.location.reload();
  };

  return (
    <>
      <ProfessionalLoanCalculator />
      <InstallPWA />
      <PWABadge />
      <div style={{ marginTop: '20px' }}>
        <button
          onClick={clearCacheAndReload}
          className="px-5 py-2.5 bg-gray-900 text-white rounded cursor-pointer hover:bg-gray-600 transition-colors duration-200"
        >
          البحث عن تحديث و اعاده تحميل الصفحه
        </button>
      </div>
    </>
  );
}

export default App;
