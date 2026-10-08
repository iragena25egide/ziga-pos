import { useState } from "react";

export function usePagination<T>(data: T[], itemsPerPage = 10) {
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(data.length / itemsPerPage);
  
  const safePage = Math.min(Math.max(1, currentPage), Math.max(1, totalPages));
  
  const paginatedData = data.slice((safePage - 1) * itemsPerPage, safePage * itemsPerPage);

  const nextPage = () => setCurrentPage(p => Math.min(totalPages, p + 1));
  const prevPage = () => setCurrentPage(p => Math.max(1, p - 1));
  const goToPage = (page: number) => setCurrentPage(Math.min(Math.max(1, page), Math.max(1, totalPages)));

  return {
    currentPage: safePage,
    totalPages,
    paginatedData,
    nextPage,
    prevPage,
    goToPage,
    setCurrentPage
  };
}
