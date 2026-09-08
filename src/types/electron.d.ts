export {};

declare global {
  interface Window {
    electronAPI: {
      clients: {
        getAll: () => Promise<any[]>;
        create: (client: any) => Promise<any>;
        update: (client: any) => Promise<any>;
        delete: (id: number) => Promise<any>;
      };
      quotations: {
        getAll: () => Promise<any[]>;
        getById: (id: number) => Promise<any>;
        create: (quotation: any) => Promise<any>;
        update: (quotation: any) => Promise<any>;
        delete: (id: number) => Promise<any>;
      };
    };
  }
}