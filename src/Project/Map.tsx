import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import geoJsonData from './Polygons/Dakahlia.json';
import type { FeatureCollection } from 'geojson';

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
    fillColor: "#000000ff",
    fillOpacity: 0.3,
    color: "#000000",
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

    const copyToClipboard = async (text: string) => {
        try {
            await navigator.clipboard.writeText(text);
            alert('تم نسخ الموقع بنجاح');
        } catch (err) {
            console.error('فشل نسخ الموقع:', err);
            alert('فشل نسخ الموقع، يرجى المحاولة مرة أخرى');
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

        // إضافة طبقة الأسماء بالعربية
        // L.tileLayer('https://mt1.google.com/vt/lyrs=h@221097440&hl=ar&x={x}&y={y}&z={z}', {
        //     maxZoom: 18,
        //     minZoom: 13,
        // }).addTo(mapInstanceRef.current);

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
                html: '<div style="background: red; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 5px rgba(0,0,0,0.5);"></div>',
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
                        html: '<div style="background: blue; width: 15px; height: 15px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 10px rgba(0,0,0,0.5);"></div>',
                        iconSize: [20, 20],
                        className: 'user-location-marker'
                    });

                    // إضافة علامة موقع المستخدم
                    L.marker([latitude, longitude], { icon: userIcon })
                        .addTo(mapInstanceRef.current!)
                        .bindPopup(`
                            <div style="direction: rtl; text-align: right; font-family: Arial, sans-serif;">
                                <h3 style="margin: 0 0 10px 0; color: #333;">موقعك الحالي</h3>
                                <p style="margin: 0; color: #666;">
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
                    <div style="direction: rtl; text-align: right; font-family: Arial, sans-serif;">
                        <h3 style="margin: 0 0 10px 0; color: #333;">${marker.title || ''}</h3>
                        <p style="margin: 0; color: #666;">${marker.description || ''}</p>
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
        <div style={{ position: 'relative', width: '100%', height: '400px' }}>
            <div
                ref={mapRef}
                style={{
                    width: '100%',
                    height: '100%',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                }}
            />
            {selectedLocation && (
                <div
                    style={{
                        position: 'absolute',
                        bottom: '20px',
                        right: '20px',
                        backgroundColor: 'white',
                        padding: '10px',
                        borderRadius: '8px',
                        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        direction: 'rtl',
                        zIndex: 1000
                    }}
                >
                    <span style={{ fontFamily: 'Arial, sans-serif', fontSize: '14px', direction: 'ltr' }}>
                        {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
                    </span>
                    <button
                        onClick={() => copyToClipboard(`${selectedLocation.lat.toFixed(6)}, ${selectedLocation.lng.toFixed(6)}`)}
                        style={{
                            padding: '5px 10px',
                            backgroundColor: '#007bff',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '14px'
                        }}
                    >
                        نسخ
                    </button>
                </div>
            )}
        </div>
    );
}

export default MapComponent;
