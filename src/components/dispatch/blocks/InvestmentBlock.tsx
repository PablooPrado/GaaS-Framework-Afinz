import React from 'react';
import { DollarSign } from 'lucide-react';
import { useDispatchForm } from '../context/DispatchFormContext';
import { SectionCard, Label, Input } from './shared';

/**
 * Bloco 4: Investimento
 * Campos: Volume, C.U. Oferta, C.U. Canal, Total Campanha
 * Largura: 200px
 *
 * SIMPLIFICADO: Removidos Total Oferta e Total Canal (eram redundantes)
 * Total Campanha agora e discreto (sem verde chamativo)
 */
export const InvestmentBlock: React.FC = () => {
    const { formData, handleChange } = useDispatchForm();

    // Formatar moeda
    const formatCurrency = (value: string | number): string => {
        const num = Number(value) || 0;
        return num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    return (
        <div className="w-full h-full">
            <SectionCard
                title="Investimento"
                icon={<DollarSign size={14} />}
                badge="4"
            >
                <div className="space-y-2.5">
                    {/* Volume da Base */}
                    <div>
                        <Label label="Volume Base" />
                        <Input
                            type="number"
                            value={formData.baseVolume}
                            onChange={(e) => handleChange('baseVolume', e.target.value)}
                            placeholder="Ex: 50000"
                            className="text-base font-semibold text-slate-200"
                        />
                    </div>

                    {/* Custos Unitarios */}
                    <div className="grid grid-cols-2 gap-1.5">
                        <div>
                            <Label label="C.U. Oferta" tooltip="Custo Unitario Oferta" />
                            <Input
                                type="number"
                                step="0.01"
                                value={formData.custoUnitarioOferta}
                                onChange={(e) => handleChange('custoUnitarioOferta', e.target.value)}
                                className="bg-slate-900/50 text-[10px]"
                                placeholder="0.00"
                            />
                        </div>
                        <div>
                            <Label label="C.U. Canal" tooltip="Custo Unitario Canal (auto)" />
                            <Input
                                type="number"
                                step="0.001"
                                value={formData.custoUnitarioCanal}
                                onChange={(e) => handleChange('custoUnitarioCanal', e.target.value)}
                                className="bg-slate-900/50 text-[10px] text-slate-400"
                                placeholder="auto"
                                readOnly
                            />
                        </div>
                    </div>

                    {/* Custo Total Campanha - DISCRETO (sem verde) */}
                    <div className="mt-auto pt-3">
                        <div className="p-3 bg-slate-800/50 border border-slate-700/50 rounded-lg text-center">
                            <span className="text-[8px] uppercase text-slate-400 font-bold block mb-0.5">
                                Total Campanha
                            </span>
                            <span className="text-base font-bold text-slate-200 block">
                                R$ {formatCurrency(formData.custoTotalCampanha)}
                            </span>
                        </div>
                    </div>
                </div>
            </SectionCard>
        </div>
    );
};

export default InvestmentBlock;
