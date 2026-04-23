import { Pipe, PipeTransform } from '@angular/core';

interface ColumnFilters {
  status?: string[];
  situacao?: string[];
  previsao?: string[];
  novaData?: string[];
}

interface SortConfig {
  column?: '' | 'status' | 'situacao' | 'previsao' | 'novaData';
  direction?: '' | 'asc' | 'desc';
}

@Pipe({
  name: 'filterIssues',
  pure: false
})
export class FilterIssuesPipe implements PipeTransform {
  transform(issues: any[], searchTerm: string, columnFilters?: ColumnFilters, sortConfig?: SortConfig): any[] {
    if (!issues) {
      return issues;
    }

    const lowerTerm = (searchTerm || '').toLowerCase().trim();
    const filters = columnFilters || {};

    const filteredIssues = issues.filter(issue => {
      const key = (issue.key || '').toString().toLowerCase();
      const resumo = (issue.resumo || '').toString().toLowerCase();
      const status = (issue.status || '').toString().toLowerCase();
      const situacao = (issue.situacao || '').toString().toLowerCase();
      const veiculo = (issue.veiculo || '').toString().toLowerCase();
      const previsao = (issue.previsao || '').toString().trim();
      const novaData = (issue.novaData || '').toString().trim();

      const matchesSearch = !lowerTerm
        || key.includes(lowerTerm)
        || resumo.includes(lowerTerm)
        || status.includes(lowerTerm)
        || situacao.includes(lowerTerm)
        || veiculo.includes(lowerTerm);

      if (!matchesSearch) {
        return false;
      }

      if (filters.status && filters.status.length > 0 && !filters.status.includes(issue.status)) {
        return false;
      }

      if (filters.situacao && filters.situacao.length > 0 && !filters.situacao.includes(issue.situacao)) {
        return false;
      }

      if (filters.previsao && filters.previsao.length > 0) {
        const hasPrevisao = !!previsao;
        const matchesPrevisao =
          (filters.previsao.includes('com-data') && hasPrevisao)
          || (filters.previsao.includes('sem-data') && !hasPrevisao);

        if (!matchesPrevisao) {
          return false;
        }
      }

      if (filters.novaData && filters.novaData.length > 0) {
        const hasNovaData = !!novaData;
        const matchesNovaData =
          (filters.novaData.includes('com-data') && hasNovaData)
          || (filters.novaData.includes('sem-data') && !hasNovaData);

        if (!matchesNovaData) {
          return false;
        }
      }

      return true;
    });

    if (!sortConfig?.column || !sortConfig?.direction) {
      return filteredIssues;
    }

    const sortColumn = sortConfig.column as 'status' | 'situacao' | 'previsao' | 'novaData';
    const directionFactor = sortConfig.direction === 'asc' ? 1 : -1;

    return [...filteredIssues].sort((a, b) => this.compareByColumn(a, b, sortColumn, directionFactor));
  }

  private compareByColumn(
    a: any,
    b: any,
    column: 'status' | 'situacao' | 'previsao' | 'novaData',
    directionFactor: number
  ): number {
    const aValue = this.getSortableValue(a, column);
    const bValue = this.getSortableValue(b, column);

    if (aValue == null && bValue == null) {
      return 0;
    }

    if (aValue == null) {
      return 1;
    }

    if (bValue == null) {
      return -1;
    }

    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return (aValue - bValue) * directionFactor;
    }

    return aValue.toString().localeCompare(bValue.toString(), 'pt-BR') * directionFactor;
  }

  private getSortableValue(issue: any, column: 'status' | 'situacao' | 'previsao' | 'novaData'): string | number | null {
    const rawValue = (issue?.[column] || '').toString().trim();

    if (!rawValue) {
      return null;
    }

    if (column === 'previsao' || column === 'novaData') {
      const parsedDate = this.parseBrDateToTime(rawValue);
      return parsedDate ?? rawValue.toLowerCase();
    }

    return rawValue.toLowerCase();
  }

  private parseBrDateToTime(value: string): number | null {
    const match = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (!match) {
      return null;
    }

    const day = Number(match[1]);
    const month = Number(match[2]);
    const year = Number(match[3]);
    const date = new Date(year, month - 1, day);

    if (
      date.getFullYear() !== year
      || date.getMonth() !== month - 1
      || date.getDate() !== day
    ) {
      return null;
    }

    return date.getTime();
  }
}
