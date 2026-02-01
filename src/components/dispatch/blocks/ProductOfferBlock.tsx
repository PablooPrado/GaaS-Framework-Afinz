import React, { useMemo } from 'react';
import { Package } from 'lucide-react';
import { useDispatchForm } from '../context/DispatchFormContext';
import { PRODUTOS, ETAPAS_AQUISICAO } from '../../../constants/frameworkFields';
import { SectionCard, Label, Combobox, ComboboxOption } from './shared';

/**
 * Bloco 3: Produto & Oferta
 * Campos: Produto, Perfil Credito, Etapa do Funil, Oferta, Promocional, Oferta2, Promocional2
 * Largura: 200px
 *
 * PILAR: Automatizacao por Historico
 * - TODOS os campos usam Combobox editavel com sugestoes
 * - Usuario pode digitar livremente OU selecionar sugestao
 * - Sugestoes ordenadas por frequencia de uso
 */
export const ProductOfferBlock: React.FC = () => {
    const { formData, handleChange, errors, smartOptions } = useDispatchForm();

    // Converter arrays fixos para formato ComboboxOption
    const produtosOptions = useMemo<ComboboxOption[]>(() => {
        if (smartOptions.produtos.length > 0) {
            return smartOptions.produtos;
        }
        return PRODUTOS.map(p => ({ value: p, count: 0 }));
    }, [smartOptions.produtos]);

    const etapasOptions = useMemo<ComboboxOption[]>(() => {
        if (smartOptions.etapasAquisicao.length > 0) {
            return smartOptions.etapasAquisicao;
        }
        return ETAPAS_AQUISICAO.map(e => ({ value: e, count: 0 }));
    }, [smartOptions.etapasAquisicao]);

    return (
        <div className="w-full h-full">
            <SectionCard title="Produto & Oferta" icon={<Package size={14} />} badge="3">
                <div className="space-y-2">
                    {/* Produto - Combobox */}
                    <div>
                        <Label label="Produto" required />
                        <Combobox
                            value={formData.produto}
                            onChange={(val) => handleChange('produto', val)}
                            options={produtosOptions}
                            placeholder="Digite ou selecione..."
                        />
                    </div>

                    {/* Perfil Credito - Combobox */}
                    <div>
                        <Label label="Perfil Credito" />
                        <Combobox
                            value={formData.perfilCredito}
                            onChange={(val) => handleChange('perfilCredito', val)}
                            options={smartOptions.perfisCredito}
                            placeholder="Digite..."
                        />
                    </div>

                    {/* Etapa do Funil - Combobox */}
                    <div>
                        <Label label="Etapa Funil" />
                        <Combobox
                            value={formData.etapaAquisicao}
                            onChange={(val) => handleChange('etapaAquisicao', val)}
                            options={etapasOptions}
                            placeholder="Digite ou selecione..."
                        />
                    </div>

                    {/* Divisor - OFERTAS */}
                    <div className="border-t border-slate-700/50 pt-2 space-y-2">
                        {/* Oferta Principal - Combobox */}
                        <div>
                            <Label label="Oferta" required />
                            <Combobox
                                value={formData.oferta}
                                onChange={(val) => handleChange('oferta', val)}
                                options={smartOptions.ofertas}
                                placeholder="Digite ou selecione..."
                                error={errors.oferta}
                            />
                        </div>

                        {/* Promocional - Combobox */}
                        <div>
                            <Label label="Promocional" />
                            <Combobox
                                value={formData.promocional}
                                onChange={(val) => handleChange('promocional', val)}
                                options={smartOptions.promocionais}
                                placeholder="Digite..."
                            />
                        </div>

                        {/* Oferta 2 e Promocional 2 - Combobox */}
                        <div className="grid grid-cols-2 gap-1.5">
                            <div>
                                <Label label="Oferta 2" />
                                <Combobox
                                    value={formData.oferta2}
                                    onChange={(val) => handleChange('oferta2', val)}
                                    options={smartOptions.ofertas2}
                                    placeholder="Digite..."
                                />
                            </div>
                            <div>
                                <Label label="Promo 2" />
                                <Combobox
                                    value={formData.promocional2}
                                    onChange={(val) => handleChange('promocional2', val)}
                                    options={smartOptions.promocionais2}
                                    placeholder="Digite..."
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </SectionCard>
        </div>
    );
};

export default ProductOfferBlock;
