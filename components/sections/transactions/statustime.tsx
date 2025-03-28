import { Clock } from 'lucide-react';
import { useApi } from '@/stores/api';
import { getStatusTime } from '@/utils/common';
import { Transaction } from '@/types/transaction';
import { useLatestBlockInfo } from '@/stores/blockinfo';
import { formatEstimatedTime } from '@/components/common/utils';

export const StatusTimeComponent = ({
  txn,
}: {
  txn: Transaction;
}) => {
  const { ethHead, avlHead, isLoading, error } = useLatestBlockInfo();
  const { isReady } = useApi();

  if (!isReady || isLoading() || error) {
    return (
      <p className="text-xs flex flex-row items-end justify-end text-right text-white text-opacity-70 space-x-1">
       ...
      </p>
    );
  }
  
  return (
    <p className="text-xs flex flex-row items-end justify-end text-right text-white text-opacity-70 space-x-1">
      <span>
        {txn.timeRemaining ? formatEstimatedTime(txn.timeRemaining) : getStatusTime({
          from: txn.sourceChain,
          to: txn.destinationChain,
          status: txn.status,
          heads: { eth: ethHead, avl: avlHead },
          SourceTimestamp:txn.sourceTimestamp,
        })}
      </span>
      <Clock className="w-4 h-4" />
    </p>
  );
};