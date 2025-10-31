import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { useAccount, useReadContract } from 'wagmi';
import type { Abi } from 'viem';
import { ethers } from 'ethers';

import {
  ERC7984ETH_ADDRESS,
  ERC7984ETH_ABI,
  METH_STAKING_ADDRESS,
  METH_STAKING_ABI,
} from '../config/contracts';
import { useEthersSigner } from '../hooks/useEthersSigner';
import { useZamaInstance } from '../hooks/useZamaInstance';
import { Header } from './Header';
import '../styles/StakingApp.css';

const MICRO_FACTOR = 1_000_000n;
const MAX_OPERATOR_WINDOW = (1n << 48n) - 1n;
const ZERO_HASH = '0x0000000000000000000000000000000000000000000000000000000000000000';

type Feedback = { type: 'success' | 'error'; message: string } | null;

const tokenAbi = ERC7984ETH_ABI as unknown as Abi;
const stakingAbi = METH_STAKING_ABI as unknown as Abi;

const formatMicroValue = (value: bigint): string => {
  const absolute = value < 0n ? -value : value;
  const integer = absolute / MICRO_FACTOR;
  const fractional = absolute % MICRO_FACTOR;
  const fractionString = fractional.toString().padStart(6, '0').replace(/0+$/u, '');
  const formattedFraction = fractionString.length > 0 ? `.${fractionString}` : '';
  const prefix = value < 0n ? '-' : '';
  return `${prefix}${integer.toString()}${formattedFraction}`;
};

const parseAmountToMicro = (rawValue: string): bigint | null => {
  const value = rawValue.trim();
  if (!value) {
    return null;
  }

  if (!/^\d*(\.\d{0,18})?$/u.test(value)) {
    return null;
  }

  const [integerPart, fractionPart = ''] = value.split('.');
  const sanitizedInteger = integerPart === '' ? '0' : integerPart;
  const sanitizedFraction = (fractionPart + '000000').slice(0, 6);

  try {
    const integer = BigInt(sanitizedInteger);
    const fraction = BigInt(sanitizedFraction);
    return integer * MICRO_FACTOR + fraction;
  } catch (error) {
    console.error('Failed to parse amount', error);
    return null;
  }
};

