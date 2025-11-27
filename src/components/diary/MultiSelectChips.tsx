import React from 'react';
import { Check } from 'lucide-react';

interface MultiSelectChipsProps {
    label: string;
    options: string[];
    selected: string[];
    onChange: (selected: string[]) => void;
    colorMap?: Record<string, string>;
}

export const MultiSelectChips: React.FC<MultiSelectChipsProps> = ({
    label,
    options,
    selected,
    onChange,
    colorMap
}) => {
    const toggleOption = (option: string) => {
        if (selected.includes(option)) {
            onChange(selected.filter(item => item !== option));
        } else {
            onChange([...selected, option]);
        }
    };

    return (
        <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                {label}
            </label>
            <div className="flex flex-wrap gap-2 p-3 bg-slate-900/30 rounded-lg border border-slate-700/50 min-h-[60px]">
                {options.length === 0 ? (
                    <span className="text-xs text-slate-500 italic">Nenhuma opção disponível</span>
                ) : (
                    options.map((option) => {
                        const isSelected = selected.includes(option);
                        const customColor = colorMap?.[option];

                        let baseClasses = "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all cursor-pointer select-none border";

                        // Determine styles based on selection and custom colors
                        if (isSelected) {
                            if (customColor) {
                                // Use custom color if provided (assuming tailwind classes or hex not supported directly in class string easily without arbitrary values, 
                                // but here we expect colorMap to provide partial class strings or we use default active style)
                                // For simplicity, let's stick to a default active style unless we want complex logic
                                baseClasses += " bg-blue-600 border-blue-500 text-white shadow-md shadow-blue-900/20";
                            } else {
                                baseClasses += " bg-blue-600 border-blue-500 text-white shadow-md shadow-blue-900/20";
                            }
                        } else {
                            baseClasses += " bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700 hover:text-slate-200 hover:border-slate-600";
                        }

                        return (
                            <div
                                key={option}
                                onClick={() => toggleOption(option)}
                                className={baseClasses}
                            >
                                {option}
                                {isSelected && <Check size={12} className="stroke-[3]" />}
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};
