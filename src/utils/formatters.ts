export const formatPercentage = (value: number | null): string => {
  if (value === null || value === undefined) return '—';
  return `${(value * 100).toFixed(1)}%`;
};

export const formatCurrency = (value: number | null): string => {
  if (value === null || value === undefined) return '—';
  return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export const formatNumber = (value: number | null): string => {
  if (value === null || value === undefined) return '—';
  return value.toLocaleString('pt-BR');
};

export const parsePercentage = (value: string | number): number | null => {
  if (!value) return null;
  try {
    const strValue = value.toString().trim();

    // Ignora valores de erro do Excel
    if (strValue === '#DIV/0!' || strValue === '#N/A' || strValue === '#REF!' || strValue === '#VALUE!' || strValue === '') {
      return null;
    }

    // Se for string com %, remove o %
    if (typeof value === 'string' && value.includes('%')) {
      const num = parseFloat(strValue.replace('%', ''));
      return isNaN(num) ? null : num / 100;
    }

    // Se for número puro (como 99 ou 0.99)
    if (typeof value === 'number') {
      // Se está entre 0 e 1, já está em formato decimal (0.99 = 99%)
      if (value >= 0 && value <= 1) {
        return value;
      }
      // Se está entre 1 e 100, é percentual (99 = 99%)
      if (value > 1 && value <= 100) {
        return value / 100;
      }
      // Valores maiores que 100 provavelmente já estão com erro
      return value > 100 ? value / 100 : value;
    }

    // String sem %
    const num = parseFloat(strValue);
    if (isNaN(num)) return null;

    // Mesma lógica: se entre 0-1 é decimal, se 1-100 é percentual
    if (num >= 0 && num <= 1) {
      return num;
    }
    if (num > 1 && num <= 100) {
      return num / 100;
    }
    return num > 100 ? num / 100 : num;
  } catch {
    return null;
  }
};

export const parseCurrency = (value: string | number): number | null => {
  if (!value) return null;
  try {
    const strValue = value.toString().trim();
    // Ignora valores de erro do Excel
    if (strValue === '#DIV/0!' || strValue === '#N/A' || strValue === '#REF!' || strValue === '#VALUE!' || strValue === '') {
      return null;
    }

    if (typeof value === 'number') return isNaN(value) ? null : value;

    // Remove "R$" e espaços, converte vírgula brasileira para ponto
    let cleaned = strValue.replace('R$', '').trim();
    // remove qualquer caractere não numérico / separadores, normaliza milhar/ponto e decimal/vírgula
    cleaned = cleaned.replace(/[^0-9.,-]/g, '')
      .replace(/\.(?=\d{3}(\D|$))/g, '') // remove todos os pontos de milhar
      .replace(',', '.');
    const num = parseFloat(cleaned);
    return isNaN(num) ? null : num;
  } catch {
    return null;
  }
};

export const parseNumber = (value: string | number): number | null => {
  if (!value) return null;
  try {
    // Ignora valores de erro do Excel
    const strValue = value.toString().trim();
    if (strValue === '#DIV/0!' || strValue === '#N/A' || strValue === '#REF!' || strValue === '#VALUE!') {
      return null;
    }

    if (typeof value === 'number') return isNaN(value) ? null : value;

    // Remove % se existir e converte
    let cleaned = strValue.replace('%', '').trim();
    cleaned = cleaned.replace(/[^0-9.,-]/g, '')
      .replace(/\.(?=\d{3}(\D|$))/g, '') // remove pontos de milhar
      .replace(',', '.');
    const num = parseFloat(cleaned);
    return isNaN(num) ? null : num;
  } catch {
    return null;
  }
};

export const formatDateKey = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const parseDate = (dateString: string | number): Date | null => {
  if (!dateString) return null;

  try {
    // Handle Excel Serial Date
    if (typeof dateString === 'number' || (typeof dateString === 'string' && !isNaN(Number(dateString)) && !dateString.includes('/') && !dateString.includes('-'))) {
      const serial = Number(dateString);
      const utc_days = Math.floor(serial - 25569);
      const utc_value = utc_days * 86400;
      const date_info = new Date(utc_value * 1000);
      const fractional_day = serial - Math.floor(serial) + 0.0000001;
      const total_seconds = Math.floor(86400 * fractional_day);
      const seconds = total_seconds % 60;
      const minutes = Math.floor(total_seconds / 60) % 60;
      const hours = Math.floor(total_seconds / (60 * 60));
      return new Date(date_info.getFullYear(), date_info.getMonth(), date_info.getDate(), hours, minutes, seconds);
    }

    const trimmed = dateString.toString().trim();

    // Tenta: DD/MM/YYYY
    if (trimmed.includes('/')) {
      const parts = trimmed.split('/');
      if (parts.length === 3) {
        const p0 = parseInt(parts[0], 10);
        const p1 = parseInt(parts[1], 10);
        let year = parseInt(parts[2], 10);
        if (year < 100) year += 2000;

        // Try DD/MM/YYYY first
        let day = p0;
        let month = p1;

        let date = new Date(year, month - 1, day);
        if (date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day) {
          return date;
        }

        // Fallback: MM/DD/YYYY (US Format)
        // If DD/MM failed (e.g. 01/16/2025 -> Month 16 invalid), try swap
        day = p1;
        month = p0;
        date = new Date(year, month - 1, day);
        if (date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day) {
          return date;
        }
      }
    }

    // Tenta: YYYY-MM-DD (ISO)
    if (trimmed.includes('-')) {
      const parts = trimmed.split('-');
      if (parts.length >= 3) {
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10);
        // Remove time part if exists to avoid timezone drift
        const dayPart = parts[2].split('T')[0].split(' ')[0];
        const day = parseInt(dayPart, 10);

        if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
          return new Date(year, month - 1, day);
        }
      }
    }

    // Fallback direct parsing but strip Timezone Z to force Local
    let cleanDateStr = trimmed;
    if (cleanDateStr.endsWith('Z')) {
      cleanDateStr = cleanDateStr.slice(0, -1);
    }
    const date = new Date(cleanDateStr);
    if (!isNaN(date.getTime())) {
      // If it has hours equal to offset, it might still have drifted. 
      // Ideally we rely on the manual parsing above.
      return date;
    }

    return null;
  } catch {
    return null;
  }
};

// Converte textos de safra (ex.: "out/25", "OUT 2025", "out-2025") em chave YYYY-MM
export const parseSafraToKey = (safra: string): string | null => {
  if (!safra) return null;
  const s = safra.toString().trim().toLowerCase();
  const meses: { [k: string]: number } = {
    'jan': 0, 'fev': 1, 'mar': 2, 'abr': 3, 'mai': 4, 'jun': 5,
    'jul': 6, 'ago': 7, 'set': 8, 'out': 9, 'nov': 10, 'dez': 11
  };
  // extrai trio de letras do mês
  const m = Object.keys(meses).find(k => s.includes(k));
  if (!m) return null;
  // extrai ano (2 ou 4 dígitos)
  const yearMatch = s.match(/(20\d{2}|\d{2})/);
  if (!yearMatch) return null;
  let year = parseInt(yearMatch[1], 10);
  if (year < 100) year = 2000 + year; // assume século 2000
  const month = meses[m];
  const monthStr = String(month + 1).padStart(2, '0');
  return `${year}-${monthStr}`;
};

export const getMonthYear = (date: Date): string => {
  return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }).toUpperCase();
};

export const getDayName = (date: Date): string => {
  return date.toLocaleDateString('pt-BR', { weekday: 'short' }).toUpperCase();
};

export const formatDateDisplay = (date: Date): string => {
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
};
