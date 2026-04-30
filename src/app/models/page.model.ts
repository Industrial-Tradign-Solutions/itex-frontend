export interface Page<T> {
  content           : T[];
  page          : Pageable;
}

interface Pageable {
  totalElements     : number;
  totalPages        : number;
  size              : number;
  number            : number;
}
