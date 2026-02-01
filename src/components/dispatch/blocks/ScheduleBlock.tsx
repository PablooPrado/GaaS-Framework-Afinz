import React from 'react';
import { Calendar } from 'lucide-react';
import { useDispatchForm } from '../context/DispatchFormContext';
import { SectionCard, Label, Input, ReadonlyField } from './shared';
// Label já importado para uso no campo Ordem editável

/**
 * Bloco 2: Cronograma
 * Campos: Data Inicio, Data Fim, Horario, Safra, Ordem
 * Largura: 180px
 */
export const ScheduleBlock: React.FC = () => {
    const { formData, handleChange, errors } = useDispatchForm();

    return (
        <div className="w-[180px] min-w-[180px] shrink-0">
            <SectionCard title="Cronograma" icon={<Calendar size={14} />} badge="2">
                <div className="space-y-2.5">
                    {/* Data Inicio */}
                    <div>
                        <Label label="Data Inicio" required />
                        <Input
                            type="date"
                            value={formData.dataInicio}
                            onChange={(e) => handleChange('dataInicio', e.target.value)}
                            error={errors.dataInicio}
                        />
                    </div>

                    {/* Data Fim */}
                    <div>
                        <Label label="Data Fim" required />
                        <Input
                            type="date"
                            value={formData.dataFim}
                            onChange={(e) => handleChange('dataFim', e.target.value)}
                            error={errors.dataFim}
                        />
                    </div>

                    {/* Horario */}
                    <div>
                        <Label label="Horario" />
                        <Input
                            type="time"
                            value={formData.horarioDisparo}
                            onChange={(e) => handleChange('horarioDisparo', e.target.value)}
                        />
                    </div>

                    {/* Divisor */}
                    <div className="border-t border-slate-700/50 pt-2">
                        {/* Safra (readonly) e Ordem (EDITAVEL) */}
                        <div className="grid grid-cols-2 gap-1.5">
                            <ReadonlyField
                                label="Safra"
                                value={formData.safra}
                            />
                            <div>
                                <Label label="Ordem" />
                                <Input
                                    value={formData.ordemDisparo}
                                    onChange={(e) => handleChange('ordemDisparo', e.target.value)}
                                    placeholder="ex: 1 ou Pontual"
                                    className="text-center font-bold text-blue-400"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </SectionCard>
        </div>
    );
};

export default ScheduleBlock;
