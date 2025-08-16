import React, { useMemo, useCallback, useState, useEffect } from 'react';
import { FixedSizeList as List } from 'react-window';
import { useVirtual } from 'react-virtual';
import { useDebouncedCallback } from '../../hooks/useDebouncedCallback';
import { useInfiniteScroll } from '../../hooks/useInfiniteScroll';
import LoadingSpinner from './LoadingSpinner';
import './VirtualizedTable.scss';

/**
 * Tabla virtualizada optimizada para grandes volúmenes de datos
 * Soporta ordenación, filtrado, selección múltiple e infinite scroll
 */
const VirtualizedTable = ({
  data = [],
  columns = [],
  height = 400,
  rowHeight = 50,
  headerHeight = 40,
  overscan = 5,
  sortable = true,
  filterable = true,
  selectable = false,
  multiSelect = false,
  onSort = null,
  onFilter = null,
  onSelect = null,
  loading = false,
  hasNextPage = false,
  onLoadMore = null,
  className = '',
  virtualizationMode = 'window', // 'window' | 'virtual'
  stickyHeader = true,
  resizable = false
}) => {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [filters, setFilters] = useState({});
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [columnWidths, setColumnWidths] = useState({});

  // Datos filtrados y ordenados (memoizado para rendimiento)
  const processedData = useMemo(() => {
    let result = [...data];

    // Aplicar filtros
    Object.entries(filters).forEach(([key, value]) => {
      if (value && value.trim()) {
        result = result.filter(row => {
          const cellValue = row[key];
          if (cellValue === null || cellValue === undefined) return false;
          return String(cellValue).toLowerCase().includes(value.toLowerCase());
        });
      }
    });

    // Aplicar ordenación
    if (sortConfig.key) {
      result.sort((a, b) => {
        const aVal = a[sortConfig.key];
        const bVal = b[sortConfig.key];
        
        if (aVal === null || aVal === undefined) return 1;
        if (bVal === null || bVal === undefined) return -1;
        
        if (typeof aVal === 'number' && typeof bVal === 'number') {
          return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
        }
        
        const aStr = String(aVal).toLowerCase();
        const bStr = String(bVal).toLowerCase();
        
        if (sortConfig.direction === 'asc') {
          return aStr.localeCompare(bStr);
        } else {
          return bStr.localeCompare(aStr);
        }
      });
    }

    return result;
  }, [data, filters, sortConfig]);

  // Hook para infinite scroll
  const { 
    isLoading: isLoadingMore,
    loadMoreRef 
  } = useInfiniteScroll({
    hasNextPage,
    onLoadMore,
    threshold: 5 // Cargar más cuando quedan 5 filas
  });

  // Callback debounced para filtros
  const debouncedFilter = useDebouncedCallback((key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    if (onFilter) onFilter(newFilters);
  }, 300);

  // Manejo de ordenación
  const handleSort = useCallback((key) => {
    if (!sortable) return;
    
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    
    const newSortConfig = { key, direction };
    setSortConfig(newSortConfig);
    if (onSort) onSort(newSortConfig);
  }, [sortConfig, sortable, onSort]);

  // Manejo de selección
  const handleRowSelect = useCallback((rowIndex, isSelected) => {
    if (!selectable) return;

    const newSelectedRows = new Set(selectedRows);
    const rowId = processedData[rowIndex]?.id || rowIndex;

    if (isSelected) {
      if (multiSelect) {
        newSelectedRows.add(rowId);
      } else {
        newSelectedRows.clear();
        newSelectedRows.add(rowId);
      }
    } else {
      newSelectedRows.delete(rowId);
    }

    setSelectedRows(newSelectedRows);
    if (onSelect) {
      const selectedData = processedData.filter((_, index) => 
        newSelectedRows.has(processedData[index]?.id || index)
      );
      onSelect(selectedData, newSelectedRows);
    }
  }, [processedData, selectedRows, selectable, multiSelect, onSelect]);

  // Calcular anchos de columna iniciales
  useEffect(() => {
    if (columns.length > 0 && Object.keys(columnWidths).length === 0) {
      const initialWidths = {};
      columns.forEach(col => {
        initialWidths[col.key] = col.width || 150;
      });
      setColumnWidths(initialWidths);
    }
  }, [columns, columnWidths]);

  // Componente de celda
  const CellRenderer = useCallback(({ column, rowData, rowIndex }) => {
    const value = rowData[column.key];
    
    if (column.render) {
      return column.render(value, rowData, rowIndex);
    }
    
    if (value === null || value === undefined) {
      return <span className="cell-empty">—</span>;
    }
    
    return <span className="cell-value">{String(value)}</span>;
  }, []);

  // Componente de fila virtualizada
  const RowRenderer = useCallback(({ index, style }) => {
    const rowData = processedData[index];
    const isSelected = selectedRows.has(rowData?.id || index);
    const isLastRow = index === processedData.length - 1;

    return (
      <div
        style={style}
        className={`virtual-row ${isSelected ? 'selected' : ''}`}
        onClick={() => handleRowSelect(index, !isSelected)}
        ref={isLastRow ? loadMoreRef : null}
      >
        {selectable && (
          <div className="cell checkbox-cell">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={(e) => handleRowSelect(index, e.target.checked)}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}
        
        {columns.map(column => (
          <div
            key={column.key}
            className={`cell ${column.className || ''}`}
            style={{ 
              width: columnWidths[column.key] || column.width || 150,
              textAlign: column.align || 'left'
            }}
          >
            <CellRenderer 
              column={column}
              rowData={rowData}
              rowIndex={index}
            />
          </div>
        ))}
      </div>
    );
  }, [processedData, selectedRows, columns, columnWidths, selectable, handleRowSelect, loadMoreRef, CellRenderer]);

  // Renderizar header
  const renderHeader = () => (
    <div className={`table-header ${stickyHeader ? 'sticky' : ''}`} style={{ height: headerHeight }}>
      {selectable && (
        <div className="header-cell checkbox-cell">
          {multiSelect && (
            <input
              type="checkbox"
              checked={selectedRows.size > 0 && selectedRows.size === processedData.length}
              indeterminate={selectedRows.size > 0 && selectedRows.size < processedData.length}
              onChange={(e) => {
                if (e.target.checked) {
                  const allIds = new Set(processedData.map((row, index) => row?.id || index));
                  setSelectedRows(allIds);
                } else {
                  setSelectedRows(new Set());
                }
              }}
            />
          )}
        </div>
      )}
      
      {columns.map(column => (
        <div
          key={column.key}
          className={`header-cell ${sortable ? 'sortable' : ''} ${
            sortConfig.key === column.key ? `sorted-${sortConfig.direction}` : ''
          }`}
          style={{ 
            width: columnWidths[column.key] || column.width || 150,
            textAlign: column.align || 'left'
          }}
          onClick={() => handleSort(column.key)}
        >
          <span className="header-title">{column.title}</span>
          {sortable && (
            <span className="sort-indicator">
              {sortConfig.key === column.key ? (
                sortConfig.direction === 'asc' ? '↑' : '↓'
              ) : '↕'}
            </span>
          )}
          
          {filterable && column.filterable !== false && (
            <input
              type="text"
              className="column-filter"
              placeholder={`Filtrar ${column.title}...`}
              onChange={(e) => debouncedFilter(column.key, e.target.value)}
              onClick={(e) => e.stopPropagation()}
            />
          )}
        </div>
      ))}
    </div>
  );

  // Renderizar con virtualización
  if (virtualizationMode === 'window') {
    return (
      <div className={`virtualized-table ${className}`}>
        {renderHeader()}
        
        <div className="table-body" style={{ height: height - headerHeight }}>
          {loading ? (
            <LoadingSpinner size="medium" />
          ) : processedData.length === 0 ? (
            <div className="empty-state">
              <p>No hay datos disponibles</p>
            </div>
          ) : (
            <List
              height={height - headerHeight}
              itemCount={processedData.length}
              itemSize={rowHeight}
              overscanCount={overscan}
            >
              {RowRenderer}
            </List>
          )}
          
          {isLoadingMore && (
            <div className="loading-more">
              <LoadingSpinner size="small" />
              <span>Cargando más datos...</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Renderizar tabla normal para volúmenes pequeños
  return (
    <div className={`standard-table ${className}`}>
      {renderHeader()}
      
      <div className="table-body" style={{ maxHeight: height - headerHeight, overflowY: 'auto' }}>
        {loading ? (
          <LoadingSpinner size="medium" />
        ) : processedData.length === 0 ? (
          <div className="empty-state">
            <p>No hay datos disponibles</p>
          </div>
        ) : (
          processedData.map((rowData, index) => (
            <div key={rowData?.id || index} style={{ height: rowHeight }}>
              <RowRenderer index={index} style={{ height: rowHeight }} />
            </div>
          ))
        )}
        
        {isLoadingMore && (
          <div className="loading-more">
            <LoadingSpinner size="small" />
            <span>Cargando más datos...</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default VirtualizedTable;