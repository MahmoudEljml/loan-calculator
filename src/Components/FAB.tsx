import { useState, useEffect } from 'react';
interface ButtonProps {
    text: string;
    icon?: React.ReactNode;
    size?: 'small' | 'medium' | 'large';
    onClick?: () => void;
    className?: string;
    textPosition?: 'top' | 'bottom' | 'left' | 'right';
    showDetails?: boolean
}

export default function FAB({
    text,
    icon,
    size = 'medium',
    onClick,
    textPosition = 'left',// القيمة الافتراضية هي اليمين
    showDetails = false
}: ButtonProps) {
    const [showText, setShowText] = useState(false);

    const handleClick = () => {
        setShowText(true);
        onClick?.();
    };

    useEffect(() => {
        if (showText) {
            const timer = setTimeout(() => {
                setShowText(false);
            }, 1000);

            return () => clearTimeout(timer);
        }
    }, [showText]);

    const sizeClasses = {
        small: 'w-10 h-10',
        medium: 'w-12 h-12',
        large: 'w-14 h-14'
    };

    // تحديد موضع النص بناءً على القيمة المحددة
    const getTextPositionClasses = () => {
        switch (textPosition) {
            case 'top':
                return `bottom-full mb-3 left-1/2 transform -translate-x-1/2
                ${showText && showDetails ? 'opacity-100' : 'opacity-0 '}`;
            case 'bottom':
                return `top-full mt-3 left-1/2 transform -translate-x-1/2 
                ${showText && showDetails ? 'opacity-100 ' : 'opacity-0 '}`;
            case 'left':
                return `right-full mr-3 top-1/2 transform -translate-y-1/2
                ${showText && showDetails ? 'opacity-100' : 'opacity-0 '}`;
            case 'right':
                return `left-full ml-3 top-1/2 transform -translate-y-1/2
                ${showText && showDetails ? 'opacity-100' : 'opacity-0 '}`;
            default:
                return `left-full ml-3 top-1/2 transform -translate-y-1/2
                ${showText && showDetails ? 'opacity-100' : 'opacity-0 '}`;
        }
    };


    return (
        <button
            onClick={handleClick}
            className={`${sizeClasses[size]} bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center active:scale-95 group relative mx-2`}
        >
            {icon}
            <span
                className={`absolute bg-gray-900 text-white px-2 py-1 rounded text-sm whitespace-nowrap 
                            transition-all duration-300 ${getTextPositionClasses()}`}>
                {text}
            </span>
        </button>
    );
}
