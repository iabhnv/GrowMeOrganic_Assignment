import axios from "axios";
import { useState, useEffect, useRef } from "react";
import { PrimeReactProvider } from "primereact/api";
import { Column } from "primereact/column";
import { DataTable } from "primereact/datatable";
import { Paginator } from "primereact/paginator";
import { OverlayPanel } from "primereact/overlaypanel";
import { InputNumber } from "primereact/inputnumber";
import { Button } from "primereact/button";

interface Data {
  id: number;
  title: string;
  place_of_origin: string;
  artist_display: string;
  inscriptions: string;
  date_start: number;
  date_end: number;
}

interface Pagination {
  total: number;
  limit: number;
  total_pages: number;
}

const url = "https://api.artic.edu/api/v1/artworks";

export default function Table() {
  const [data, setData] = useState<Data[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRow, setSelectedRow] = useState<Data[]>([]);
  const [newSelectedRow, setNewSelectedRow] = useState<number>();
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    limit: 12,
    total_pages: 0,
  });
  const [page, setPage] = useState<number>(0);

  const op = useRef<OverlayPanel>(null);

  useEffect(() => {
    fetchData(page);
  }, [page]);

  const fetchData = async (pageNumber: number) => {
    setLoading(true);
    try {
      const response = await axios.get(`${url}?page=${pageNumber + 1}`);
      const artworks = response.data.data as Data[];
      setData(artworks);

      const { total, limit: responseLimit, total_pages } = response.data.pagination;
      setPagination({
        total,
        limit: responseLimit,
        total_pages
      });

      setLoading(false);
    } catch (error) {
      setError((error as Error).message);
      setLoading(false);
    }
  };

  const handlePageChange = (event: { first: number; page: number; rows: number; }) => {
    setPage(event.page);
  };

  const handleRowSelection = async () => {
    let selectedRows = [...data];
    const rowsRequired = newSelectedRow || 12;

    if (data.length < rowsRequired) {
      let nextPage = page + 1;
      while (selectedRows.length < rowsRequired && nextPage < pagination.total_pages) {
        const response = await axios.get(`${url}?page=${nextPage + 1}`);
        const nextPageData = response.data.data as Data[];

        selectedRows = [...selectedRows, ...nextPageData];

        nextPage++;
      }
    }

    setSelectedRow(selectedRows.slice(0, rowsRequired));

    op.current?.hide();
  };

  const titleHeader = (
    <div className="flex items-center gap-2">
      <Button 
        icon="pi pi-angle-down" 
        onClick={(e) => op.current?.toggle(e)} 
        className="p-button-text p-button-rounded p-button-plain"
        tooltip="Select Row"
        tooltipOptions={{ position: 'top' }}
      />
      <span>Title</span>
      <OverlayPanel ref={op} className="w-72">
        <div className="p-fluid">
          <h3 className="text-lg font-semibold mb-2">Select Row</h3>
          <div className="flex gap-2">
            <InputNumber 
              value={newSelectedRow} 
              onValueChange={(e) => setNewSelectedRow(e.value ?? 12)} 
              min={1} 
            />
            <Button label="Submit" onClick={handleRowSelection} />
          </div>
        </div>
      </OverlayPanel>
    </div>
  );

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <PrimeReactProvider>
      <DataTable 
        value={data} 
        selectionMode="checkbox" 
        selection={selectedRow} 
        onSelectionChange={(e) => setSelectedRow(e.value)} 
        dataKey="id" 
        tableStyle={{ minWidth: "50rem" }}
      >
        <Column selectionMode="multiple" headerStyle={{ width: '3rem' }}></Column>
        <Column field="title" header={titleHeader} />
        <Column field="place_of_origin" header="Place of Origin" />
        <Column field="artist_display" header="Artist Display" />
        <Column field="inscriptions" header="Inscriptions" />
        <Column field="date_start" header="Date Start" />
        <Column field="date_end" header="Date End" />
      </DataTable>
      <Paginator 
        first={page * pagination.limit} 
        rows={pagination.limit} 
        totalRecords={pagination.total} 
        onPageChange={handlePageChange} 
      />
    </PrimeReactProvider>
  );
}
