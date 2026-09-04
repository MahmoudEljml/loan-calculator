import MapComponent from '@/features/map/components/Map';
import { useInstallmentsStorage } from '@/features/installments/hooks/useInstallmentsStorage';
import { Button } from '@/components/ui/button';
import { MapPinned } from 'lucide-react';
import { useCallback, useMemo, useState } from "react";

export function MapPage() {

    const [selectedLocation, setSelectedLocation] = useState({ lat: 0, lng: 0 });
    const [showInstallmentLocations, setShowInstallmentLocations] = useState(false);
    const { installments, isLoaded } = useInstallmentsStorage();

    const handleMapLocationSelect = useCallback((location: { lat: number; lng: number }) => {

        setSelectedLocation(location);
    }, []);
    const mapMarkers = useMemo(() => {
        if (!showInstallmentLocations) {
            return [];
        }

        return installments
            .filter((installment) => installment.latitude !== null && installment.longitude !== null)
            .map((installment) => ({
                position: [installment.latitude!, installment.longitude!] as [number, number],
                title: installment.clientName || 'عميل بدون اسم',
                description: installment.address,
            }));
    }, [installments, showInstallmentLocations]);



    return (
        <div dir="rtl" className="space-y-4" >
            <div className="flex justify-end">
                <Button
                    type="button"
                    variant={showInstallmentLocations ? 'default' : 'outline'}
                    onClick={() => setShowInstallmentLocations((visible) => !visible)}
                    disabled={!isLoaded}
                    className="gap-2"
                >
                    <MapPinned className="w-4 h-4" />
                    {showInstallmentLocations ? 'إخفاء مواقع الأقساط' : 'عرض مواقع الأقساط'}
                </Button>
            </div>
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
