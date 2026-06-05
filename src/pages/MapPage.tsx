import MapComponent from '@/Project/Map';
import { useCallback, useMemo, useState } from "react";

export function MapPage() {

    const [selectedLocation, setSelectedLocation] = useState({ lat: 0, lng: 0 });

    const handleMapLocationSelect = useCallback((location: { lat: number; lng: number }) => {

        setSelectedLocation(location);
    }, []);
    const mapMarkers = useMemo(() => [
        {
            position: [0, 0] as [number, number],
            title: 'موقع النشاط'
        }
    ], []);



    return (
        <div dir="rtl" className="space-y-4" >
            <MapComponent
                showUserLocation={true}
                markers={mapMarkers}
                onLocationSelect={handleMapLocationSelect}
            />
            {selectedLocation && (
                <div className="text-center">
                    <p>خط العرض: {selectedLocation.lat.toFixed(6)}</p>
                    <p>خط الطول: {selectedLocation.lng.toFixed(6)}</p>
                </div>
            )}
        </div >
    );
}
