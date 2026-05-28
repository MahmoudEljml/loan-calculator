import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import geoJsonData from './Polygons/Dakahlia.json';
import type { FeatureCollection } from 'geojson';
import { Card } from '@/components/ui/card';
import { MapPin, Check, Maximize2, Minimize2, Search } from 'lucide-react';
import { toast, Toaster } from 'sonner';
// @ts-ignore
import { OpenLocationCode } from 'open-location-code';

const dakahliaData = geoJsonData as FeatureCollection;

// طبقة خرائط Google بالعربية
const GoogleArabicLayer = L.TileLayer.extend({
    getTileUrl: function (coords: { x: number; y: number; z: number }) {
        const { x, y, z } = coords;
        return `https://mt1.google.com/vt/lyrs=m@221097440&hl=ar&x=${x}&y=${y}&z=${z}`;
    }
});

// خيارات تخصيص الحدود
const polygonOptions = {
    fillColor: "rgba(0, 0, 0, 0.301)",
    fillOpacity: 0.3,
    color: "rgba(0, 0, 0, 0.09)",
    opacity: 0,
    weight: 1,
};

interface MapComponentProps {
    markers?: Array<{
        position: [number, number];
        title?: string;
        description?: string;
    }>;
    showUserLocation?: boolean;
    onLocationSelect?: (location: { lat: number; lng: number }) => void;
}

