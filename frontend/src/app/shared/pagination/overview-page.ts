export interface OverviewPage<T> {
  items: T[];
  page: number;
  pageSize: 10;
  totalElements: number;
}
