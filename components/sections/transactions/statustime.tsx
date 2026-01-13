import { Clock } from 'lucide-react';
import { Transaction } from '@/types/transaction';
import { formatEstimatedTime } from '@/components/common/utils';

export const StatusTimeComponent = ({
  txn,
}: {
  txn: Transaction;
}) => {
  return (
    <p className="text-xs flex flex-row items-end justify-end text-right text-white text-opacity-70 space-x-1">
      <span>
        {txn.timeRemaining ? formatEstimatedTime(txn.timeRemaining) : '--'}
      </span>
      <Clock className="w-4 h-4" />
    </p>
  );
};