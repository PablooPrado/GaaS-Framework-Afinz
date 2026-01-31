import React from 'react';
import { Tag } from 'lucide-react';
import { useDispatchForm } from '../context/DispatchFormContext';
import { CANAIS } from '../../../constants/frameworkFields';
import { SectionCard, Label, Input, Select } from './shared';

/**
 * Bloco 1: Identificacao
 * Campos: BU, Segmento, Nome, Jornada, Canal, Parceiro, Subgrupo
 * Largura: 220px
 */
export const IdentificationBlock: React.FC = () => {
    const { formData, handleChange, errors, historicalOptions } = useDispatchForm();

    return (
        <div className="w-[220px] min-w-[220px] shrink-0">
            <SectionCard title="Identificacao" icon={<Tag size={14} />} badge="1">
                <div className="space-y-2.5">
                    {/* BU e Segmento */}
                    <div className="grid grid-cols-2 gap-1.5">
                        <div>
                            <Label label="BU" required />
                            <Select
                                value={formData.bu}
                                onChange={(e) => handleChange('bu', e.target.value)}
                                error={errors.bu}
                            >
                                <option value="">...</option>
                                <option value="B2C">B2C</option>
                                <option value="B2B2C">B2B2C</option>
                                <option value="Plurix">Plurix</option>
                            </Select>
                        </div>
                        <div>
                            <Label label="Seg." required />
                            <Select
                                value={formData.segmento}
                                onChange={(e) => handleChange('segmento', e.target.value)}
                                error={errors.segmento}
                            >
                                <option value="">...</option>
                                {historicalOptions.segmentos.map(s => (
                                    <option key={s} value={s}>{s}</option>
                                ))}
                            </Select>
                        </div>
                    </div>

                    {/* Nome da Atividade */}
                    <div>
                        <Label label="Nome Atividade" required />
                        <Input
                            value={formData.activityName}
                            onChange={(e) => handleChange('activityName', e.target.value)}
                            placeholder="campanha_2026"
                            className="font-mono text-[9px] bg-slate-950/30 border-slate-800 text-slate-300"
                            error={errors.activityName}
                        />
                    </div>

                    {/* Jornada */}
                    <div>
                        <Label label="Jornada" required />
                        <Input
                            list="jornadas-list"
                            value={formData.jornada}
                            onChange={(e) => handleChange('jornada', e.target.value)}
                            error={errors.jornada}
                            placeholder="Ex: Carrinho"
                        />
                        <datalist id="jornadas-list">
                            {historicalOptions.jornadas.map(j => (
                                <option key={j} value={j} />
                            ))}
                        </datalist>
                    </div>

                    {/* Canal */}
                    <div>
                        <Label label="Canal" required />
                        <Select
                            value={formData.canal}
                            onChange={(e) => handleChange('canal', e.target.value)}
                            error={errors.canal}
                        >
                            <option value="">Selecione</option>
                            {(historicalOptions.canais.length > 0 ? historicalOptions.canais : CANAIS).map(c => (
                                <option key={c} value={c}>{c}</option>
                            ))}
                        </Select>
                    </div>

                    {/* Divisor visual */}
                    <div className="border-t border-slate-700/50 pt-2">
                        {/* Parceiro e Subgrupo */}
                        <div className="grid grid-cols-2 gap-1.5">
                            <div>
                                <Label label="Parceiro" />
                                <Input
                                    list="parceiros-list"
                                    value={formData.parceiro}
                                    onChange={(e) => handleChange('parceiro', e.target.value)}
                                    placeholder="-"
                                />
                                <datalist id="parceiros-list">
                                    {historicalOptions.parceiros.map(p => (
                                        <option key={p} value={p} />
                                    ))}
                                </datalist>
                            </div>
                            <div>
                                <Label label="Subgrupo" />
                                <Input
                                    list="subgrupos-list"
                                    value={formData.subgrupo}
                                    onChange={(e) => handleChange('subgrupo', e.target.value)}
                                    placeholder="-"
                                />
                                <datalist id="subgrupos-list">
                                    {historicalOptions.subgrupos.map(s => (
                                        <option key={s} value={s} />
                                    ))}
                                </datalist>
                            </div>
                        </div>
                    </div>
                </div>
            </SectionCard>
        </div>
    );
};

export default IdentificationBlock;
