import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import geoJsonData from './Polygons/Dakahlia.json';
import type { FeatureCollection } from 'geojson';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { MapPin, Copy } from 'lucide-react';

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
    opacity: 0.8,
    weight: 1,
};

interface MapComponentProps {
    markers?: Array<{
        position: [number, number];
        title?: string;
        description?: string;
    }>;
    showUserLocation?: boolean;
}

function MapComponent({
    markers = [],
    showUserLocation = true
}: MapComponentProps) {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<L.Map | null>(null);
    const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null);
    const clickMarkerRef = useRef<L.Marker | null>(null);
    const [copySuccess, setCopySuccess] = useState(false);

    const copyToClipboard = async (text: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopySuccess(true);
            setTimeout(() => setCopySuccess(false), 2000);
        } catch (err) {
            console.error('فشل نسخ الموقع:', err);
        }
    };

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
                        html: `<div class="w-4 h-4 bg-blue-500 rounded-full border-3 border-white shadow-lg"></div>`,
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
        <div className="relative w-full h-[400px]">
            <div
                ref={mapRef}
                className="w-full h-full rounded-xl overflow-hidden shadow-lg"
            />
            {selectedLocation && (
                <Card className="absolute bottom-5 right-5 p-3 flex items-center gap-3 z-50 shadow-lg">
                    <MapPin className="w-5 h-5 text-gray-500" />
                    <span className="text-sm font-medium" dir='ltr'>
                        {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
                    </span>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(`${selectedLocation.lat.toFixed(6)}, ${selectedLocation.lng.toFixed(6)}`)}
                        className="gap-2"
                    >
                        {copySuccess ? (
                            <>
                                <span>تم النسخ</span>
                            </>
                        ) : (
                            <>
                                <Copy className="w-4 h-4" />
                                <span>نسخ</span>
                            </>
                        )}
                    </Button>
                </Card>
            )}
        </div>
    );
}

export default MapComponent;
