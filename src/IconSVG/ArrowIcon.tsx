interface ArrowIconProps {
    size?: number;
    color?: string;
    className?: string;
}

const ArrowIcon = ({
    size = 24,
    color = "#000000",
    className = ""
}: ArrowIconProps) => {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M11.178 19.569a.998.998 0 0 0 1.644 0l9-13A.999.999 0 0 0 21 5H3a1.002 1.002 0 0 0-.822 1.569l9 13z"
                fill={color}
            />
        </svg>
    );
};

export default ArrowIcon;