export function StakingApp() {
  const { address, isConnected } = useAccount();
  const signerPromise = useEthersSigner();
  const { instance, isLoading: zamaLoading, error: zamaError } = useZamaInstance();

  const [stakeAmount, setStakeAmount] = useState('');
  const [unstakeAmount, setUnstakeAmount] = useState('');

  const [minting, setMinting] = useState(false);
  const [operatorLoading, setOperatorLoading] = useState(false);
  const [stakeLoading, setStakeLoading] = useState(false);
  const [unstakeLoading, setUnstakeLoading] = useState(false);

  const [decrypting, setDecrypting] = useState(false);
  const [decryptError, setDecryptError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Feedback>(null);

  const [balances, setBalances] = useState({ wallet: 0n, staked: 0n, total: 0n });

  const { data: operatorData, refetch: refetchOperator } = useReadContract({
    address: ERC7984ETH_ADDRESS,
    abi: tokenAbi,
    functionName: 'isOperator',
    args: address ? [address, METH_STAKING_ADDRESS] : undefined,
    query: {
      enabled: !!address,
    },
  });

  const { data: walletBalanceData, refetch: refetchWalletBalance } = useReadContract({
    address: ERC7984ETH_ADDRESS,
    abi: tokenAbi,
    functionName: 'confidentialBalanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });

  const { data: stakedBalanceData, refetch: refetchStakedBalance } = useReadContract({
    address: METH_STAKING_ADDRESS,
    abi: stakingAbi,
    functionName: 'stakedBalanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });

  const { data: totalStakedData, refetch: refetchTotalStaked } = useReadContract({
    address: METH_STAKING_ADDRESS,
    abi: stakingAbi,
    functionName: 'confidentialTotalStaked',
  });

  const operatorActive = Boolean(operatorData);

  const walletHandle = useMemo(() => (typeof walletBalanceData === 'string' ? walletBalanceData : undefined), [
    walletBalanceData,
  ]);
  const stakedHandle = useMemo(() => (typeof stakedBalanceData === 'string' ? stakedBalanceData : undefined), [
    stakedBalanceData,
  ]);
  const totalHandle = useMemo(() => (typeof totalStakedData === 'string' ? totalStakedData : undefined), [
    totalStakedData,
  ]);

  useEffect(() => {
    if (!address) {
      setBalances({ wallet: 0n, staked: 0n, total: 0n });
      setDecryptError(null);
      return;
    }

    if (!instance || !signerPromise) {
      return;
    }

    const handles = [] as { handle: string; contract: string }[];

    const pushHandle = (handle?: string, contract?: string) => {
      if (!handle || !contract) return;
      if (handle === ZERO_HASH || handle === '0x0') return;
      handles.push({ handle, contract });
    };

    pushHandle(walletHandle, ERC7984ETH_ADDRESS);
    pushHandle(stakedHandle, METH_STAKING_ADDRESS);
    pushHandle(totalHandle, METH_STAKING_ADDRESS);

    if (handles.length === 0) {
      setBalances({ wallet: 0n, staked: 0n, total: 0n });
      setDecryptError(null);
      return;
    }

    let cancelled = false;

    const run = async () => {
      try {
        setDecrypting(true);
        setDecryptError(null);

        const signer = await signerPromise;
        if (!signer) {
          throw new Error('Wallet not connected');
        }

        const keypair = instance.generateKeypair();
        const startTimestamp = Math.floor(Date.now() / 1000).toString();
        const durationDays = '7';
        const contractAddresses = Array.from(new Set(handles.map((item) => item.contract)));

        const eip712 = instance.createEIP712(keypair.publicKey, contractAddresses, startTimestamp, durationDays);
        const signature = await signer.signTypedData(
          eip712.domain,
          { UserDecryptRequestVerification: eip712.types.UserDecryptRequestVerification },
          eip712.message,
        );

        const result = await instance.userDecrypt(
          handles.map(({ handle, contract }) => ({ handle, contractAddress: contract })),
          keypair.privateKey,
          keypair.publicKey,
          signature.replace('0x', ''),
          contractAddresses,
          address,
          startTimestamp,
          durationDays,
        );

        if (cancelled) {
          return;
        }

        const getValue = (handle?: string): bigint => {
          if (!handle || handle === ZERO_HASH || handle === '0x0') {
            return 0n;
          }
          const decrypted = result[handle];
          if (!decrypted) {
            return 0n;
          }
          try {
            return BigInt(decrypted);
          } catch (error) {
            console.error('Failed to parse decrypted value', error);
            return 0n;
          }
        };

        setBalances({
          wallet: getValue(walletHandle),
          staked: getValue(stakedHandle),
          total: getValue(totalHandle),
        });
      } catch (error) {
        if (!cancelled) {
          console.error('Error decrypting balances', error);
          setDecryptError(error instanceof Error ? error.message : 'Decryption failed');
        }
      } finally {
        if (!cancelled) {
          setDecrypting(false);
        }
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [address, instance, signerPromise, walletHandle, stakedHandle, totalHandle]);

  const refreshReads = useCallback(async () => {
    await Promise.all([refetchWalletBalance(), refetchStakedBalance(), refetchTotalStaked(), refetchOperator()]);
  }, [refetchOperator, refetchStakedBalance, refetchTotalStaked, refetchWalletBalance]);

  const withFeedback = useCallback(async (operation: () => Promise<void>) => {
    setFeedback(null);
    try {
      await operation();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unexpected error';
      setFeedback({ type: 'error', message });
    }
  }, []);

  const handleMint = async () => {
    await withFeedback(async () => {
      if (!signerPromise) {
        throw new Error('Wallet not connected');
      }

      setMinting(true);
      try {
        const signer = await signerPromise;
        if (!signer) {
          throw new Error('Wallet not connected');
        }

        const tokenContract = new ethers.Contract(ERC7984ETH_ADDRESS, ERC7984ETH_ABI, signer);
        const tx = await tokenContract.mintFree();
        await tx.wait();
        setFeedback({ type: 'success', message: 'Successfully minted 1 mETH' });
        await refreshReads();
      } finally {
        setMinting(false);
      }
    });
  };

  const handleSetOperator = async () => {
    await withFeedback(async () => {
      if (!signerPromise) {
        throw new Error('Wallet not connected');
      }

      setOperatorLoading(true);
      try {
        const signer = await signerPromise;
        if (!signer) {
          throw new Error('Wallet not connected');
        }

        const tokenContract = new ethers.Contract(ERC7984ETH_ADDRESS, ERC7984ETH_ABI, signer);
        const tx = await tokenContract.setOperator(METH_STAKING_ADDRESS, MAX_OPERATOR_WINDOW);
        await tx.wait();
        setFeedback({ type: 'success', message: 'Operator permission granted to staking contract' });
        await refreshReads();
      } finally {
        setOperatorLoading(false);
      }
    });
  };

  const handleStake = async (event: FormEvent) => {
    event.preventDefault();
    await withFeedback(async () => {
      if (!signerPromise || !instance || !address) {
        throw new Error('Missing wallet connection or encryption service');
      }

      const parsedAmount = parseAmountToMicro(stakeAmount);
      if (parsedAmount === null || parsedAmount === 0n) {
        throw new Error('Enter a valid amount greater than 0');
      }

      setStakeLoading(true);
      try {
        const signer = await signerPromise;
        if (!signer) {
          throw new Error('Wallet not connected');
        }

        const buffer = instance.createEncryptedInput(METH_STAKING_ADDRESS, address);
        buffer.add64(parsedAmount);
        const encrypted = await buffer.encrypt();

        const stakingContract = new ethers.Contract(METH_STAKING_ADDRESS, METH_STAKING_ABI, signer);
        const tx = await stakingContract["stake(bytes32,bytes)"](encrypted.handles[0], encrypted.inputProof);
        await tx.wait();
        setFeedback({ type: 'success', message: `Staked ${formatMicroValue(parsedAmount)} mETH` });
        setStakeAmount('');
        await refreshReads();
      } finally {
        setStakeLoading(false);
      }
    });
  };

  const handleUnstake = async (event: FormEvent) => {
    event.preventDefault();
    await withFeedback(async () => {
      if (!signerPromise || !instance || !address) {
        throw new Error('Missing wallet connection or encryption service');
      }

      const parsedAmount = parseAmountToMicro(unstakeAmount);
      if (parsedAmount === null || parsedAmount === 0n) {
        throw new Error('Enter a valid amount greater than 0');
      }

      setUnstakeLoading(true);
      try {
        const signer = await signerPromise;
        if (!signer) {
          throw new Error('Wallet not connected');
        }

        const buffer = instance.createEncryptedInput(METH_STAKING_ADDRESS, address);
        buffer.add64(parsedAmount);
        const encrypted = await buffer.encrypt();

        const stakingContract = new ethers.Contract(METH_STAKING_ADDRESS, METH_STAKING_ABI, signer);
        const tx = await stakingContract["unstake(bytes32,bytes)"](encrypted.handles[0], encrypted.inputProof);
        await tx.wait();
        setFeedback({ type: 'success', message: `Unstake requested for ${formatMicroValue(parsedAmount)} mETH` });
        setUnstakeAmount('');
        await refreshReads();
      } finally {
        setUnstakeLoading(false);
      }
    });
  };

  return (
    <div className="staking-app">
      <Header />
      <main className="staking-main">
        {feedback && (
          <div className={`feedback feedback-${feedback.type}`}>
            {feedback.message}
          </div>
        )}

        {zamaError && (
          <div className="feedback feedback-error">Encryption service error: {zamaError}</div>
        )}

        {!isConnected && (
          <div className="info-card">
            <h2>Connect your wallet to start</h2>
            <p>Mint test mETH, set the staking operator, and manage your confidential stake.</p>
          </div>
        )}

        <section className="balance-section">
          <h2 className="section-title">Balances</h2>
          <div className="balance-grid">
            <div className="balance-card">
              <span className="balance-label">Wallet mETH</span>
              <span className="balance-value">{formatMicroValue(balances.wallet)}</span>
              <span className="balance-subtext">Available to stake</span>
            </div>
            <div className="balance-card">
              <span className="balance-label">Staked mETH</span>
              <span className="balance-value">{formatMicroValue(balances.staked)}</span>
              <span className="balance-subtext">Encrypted position</span>
            </div>
            <div className="balance-card">
              <span className="balance-label">Total Staked</span>
              <span className="balance-value">{formatMicroValue(balances.total)}</span>
              <span className="balance-subtext">All users combined</span>
            </div>
          </div>
          {decrypting && <p className="balance-status">Decrypting balances...</p>}
          {decryptError && <p className="balance-status error">{decryptError}</p>}
        </section>

        <section className="actions-section">
          <h2 className="section-title">Actions</h2>
          <div className="action-grid">
            <div className="action-card">
              <h3>Mint test mETH</h3>
              <p>Receive 1 mETH token for testing your staking flow.</p>
              <button className="primary-button" onClick={handleMint} disabled={minting || !isConnected}>
                {minting ? 'Minting...' : 'Mint mETH'}
              </button>
            </div>

            <div className="action-card">
              <h3>Operator status</h3>
              <p>
                {operatorActive
                  ? 'Staking contract is authorized to transfer your mETH.'
                  : 'Grant operator permission before staking.'}
              </p>
              <button
                className="secondary-button"
                onClick={handleSetOperator}
                disabled={operatorActive || operatorLoading || !isConnected}
              >
                {operatorActive ? 'Operator Active' : operatorLoading ? 'Setting...' : 'Set Operator'}
              </button>
            </div>

            <div className="action-card">
              <h3>Stake mETH</h3>
              <p>Enter the amount to stake. Six decimal precision is supported.</p>
              <form onSubmit={handleStake} className="action-form">
                <input
                  type="number"
                  min="0"
                  step="0.000001"
                  value={stakeAmount}
                  onChange={(event) => setStakeAmount(event.target.value)}
                  placeholder="0.000000"
                  className="action-input"
                  disabled={!isConnected || zamaLoading}
                />
                <button className="primary-button" type="submit" disabled={stakeLoading || !isConnected || zamaLoading}>
                  {stakeLoading ? 'Staking...' : 'Stake'}
                </button>
              </form>
            </div>

            <div className="action-card">
              <h3>Unstake mETH</h3>
              <p>Request to withdraw staked tokens back to your wallet.</p>
              <form onSubmit={handleUnstake} className="action-form">
                <input
                  type="number"
                  min="0"
                  step="0.000001"
                  value={unstakeAmount}
                  onChange={(event) => setUnstakeAmount(event.target.value)}
                  placeholder="0.000000"
                  className="action-input"
                  disabled={!isConnected || zamaLoading}
                />
                <button className="secondary-button" type="submit" disabled={unstakeLoading || !isConnected || zamaLoading}>
                  {unstakeLoading ? 'Unstaking...' : 'Unstake'}
                </button>
              </form>
            </div>
          </div>
        </section>

        <section className="notes-section">
          <h2 className="section-title">Help</h2>
          <ul className="notes-list">
            <li>1 mETH uses 6 decimal places. Example: 0.750000 represents 0.75 mETH.</li>
            <li>You must set the staking contract as operator before staking.</li>
            <li>Balances are decrypted locally through the Zama relayer; keep the page open during requests.</li>
          </ul>
        </section>
      </main>
    </div>
  );
}