function MapComponent({
    markers = [],
    showUserLocation = true,
    onLocationSelect
}: MapComponentProps) {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<L.Map | null>(null);
    const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [plusCode, setPlusCode] = useState('');
    const clickMarkerRef = useRef<L.Marker | null>(null);
    const mapContainerRef = useRef<HTMLDivElement>(null);

    // دالة للتعامل مع البحث عن كود Plus Code أو الإحداثيات الجغرافية
    const handleSearchPlusCode = () => {
        if (!plusCode.trim()) {
            toast.error('الرجاء إدخال كود Plus Code أو إحداثيات');
            return;
        }

        try {
            // التحقق مما إذا كان الإدخال يحتوي على إحداثيات جغرافية (DMS)
            // نمط البحث يبحث عن درجات ودقائق وثواني مع اتجاهات N/S و E/W
            const dmsPattern = /(\d+)°(\d+)'([\d.]+)"([NS])\s*(\d+)°(\d+)'([\d.]+)"([EW])/i;
            const dmsMatch = plusCode.trim().match(dmsPattern);

            let latitude, longitude;

            if (dmsMatch) {
                // تحويل الإحداثيات من DMS إلى درجات عشرية
                const latDeg = parseInt(dmsMatch[1]);
                const latMin = parseInt(dmsMatch[2]);
                const latSec = parseFloat(dmsMatch[3]);
                const latDir = dmsMatch[4].toUpperCase();

                const lngDeg = parseInt(dmsMatch[5]);
                const lngMin = parseInt(dmsMatch[6]);
                const lngSec = parseFloat(dmsMatch[7]);
                const lngDir = dmsMatch[8].toUpperCase();

                // حساب خط العرض
                latitude = latDeg + (latMin / 60) + (latSec / 3600);
                if (latDir === 'S') {
                    latitude = -latitude;
                }

                // حساب خط الطول
                longitude = lngDeg + (lngMin / 60) + (lngSec / 3600);
                if (lngDir === 'W') {
                    longitude = -longitude;
                }
            } else {
                // التعامل مع Plus Codes
                const olc = new OpenLocationCode();
                let codeArea;

                // استخراج الكود من النص المدخل (للتعامل مع صيغة "كود + اسم المكان")
                const codeMatch = plusCode.match(/([23456789CFGHJMPQRVWX]+)\+([23456789CFGHJMPQRVWX]+)/);
                const extractedCode = codeMatch ? `${codeMatch[1]}+${codeMatch[2]}` : plusCode.trim();

                // التحقق مما إذا كان الكود مختصراً
                if (olc.isShort(extractedCode)) {
                    // إذا كان الكود مختصراً، نحتاج إلى تحويله إلى كود كامل
                    // سنستخدم مركز الدقهلية كمرجع
                    const bounds = L.geoJSON(dakahliaData).getBounds();
                    const center = bounds.getCenter();
                    const fullCode = olc.recoverNearest(extractedCode, center.lat, center.lng);
                    codeArea = olc.decode(fullCode);
                } else {
                    // إذا كان الكود كاملاً، نستخدمه مباشرة
                    codeArea = olc.decode(extractedCode);
                }

                if (codeArea) {
                    latitude = codeArea.latitudeCenter;
                    longitude = codeArea.longitudeCenter;
                } else {
                    throw new Error('فشل في فك تشفير الكود');
                }
            }

            if (latitude !== undefined && longitude !== undefined) {
                const newLocation = { lat: latitude, lng: longitude };

                setSelectedLocation(newLocation);

                // إزالة العلامة السابقة إذا وجدت
                if (clickMarkerRef.current) {
                    mapInstanceRef.current?.removeLayer(clickMarkerRef.current);
                }

                // إنشاء أيقونة مخصصة للنقطة المحددة
                const clickIcon = L.divIcon({
                    html: `<div class="w-3 h-3 bg-red-500 rounded-full border-2 border-white shadow-md"></div>`,
                    iconSize: [12, 12],
                    className: 'click-marker'
                });

                // إضافة علامة جديدة في الموقع
                clickMarkerRef.current = L.marker([latitude, longitude], { icon: clickIcon })
                    .addTo(mapInstanceRef.current!);

                // توجيه الخريطة نحو الموقع الجديد
                mapInstanceRef.current?.setView([latitude, longitude], 16);

                toast.success('تم العثور على الموقع بنجاح', {
                    description: `خط العرض: ${latitude.toFixed(6)}, خط الطول: ${longitude.toFixed(6)}`,
                    duration: 3000,
                    position: 'top-center',
                });
            } else {
                throw new Error('فشل في تحديد الموقع');
            }
        } catch (error) {
            console.error('Error processing location:', error);
            toast.error('خطأ في معالجة الموقع', {
                description: 'الرجاء التأكد من صحة الكود أو الإحداثيات المدخلة والمحاولة مرة أخرى',
                duration: 3000,
                position: 'top-center',
            });
        }
    };


    // دالة للتعامل مع الضغط على زر التأكيد
    const handleConfirmLocation = () => {
        if (selectedLocation && onLocationSelect) {
            onLocationSelect(selectedLocation);

            // إظهار إشعار عند إضافة الموقع
            toast.success('تمت تغيير الإحداثيات بنجاح', {
                description: `خط العرض: ${selectedLocation.lat.toFixed(6)}, خط الطول: ${selectedLocation.lng.toFixed(6)}`,
                duration: 3000,
                position: 'top-center',
            });
        }
    };

    // دالة للتبديل بين وضع ملء الشاشة والوضع العادي
    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            mapContainerRef.current?.requestFullscreen().catch(err => {
                console.error(`Error attempting to enable fullscreen: ${err.message}`);
            });
            setIsFullscreen(true);
        } else {
            document.exitFullscreen();
            setIsFullscreen(false);
        }
    };

    // التحقق من الوضع الليلي
    useEffect(() => {
        const checkDarkMode = () => {
            setIsDarkMode(document.documentElement.classList.contains('dark'));
        };

        // Check initially
        checkDarkMode();

        // Set up a mutation observer to watch for class changes on the html element
        const observer = new MutationObserver(checkDarkMode);
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

        return () => {
            observer.disconnect();
        };
    }, []);

    // الاستماع لتغييرات وضع ملء الشاشة
    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };

        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => {
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
        };
    }, []);

    // تحديث حجم الخريطة عند تغيير وضع ملء الشاشة
    useEffect(() => {
        if (mapInstanceRef.current) {
            setTimeout(() => {
                mapInstanceRef.current?.invalidateSize();
            }, 100);
        }
    }, [isFullscreen]);

    useEffect(() => {
        if (!mapRef.current || mapInstanceRef.current) return;

        // إنشاء الخريطة
        mapInstanceRef.current = L.map(mapRef.current, {
            zoomControl: true,
            attributionControl: false,
        });

        // إضافة طبقة خرائط Google بالعربية
        new GoogleArabicLayer().addTo(mapInstanceRef.current);

        // إنشاء طبقة GeoJSON باستخدام البيانات المستوردة
        const geoJsonLayer = L.geoJSON(dakahliaData, {
            style: polygonOptions
        }).addTo(mapInstanceRef.current!);

        // ضبط حدود الخريطة
        const bounds = geoJsonLayer.getBounds();
        mapInstanceRef.current?.fitBounds(bounds);
        mapInstanceRef.current?.setMaxBounds(bounds.pad(0.1));

        // إضافة حدث النقر على الخريطة
        mapInstanceRef.current?.on('click', function (e) {
            const { lat, lng } = e.latlng;
            setSelectedLocation({ lat, lng });

            // إزالة العلامة السابقة إذا وجدت
            if (clickMarkerRef.current) {
                mapInstanceRef.current?.removeLayer(clickMarkerRef.current);
            }

            // إنشاء أيقونة مخصصة للنقطة المحددة
            const clickIcon = L.divIcon({
                html: `<div class="w-3 h-3 bg-red-500 rounded-full border-2 border-white shadow-md"></div>`,
                iconSize: [12, 12],
                className: 'click-marker'
            });

            // إضافة علامة جديدة في موقع النقر
            clickMarkerRef.current = L.marker([lat, lng], { icon: clickIcon })
                .addTo(mapInstanceRef.current!);
        });

        // الحصول على موقع المستخدم الحالي
        if (showUserLocation && navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;

                    // إنشاء أيقونة مخصصة لموقع المستخدم
                    const userIcon = L.divIcon({
                        html: `<div class="w-3 h-3 bg-blue-500 rounded-full border-3 border-white shadow-lg"></div>`,
                        iconSize: [20, 20],
                        className: 'user-location-marker'
                    });

                    // إضافة علامة موقع المستخدم
                    L.marker([latitude, longitude], { icon: userIcon })
                        .addTo(mapInstanceRef.current!)
                        .bindPopup(`
                            <div class="text-right font-sans" dir="rtl">
                                <h3 class="text-lg font-semibold text-gray-800 mb-2">موقعك الحالي</h3>
                                <p class="text-gray-600 text-sm">
                                    خط العرض: ${latitude.toFixed(6)}<br>
                                    خط الطول: ${longitude.toFixed(6)}
                                </p>
                            </div>
                        `);

                    // توجيه الخريطة نحو موقع المستخدم
                    mapInstanceRef.current?.setView([latitude, longitude], 16);
                },
                (error) => {
                    console.error("Error getting location:", error);
                    // نستخدم مركز حدود الدقهلية كافتراضي
                    const fallbackCenter = bounds.getCenter();
                    L.popup()
                        .setLatLng(fallbackCenter)
                        .setContent('لم نتمكن من الوصول إلى موقعك الحالي')
                        .openOn(mapInstanceRef.current!);
                }
            );
        }

        // إضافة العلامات المخصصة
        markers.forEach(marker => {
            const markerInstance = L.marker(marker.position)
                .addTo(mapInstanceRef.current!)
                .bindPopup(`
                    <div class="text-right font-sans" dir="rtl">
                        <h3 class="text-lg font-semibold text-gray-800 mb-2">${marker.title || ''}</h3>
                        <p class="text-gray-600 text-sm">${marker.description || ''}</p>
                    </div>
                `);

            markerInstance.on('mouseover', function (this: L.Marker) {
                this.openPopup();
            });
        });

        return () => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
            }
        };
    }, [showUserLocation, markers]);

    return (
        <div ref={mapContainerRef} className={`relative w-full ${isFullscreen ? 'h-screen' : 'h-[400px]'}`}>
            <div style={{ zIndex: 0 }} ref={mapRef} className="w-full h-full rounded-xl overflow-hidden shadow-lg" />

            {/* حقل البحث عن كود Plus Code */}
            <div className="absolute top-4 left-4 right-16 z-10 flex gap-2">
                <input
                    type="text"
                    value={plusCode}
                    onChange={(e) => setPlusCode(e.target.value)}
                    placeholder={`(31°05'57.3" N 31°20'33.8"E)`}
                    className={`w-64 px-4 py-2 rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'
                        }`}
                    dir="ltr"
                />
                <button
                    type="button"
                    onClick={handleSearchPlusCode}
                    className={`p-2 rounded-lg shadow-md transition-colors ${isDarkMode
                        ? 'bg-gray-800 text-white hover:bg-gray-700'
                        : 'bg-white text-gray-800 hover:bg-gray-100'
                        }`}
                >
                    <Search className="w-5 h-5" />
                </button>
            </div>

            {/* زر ملء الشاشة */}
            <button
                type="button"
                onClick={toggleFullscreen}
                className={`absolute top-4 right-4 p-2 rounded-lg shadow-md transition-colors ${isDarkMode
                    ? 'bg-gray-800 text-white hover:bg-gray-700'
                    : 'bg-white text-gray-800 hover:bg-gray-100'
                    }`}
                title={isFullscreen ? "خروج من ملء الشاشة" : "ملء الشاشة"}
            >
                {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
            </button>

            {selectedLocation && (
                <Card className="absolute bottom-5 right-5 p-3 flex-row items-center gap-3 z-0 shadow-lg">
                    <MapPin className="w-5 h-5 text-gray-500" />
                    <span className="text-sm font-medium" dir='ltr'>
                        {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
                    </span>
                    <div
                        onClick={handleConfirmLocation}
                        className="inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-8 px-4 py-2 cursor-pointer"
                    >
                        <Check className="w-4 h-4" />
                        <span>تأكيد</span>
                    </div>
                </Card>
            )}

            {/* Toaster component for fullscreen mode */}
            {isFullscreen && (
                <Toaster
                    position="top-center"
                    richColors
                    closeButton
                    expand={false}
                    duration={3000}
                    theme={isDarkMode ? "dark" : "light"}
                    className="z-[9999]"
                />
            )}
        </div>
    );
}

export default React.memo(MapComponent);
