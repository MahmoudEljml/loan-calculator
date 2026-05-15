import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import geoJsonData from './Polygons/Dakahlia.json';
import type { FeatureCollection } from 'geojson';
import { Card } from '@/components/ui/card';
import { MapPin, Check, Maximize2, Minimize2 } from 'lucide-react';
import { toast, Toaster } from 'sonner';

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
    const clickMarkerRef = useRef<L.Marker | null>(null);
    const mapContainerRef = useRef<HTMLDivElement>(null);

    // دالة للتعامل مع الضغط على زر التأكيد
    const handleConfirmLocation = (e: React.MouseEvent) => {
        e.preventDefault();
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
    const toggleFullscreen = (e: React.MouseEvent) => {
        e.preventDefault();
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

            {/* زر ملء الشاشة */}
            <button
                onClick={(e) => toggleFullscreen(e)}
                className={`absolute top-4 right-4 z-10 p-2 rounded-lg shadow-md transition-colors ${isDarkMode
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
