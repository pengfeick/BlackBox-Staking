import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { sepolia } from 'wagmi/chains';

export const config = getDefaultConfig({
  appName: '',
  projectId: 'demo-project-id',
  chains: [sepolia],
  ssr: false,
});
