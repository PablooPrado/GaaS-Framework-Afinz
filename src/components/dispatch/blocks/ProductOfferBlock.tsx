import React from 'react';
import { Package } from 'lucide-react';
import { useDispatchForm } from '../context/DispatchFormContext';
import { PRODUTOS, ETAPAS_AQUISICAO } from '../../../constants/frameworkFields';
import { SectionCard, Label, Input, Select } from './shared';

/**
 * Bloco 3: Produto & Oferta
 * Campos: Produto, Perfil Credito, Etapa do Funil, Oferta, Promocional, Oferta2, Promocional2
 * Largura: 200px
 */
export const ProductOfferBlock: React.FC = () => {
    const { formData, handleChange, errors, historicalOptions } = useDispatchForm();

    return (
        <div className="w-[200px] min-w-[200px] shrink-0">
            <SectionCard title="Produto & Oferta" icon={<Package size={14} />} badge="3">
                <div className="space-y-2">
                    {/* Produto */}
                    <div>
                        <Label label="Produto" required />
                        <Select
                            value={formData.produto}
                            onChange={(e) => handleChange('produto', e.target.value)}
                        >
                            <option value="">Selecione</option>
                            {(historicalOptions.produtos.length > 0 ? historicalOptions.produtos : PRODUTOS).map(p => (
                                <option key={p} value={p}>{p}</option>
                            ))}
                        </Select>
                    </div>

                    {/* Perfil Credito */}
                    <div>
                        <Label label="Perfil Credito" />
                        <Select
                            value={formData.perfilCredito}
                            onChange={(e) => handleChange('perfilCredito', e.target.value)}
                        >
                            <option value="">Selecione</option>
                            {historicalOptions.perfisCredito.map(p => (
                                <option key={p} value={p}>{p}</option>
                            ))}
                        </Select>
                    </div>

                    {/* Etapa do Funil - NOVO CAMPO IMPORTANTE */}
                    <div>
                        <Label label="Etapa Funil" />
                        <Select
                            value={formData.etapaAquisicao}
                            onChange={(e) => handleChange('etapaAquisicao', e.target.value)}
                        >
                            <option value="">Selecione</option>
                            {(historicalOptions.etapasAquisicao.length > 0
                                ? historicalOptions.etapasAquisicao
                                : ETAPAS_AQUISICAO
                            ).map(e => (
                                <option key={e} value={e}>{e}</option>
                            ))}
                        </Select>
                    </div>

                    {/* Divisor */}
                    <div className="border-t border-slate-700/50 pt-2 space-y-2">
                        {/* Oferta Principal */}
                        <div>
                            <Label label="Oferta" required />
                            <Input
                                list="ofertas-list"
                                value={formData.oferta}
                                onChange={(e) => handleChange('oferta', e.target.value)}
                                error={errors.oferta}
                            />
                            <datalist id="ofertas-list">
                                {historicalOptions.ofertas.map(o => (
                                    <option key={o} value={o} />
                                ))}
                            </datalist>
                        </div>

                        {/* Promocional */}
                        <div>
                            <Label label="Promocional" />
                            <Input
                                list="promocionais-list"
                                value={formData.promocional}
                                onChange={(e) => handleChange('promocional', e.target.value)}
                            />
                            <datalist id="promocionais-list">
                                {historicalOptions.promocionais.map(p => (
                                    <option key={p} value={p} />
                                ))}
                            </datalist>
                        </div>

                        {/* Oferta 2 e Promocional 2 - Compactos */}
                        <div className="grid grid-cols-2 gap-1.5">
                            <div>
                                <Label label="Oferta 2" />
                                <Input
                                    list="ofertas2-list"
                                    value={formData.oferta2}
                                    onChange={(e) => handleChange('oferta2', e.target.value)}
                                    placeholder="-"
                                />
                                <datalist id="ofertas2-list">
                                    {historicalOptions.ofertas2.map(o => (
                                        <option key={o} value={o} />
                                    ))}
                                </datalist>
                            </div>
                            <div>
                                <Label label="Promo 2" />
                                <Input
                                    list="promocionais2-list"
                                    value={formData.promocional2}
                                    onChange={(e) => handleChange('promocional2', e.target.value)}
                                    placeholder="-"
                                />
                                <datalist id="promocionais2-list">
                                    {historicalOptions.promocionais2.map(p => (
                                        <option key={p} value={p} />
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

export default ProductOfferBlock;
