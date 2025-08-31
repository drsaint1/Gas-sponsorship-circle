// types/ethereum.d.ts - Ethereum wallet types
interface EthereumProvider {
  request(args: { method: string; params?: any[] }): Promise<any>;
  isMetaMask?: boolean;
  isConnected?(): boolean;
  on(event: string, callback: (data: any) => void): void;
  removeListener(event: string, callback: (data: any) => void): void;
}

interface Window {
  ethereum?: EthereumProvider;
}

declare global {
  interface Window {
    ethereum?: EthereumProvider;
  }
}

export {};