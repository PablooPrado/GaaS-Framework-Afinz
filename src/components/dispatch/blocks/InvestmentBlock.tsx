import React from 'react';
import { DollarSign } from 'lucide-react';
import { useDispatchForm } from '../context/DispatchFormContext';
import { SectionCard, Label, Input } from './shared';

/**
 * Bloco 4: Investimento
 * Campos: Volume, Custos Unitarios e Totais
 * Largura: 200px
 */
export const InvestmentBlock: React.FC = () => {
    const { formData, handleChange } = useDispatchForm();

    // Formatar moeda
    const formatCurrency = (value: string | number): string => {
        const num = Number(value) || 0;
        return num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    return (
        <div className="w-[200px] min-w-[200px] shrink-0">
            <SectionCard
                title="Investimento"
                icon={<DollarSign size={14} />}
                headerClassName="text-emerald-400"
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
                            className="text-base font-semibold text-emerald-400 border-emerald-500/30 bg-emerald-950/20"
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
                            <Label label="C.U. Canal" tooltip="Custo Unitario Canal" />
                            <Input
                                type="number"
                                step="0.001"
                                value={formData.custoUnitarioCanal}
                                onChange={(e) => handleChange('custoUnitarioCanal', e.target.value)}
                                className="bg-slate-900/50 text-[10px]"
                                placeholder="0.000"
                                readOnly
                            />
                        </div>
                    </div>

                    {/* Custos Totais - Readonly */}
                    <div className="grid grid-cols-2 gap-1.5">
                        <div className="bg-slate-900/40 p-1.5 rounded border border-slate-700/50">
                            <Label label="Total Oferta" />
                            <div className="text-[10px] text-slate-300 font-mono text-center">
                                R$ {formatCurrency(formData.custoTotalOferta)}
                            </div>
                        </div>
                        <div className="bg-slate-900/40 p-1.5 rounded border border-slate-700/50">
                            <Label label="Total Canal" />
                            <div className="text-[10px] text-slate-300 font-mono text-center">
                                R$ {formatCurrency(formData.custoTotalCanal)}
                            </div>
                        </div>
                    </div>

                    {/* Custo Total Campanha - Destaque */}
                    <div className="mt-auto pt-3">
                        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-center">
                            <span className="text-[8px] uppercase text-emerald-500 font-bold block mb-0.5">
                                Total Campanha
                            </span>
                            <span className="text-base font-bold text-emerald-300 block">
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
