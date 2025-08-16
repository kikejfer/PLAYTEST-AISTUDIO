import { useState, useCallback, useRef, useEffect } from 'react';

/**
 * Hook para implementar infinite scroll optimizado
 * Carga datos adicionales cuando el usuario se acerca al final
 */
export const useInfiniteScroll = ({
  hasNextPage = false,
  onLoadMore = null,
  threshold = 5, // Número de elementos antes del final para trigger
  enabled = true
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const loadMoreRef = useRef();
  const observerRef = useRef();

  // Función para cargar más datos
  const loadMore = useCallback(async () => {
    if (!hasNextPage || isLoading || !onLoadMore || !enabled) return;

    setIsLoading(true);
    try {
      await onLoadMore();
    } catch (error) {
      console.error('Error cargando más datos:', error);
    } finally {
      setIsLoading(false);
    }
  }, [hasNextPage, isLoading, onLoadMore, enabled]);

  // Configurar Intersection Observer
  useEffect(() => {
    if (!enabled) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          loadMore();
        }
      },
      {
        threshold: 0.1,
        rootMargin: '20px'
      }
    );

    observerRef.current = observer;

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [loadMore, enabled]);

  // Observar el elemento de referencia
  useEffect(() => {
    const currentRef = loadMoreRef.current;
    const currentObserver = observerRef.current;

    if (currentRef && currentObserver) {
      currentObserver.observe(currentRef);
    }

    return () => {
      if (currentRef && currentObserver) {
        currentObserver.unobserve(currentRef);
      }
    };
  }, []);

  return {
    isLoading,
    loadMoreRef,
    loadMore: enabled ? loadMore : () => {}
  };
};

/**
 * Hook para infinite scroll con ventana virtual
 */
export const useVirtualInfiniteScroll = ({
  totalItems = 0,
  hasNextPage = false,
  onLoadMore = null,
  itemHeight = 50,
  containerHeight = 400,
  buffer = 5
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [scrollTop, setScrollTop] = useState(0);

  // Calcular elementos visibles
  const visibleStart = Math.floor(scrollTop / itemHeight);
  const visibleEnd = Math.min(
    visibleStart + Math.ceil(containerHeight / itemHeight),
    totalItems - 1
  );

  // Verificar si necesita cargar más
  const shouldLoadMore = visibleEnd >= totalItems - buffer && hasNextPage && !isLoading;

  // Función para cargar más datos
  const loadMore = useCallback(async () => {
    if (!onLoadMore || isLoading) return;

    setIsLoading(true);
    try {
      await onLoadMore();
    } catch (error) {
      console.error('Error cargando más datos:', error);
    } finally {
      setIsLoading(false);
    }
  }, [onLoadMore, isLoading]);

  // Efecto para trigger automático
  useEffect(() => {
    if (shouldLoadMore) {
      loadMore();
    }
  }, [shouldLoadMore, loadMore]);

  const handleScroll = useCallback((e) => {
    setScrollTop(e.target.scrollTop);
  }, []);

  return {
    isLoading,
    visibleStart,
    visibleEnd,
    handleScroll,
    shouldLoadMore
  };
};

/**
 * Hook para scroll con paginación
 */
export const usePaginatedScroll = ({
  pageSize = 50,
  onLoadPage = null,
  totalPages = 0
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [loadedPages, setLoadedPages] = useState(new Set([1]));
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState([]);

  // Función para cargar una página específica
  const loadPage = useCallback(async (page) => {
    if (loadedPages.has(page) || !onLoadPage || isLoading) return;

    setIsLoading(true);
    try {
      const pageData = await onLoadPage(page, pageSize);
      setData(prevData => {
        const newData = [...prevData];
        const startIndex = (page - 1) * pageSize;
        pageData.forEach((item, index) => {
          newData[startIndex + index] = item;
        });
        return newData;
      });
      setLoadedPages(prev => new Set([...prev, page]));
    } catch (error) {
      console.error('Error cargando página:', error);
    } finally {
      setIsLoading(false);
    }
  }, [loadedPages, onLoadPage, isLoading, pageSize]);

  // Función para determinar qué páginas cargar basado en scroll
  const handleScrollPage = useCallback((visibleStart, visibleEnd) => {
    const startPage = Math.floor(visibleStart / pageSize) + 1;
    const endPage = Math.floor(visibleEnd / pageSize) + 1;

    for (let page = startPage; page <= Math.min(endPage, totalPages); page++) {
      if (!loadedPages.has(page)) {
        loadPage(page);
      }
    }
  }, [pageSize, totalPages, loadedPages, loadPage]);

  return {
    currentPage,
    setCurrentPage,
    loadedPages,
    isLoading,
    data,
    loadPage,
    handleScrollPage
  };
};