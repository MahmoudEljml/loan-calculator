import type { ReactNode } from "react";

// Use Omit to exclude the standard 'title' from HTMLAttributes
interface CardHeadProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
    // Now you can define your own 'title' with ReactNode
    title?: ReactNode;
    children?: ReactNode;
}

export function CardHead({ children, title, ...props }: CardHeadProps) {
    return (
        <div className="relative mt-10 border border-border p-4 rounded-lg shadow-md border-border py-5" {...props}>
            <div className="absolute -top-4 right-1">
                <h3 className="text-lg font-bold mb-3">{title}</h3>
            </div>
            {children}
        </div>
    );
}
